"""Reconciliation router — document rebuild vs balance table comparison + back-postings."""

from fastapi import APIRouter
from typing import Optional
from catchweight.db import get_connection

router = APIRouter(tags=["reconciliation"])


@router.get("/reconciliation")
def reconciliation_report(material_id: Optional[str] = None):
    """Compare v_inventory_rebuild (document-derived) vs MARD (balance table)."""
    conditions = []
    params: list = []

    if material_id:
        conditions.append("d.material_id = %s")
        params.append(material_id)

    where = ""
    if conditions:
        where = "AND " + " AND ".join(conditions)

    with get_connection() as conn:
        rows = conn.execute(
            f"""SELECT
                    COALESCE(d.material_id, b.material_id) AS material_id,
                    COALESCE(d.plant_id, b.plant_id) AS plant_id,
                    COALESCE(d.storage_location, b.storage_location) AS storage_location,
                    COALESCE(b.stock_base_uom, 0) AS balance_base,
                    COALESCE(b.stock_parallel_uom, 0) AS balance_parallel,
                    COALESCE(d.total_base, 0) AS rebuild_base,
                    COALESCE(d.total_parallel, 0) AS rebuild_parallel
                FROM v_inventory_rebuild d
                FULL OUTER JOIN mard b
                  ON d.material_id = b.material_id
                 AND d.plant_id = b.plant_id
                 AND d.storage_location = b.storage_location
                WHERE 1=1 {where}
                ORDER BY material_id, plant_id, storage_location""",
            params,
        ).fetchall()

    results = []
    all_reconciled = True

    for r in rows:
        disc_base = float(r[5]) - float(r[3])
        disc_parallel = float(r[6]) - float(r[4])
        reconciled = abs(disc_base) < 0.01 and abs(disc_parallel) < 0.01

        if not reconciled:
            all_reconciled = False

        results.append({
            "material_id": r[0],
            "plant_id": r[1],
            "storage_location": r[2],
            "balance_table": {
                "base": float(r[3]),
                "parallel": float(r[4]),
            },
            "document_rebuild": {
                "base": float(r[5]),
                "parallel": float(r[6]),
            },
            "discrepancy": {
                "base": round(disc_base, 6),
                "parallel": round(disc_parallel, 6),
            },
            "reconciled": reconciled,
        })

    return {
        "all_reconciled": all_reconciled,
        "positions": results,
    }


@router.get("/reconciliation/{material_id}")
def material_reconciliation(material_id: str):
    """Per-material reconciliation detail."""
    return reconciliation_report(material_id=material_id)


@router.get("/back-postings")
def list_back_postings():
    """List documents where entry timestamp is after posting date."""
    with get_connection() as conn:
        rows = conn.execute(
            """SELECT document_number, document_year, posting_date, entry_timestamp
               FROM v_back_postings
               ORDER BY (entry_timestamp::date - posting_date) DESC"""
        ).fetchall()

    return [
        {
            "document_number": r[0],
            "document_year": r[1],
            "posting_date": str(r[2]),
            "entry_timestamp": r[3].isoformat() if r[3] else None,
            "delta_days": (r[3].date() - r[2]).days if r[3] and r[2] else None,
        }
        for r in rows
    ]
