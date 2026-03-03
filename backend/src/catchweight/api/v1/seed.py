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
        # Load seed data
        conn.execute(sql)

        # Rebuild MARD and MCHB stock tables from MSEG movements
        rebuild_stock_sql = """
            -- Clear existing stock
            DELETE FROM sap_poc.mchb;
            DELETE FROM sap_poc.mard;

            -- Rebuild MCHB (batch stock) from v_inventory_rebuild
            INSERT INTO sap_poc.mchb (material_id, plant_id, storage_location, batch_id, stock_base_uom, stock_parallel_uom, last_updated)
            SELECT
                material_id,
                plant_id,
                storage_location,
                batch_id,
                SUM(quantity_base_uom) AS stock_base_uom,
                SUM(quantity_parallel_uom) AS stock_parallel_uom,
                NOW() AS last_updated
            FROM sap_poc.mseg
            GROUP BY material_id, plant_id, storage_location, batch_id
            HAVING SUM(quantity_base_uom) > 0;

            -- Rebuild MARD (storage location stock) from MCHB
            INSERT INTO sap_poc.mard (material_id, plant_id, storage_location, stock_base_uom, stock_parallel_uom, last_updated)
            SELECT
                material_id,
                plant_id,
                storage_location,
                SUM(stock_base_uom) AS stock_base_uom,
                SUM(stock_parallel_uom) AS stock_parallel_uom,
                NOW() AS last_updated
            FROM sap_poc.mchb
            GROUP BY material_id, plant_id, storage_location;
        """

        conn.execute(rebuild_stock_sql)
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
