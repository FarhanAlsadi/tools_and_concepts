"""
Minimal static Flask server for the standalone Ethical Hacking lessons.

Serves the built React/Vite single-page app from ``static/`` at the site root,
with an index.html fallback for unknown paths. There is no database,
authentication, or API — every lesson runs entirely client-side (the antivirus
lab safely falls back to its built-in EICAR demo when no proxy is configured).

Run locally:   python app.py           # http://localhost:5050
Production:     gunicorn app:app --bind 0.0.0.0:$PORT --timeout 120
"""

import os

from flask import Flask, send_from_directory

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

# static_folder=None: we serve everything explicitly below, so Flask's default
# "/static/<path>" route doesn't shadow the SPA's root-based asset paths.
app = Flask(__name__, static_folder=None)


@app.route("/")
def index():
    return send_from_directory(STATIC_DIR, "index.html")


@app.route("/<path:path>")
def serve(path):
    """Serve real files (assets/, images/, fonts/, …); for any unknown path
    fall back to index.html so the SPA can resolve it."""
    full_path = os.path.join(STATIC_DIR, path)
    if os.path.isfile(full_path):
        return send_from_directory(STATIC_DIR, path)
    return send_from_directory(STATIC_DIR, "index.html")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5050))
    app.run(host="0.0.0.0", port=port, debug=False)
