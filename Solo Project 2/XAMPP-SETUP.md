# Running Solo Project 2 with XAMPP

XAMPP runs **Apache** (for the frontend). The **Flask backend** must run separately in a terminal. Here’s how to set it up.

---

## 1. Put the frontend in XAMPP’s htdocs

Copy the **contents** of the `public` folder into a new folder under XAMPP’s `htdocs`:

**On macOS (typical XAMPP install):**
```text
/Applications/XAMPP/xamppfiles/htdocs/workout-log-cloud/
```

**On Windows:**
```text
C:\xampp\htdocs\workout-log-cloud\
```

So that folder contains:
- `index.html`
- `style.css`
- `app.js`

You can copy them manually or run (from your project repo, **macOS/Linux**):

```bash
cp -r "Solo Project 2/public/"* /Applications/XAMPP/xamppfiles/htdocs/workout-log-cloud/
```

(On Windows, copy the three files into `C:\xampp\htdocs\workout-log-cloud\`.)

---

## 2. Point the frontend at the local Flask backend

The frontend in htdocs must call your Flask API. In the **copy** of `index.html` that’s inside `workout-log-cloud`, change this line:

**From:**
```html
<script>window.API_BASE_URL = '';</script>
```

**To:**
```html
<script>window.API_BASE_URL = 'http://127.0.0.1:5000';</script>
```

Save the file. That way the page at `http://localhost/workout-log-cloud/` will use the API at `http://127.0.0.1:5000`.

---

## 3. Start XAMPP

1. Open the XAMPP Control Panel.
2. Start **Apache** (and MySQL only if you use it for something else; this project does not need it).

---

## 4. Start the Flask backend

In a terminal, from your **project repo** (e.g. where `Solo Project 2` lives):

```bash
cd "Solo Project 2/api"
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

You should see something like:
```text
 * Running on http://127.0.0.1:5000
```

Leave this terminal open while you use the app.

---

## 5. Open the app in the browser

1. Go to: **http://localhost/workout-log-cloud/**  
   (or **http://localhost/workout-log-cloud/index.html**)
2. The page is served by **Apache (XAMPP)**.
3. The app will load data and do CRUD via **Flask** at `http://127.0.0.1:5000`.

If the backend isn’t running, the list will be empty and you’ll see a “Could not load workouts” message until Flask is started.

---

## Summary

| What              | Where / URL |
|-------------------|-------------|
| Frontend files    | `htdocs/workout-log-cloud/` (index.html, style.css, app.js) |
| Frontend URL      | http://localhost/workout-log-cloud/ |
| Backend (Flask)   | Run from `Solo Project 2/api` with `python app.py` |
| Backend URL       | http://127.0.0.1:5000 |
| Data (JSON)       | Stored in `Solo Project 2/api/data/workouts.json` (created when you first run Flask) |

You need **both** Apache (XAMPP) and the Flask process running for the app to work.
