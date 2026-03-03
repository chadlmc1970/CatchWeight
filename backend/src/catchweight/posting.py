"""
Core goods movement posting logic.

Atomic transaction: creates document header + items,
updates stock balances (MARD/MCHB) and valuation (MBEW).
"""

from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Optional

# Movement type direction: +1 = inbound, -1 = outbound
MOVEMENT_DIRECTION = {
    "101": Decimal("1"),   # Goods Receipt
    "102": Decimal("-1"),  # GR Reversal
    "201": Decimal("-1"),  # GI to Cost Center
    "261": Decimal("-1"),  # GI to Production
    "301": Decimal("0"),   # Transfer (handled specially)
    "601": Decimal("-1"),  # GI for Delivery
}


def _next_document_number(conn, year: str) -> str:
    """Generate next sequential document number for the year."""
    row = conn.execute(
        "SELECT MAX(document_number) FROM mkpf WHERE document_year = %s",
        (year,),
    ).fetchone()
    if row[0] is None:
        return "5000000001"
    return str(int(row[0]) + 1).zfill(10)


def post_goods_movement(
    conn,
    posting_date: date,
    lines: list[dict],
    document_date: Optional[date] = None,
    user_id: Optional[str] = None,
) -> dict:
    """
    Post a goods movement as an atomic transaction.

    Each line dict must have:
        material_id, plant_id, storage_location, movement_type,
        quantity_base_uom, quantity_parallel_uom,
        uom_base, uom_parallel
    Optional: batch_id

    Returns the created document header.
    """
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    year = str(posting_date.year)
    doc_number = _next_document_number(conn, year)
    doc_date = document_date or posting_date

    # Insert MKPF header
    conn.execute(
        """INSERT INTO mkpf
           (document_number, document_year, posting_date, document_date,
            entry_timestamp, user_id)
           VALUES (%s, %s, %s, %s, %s, %s)""",
        (doc_number, year, posting_date, doc_date, now, user_id),
    )

    created_items = []

    for idx, line in enumerate(lines, start=1):
        mvt = line["movement_type"]
        direction = MOVEMENT_DIRECTION.get(mvt)
        if direction is None:
            raise ValueError(f"Unsupported movement type: {mvt}")

        qty_base = Decimal(str(line["quantity_base_uom"]))
        qty_parallel = Decimal(str(line.get("quantity_parallel_uom") or 0))

        # For signed quantities: apply direction
        signed_base = qty_base * direction
        signed_parallel = qty_parallel * direction

        # Handle transfer postings (301): caller must supply two lines
        # with explicit from/to — we store as-is
        if mvt == "301":
            signed_base = qty_base
            signed_parallel = qty_parallel

        # Insert MSEG item
        conn.execute(
            """INSERT INTO mseg
               (document_number, document_year, line_item, material_id,
                plant_id, storage_location, batch_id, movement_type,
                quantity_base_uom, quantity_parallel_uom, uom_base, uom_parallel)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (
                doc_number, year, idx,
                line["material_id"], line["plant_id"], line["storage_location"],
                line.get("batch_id"), mvt,
                signed_base, signed_parallel,
                line.get("uom_base", "CS"), line.get("uom_parallel", "LB"),
            ),
        )

        # Update MARD stock balance (upsert)
        conn.execute(
            """INSERT INTO mard
               (material_id, plant_id, storage_location,
                stock_base_uom, stock_parallel_uom, last_updated)
               VALUES (%s, %s, %s, %s, %s, %s)
               ON CONFLICT (material_id, plant_id, storage_location)
               DO UPDATE SET
                 stock_base_uom = mard.stock_base_uom + EXCLUDED.stock_base_uom,
                 stock_parallel_uom = mard.stock_parallel_uom + EXCLUDED.stock_parallel_uom,
                 last_updated = EXCLUDED.last_updated""",
            (
                line["material_id"], line["plant_id"], line["storage_location"],
                signed_base, signed_parallel, now,
            ),
        )

        # Update MCHB batch stock (if batch provided)
        if line.get("batch_id"):
            conn.execute(
                """INSERT INTO mchb
                   (material_id, plant_id, storage_location, batch_id,
                    stock_base_uom, stock_parallel_uom, last_updated)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)
                   ON CONFLICT (material_id, plant_id, storage_location, batch_id)
                   DO UPDATE SET
                     stock_base_uom = mchb.stock_base_uom + EXCLUDED.stock_base_uom,
                     stock_parallel_uom = mchb.stock_parallel_uom + EXCLUDED.stock_parallel_uom,
                     last_updated = EXCLUDED.last_updated""",
                (
                    line["material_id"], line["plant_id"], line["storage_location"],
                    line["batch_id"], signed_base, signed_parallel, now,
                ),
            )

        # Update MBEW moving average price (for inbound V-price materials)
        if direction > 0 and line.get("unit_price"):
            _update_moving_avg(
                conn,
                line["material_id"],
                line["plant_id"],
                abs(signed_base),
                Decimal(str(line["unit_price"])),
            )

        created_items.append({
            "line_item": idx,
            "material_id": line["material_id"],
            "movement_type": mvt,
            "quantity_base_uom": str(signed_base),
            "quantity_parallel_uom": str(signed_parallel),
        })

    conn.commit()

    return {
        "document_number": doc_number,
        "document_year": year,
        "posting_date": str(posting_date),
        "entry_timestamp": now.isoformat(),
        "items": created_items,
    }


def _update_moving_avg(
    conn, material_id: str, plant_id: str,
    new_qty: Decimal, unit_price: Decimal,
):
    """Recalculate moving average price for V-price materials."""
    row = conn.execute(
        """SELECT price_control, moving_avg_price, s.stock_base_uom
           FROM mbew
           JOIN mard s ON s.material_id = mbew.material_id
                       AND s.plant_id = mbew.plant_id
           WHERE mbew.material_id = %s AND mbew.plant_id = %s
           LIMIT 1""",
        (material_id, plant_id),
    ).fetchone()

    if not row or row[0] != "V":
        return

    old_map = row[1] or Decimal("0")
    # old_qty is the stock BEFORE this posting updated it
    old_qty = (row[2] or Decimal("0")) - new_qty
    if old_qty < 0:
        old_qty = Decimal("0")

    total_qty = old_qty + new_qty
    if total_qty == 0:
        return

    new_map = (old_map * old_qty + unit_price * new_qty) / total_qty

    conn.execute(
        "UPDATE mbew SET moving_avg_price = %s WHERE material_id = %s AND plant_id = %s",
        (new_map, material_id, plant_id),
    )
