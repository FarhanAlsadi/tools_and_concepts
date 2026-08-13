# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project Overview

A standalone **Ethical Hacking lessons** website: a built React/Vite
single-page app served by a minimal Flask app. Arabic (RTL) only, light theme
only, no third-party branding. Every lesson is a safe, self-contained
client-side simulation — there is no database, login, or external service.

This repo was reduced from a larger "Academy Coordinator" platform down to just
the hacking lessons; the coordinator/instructor/leaderboard/other-games code was
removed.

## Architecture

- **`webapp/app.py`** — minimal Flask server. Serves the SPA from `static/` at
  the site root, with an index.html fallback for unknown paths. The only backend
  endpoints are two read-only routes, `GET /api/xo/subjects` and
  `GET /api/xo/questions`, which read `webapp/data/xo_questions.json` (used by the
  in-app "Mind Games" quiz and the embedded `csyc-xo` trivia game). No auth, no
  DB, no rate limiting.
- **`webapp/static/`** — the built SPA (`index.html`, `assets/`, `images/`,
  `fonts/`, `csyc-xo/`). **This is a build artifact — do not hand-edit it.**
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
- `src/pages/Welcome.jsx` — landing hub: learning paths + lessons grid.
- `src/pages/` — one file per lesson/lab.
- `vite.config.js` — `base: '/'`, single entry (`index.html`).

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

Production: `gunicorn app:app --bind 0.0.0.0:$PORT --timeout 120` (see
`Procfile`, `render.yaml`, `railway.json`).

## Git

Remote: `github.com/FarhanAlsadi/tools_and_concepts` (branch `main`). `gh` is
authenticated as **FarhanAlsadi**. Commit and push finished work.
