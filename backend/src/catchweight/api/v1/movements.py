"""Goods movement router — post documents, query history."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import date
from catchweight.db import get_connection
from catchweight.posting import post_goods_movement

router = APIRouter(tags=["movements"])


class MovementLineIn(BaseModel):
    material_id: str
    plant_id: str
    storage_location: str
    movement_type: str
    quantity_base_uom: float
    quantity_parallel_uom: Optional[float] = None
    uom_base: str = "CS"
    uom_parallel: str = "LB"
    batch_id: Optional[str] = None
    unit_price: Optional[float] = None


class MovementPostIn(BaseModel):
    posting_date: date
    document_date: Optional[date] = None
    user_id: Optional[str] = None
    lines: list[MovementLineIn]


@router.post("/movements", status_code=201)
def post_movement(payload: MovementPostIn):
    if not payload.lines:
        raise HTTPException(400, "At least one line item is required")

    lines = [line.model_dump() for line in payload.lines]

    with get_connection() as conn:
        try:
            result = post_goods_movement(
                conn,
                posting_date=payload.posting_date,
                lines=lines,
                document_date=payload.document_date,
                user_id=payload.user_id,
            )
        except ValueError as e:
            conn.rollback()
            raise HTTPException(400, str(e))
        except Exception:
            conn.rollback()
            raise

    return result


@router.get("/movements")
def list_movements(
    material_id: Optional[str] = None,
    plant_id: Optional[str] = None,
    posting_date_from: Optional[date] = None,
    posting_date_to: Optional[date] = None,
    limit: int = 50,
):
    conditions = []
    params: list = []

    if material_id:
        conditions.append("EXISTS (SELECT 1 FROM mseg i WHERE i.document_number = h.document_number AND i.document_year = h.document_year AND i.material_id = %s)")
        params.append(material_id)
    if plant_id:
        conditions.append("EXISTS (SELECT 1 FROM mseg i WHERE i.document_number = h.document_number AND i.document_year = h.document_year AND i.plant_id = %s)")
        params.append(plant_id)
    if posting_date_from:
        conditions.append("h.posting_date >= %s")
        params.append(posting_date_from)
    if posting_date_to:
        conditions.append("h.posting_date <= %s")
        params.append(posting_date_to)

    where = ""
    if conditions:
        where = "WHERE " + " AND ".join(conditions)

    params.append(limit)

    with get_connection() as conn:
        rows = conn.execute(
            f"""SELECT h.document_number, h.document_year, h.posting_date,
                       h.document_date, h.entry_timestamp, h.user_id
                FROM mkpf h {where}
                ORDER BY h.entry_timestamp DESC
                LIMIT %s""",
            params,
        ).fetchall()

    return [
        {
            "document_number": r[0],
            "document_year": r[1],
            "posting_date": str(r[2]),
            "document_date": str(r[3]) if r[3] else None,
            "entry_timestamp": r[4].isoformat() if r[4] else None,
            "user_id": r[5],
        }
        for r in rows
    ]


@router.get("/movements/{doc_number}/{doc_year}")
def get_movement(doc_number: str, doc_year: str):
    with get_connection() as conn:
        header = conn.execute(
            """SELECT document_number, document_year, posting_date,
                      document_date, entry_timestamp, user_id
               FROM mkpf WHERE document_number = %s AND document_year = %s""",
            (doc_number, doc_year),
        ).fetchone()

        if not header:
            raise HTTPException(404, f"Document {doc_number}/{doc_year} not found")

        items = conn.execute(
            """SELECT line_item, material_id, plant_id, storage_location,
                      batch_id, movement_type, quantity_base_uom,
                      quantity_parallel_uom, uom_base, uom_parallel
               FROM mseg
               WHERE document_number = %s AND document_year = %s
               ORDER BY line_item""",
            (doc_number, doc_year),
        ).fetchall()

    return {
        "document_number": header[0],
        "document_year": header[1],
        "posting_date": str(header[2]),
        "document_date": str(header[3]) if header[3] else None,
        "entry_timestamp": header[4].isoformat() if header[4] else None,
        "user_id": header[5],
        "items": [
            {
                "line_item": i[0],
                "material_id": i[1],
                "plant_id": i[2],
                "storage_location": i[3],
                "batch_id": i[4],
                "movement_type": i[5],
                "quantity_base_uom": float(i[6]),
                "quantity_parallel_uom": float(i[7]) if i[7] else None,
                "uom_base": i[8],
                "uom_parallel": i[9],
            }
            for i in items
        ],
    }
