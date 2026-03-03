"""Stock query router — MARD and MCHB queries."""

from fastapi import APIRouter, HTTPException
from typing import Optional
from catchweight.db import get_connection

router = APIRouter(tags=["stock"])


@router.get("/stock")
def list_stock(
    material_id: Optional[str] = None,
    plant_id: Optional[str] = None,
    storage_location: Optional[str] = None,
):
    conditions = []
    params: list = []

    if material_id:
        conditions.append("material_id = %s")
        params.append(material_id)
    if plant_id:
        conditions.append("plant_id = %s")
        params.append(plant_id)
    if storage_location:
        conditions.append("storage_location = %s")
        params.append(storage_location)

    where = ""
    if conditions:
        where = "WHERE " + " AND ".join(conditions)

    with get_connection() as conn:
        rows = conn.execute(
            f"""SELECT material_id, plant_id, storage_location,
                       stock_base_uom, stock_parallel_uom, last_updated
                FROM mard {where}
                ORDER BY material_id, plant_id, storage_location""",
            params,
        ).fetchall()

    return [
        {
            "material_id": r[0],
            "plant_id": r[1],
            "storage_location": r[2],
            "stock_base_uom": float(r[3]),
            "stock_parallel_uom": float(r[4]) if r[4] else 0,
            "last_updated": r[5].isoformat() if r[5] else None,
        }
        for r in rows
    ]


@router.get("/stock/batches")
def list_batch_stock(
    material_id: Optional[str] = None,
    plant_id: Optional[str] = None,
    batch_id: Optional[str] = None,
):
    conditions = []
    params: list = []

    if material_id:
        conditions.append("material_id = %s")
        params.append(material_id)
    if plant_id:
        conditions.append("plant_id = %s")
        params.append(plant_id)
    if batch_id:
        conditions.append("batch_id = %s")
        params.append(batch_id)

    where = ""
    if conditions:
        where = "WHERE " + " AND ".join(conditions)

    with get_connection() as conn:
        rows = conn.execute(
            f"""SELECT material_id, plant_id, storage_location, batch_id,
                       stock_base_uom, stock_parallel_uom, last_updated
                FROM mchb {where}
                ORDER BY material_id, plant_id, storage_location, batch_id""",
            params,
        ).fetchall()

    return [
        {
            "material_id": r[0],
            "plant_id": r[1],
            "storage_location": r[2],
            "batch_id": r[3],
            "stock_base_uom": float(r[4]),
            "stock_parallel_uom": float(r[5]) if r[5] else 0,
            "last_updated": r[6].isoformat() if r[6] else None,
        }
        for r in rows
    ]


@router.get("/stock/{material_id}")
def get_material_stock(material_id: str):
    with get_connection() as conn:
        sloc_rows = conn.execute(
            """SELECT plant_id, storage_location, stock_base_uom, stock_parallel_uom, last_updated
               FROM mard WHERE material_id = %s
               ORDER BY plant_id, storage_location""",
            (material_id,),
        ).fetchall()

        if not sloc_rows:
            raise HTTPException(404, f"No stock found for material {material_id}")

        batch_rows = conn.execute(
            """SELECT plant_id, storage_location, batch_id,
                      stock_base_uom, stock_parallel_uom, last_updated
               FROM mchb WHERE material_id = %s
               ORDER BY plant_id, storage_location, batch_id""",
            (material_id,),
        ).fetchall()

    return {
        "material_id": material_id,
        "storage_locations": [
            {
                "plant_id": r[0],
                "storage_location": r[1],
                "stock_base_uom": float(r[2]),
                "stock_parallel_uom": float(r[3]) if r[3] else 0,
                "last_updated": r[4].isoformat() if r[4] else None,
            }
            for r in sloc_rows
        ],
        "batches": [
            {
                "plant_id": r[0],
                "storage_location": r[1],
                "batch_id": r[2],
                "stock_base_uom": float(r[3]),
                "stock_parallel_uom": float(r[4]) if r[4] else 0,
                "last_updated": r[5].isoformat() if r[5] else None,
            }
            for r in batch_rows
        ],
    }
