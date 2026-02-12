# Solo Project 3 — Deployment Documentation

**Workout Log Manager**  
CPSC 3750 · Web Application Development

---

## Live Application

**Custom domain (HTTPS):** https://workoutmanager.live

Open the link above in any browser to use the app. No login required.

---

## Domain & Registrar

- **Domain name:** workoutmanager.live  
- **Registrar:** Purchased and managed through **Netlify**.  
- **DNS:** Netlify automatically configures DNS for the domain when it is added to the site.  
- **HTTPS:** Netlify provisions a TLS certificate for the custom domain; the site is served over HTTPS.

---

## Hosting Provider

- **Frontend:** **Netlify**  
  - The files in `Solo Project 3/public` are deployed to Netlify.  
  - The site is available at the custom domain **workoutmanager.live** and at the Netlify subdomain **workout-log-solo3.netlify.app**.

- **Backend (API):** **Render**  
  - The Flask application in `Solo Project 3/api` is deployed as a **Web Service** on Render.  
  - It handles all CRUD operations, search, filtering, sorting, paging, and stats.  
  - **Render API base URL:** https://cpsc3750-soloproject3.onrender.com  

- **Database:** **PostgreSQL on Render**  
  - A Render **PostgreSQL** instance stores all workout data.  
  - The backend connects using the **internal** database URL provided by Render (same region as the API service).

---

## Tech Stack

| Layer      | Technology |
|-----------|------------|
| Frontend  | HTML, CSS, JavaScript (vanilla); static files served by Netlify |
| Backend   | **Python 3**, **Flask**, **gunicorn**, **flask-cors** |
| Database  | **PostgreSQL** (Render managed) |
| Hosting   | Netlify (frontend), Render (backend + database) |

---

## Database

- **Type:** PostgreSQL  
- **Where hosted:** Render (same account as the backend Web Service).  
- **Schema:** Single table `workouts` with columns: `id`, `workout_date`, `exercise_type`, `duration_min`, `intensity`, `calories_burned`, `notes`, `image_url`, `created_at`, `updated_at`.  
- **Seed data:** The application seeds at least 30 sample workouts on first run (or via the one-time `/api/seed` endpoint if the table is empty).  
- **Secrets:** The database connection URL is **not** stored in the repository. It is provided via **environment variables** (see below).

---

## How to Deploy and Update the App

1. **Code lives in GitHub:**  
   Repository: **amart47-clemson/cpsc3750**  
   Solo Project 3 code is under the `Solo Project 3/` directory (`api/` and `public/`).

2. **Deploy / update frontend (Netlify):**  
   - Push changes to the `main` branch.  
   - Netlify is connected to this repo; it builds from `Solo Project 3/public` (per `netlify.toml`).  
   - Netlify automatically deploys on push.  
   - Alternatively, in the Netlify dashboard: **Deploys → Trigger deploy → Deploy site**.

3. **Deploy / update backend (Render):**  
   - Push changes to `main`.  
   - The Render Web Service is connected to the same repo with **Root Directory** set to `Solo Project 3/api`.  
   - Render automatically deploys on push.  
   - Alternatively, in the Render dashboard: open the service → **Manual Deploy → Deploy latest commit**.

4. **After deployment:**  
   - Frontend at https://wokroutmanager.live will serve the latest static files.  
   - Backend at https://cpsc3750-soloproject3.onrender.com will run the latest API code.  
   - No need to redeploy the database unless you change schema or run migrations (not required for this project).

---

## How Configuration and Secrets Are Managed

- **Backend (Render):**  
  - **DATABASE_URL:** Set in the Render Web Service **Environment** tab. Uses the **internal** PostgreSQL URL from the Render database (never committed to Git).  
  - **FLASK_ENV:** Set to `production` on Render.  
  - All secrets are stored as **environment variables** in the Render dashboard; they are not in the repository.

- **Local development:**  
  - A **`.env`** file in the repository root can hold `DATABASE_URL` (e.g. the **external** Postgres URL from Render) for running the Flask app locally.  
  - **`.env` is listed in `.gitignore`** and is **never committed** to Git.

- **Frontend:**  
  - The API base URL is set in `Solo Project 3/public/index.html` as `window.API_BASE_URL = 'https://cpsc3750-soloproject3.onrender.com'`.  
  - No API keys or secrets are required in the frontend for this project.

---

## Summary

| Item              | Detail |
|-------------------|--------|
| Live URL          | https://workoutmanager.live |
| Domain registrar  | Netlify |
| Frontend hosting  | Netlify |
| Backend hosting   | Render (Web Service) |
| Database          | PostgreSQL on Render |
| Secrets           | Environment variables (Render + local `.env`, not in Git) |

---

Anthony Martino · CPSC 3750 · Web Application Development
