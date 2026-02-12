"""
Workout Log Manager — Flask API (Solo Project 3)

Production version with PostgreSQL persistence, images, paging, search, and sorting.
"""

import os
from datetime import datetime, timedelta, timezone

from flask import Flask, request, jsonify
from flask_cors import CORS

from db import init_db, with_connection

app = Flask(__name__, static_folder="../public", static_url_path="")
CORS(app)


# Paging configuration for Solo Project 3
PAGE_SIZE_DEFAULT = 10
PAGE_SIZE_MIN = 5
PAGE_SIZE_MAX = 50

# Allowed values for validation
EXERCISE_TYPES = {"Cardio", "Strength Training", "Yoga", "HIIT", "Sports", "Flexibility", "Other"}
INTENSITIES = {"Low", "Medium", "High"}

# Valid sort columns exposed to the client
SORT_COLUMNS = {
    "date": "workout_date",
    "duration": "duration_min",
    "calories": "calories_burned",
}


def row_to_workout(row):
    """
    Convert a DB row from `workouts` into the JSON shape used by the frontend.
    Expected row order:
    (id, workout_date, exercise_type, duration_min, intensity, calories_burned, notes, image_url)
    """
    (
        wid,
        workout_date,
        exercise_type,
        duration_min,
        intensity,
        calories_burned,
        notes,
        image_url,
    ) = row

    return {
        "id": wid,
        "date": workout_date.isoformat(),
        "exerciseType": exercise_type,
        "duration": duration_min,
        "intensity": intensity,
        "caloriesBurned": calories_burned,
        "notes": notes or "",
        "imageUrl": image_url,
    }


def validate_workout(body, for_update=False):
    """Server-side validation. Returns (None, error_response) or (workout_dict, None)."""
    if not isinstance(body, dict):
        return None, ({"error": "Invalid JSON body."}, 400)

    required = ["date", "exerciseType", "duration", "intensity", "caloriesBurned", "imageUrl"]
    for field in required:
        if field not in body:
            return None, ({"error": f"Missing required field: {field}."}, 400)

    date_str = body.get("date")
    if not date_str or not isinstance(date_str, str):
        return None, ({"error": "Date is required and must be a string (YYYY-MM-DD)."}, 400)
    try:
        parsed_date = datetime.strptime(date_str, "%Y-%m-%d").date()
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

    image_url = body.get("imageUrl")
    if not image_url or not isinstance(image_url, str):
        return None, ({"error": "Image URL is required."}, 400)
    if len(image_url) > 500:
        return None, ({"error": "Image URL is too long."}, 400)

    return {
        "date": parsed_date,
        "exerciseType": body["exerciseType"],
        "duration": duration,
        "intensity": body["intensity"],
        "caloriesBurned": calories,
        "notes": (notes or "").strip(),
        "imageUrl": image_url.strip(),
    }, None


def seed_db_if_needed():
    """
    Ensure the workouts table has at least 30 records.
    This is run on startup and is safe to call multiple times.
    """

    def _inner(conn):
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM workouts;")
            count = cur.fetchone()[0]
            if count >= 30:
                return

            types_list = ["Cardio", "Strength Training", "Yoga", "HIIT", "Sports", "Flexibility"]
            intensities_list = ["Low", "Medium", "High"]
            notes_list = [
                "Morning workout, felt great!",
                "Tough session but pushed through.",
                "Easy recovery day.",
                "New personal record!",
                "Focused on form today.",
                "Best workout this week!",
            ]
            image_urls = [
                "https://images.pexels.com/photos/1552106/pexels-photo-1552106.jpeg",
                "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg",
                "https://images.pexels.com/photos/866023/pexels-photo-866023.jpeg",
                "https://images.pexels.com/photos/949129/pexels-photo-949129.jpeg",
                "https://images.pexels.com/photos/414029/pexels-photo-414029.jpeg",
                "https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg",
            ]

            today = datetime.now(timezone.utc).date()
            rows = []
            for i in range(35):
                d = today - timedelta(days=i)
                duration = 20 + (i * 2) % 50
                intensity = intensities_list[i % len(intensities_list)]
                ex_type = types_list[i % len(types_list)]
                calories = min(2000, duration * (6 + (i % 5)))
                notes = notes_list[i % len(notes_list)]
                image_url = image_urls[i % len(image_urls)]
                rows.append(
                    (
                        d,
                        ex_type,
                        duration,
                        intensity,
                        calories,
                        notes,
                        image_url,
                    )
                )

            cur.executemany(
                """
                INSERT INTO workouts (
                    workout_date,
                    exercise_type,
                    duration_min,
                    intensity,
                    calories_burned,
                    notes,
                    image_url
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s);
                """,
                rows,
            )

    with_connection(_inner)


# Initialize database schema and seed data at startup
init_db()
seed_db_if_needed()


@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/api/workouts", methods=["GET"])
def list_workouts():
    """
    List workouts with paging, optional search/filtering, and sorting.

    Query params:
      - page: 1-based page number
      - pageSize: number of records per page (5–50)
      - search: substring search on exercise type and notes
      - exerciseType: exact match filter
      - intensity: exact match filter
      - sortBy: one of "date", "duration", "calories"
      - sortDir: "asc" or "desc"
    """
    page = request.args.get("page", 1, type=int)
    if page is None or page < 1:
        page = 1

    page_size = request.args.get("pageSize", PAGE_SIZE_DEFAULT, type=int)
    if page_size is None or page_size < PAGE_SIZE_MIN:
        page_size = PAGE_SIZE_MIN
    if page_size > PAGE_SIZE_MAX:
        page_size = PAGE_SIZE_MAX

    search = request.args.get("search", "", type=str).strip()
    exercise_type_filter = request.args.get("exerciseType", "", type=str).strip()
    intensity_filter = request.args.get("intensity", "", type=str).strip()

    sort_by_param = request.args.get("sortBy", "date")
    sort_dir_param = request.args.get("sortDir", "desc")

    sort_column = SORT_COLUMNS.get(sort_by_param, SORT_COLUMNS["date"])
    sort_dir = "ASC" if str(sort_dir_param).lower() == "asc" else "DESC"

    def _inner(conn):
        where_clauses = []
        params = []

        if search:
            where_clauses.append(
                "(LOWER(exercise_type) LIKE %s OR LOWER(COALESCE(notes, '')) LIKE %s)"
            )
            like = f"%{search.lower()}%"
            params.extend([like, like])

        if exercise_type_filter:
            where_clauses.append("exercise_type = %s")
            params.append(exercise_type_filter)

        if intensity_filter:
            where_clauses.append("intensity = %s")
            params.append(intensity_filter)

        where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

        with conn.cursor() as cur:
            # Total count
            cur.execute(f"SELECT COUNT(*) FROM workouts {where_sql};", params)
            total = cur.fetchone()[0]

            if total == 0:
                return [], 0, 1, 1

            total_pages = (total + page_size - 1) // page_size
            if page > total_pages:
                page_local = total_pages
            else:
                page_local = page

            offset = (page_local - 1) * page_size

            cur.execute(
                f"""
                SELECT
                    id,
                    workout_date,
                    exercise_type,
                    duration_min,
                    intensity,
                    calories_burned,
                    notes,
                    image_url
                FROM workouts
                {where_sql}
                ORDER BY {sort_column} {sort_dir}
                LIMIT %s OFFSET %s;
                """,
                params + [page_size, offset],
            )
            rows = cur.fetchall()
            workouts = [row_to_workout(r) for r in rows]
            return workouts, total, page_local, total_pages

    workouts, total, page_effective, total_pages = with_connection(_inner)

    return jsonify(
        {
            "workouts": workouts,
            "total": total,
            "page": page_effective,
            "pageSize": page_size,
            "totalPages": total_pages,
        }
    )


@app.route("/api/workouts/<int:wid>", methods=["GET"])
def get_workout(wid):
    def _inner(conn):
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    id,
                    workout_date,
                    exercise_type,
                    duration_min,
                    intensity,
                    calories_burned,
                    notes,
                    image_url
                FROM workouts
                WHERE id = %s;
                """,
                (wid,),
            )
            row = cur.fetchone()
            if not row:
                return None
            return row_to_workout(row)

    workout = with_connection(_inner)
    if not workout:
        return jsonify({"error": "Workout not found."}), 404
    return jsonify(workout)


@app.route("/api/workouts", methods=["POST"])
def create_workout():
    body = request.get_json(silent=True)
    workout, err = validate_workout(body or {}, for_update=False)
    if err:
        return jsonify(err[0]), err[1]

    def _inner(conn):
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO workouts (
                    workout_date,
                    exercise_type,
                    duration_min,
                    intensity,
                    calories_burned,
                    notes,
                    image_url
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING
                    id,
                    workout_date,
                    exercise_type,
                    duration_min,
                    intensity,
                    calories_burned,
                    notes,
                    image_url;
                """,
                (
                    workout["date"],
                    workout["exerciseType"],
                    workout["duration"],
                    workout["intensity"],
                    workout["caloriesBurned"],
                    workout["notes"],
                    workout["imageUrl"],
                ),
            )
            row = cur.fetchone()
            return row_to_workout(row)

    created = with_connection(_inner)
    return jsonify(created), 201


@app.route("/api/workouts/<int:wid>", methods=["PUT"])
def update_workout(wid):
    body = request.get_json(silent=True)
    workout, err = validate_workout(body or {}, for_update=True)
    if err:
        return jsonify(err[0]), err[1]

    def _inner(conn):
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE workouts
                SET
                    workout_date = %s,
                    exercise_type = %s,
                    duration_min = %s,
                    intensity = %s,
                    calories_burned = %s,
                    notes = %s,
                    image_url = %s,
                    updated_at = NOW()
                WHERE id = %s
                RETURNING
                    id,
                    workout_date,
                    exercise_type,
                    duration_min,
                    intensity,
                    calories_burned,
                    notes,
                    image_url;
                """,
                (
                    workout["date"],
                    workout["exerciseType"],
                    workout["duration"],
                    workout["intensity"],
                    workout["caloriesBurned"],
                    workout["notes"],
                    workout["imageUrl"],
                    wid,
                ),
            )
            row = cur.fetchone()
            return row_to_workout(row) if row else None

    updated = with_connection(_inner)
    if not updated:
        return jsonify({"error": "Workout not found."}), 404
    return jsonify(updated)


@app.route("/api/workouts/<int:wid>", methods=["DELETE"])
def delete_workout(wid):
    def _inner(conn):
        with conn.cursor() as cur:
            cur.execute("DELETE FROM workouts WHERE id = %s;", (wid,))
            deleted = cur.rowcount > 0
            return deleted

    deleted = with_connection(_inner)
    if not deleted:
        return jsonify({"error": "Workout not found."}), 404
    return jsonify({"deleted": True, "id": wid})


@app.route("/api/stats")
def stats():
    """
    Aggregate statistics across all workouts.
    Stats view in the UI will also include the *current* page size from the client.
    """

    def _inner(conn):
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    COUNT(*) AS total_workouts,
                    COALESCE(SUM(duration_min), 0) AS total_minutes,
                    COALESCE(SUM(calories_burned), 0) AS total_calories,
                    COALESCE(AVG(duration_min), 0) AS avg_duration
                FROM workouts;
                """
            )
            total_workouts, total_minutes, total_calories, avg_duration = cur.fetchone()

            cur.execute(
                """
                SELECT exercise_type, COUNT(*) AS cnt
                FROM workouts
                GROUP BY exercise_type
                ORDER BY cnt DESC
                LIMIT 1;
                """
            )
            row = cur.fetchone()
            most_common_type = row[0] if row else "N/A"

            return {
                "totalWorkouts": total_workouts,
                "totalMinutes": int(total_minutes or 0),
                "totalCalories": int(total_calories or 0),
                "avgDuration": round(avg_duration) if avg_duration else 0,
                "mostCommonType": most_common_type,
                "defaultPageSize": PAGE_SIZE_DEFAULT,
            }

    data = with_connection(_inner)
    return jsonify(data)


@app.route("/api/seed", methods=["POST"])
def seed_endpoint():
    """
    One-time helper endpoint to ensure the database has
    at least 30 sample workouts.

    Safe to call multiple times; it only inserts when the
    table has fewer than 30 rows.
    """
    seed_db_if_needed()
    return jsonify({"seeded": True}), 200


# Serve frontend from / when running as single app (e.g. Render)
@app.route("/")
def index():
    return app.send_static_file("index.html")


if __name__ == "__main__":
    # Default 5001 locally (macOS often uses 5000 for AirPlay); Render/etc. set PORT
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=(os.environ.get("FLASK_ENV") == "development"))

