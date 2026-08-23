# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project Overview

A standalone **Ethical Hacking lessons** website: a built React/Vite
single-page app served by a minimal Flask app. Arabic (RTL) only, light theme
only, no third-party branding. Every lesson is a safe, self-contained
client-side simulation — there is no database, login, or external service.
The one server-side feature is the **Live Quiz** (Kahoot-style game, see
below); its state is in-memory only.

This repo was reduced from a larger "Academy Coordinator" platform down to just
the hacking lessons; the coordinator/instructor/leaderboard/other-games code was
removed.

## Architecture

- **`webapp/app.py`** — minimal Flask server. Serves the SPA from
  `static/` at the site root, with an index.html fallback for unknown paths
  (the SPA uses BrowserRouter, so real paths like `/play` rely on this).
- **`webapp/quiz_api.py`** — the Live Quiz game API (`/api/quiz/…`).
  Kahoot-style: trainer hosts (PIN from `TRAINER_PIN` env var, default
  `0000`), attendees join with a 6-digit code, clients poll ~1/s. All state
  is in-memory: run ONE gunicorn process (`--threads 8`, no `-w`).
- **`webapp/static/`** — the built SPA (`index.html`, `assets/`, `images/`,
  `fonts/`). **This is a build artifact — do not hand-edit it.**
- **`hacking-edu/`** — the editable React/Vite source that produces `static/`.

## Changing the front end

Edit the source, then rebuild and copy the output in:

```bash
cd hacking-edu
npm install        # first time
npm run build      # -> hacking-edu/dist/
cp -r dist/. ../webapp/static/
```

Key source files:
- `src/context/AppContext.jsx` — locks `lang='ar'` and `theme='light'` (toggles
  removed; toggle functions kept as no-ops so consumers don't break).
- `src/components/Navbar.jsx` — top bar (language/theme toggle buttons removed).
- `src/pages/Welcome.jsx` — landing page: Live Quiz banner + the lessons grid.
- `src/pages/` — one file per lesson/lab.
- `src/quiz/` — the Live Quiz front end: `PagePlay.jsx` (attendees, `/play`),
  `PageHost.jsx` (trainer, `/host`), `QuizEditor.jsx`, `HostGame.jsx`,
  `xlsxUtils.js` (Excel template + import; `xlsx` is lazy-loaded), `api.js`.
  Trainer quizzes persist in the trainer's browser localStorage.
- `src/games/` — client-side team games (no backend): `PageXO.jsx`
  (`/games/xo`, answer-to-claim tic-tac-toe; question sources: built-in
  `questionBank.js` or saved trainer quizzes) and `PageMemory.jsx`
  (`/games/memory`, 3×3 pairs board, 10s preview, fewest mistakes).
- `vite.config.js` — `base: '/'`, single entry, dev proxy `/api` → `:5050`.

## Conventions

- **Arabic + light only.** Do not reintroduce a language switch, English-default
  UI, or a dark theme.
- **No third-party branding.** Do not add logos, mascots, "back to games" links,
  or brand names to the UI chrome. (Some lessons still use a fictional company
  name inside scenario content — that is lesson content, not chrome.)
- Lessons are safe simulations — never wire a lesson to perform a real attack or
  scan against an external target.

## Running & Deploy

```bash
cd webapp && python app.py       # http://localhost:5050
```

Production: `gunicorn app:app --bind 0.0.0.0:$PORT --timeout 120 --threads 8`
(see `Procfile`, `render.yaml`, `railway.json`). Set the `TRAINER_PIN` env var
on the host — it protects the Live Quiz trainer panel (`/host`).

## Git

Remote: `github.com/FarhanAlsadi/tools_and_concepts` (branch `main`). `gh` is
authenticated as **FarhanAlsadi**. Commit and push finished work.
