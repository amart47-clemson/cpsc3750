"""
Database helpers for Solo Project 3 — Workout Log Manager.

This module is responsible for:
- Reading the DATABASE_URL environment variable
- Opening PostgreSQL connections
- Ensuring the `workouts` table exists with the expected schema

You will import `init_db` once at startup and call `get_connection`
whenever you need to run a query.
"""

import os
from typing import Callable, Any

import psycopg2
from psycopg2.extensions import connection as PGConnection


DATABASE_URL = os.getenv("DATABASE_URL")


def get_connection() -> PGConnection:
    """
    Open a new PostgreSQL connection using DATABASE_URL.

    For this project, opening/closing a connection per request is fine.
    Render's external/internal URLs already include SSL options where needed,
    so we just pass the URL straight through.
    """
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not set. Check your env vars or .env file.")
    return psycopg2.connect(DATABASE_URL)


def init_db() -> None:
    """
    Create the `workouts` table if it does not already exist.

    This is idempotent and safe to call on startup. It only creates the table;
    seeding initial data will be handled separately.
    """
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS workouts (
        id SERIAL PRIMARY KEY,
        workout_date DATE NOT NULL,
        exercise_type VARCHAR(50) NOT NULL,
        duration_min INTEGER NOT NULL CHECK (duration_min BETWEEN 1 AND 480),
        intensity VARCHAR(20) NOT NULL,
        calories_burned INTEGER NOT NULL CHECK (calories_burned BETWEEN 0 AND 2000),
        notes TEXT,
        image_url TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts (workout_date DESC);
    CREATE INDEX IF NOT EXISTS idx_workouts_exercise_type ON workouts (exercise_type);
    """

    conn = get_connection()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(create_table_sql)
    finally:
        conn.close()


def with_connection(fn: Callable[[PGConnection], Any]) -> Any:
    """
    Small helper to run a function with a managed connection.

    Example usage in route handlers:

        from db import with_connection

        def list_workouts_from_db():
            def _inner(conn):
                with conn.cursor() as cur:
                    cur.execute("SELECT ...")
                    return cur.fetchall()
            return with_connection(_inner)
    """

    conn = get_connection()
    try:
        result = fn(conn)
        # Explicitly commit any changes made inside fn.
        # This ensures INSERT/UPDATE/DELETE statements are persisted,
        # including initial seeding.
        try:
            conn.commit()
        except Exception:
            # In case of read-only operations, commit is a no-op.
            pass
        return result
    finally:
        conn.close()

