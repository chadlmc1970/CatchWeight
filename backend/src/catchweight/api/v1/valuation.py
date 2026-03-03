"""Valuation router — MBEW queries and inventory valuation view."""

from fastapi import APIRouter, HTTPException
from typing import Optional
from catchweight.db import get_connection

router = APIRouter(tags=["valuation"])


@router.get("/valuation")
def list_valuations(material_id: Optional[str] = None, plant_id: Optional[str] = None):
    conditions = []
    params: list = []

    if material_id:
        conditions.append("material_id = %s")
        params.append(material_id)
    if plant_id:
        conditions.append("plant_id = %s")
        params.append(plant_id)

    where = ""
    if conditions:
        where = "WHERE " + " AND ".join(conditions)

    with get_connection() as conn:
        rows = conn.execute(
            f"""SELECT material_id, plant_id, price_control,
                       standard_price, moving_avg_price, valuation_class
                FROM mbew {where}
                ORDER BY material_id, plant_id""",
            params,
        ).fetchall()

    return [
        {
            "material_id": r[0],
            "plant_id": r[1],
            "price_control": r[2],
            "standard_price": float(r[3]) if r[3] else None,
            "moving_avg_price": float(r[4]) if r[4] else None,
            "valuation_class": r[5],
        }
        for r in rows
    ]


@router.get("/valuation/report")
def valuation_report():
    """Inventory valuation using v_inventory_valuation view."""
    with get_connection() as conn:
        rows = conn.execute(
            """SELECT material_id, plant_id, storage_location,
                      total_base, total_parallel, inventory_value
               FROM v_inventory_valuation
               ORDER BY material_id, plant_id, storage_location"""
        ).fetchall()

    items = [
        {
            "material_id": r[0],
            "plant_id": r[1],
            "storage_location": r[2],
            "total_base": float(r[3]),
            "total_parallel": float(r[4]) if r[4] else 0,
            "inventory_value": float(r[5]) if r[5] else 0,
        }
        for r in rows
    ]

    total_value = sum(i["inventory_value"] for i in items)

    return {
        "items": items,
        "total_inventory_value": total_value,
    }


@router.get("/valuation/{material_id}")
def get_material_valuation(material_id: str):
    with get_connection() as conn:
        mbew_rows = conn.execute(
            """SELECT plant_id, price_control, standard_price,
                      moving_avg_price, valuation_class
               FROM mbew WHERE material_id = %s""",
            (material_id,),
        ).fetchall()

        if not mbew_rows:
            raise HTTPException(404, f"No valuation data for material {material_id}")

        val_rows = conn.execute(
            """SELECT plant_id, storage_location, total_base,
                      total_parallel, inventory_value
               FROM v_inventory_valuation
               WHERE material_id = %s""",
            (material_id,),
        ).fetchall()

    return {
        "material_id": material_id,
        "valuation": [
            {
                "plant_id": r[0],
                "price_control": r[1],
                "standard_price": float(r[2]) if r[2] else None,
                "moving_avg_price": float(r[3]) if r[3] else None,
                "valuation_class": r[4],
            }
            for r in mbew_rows
        ],
        "inventory": [
            {
                "plant_id": r[0],
                "storage_location": r[1],
                "total_base": float(r[2]),
                "total_parallel": float(r[3]) if r[3] else 0,
                "inventory_value": float(r[4]) if r[4] else 0,
            }
            for r in val_rows
        ],
    }
