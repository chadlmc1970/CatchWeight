"""Seed data router — load/clear sample data."""

import os
from fastapi import APIRouter, HTTPException
from catchweight.db import get_connection

router = APIRouter(tags=["seed"])

_SQL_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "sql")


@router.post("/seed", status_code=201)
def load_seed_data():
    """Load sample Tyson-like data (idempotent — clears existing first)."""
    seed_path = os.path.join(_SQL_DIR, "004_seed.sql")
    if not os.path.exists(seed_path):
        raise HTTPException(500, "Seed SQL file not found")

    with open(seed_path) as f:
        sql = f.read()

    with get_connection() as conn:
        conn.execute(sql)
        conn.commit()

    return {"seeded": True, "message": "Sample data loaded successfully"}


@router.delete("/seed")
def clear_data():
    """Clear all transactional and master data."""
    with get_connection() as conn:
        conn.execute("DELETE FROM cdpos")
        conn.execute("DELETE FROM cdhdr")
        conn.execute("DELETE FROM mseg")
        conn.execute("DELETE FROM mkpf")
        conn.execute("DELETE FROM mchb")
        conn.execute("DELETE FROM mard")
        conn.execute("DELETE FROM mbew")
        conn.execute("DELETE FROM marm")
        conn.execute("DELETE FROM mara")
        conn.commit()

    return {"cleared": True, "message": "All data cleared"}
