"""
Minimal Flask server for the standalone Ethical Hacking lessons.

Serves the built React/Vite single-page app from ``static/`` at the site root,
plus two read-only endpoints backed by a local JSON file that the in-app
"Mind Games" quiz and the embedded XO trivia game fetch from.

There is no database, authentication, or external service — every lesson runs
entirely client-side (the antivirus lab safely falls back to its built-in EICAR
demo when no VirusTotal proxy is configured).

Run locally:   python app.py           # http://localhost:5050
Production:     gunicorn app:app --bind 0.0.0.0:$PORT --timeout 120
"""

import json
import os
import threading

from flask import Flask, jsonify, request, send_from_directory

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
XO_DATA_FILE = os.path.join(BASE_DIR, "data", "xo_questions.json")

# static_folder=None: we serve everything explicitly below, so Flask's default
# "/static/<path>" route doesn't shadow the SPA's root-based asset paths.
app = Flask(__name__, static_folder=None)

_xo_lock = threading.Lock()


def _xo_load():
    """Load all XO trivia questions from the local JSON file."""
    if not os.path.exists(XO_DATA_FILE):
        return []
    with open(XO_DATA_FILE, "r", encoding="utf-8") as fh:
        try:
            return json.load(fh)
        except json.JSONDecodeError:
            return []


# ── XO question bank (read-only, used by Mind Games + embedded XO game) ──────
@app.route("/api/xo/subjects")
def xo_subjects():
    with _xo_lock:
        rows = _xo_load()
    subjects = sorted({r["subject"] for r in rows if r.get("subject")})
    return jsonify({"subjects": subjects})


@app.route("/api/xo/questions")
def xo_questions():
    subject = (request.args.get("subject") or "").strip()
    with _xo_lock:
        rows = _xo_load()
    if subject:
        rows = [r for r in rows if r.get("subject") == subject]
    rows = sorted(rows, key=lambda r: r.get("id", 0))
    return jsonify({"questions": rows})


# ── Static SPA ──────────────────────────────────────────────────────────────
@app.route("/")
def index():
    return send_from_directory(STATIC_DIR, "index.html")


@app.route("/<path:path>")
def serve(path):
    """Serve real files (assets/, images/, fonts/, csyc-xo/, …); for any
    unknown path fall back to index.html so the SPA can resolve it."""
    full_path = os.path.join(STATIC_DIR, path)
    if os.path.isfile(full_path):
        return send_from_directory(STATIC_DIR, path)
    return send_from_directory(STATIC_DIR, "index.html")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5050))
    app.run(host="0.0.0.0", port=port, debug=False)
