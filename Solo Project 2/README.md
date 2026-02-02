# Solo Project 2 — Cloud Collection Manager (Workout Log)

**CPSC 3750 · Web Application Development**

Cloud-hosted Workout Log Manager with a backend API and JSON file persistence. All CRUD operations go through the server; the browser does not own the data.

---

## Live deployment

- **Netlify (frontend):** [Add your Netlify URL here after deployment]
- **Backend:** Python (Flask), deployed separately (e.g. [Render](https://render.com)) so the frontend can call the API.

The application is fully usable at the Netlify URL in a normal or incognito/private browser window once the backend URL is set (see below).

---

## Backend language and stack

- **Backend:** Python 3 with **Flask**
- **Persistence:** Server-side **JSON file** (`api/data/workouts.json`) — no database
- **Frontend:** HTML, CSS, JavaScript (vanilla); communicates with the backend via `fetch()` (HTTP)

---

## JSON persistence

- All workout records are stored in a single JSON file on the server: `api/data/workouts.json`.
- The backend reads this file on each request and writes it back after any create, update, or delete.
- Data persists across browser refreshes and different devices because it lives on the server.
- The app starts with at least 30 seed records; if the file is missing or empty, the server seeds it automatically.
- No SQL or other database is used — only this JSON file.

---

## Features (requirements checklist)

- **CRUD via backend:** Create, read, update, and delete workouts through server API routes only.
- **Paging:** List view shows 10 records per page with Previous/Next and a “Page X of Y” indicator; paging behaves correctly after add/edit/delete.
- **UI:** Clear layout, consistent styling, basic mobile responsiveness.
- **Stats view:** Total workouts, total minutes, total calories, average duration, and most common exercise type (all from server data).
- **Validation:** Required fields and invalid data are validated on both the client and the server; errors are shown in the UI.
- **Delete confirmation:** A modal confirms before any record is deleted.

---

## Local setup

### 1. Backend (Flask)

```bash
cd "Solo Project 2/api"
python -m venv venv
source venv/bin/activate   
pip install -r requirements.txt
python app.py
```

The API runs at `http://127.0.0.1:5000`. It serves the frontend from the `public` folder at `/`, so you can open `http://127.0.0.1:5000` and use the app with the backend on the same origin (no CORS issues).

### 2. Frontend only (e.g. for Netlify-style testing)

If you serve the frontend from another origin (e.g. Netlify), it must know the backend URL. In `public/index.html`, set:

```html
<script>window.API_BASE_URL = 'https://your-backend.onrender.com';</script>
```

Replace with your actual backend URL. Leave it as `''` when the frontend is served by Flask (same origin).

---

## Deployment

### Netlify (frontend)

1. In Netlify: **Site settings → Build & deploy.** Set **Base directory** to `Solo Project 2` (if the repo root is the repo root). Set **Publish directory** to `public` (or use the repo’s `netlify.toml`, which already sets `publish = "public"`).
2. After deploy, set `window.API_BASE_URL` in `public/index.html` to your backend URL, then redeploy (or use a build step that injects the URL from an env var).
3. Your **Netlify URL** is the live application URL to submit.

### Backend (e.g. Render)

1. Create a **Web Service** and connect this repo.
2. **Root directory:** `Solo Project 2/api` (or equivalent so `app.py` and `requirements.txt` are at the service root).
3. **Build:** `pip install -r requirements.txt`
4. **Start:** `gunicorn app:app` or `python app.py`
5. Copy the service URL (e.g. `https://workout-log-api.onrender.com`) and use it as `API_BASE_URL` in the frontend.

The backend keeps using `api/data/workouts.json` for persistence on the server (Render’s disk is ephemeral on free tier; for a persistent file you’d use a persistent disk add-on or switch to a different host that retains files — the architecture and “JSON file persistence” design remain the same).

---

## Repository

- **GitHub:** https://github.com/amart47-clemson/cpsc3750

---

## Summary

| Item              | Detail                                      |
|-------------------|---------------------------------------------|
| Netlify URL       | https://coruscating-gaufre-0e180e.netlify.app/
| Backend language  | Python (Flask)                              |
| Data persistence  | Server-side JSON file (`api/data/workouts.json`) |
| Minimum records   | 30+ (seeded on first run if needed)         |

Name: Anthony Martino  
Class: CPSC 3750 — Web Application Development  
Date: 2/2026
