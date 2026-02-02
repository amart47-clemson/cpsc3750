"""
Workout Log Manager — Flask API
CPSC 3750 Solo Project 2
Backend: JSON file persistence, CRUD, paging, server-side validation.
"""

import json
import os
from pathlib import Path

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__, static_folder="../public", static_url_path="")
CORS(app)

# JSON file path (persistent on server)
DATA_DIR = Path(__file__).resolve().parent / "data"
DATA_FILE = DATA_DIR / "workouts.json"
PAGE_SIZE = 10

# Allowed values for validation
EXERCISE_TYPES = {"Cardio", "Strength Training", "Yoga", "HIIT", "Sports", "Flexibility", "Other"}
INTENSITIES = {"Low", "Medium", "High"}


def ensure_data_dir():
    DATA_DIR.mkdir(exist_ok=True)


def load_workouts():
    ensure_data_dir()
    if not DATA_FILE.exists():
        return None
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return None


def save_workouts(workouts):
    ensure_data_dir()
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(workouts, f, indent=2)


def seed_if_needed():
    data = load_workouts()
    if data is not None and len(data) >= 30:
        return
    from datetime import datetime, timedelta, timezone
    types_list = ["Cardio", "Strength Training", "Yoga", "HIIT", "Sports", "Flexibility"]
    intensities_list = ["Low", "Medium", "High"]
    notes_list = [
        "Morning workout, felt great!",
        "Tough session but pushed through",
        "Easy recovery day",
        "New personal record!",
        "Focused on form today",
        "Best workout this week!",
    ]
    base_id = 10000
    workouts = []
    today = datetime.now(timezone.utc).date()
    for i in range(35):
        d = today - timedelta(days=i)
        duration = 20 + (i * 2) % 50
        intensity = intensities_list[i % 3]
        ex_type = types_list[i % len(types_list)]
        workouts.append({
            "id": base_id + i,
            "date": d.isoformat(),
            "exerciseType": ex_type,
            "duration": duration,
            "intensity": intensity,
            "caloriesBurned": min(2000, duration * (6 + (i % 5))),
            "notes": notes_list[i % len(notes_list)],
        })
    save_workouts(workouts)


def validate_workout(body, for_update=False):
    """Server-side validation. Returns (None, error_response) or (workout_dict, None)."""
    if not isinstance(body, dict):
        return None, ({"error": "Invalid JSON body."}, 400)
    required = ["date", "exerciseType", "duration", "intensity", "caloriesBurned"]
    for field in required:
        if field not in body:
            return None, ({"error": f"Missing required field: {field}."}, 400)
    date = body.get("date")
    if not date or not isinstance(date, str):
        return None, ({"error": "Date is required and must be a string (YYYY-MM-DD)."}, 400)
    try:
        from datetime import datetime
        datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        return None, ({"error": "Date must be in YYYY-MM-DD format."}, 400)
    if body.get("exerciseType") not in EXERCISE_TYPES:
        return None, ({"error": "Invalid exercise type."}, 400)
    try:
        duration = int(body["duration"])
    except (TypeError, ValueError):
        return None, ({"error": "Duration must be an integer."}, 400)
    if duration < 1 or duration > 480:
        return None, ({"error": "Duration must be between 1 and 480 minutes."}, 400)
    if body.get("intensity") not in INTENSITIES:
        return None, ({"error": "Invalid intensity."}, 400)
    try:
        calories = int(body["caloriesBurned"])
    except (TypeError, ValueError):
        return None, ({"error": "Calories burned must be an integer."}, 400)
    if calories < 0 or calories > 2000:
        return None, ({"error": "Calories burned must be between 0 and 2000."}, 400)
    notes = body.get("notes")
    if notes is not None and not isinstance(notes, str):
        return None, ({"error": "Notes must be a string."}, 400)
    if notes and len(notes) > 200:
        return None, ({"error": "Notes must be at most 200 characters."}, 400)
    return {
        "date": date,
        "exerciseType": body["exerciseType"],
        "duration": duration,
        "intensity": body["intensity"],
        "caloriesBurned": calories,
        "notes": (notes or "").strip(),
    }, None


@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/api/workouts", methods=["GET"])
def list_workouts():
    data = load_workouts()
    if data is None:
        seed_if_needed()
        data = load_workouts()
    page = request.args.get("page", 1, type=int)
    if page < 1:
        page = 1
    # Sort by date descending
    sorted_data = sorted(data, key=lambda w: w["date"], reverse=True)
    total = len(sorted_data)
    start = (page - 1) * PAGE_SIZE
    end = start + PAGE_SIZE
    items = sorted_data[start:end]
    total_pages = (total + PAGE_SIZE - 1) // PAGE_SIZE if total else 1
    if page > total_pages:
        page = total_pages
        start = (page - 1) * PAGE_SIZE
        end = start + PAGE_SIZE
        items = sorted_data[start:end]
    return jsonify({
        "workouts": items,
        "total": total,
        "page": page,
        "pageSize": PAGE_SIZE,
        "totalPages": total_pages,
    })


@app.route("/api/workouts/<int:wid>", methods=["GET"])
def get_workout(wid):
    data = load_workouts()
    if data is None:
        seed_if_needed()
        data = load_workouts()
    for w in data:
        if w["id"] == wid:
            return jsonify(w)
    return jsonify({"error": "Workout not found."}), 404


@app.route("/api/workouts", methods=["POST"])
def create_workout():
    body = request.get_json(silent=True)
    workout, err = validate_workout(body or {}, for_update=False)
    if err:
        return jsonify(err[0]), err[1]
    data = load_workouts()
    if data is None:
        seed_if_needed()
        data = load_workouts()
    new_id = max((w["id"] for w in data), default=0) + 1
    new_workout = {"id": new_id, **workout}
    data.append(new_workout)
    save_workouts(data)
    return jsonify(new_workout), 201


@app.route("/api/workouts/<int:wid>", methods=["PUT"])
def update_workout(wid):
    body = request.get_json(silent=True)
    workout, err = validate_workout(body or {}, for_update=True)
    if err:
        return jsonify(err[0]), err[1]
    data = load_workouts()
    if data is None:
        return jsonify({"error": "Data not loaded."}), 500
    for i, w in enumerate(data):
        if w["id"] == wid:
            data[i] = {**w, **workout, "id": wid}
            save_workouts(data)
            return jsonify(data[i])
    return jsonify({"error": "Workout not found."}), 404


@app.route("/api/workouts/<int:wid>", methods=["DELETE"])
def delete_workout(wid):
    data = load_workouts()
    if data is None:
        return jsonify({"error": "Data not loaded."}), 500
    for i, w in enumerate(data):
        if w["id"] == wid:
            data.pop(i)
            save_workouts(data)
            return jsonify({"deleted": True, "id": wid})
    return jsonify({"error": "Workout not found."}), 404


@app.route("/api/stats")
def stats():
    data = load_workouts()
    if data is None:
        seed_if_needed()
        data = load_workouts()
    total = len(data)
    total_minutes = sum(w["duration"] for w in data)
    total_calories = sum(w["caloriesBurned"] for w in data)
    avg_duration = round(total_minutes / total) if total else 0
    type_counts = {}
    for w in data:
        t = w["exerciseType"]
        type_counts[t] = type_counts.get(t, 0) + 1
    most_common = max(type_counts, key=type_counts.get) if type_counts else "N/A"
    return jsonify({
        "totalWorkouts": total,
        "totalMinutes": total_minutes,
        "totalCalories": total_calories,
        "avgDuration": avg_duration,
        "mostCommonType": most_common,
    })


# Serve frontend from / when running as single app (e.g. Render)
@app.route("/")
def index():
    return app.send_static_file("index.html")


if __name__ == "__main__":
    seed_if_needed()
    # Default 5001 locally (macOS often uses 5000 for AirPlay); Render/etc. set PORT
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=(os.environ.get("FLASK_ENV") == "development"))
