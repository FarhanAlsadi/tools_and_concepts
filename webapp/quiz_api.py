"""
Live Quiz — Kahoot-style game API for training sessions.

A trainer (PIN-protected) hosts a quiz; attendees join with a 6-digit code and
a nickname, answer timed questions on their phones, and race up a live
leaderboard. Open-ended questions are graded manually by the trainer, who
awards points per answer before the game moves on.

Design notes:
- All game state lives in memory (games are ephemeral, matching the free-tier
  hosts where disk resets on deploy). Run gunicorn with ONE process
  (threads are fine): the deploy configs use ``--threads 8``.
- Clients sync by polling ~1/s. There are no background timers: phase
  transitions that depend on the clock (question time running out) are applied
  lazily inside :func:`_tick` whenever any request touches the game.
- The trainer PIN comes from the ``TRAINER_PIN`` env var (default ``0000`` —
  set a real one in production). PIN attempts are rate-limited per IP.

Phases: lobby -> [question -> (grading) -> reveal -> leaderboard]* -> podium
"""

import hmac
import os
import re
import secrets
import threading
import time

from flask import Blueprint, jsonify, request

quiz_bp = Blueprint("quiz", __name__, url_prefix="/api/quiz")

_LOCK = threading.RLock()
GAMES = {}          # code -> game dict
PIN_ATTEMPTS = {}   # ip -> [count, window_start]

MAX_GAMES = 40
MAX_PLAYERS = 300
GAME_TTL_SECONDS = 4 * 3600        # drop games idle this long
PIN_WINDOW = 600                   # seconds
PIN_MAX_ATTEMPTS = 15              # per window per IP
ACTIVE_WINDOW = 12                 # a player is "active" if seen this recently

VALID_TYPES = {"mc", "tf", "multi", "open"}


# ─────────────────────────────── helpers ────────────────────────────────────

def _now():
    return time.time()


def _trainer_pin():
    return os.environ.get("TRAINER_PIN", "0000")


def _check_pin(pin):
    """Constant-time PIN check with a small per-IP rate limit."""
    ip = request.headers.get("X-Forwarded-For", request.remote_addr or "?")
    ip = ip.split(",")[0].strip()
    now = _now()
    count, start = PIN_ATTEMPTS.get(ip, (0, now))
    if now - start > PIN_WINDOW:
        count, start = 0, now
    if count >= PIN_MAX_ATTEMPTS:
        return False, "too_many_attempts"
    ok = hmac.compare_digest(str(pin or ""), _trainer_pin())
    PIN_ATTEMPTS[ip] = (0, start) if ok else (count + 1, start)
    return ok, None if ok else "bad_pin"


def _purge_stale():
    now = _now()
    for code in [c for c, g in GAMES.items()
                 if now - g["last_activity"] > GAME_TTL_SECONDS]:
        del GAMES[code]


def _new_code():
    for _ in range(100):
        code = "".join(secrets.choice("0123456789") for _ in range(6))
        if code not in GAMES:
            return code
    raise RuntimeError("could not allocate a game code")


def _err(msg, status=400):
    return jsonify({"ok": False, "error": msg}), status


def _game_or_none(code):
    return GAMES.get(str(code or "").strip())


def _clean_text(value, max_len):
    return re.sub(r"\s+", " ", str(value or "")).strip()[:max_len]


# ─────────────────────────── quiz validation ────────────────────────────────

def _validate_quiz(quiz):
    """Normalize + validate a quiz sent by the trainer. Returns (quiz, error)."""
    if not isinstance(quiz, dict):
        return None, "quiz must be an object"
    title = _clean_text(quiz.get("title"), 120) or "مسابقة"
    raw_questions = quiz.get("questions")
    if not isinstance(raw_questions, list) or not 1 <= len(raw_questions) <= 100:
        return None, "quiz needs 1-100 questions"

    questions = []
    for i, raw in enumerate(raw_questions):
        if not isinstance(raw, dict):
            return None, f"question {i + 1} is not an object"
        qtype = raw.get("type")
        if qtype not in VALID_TYPES:
            return None, f"question {i + 1}: unknown type"
        text = _clean_text(raw.get("text"), 500)
        if not text:
            return None, f"question {i + 1}: empty text"

        q = {
            "type": qtype,
            "text": text,
            "time": min(max(int(raw.get("time") or 20), 5), 300),
            "points": min(max(int(raw.get("points") or 1000), 0), 10000),
            "options": [],
            "correct": [],
            "model": "",
        }
        if qtype == "tf":
            q["options"] = ["صح", "خطأ"]
            correct = raw.get("correct")
            if correct not in ([0], [1]):
                return None, f"question {i + 1}: tf correct must be [0] or [1]"
            q["correct"] = correct
        elif qtype in ("mc", "multi"):
            options = [_clean_text(o, 200) for o in (raw.get("options") or [])]
            options = [o for o in options if o]
            if not 2 <= len(options) <= 6:
                return None, f"question {i + 1}: needs 2-6 options"
            correct = raw.get("correct")
            if (not isinstance(correct, list) or not correct
                    or any(not isinstance(c, int) or not 0 <= c < len(options)
                           for c in correct)):
                return None, f"question {i + 1}: invalid correct answers"
            correct = sorted(set(correct))
            if qtype == "mc" and len(correct) != 1:
                return None, f"question {i + 1}: mc needs exactly one correct"
            q["options"], q["correct"] = options, correct
        else:  # open
            q["model"] = _clean_text(raw.get("model"), 500)
        questions.append(q)

    return {"title": title, "questions": questions}, None


# ───────────────────────── phase transitions ────────────────────────────────

def _current_question(game):
    return game["quiz"]["questions"][game["q_index"]]


def _active_players(game):
    now = _now()
    return [p for p in game["players"].values()
            if not p["kicked"] and now - p["last_seen"] <= ACTIVE_WINDOW]


def _tick(game):
    """Apply time-based transitions lazily (no background threads)."""
    if game["phase"] != "question":
        return
    q = _current_question(game)
    time_up = _now() >= game["q_started_at"] + q["time"]
    active = _active_players(game)
    everyone_answered = (
        len(active) > 0
        and all(game["q_index"] in p["answers"] for p in active)
        and len(game["players"]) > 0
    )
    if time_up or everyone_answered:
        _end_question(game)


def _end_question(game):
    """Close the current question: score it (auto types) or open grading."""
    q = _current_question(game)
    if q["type"] == "open":
        game["phase"] = "grading"
        return
    correct = q["correct"]
    for p in game["players"].values():
        ans = p["answers"].get(game["q_index"])
        if not ans:
            continue
        if q["type"] == "multi":
            is_correct = sorted(ans.get("choices") or []) == correct
        else:
            is_correct = ans.get("choice") == correct[0]
        pts = 0
        if is_correct:
            # Kahoot-style speed bonus: full points at t=0, half at the buzzer.
            rt = min(max(ans["at"] - game["q_started_at"], 0), q["time"])
            pts = round(q["points"] * (1 - (rt / q["time"]) / 2))
        ans["correct"] = is_correct
        ans["points"] = pts
        p["score"] += pts
    game["phase"] = "reveal"


def _finish_grading(game):
    """Apply trainer-awarded points for the open question, then reveal."""
    for p in game["players"].values():
        ans = p["answers"].get(game["q_index"])
        if not ans:
            continue
        pts = int(ans.get("awarded") or 0)
        ans["points"] = pts
        ans["correct"] = pts > 0
        p["score"] += pts
    game["phase"] = "reveal"


def _leaderboard(game, limit=None):
    ranked = sorted(
        (p for p in game["players"].values() if not p["kicked"]),
        key=lambda p: (-p["score"], p["joined_at"]),
    )
    rows = [{"id": p["id"], "name": p["name"], "score": p["score"],
             "rank": i + 1} for i, p in enumerate(ranked)]
    return rows[:limit] if limit else rows


def _public_question(q):
    """Question as players may see it while answering (no answers leaked)."""
    return {"type": q["type"], "text": q["text"], "options": q["options"],
            "time": q["time"], "points": q["points"]}


# ─────────────────────────── trainer endpoints ──────────────────────────────

@quiz_bp.post("/host/verify")
def host_verify():
    """Cheap PIN pre-check so the trainer UI can gate before quiz building."""
    body = request.get_json(silent=True) or {}
    with _LOCK:
        ok, why = _check_pin(body.get("pin"))
    if not ok:
        return _err(why, 403)
    return jsonify({"ok": True})


@quiz_bp.post("/host")
def host_create():
    body = request.get_json(silent=True) or {}
    ok, why = _check_pin(body.get("pin"))
    if not ok:
        return _err(why, 403)
    quiz, err = _validate_quiz(body.get("quiz"))
    if err:
        return _err(err)
    with _LOCK:
        _purge_stale()
        if len(GAMES) >= MAX_GAMES:
            return _err("server_full", 503)
        code = _new_code()
        GAMES[code] = {
            "code": code,
            "host_token": secrets.token_hex(16),
            "quiz": quiz,
            "phase": "lobby",
            "q_index": -1,
            "q_started_at": 0.0,
            "players": {},
            "created_at": _now(),
            "last_activity": _now(),
        }
        return jsonify({"ok": True, "code": code,
                        "host_token": GAMES[code]["host_token"],
                        "title": quiz["title"],
                        "q_total": len(quiz["questions"])})


def _host_game(body_or_args):
    game = _game_or_none(body_or_args.get("code"))
    if not game:
        return None, _err("no_such_game", 404)
    token = str(body_or_args.get("token") or "")
    if not hmac.compare_digest(token, game["host_token"]):
        return None, _err("bad_token", 403)
    return game, None


@quiz_bp.get("/host/state")
def host_state():
    with _LOCK:
        game, err = _host_game(request.args)
        if err:
            return err
        game["last_activity"] = _now()
        _tick(game)

        q_index = game["q_index"]
        question = None
        answers = []
        option_counts = []
        if q_index >= 0:
            q = _current_question(game)
            question = dict(q)  # host sees correct + model answer
            option_counts = [0] * len(q["options"])
            for p in game["players"].values():
                ans = p["answers"].get(q_index)
                if not ans:
                    continue
                row = {"player_id": p["id"], "name": p["name"],
                       "at": ans["at"] - game["q_started_at"],
                       "points": ans.get("points"),
                       "correct": ans.get("correct"),
                       "awarded": ans.get("awarded")}
                if q["type"] == "open":
                    row["text"] = ans.get("text", "")
                elif q["type"] == "multi":
                    row["choices"] = ans.get("choices", [])
                    for c in ans.get("choices", []):
                        if 0 <= c < len(option_counts):
                            option_counts[c] += 1
                else:
                    row["choice"] = ans.get("choice")
                    c = ans.get("choice")
                    if isinstance(c, int) and 0 <= c < len(option_counts):
                        option_counts[c] += 1
                answers.append(row)
            answers.sort(key=lambda r: r["at"])

        now = _now()
        players = [{"id": p["id"], "name": p["name"], "score": p["score"],
                    "answered": q_index in p["answers"],
                    "active": now - p["last_seen"] <= ACTIVE_WINDOW,
                    "kicked": p["kicked"]}
                   for p in game["players"].values()]
        players.sort(key=lambda p: -p["score"])

        payload = {
            "ok": True, "server_now": now,
            "phase": game["phase"],
            "title": game["quiz"]["title"],
            "q_index": q_index,
            "q_total": len(game["quiz"]["questions"]),
            "question": question,
            "ends_at": (game["q_started_at"] + question["time"]
                        if question and game["phase"] == "question" else None),
            "players": players,
            "answers": answers,
            "option_counts": option_counts,
            "leaderboard": _leaderboard(game),
        }
        return jsonify(payload)


@quiz_bp.post("/host/action")
def host_action():
    body = request.get_json(silent=True) or {}
    with _LOCK:
        game, err = _host_game(body)
        if err:
            return err
        game["last_activity"] = _now()
        _tick(game)
        action = body.get("action")
        phase = game["phase"]

        if action == "start" and phase == "lobby":
            game["q_index"] = 0
            game["q_started_at"] = _now()
            game["phase"] = "question"

        elif action == "end_question" and phase == "question":
            _end_question(game)

        elif action == "grade" and phase == "grading":
            player = game["players"].get(str(body.get("player_id") or ""))
            ans = player and player["answers"].get(game["q_index"])
            if not ans:
                return _err("no_such_answer", 404)
            points = int(body.get("points") or 0)
            ans["awarded"] = min(max(points, 0), 10000)

        elif action == "finish_grading" and phase == "grading":
            _finish_grading(game)

        elif action == "next" and phase in ("reveal", "leaderboard"):
            if phase == "reveal":
                game["phase"] = "leaderboard"
            elif game["q_index"] + 1 < len(game["quiz"]["questions"]):
                game["q_index"] += 1
                game["q_started_at"] = _now()
                game["phase"] = "question"
            else:
                game["phase"] = "podium"

        elif action == "end_game":
            game["phase"] = "podium"

        elif action == "kick":
            player = game["players"].get(str(body.get("player_id") or ""))
            if player:
                player["kicked"] = True

        elif action == "close":
            del GAMES[game["code"]]
            return jsonify({"ok": True, "phase": "closed"})

        else:
            return _err(f"cannot '{action}' during '{phase}'")

        return jsonify({"ok": True, "phase": game["phase"]})


# ─────────────────────────── player endpoints ───────────────────────────────

@quiz_bp.post("/join")
def join():
    body = request.get_json(silent=True) or {}
    with _LOCK:
        _purge_stale()
        game = _game_or_none(body.get("code"))
        if not game:
            return _err("no_such_game", 404)
        if game["phase"] == "podium":
            return _err("game_over", 410)

        # Resume: a refreshed player sends their old id back.
        old = game["players"].get(str(body.get("player_id") or ""))
        if old and not old["kicked"]:
            old["last_seen"] = _now()
            return jsonify({"ok": True, "player_id": old["id"],
                            "name": old["name"],
                            "title": game["quiz"]["title"]})

        name = _clean_text(body.get("name"), 20)
        if len(name) < 2:
            return _err("bad_name")
        taken = {p["name"] for p in game["players"].values()
                 if not p["kicked"]}
        if name in taken:
            return _err("name_taken", 409)
        if len(game["players"]) >= MAX_PLAYERS:
            return _err("game_full", 503)

        player_id = secrets.token_hex(8)
        game["players"][player_id] = {
            "id": player_id, "name": name, "score": 0,
            "answers": {}, "kicked": False,
            "joined_at": _now(), "last_seen": _now(),
        }
        game["last_activity"] = _now()
        return jsonify({"ok": True, "player_id": player_id, "name": name,
                        "title": game["quiz"]["title"]})


@quiz_bp.get("/state")
def player_state():
    with _LOCK:
        game = _game_or_none(request.args.get("code"))
        if not game:
            return _err("no_such_game", 404)
        player = game["players"].get(str(request.args.get("player_id") or ""))
        if not player:
            return _err("no_such_player", 404)
        if player["kicked"]:
            return jsonify({"ok": True, "kicked": True, "phase": "kicked"})
        player["last_seen"] = _now()
        game["last_activity"] = _now()
        _tick(game)

        phase = game["phase"]
        q_index = game["q_index"]
        payload = {
            "ok": True, "server_now": _now(), "kicked": False,
            "phase": phase, "title": game["quiz"]["title"],
            "q_index": q_index,
            "q_total": len(game["quiz"]["questions"]),
            "players_count": sum(1 for p in game["players"].values()
                                 if not p["kicked"]),
            "score": player["score"],
        }

        if phase == "question":
            q = _current_question(game)
            payload["question"] = _public_question(q)
            payload["ends_at"] = game["q_started_at"] + q["time"]
            payload["answered"] = q_index in player["answers"]

        elif phase in ("reveal", "grading"):
            q = _current_question(game)
            ans = player["answers"].get(q_index)
            payload["question"] = _public_question(q)
            if phase == "reveal":
                payload["correct"] = q["correct"]
                payload["my_answer"] = ans and {
                    "correct": ans.get("correct"),
                    "points": ans.get("points"),
                }

        if phase in ("leaderboard", "podium"):
            rows = _leaderboard(game)
            payload["leaderboard"] = rows[:5]
            payload["my_rank"] = next(
                (r["rank"] for r in rows if r["id"] == player["id"]), None)
            if phase == "podium":
                payload["podium"] = rows[:3]

        return jsonify(payload)


@quiz_bp.post("/answer")
def answer():
    body = request.get_json(silent=True) or {}
    with _LOCK:
        game = _game_or_none(body.get("code"))
        if not game:
            return _err("no_such_game", 404)
        player = game["players"].get(str(body.get("player_id") or ""))
        if not player or player["kicked"]:
            return _err("no_such_player", 404)
        player["last_seen"] = _now()
        game["last_activity"] = _now()
        _tick(game)
        if game["phase"] != "question":
            return _err("question_closed", 409)
        q_index = game["q_index"]
        if q_index in player["answers"]:
            return _err("already_answered", 409)

        q = _current_question(game)
        ans = {"at": _now()}
        if q["type"] == "open":
            text = _clean_text(body.get("text"), 500)
            if not text:
                return _err("empty_answer")
            ans["text"] = text
        elif q["type"] == "multi":
            choices = body.get("choices")
            if (not isinstance(choices, list) or not choices
                    or any(not isinstance(c, int)
                           or not 0 <= c < len(q["options"])
                           for c in choices)):
                return _err("bad_answer")
            ans["choices"] = sorted(set(choices))
        else:
            choice = body.get("choice")
            if not isinstance(choice, int) or not 0 <= choice < len(q["options"]):
                return _err("bad_answer")
            ans["choice"] = choice

        player["answers"][q_index] = ans
        _tick(game)  # maybe everyone has now answered
        return jsonify({"ok": True})
