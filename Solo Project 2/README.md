# Solo Project 2 — Cloud Collection Manager (Workout Log)

CPSC 3750 · Web Application Development

---

## Live app

**Netlify URL:** https://coruscating-gaufre-0e180e.netlify.app

Open the link above in any browser to use the app. No setup required.

**If the page loads but shows no workouts or stats:** The backend may be waking up after a period of no traffic. Wait a few seconds and refresh the page once; the data should appear.

---

## Backend language

The backend is written in **Python** using **Flask**. It exposes API routes for listing, creating, updating, and deleting workout records, plus a stats endpoint. The frontend (HTML, CSS, JavaScript) talks to this backend over HTTP.

---

## JSON persistence

All workout data is stored on the server in a single **JSON file** — no database is used.

- **File location:** `api/data/workouts.json`
- The backend reads this file when it needs to list or fetch workouts, and writes it back whenever a workout is added, updated, or deleted.
- Data persists across browser refreshes and different devices because it lives on the server, not in the browser.
- When the app runs for the first time (or the file is missing), the backend automatically creates the file and fills it with 35 sample workouts so the app always starts with at least 30 records.

---

## Setup and deployment (how it’s built)

- **Frontend:** The files in the `public` folder (HTML, CSS, JS) are deployed to **Netlify**. Netlify serves these static files when someone opens the Netlify URL.
- **Backend:** The Flask app in the `api` folder is deployed to **Render**. It handles all CRUD and stats, and reads/writes the JSON file on the server. The frontend is configured to call this backend by URL.
- **Local development:** To run it on your machine, start the Flask backend from the `api` folder (`pip install -r requirements.txt` then `python app.py`) and either open the frontend via a local server (e.g. XAMPP) or use the Netlify/Render URLs.

---

## Repository

**GitHub:** https://github.com/amart47-clemson/cpsc3750

---

Anthony Martino · CPSC 3750 · Web Application Development
