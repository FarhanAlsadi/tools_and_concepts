# Ethical Hacking Lessons

An interactive, Arabic (RTL) web-security learning platform — hands-on lessons
and labs (brute-force, ciphers, VPN, DoS/DDoS, phishing, ransomware, and a
real-command Linux track with Gobuster & Hydra), all running as safe
client-side simulations.

The site is a built React/Vite single-page app served by a tiny Flask app.
It is **Arabic + light-theme only** and carries no third-party branding.

## Layout

```
webapp/            Minimal static Flask server
  app.py             Serves the built SPA (no database, no API)
  static/            Built SPA (index.html, assets/, images/, fonts/)
hacking-edu/       Editable React/Vite source for the SPA
```

## Run locally

```bash
cd webapp
python -m venv venv && source venv/bin/activate   # first time
pip install -r requirements.txt
python app.py            # http://localhost:5050
```

## Change the lessons UI (rebuild the SPA)

The served files under `webapp/static/` are a build artifact. To change the
front end, edit the source and rebuild:

```bash
cd hacking-edu
npm install              # first time
npm run build            # outputs to hacking-edu/dist/
```

Then copy `hacking-edu/dist/` over `webapp/static/`.
(The Vite config uses `base: '/'` so the app is served from the site root.)

## Deploy

Deployed as a Python web service (Render/Railway configs included).
Start command: `gunicorn app:app --bind 0.0.0.0:$PORT --timeout 120`.
