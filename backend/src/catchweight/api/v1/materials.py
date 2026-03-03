"""Materials router — MARA + MARM CRUD."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from catchweight.db import get_connection

router = APIRouter(tags=["materials"])


class MaterialUomIn(BaseModel):
    alt_uom: str
    numerator: float
    denominator: float


class MaterialIn(BaseModel):
    material_id: str
    material_type: Optional[str] = "FERT"
    base_uom: str = "CS"
    catch_weight_flag: bool = True
    conversions: list[MaterialUomIn] = []


class MaterialUpdateIn(BaseModel):
    material_type: Optional[str] = None
    base_uom: Optional[str] = None
    catch_weight_flag: Optional[bool] = None


@router.get("/materials")
def list_materials():
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT material_id, material_type, base_uom, catch_weight_flag FROM mara ORDER BY material_id"
        ).fetchall()
    return [
        {
            "material_id": r[0],
            "material_type": r[1],
            "base_uom": r[2],
            "catch_weight_flag": r[3],
        }
        for r in rows
    ]


@router.get("/materials/{material_id}")
def get_material(material_id: str):
    with get_connection() as conn:
        row = conn.execute(
            "SELECT material_id, material_type, base_uom, catch_weight_flag FROM mara WHERE material_id = %s",
            (material_id,),
        ).fetchone()
        if not row:
            raise HTTPException(404, f"Material {material_id} not found")

        conversions = conn.execute(
            "SELECT alt_uom, numerator, denominator FROM marm WHERE material_id = %s",
            (material_id,),
        ).fetchall()

    return {
        "material_id": row[0],
        "material_type": row[1],
        "base_uom": row[2],
        "catch_weight_flag": row[3],
        "conversions": [
            {"alt_uom": c[0], "numerator": float(c[1]), "denominator": float(c[2])}
            for c in conversions
        ],
    }


@router.post("/materials", status_code=201)
def create_material(payload: MaterialIn):
    with get_connection() as conn:
        try:
            conn.execute(
                "INSERT INTO mara (material_id, material_type, base_uom, catch_weight_flag) VALUES (%s, %s, %s, %s)",
                (payload.material_id, payload.material_type, payload.base_uom, payload.catch_weight_flag),
            )
            for c in payload.conversions:
                conn.execute(
                    "INSERT INTO marm (material_id, alt_uom, numerator, denominator) VALUES (%s, %s, %s, %s)",
                    (payload.material_id, c.alt_uom, c.numerator, c.denominator),
                )
            conn.commit()
        except Exception as e:
            conn.rollback()
            if "duplicate key" in str(e).lower():
                raise HTTPException(409, f"Material {payload.material_id} already exists")
            raise

    return {"material_id": payload.material_id, "created": True}


@router.put("/materials/{material_id}")
def update_material(material_id: str, payload: MaterialUpdateIn):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(400, "No fields to update")

    set_clause = ", ".join(f"{k} = %s" for k in updates)
    values = list(updates.values()) + [material_id]

    with get_connection() as conn:
        result = conn.execute(
            f"UPDATE mara SET {set_clause} WHERE material_id = %s",
            values,
        )
        if result.rowcount == 0:
            raise HTTPException(404, f"Material {material_id} not found")
        conn.commit()

    return {"material_id": material_id, "updated": True}


@router.delete("/materials/{material_id}")
def delete_material(material_id: str):
    with get_connection() as conn:
        # Check for existing stock
        stock = conn.execute(
            "SELECT SUM(stock_base_uom) FROM mard WHERE material_id = %s",
            (material_id,),
        ).fetchone()
        if stock and stock[0] and float(stock[0]) != 0:
            raise HTTPException(409, "Cannot delete material with existing stock")

        conn.execute("DELETE FROM marm WHERE material_id = %s", (material_id,))
        result = conn.execute("DELETE FROM mara WHERE material_id = %s", (material_id,))
        if result.rowcount == 0:
            raise HTTPException(404, f"Material {material_id} not found")
        conn.commit()

    return {"material_id": material_id, "deleted": True}
