"""Admin router — data reset, status, and audit logging."""

import os
import time
import json
from datetime import datetime
from fastapi import APIRouter, HTTPException
from catchweight.db import get_connection

router = APIRouter(tags=["admin"])

_SQL_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "sql")


def _log_admin_action(
    action_type: str,
    user_id: str,
    status: str,
    details: dict = None,
    duration_ms: int = None
):
    """Log admin action to audit trail."""
    try:
        with get_connection() as conn:
            conn.execute(
                """INSERT INTO admin_audit_log
                   (user_id, action_type, status, details, duration_ms)
                   VALUES (%s, %s, %s, %s, %s)""",
                (user_id, action_type, status, json.dumps(details) if details else None, duration_ms)
            )
            conn.commit()
    except Exception as e:
        # Don't fail the main operation if audit logging fails
        print(f"Warning: Failed to log admin action: {e}")


def _clear_all_tables(conn):
    """Clear all data from all tables (same logic as seed.py)."""
    conn.execute("DELETE FROM cdpos")
    conn.execute("DELETE FROM cdhdr")
    conn.execute("DELETE FROM mseg")
    conn.execute("DELETE FROM mkpf")
    conn.execute("DELETE FROM mchb")
    conn.execute("DELETE FROM mard")
    conn.execute("DELETE FROM mbew")
    conn.execute("DELETE FROM marm")
    conn.execute("DELETE FROM mara")


@router.get("/admin/status")
def get_system_status():
    """
    Get current system status with data metrics.
    Returns document count, date range, and material count.
    """
    try:
        with get_connection() as conn:
            # Get document count
            doc_count_row = conn.execute("SELECT COUNT(*) FROM mkpf").fetchone()
            doc_count = doc_count_row[0] if doc_count_row else 0

            # Get date range
            date_range_row = conn.execute(
                "SELECT MIN(posting_date), MAX(posting_date) FROM mkpf"
            ).fetchone()
            date_min = date_range_row[0] if date_range_row and date_range_row[0] else None
            date_max = date_range_row[1] if date_range_row and date_range_row[1] else None

            # Get material count
            material_count_row = conn.execute("SELECT COUNT(*) FROM mara").fetchone()
            material_count = material_count_row[0] if material_count_row else 0

            # Get movement count
            movement_count_row = conn.execute("SELECT COUNT(*) FROM mseg").fetchone()
            movement_count = movement_count_row[0] if movement_count_row else 0

            return {
                "document_count": doc_count,
                "date_range": {
                    "min": date_min.isoformat() if date_min else None,
                    "max": date_max.isoformat() if date_max else None,
                    "days": (date_max - date_min).days if date_min and date_max else 0
                },
                "material_count": material_count,
                "movement_count": movement_count,
                "timestamp": datetime.now().isoformat()
            }
    except Exception as e:
        raise HTTPException(500, f"Failed to get system status: {e}")


@router.get("/admin/audit-log")
def get_audit_log(limit: int = 20, offset: int = 0):
    """
    Retrieve admin audit log entries.
    Returns last N operations with details.
    """
    try:
        with get_connection() as conn:
            rows = conn.execute(
                """SELECT log_id, timestamp, user_id, action_type, status, details, duration_ms
                   FROM admin_audit_log
                   ORDER BY timestamp DESC
                   LIMIT %s OFFSET %s""",
                (limit, offset)
            ).fetchall()

        return [
            {
                "log_id": r[0],
                "timestamp": r[1].isoformat() if r[1] else None,
                "user_id": r[2],
                "action_type": r[3],
                "status": r[4],
                "details": r[5],
                "duration_ms": r[6]
            }
            for r in rows
        ]
    except Exception as e:
        raise HTTPException(500, f"Failed to retrieve audit log: {e}")


@router.post("/admin/reset")
async def reset_data_to_baseline(user_id: str = "WEBUSER"):
    """
    Orchestrated 90-day data reset: clear → load backfill → load seed.
    Returns detailed status of each step with duration.
    """
    start_time = time.time()
    steps_completed = []

    try:
        # Step 1: Clear all tables
        with get_connection() as conn:
            _clear_all_tables(conn)
            conn.commit()
        steps_completed.append("clear")

        # Step 2: Load 90-day backfill
        backfill_path = os.path.join(_SQL_DIR, "006_backfill_historical.sql")
        if not os.path.exists(backfill_path):
            raise FileNotFoundError(f"Backfill SQL file not found: {backfill_path}")

        with open(backfill_path) as f:
            backfill_sql = f.read()

        with get_connection() as conn:
            conn.execute(backfill_sql)
            conn.commit()
        steps_completed.append("backfill")

        # Step 3: Load current seed
        seed_path = os.path.join(_SQL_DIR, "004_seed_realistic.sql")
        if not os.path.exists(seed_path):
            raise FileNotFoundError(f"Seed SQL file not found: {seed_path}")

        with open(seed_path) as f:
            seed_sql = f.read()

        with get_connection() as conn:
            conn.execute(seed_sql)
            conn.commit()
        steps_completed.append("seed")

        # Calculate duration
        duration_ms = int((time.time() - start_time) * 1000)

        # Log success to audit trail
        _log_admin_action(
            action_type="data_reset",
            user_id=user_id,
            status="success",
            details={"steps": steps_completed},
            duration_ms=duration_ms
        )

        return {
            "status": "success",
            "steps_completed": steps_completed,
            "duration_ms": duration_ms,
            "message": "Data reset to 90-day baseline completed successfully"
        }

    except Exception as e:
        # Log error to audit trail
        duration_ms = int((time.time() - start_time) * 1000)
        _log_admin_action(
            action_type="data_reset",
            user_id=user_id,
            status="error",
            details={"error": str(e), "steps_completed": steps_completed},
            duration_ms=duration_ms
        )
        raise HTTPException(500, f"Reset failed at step {len(steps_completed)}: {e}")
