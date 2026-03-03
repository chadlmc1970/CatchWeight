"""Data Products API endpoints for CatchWeight POC."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import psycopg
import os
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


# === Weight Drift Models ===
class WeightDriftRecord(BaseModel):
    material_id: str
    plant_id: str
    storage_location: str
    batch_id: Optional[str]
    posting_date: str
    qty_cases: float
    expected_weight_lb: float
    actual_weight_lb: float
    drift_lb: float
    drift_pct: float
    financial_exposure_usd: float
    user_id: str


class WeightDriftSummary(BaseModel):
    total_transactions: int
    total_drift_lb: float
    avg_drift_pct: float
    total_financial_exposure: float
    max_drift_pct: float
    min_drift_pct: float


# === Margin Erosion Models ===
class MarginErosionRecord(BaseModel):
    material_id: str
    plant_id: str
    storage_location: str
    batch_id: Optional[str]
    posting_date: str
    qty_cases: float
    expected_shipped_lb: float
    actual_shipped_lb: float
    expected_margin_usd: float
    actual_margin_usd: float
    margin_erosion_usd: float
    erosion_pct: float
    price_per_lb: float
    movement_type: str
    user_id: str


class MarginErosionSummary(BaseModel):
    total_transactions: int
    total_margin_erosion: float
    avg_erosion_pct: float
    total_expected_margin: float
    total_actual_margin: float


def get_db():
    """Get database connection."""
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise HTTPException(status_code=500, detail="DATABASE_URL not configured")
    return psycopg.connect(db_url)


@router.get("/dataproducts/weight-drift", response_model=List[WeightDriftRecord])
def get_weight_drift(limit: int = 100, offset: int = 0):
    """
    Get Weight Drift Trend data product.
    Tracks weight variance from baseline (expected vs actual).
    """
    try:
        with get_db() as conn:
            conn.execute("SET search_path TO sap_poc")

            query = """
                SELECT
                    material_id,
                    plant_id,
                    storage_location,
                    batch_id,
                    posting_date::text,
                    qty_cases,
                    expected_weight_lb,
                    actual_weight_lb,
                    drift_lb,
                    drift_pct,
                    financial_exposure_usd,
                    user_id
                FROM v_weight_drift_trend
                ORDER BY posting_date DESC, ABS(drift_pct) DESC
                LIMIT %s OFFSET %s
            """

            rows = conn.execute(query, (limit, offset)).fetchall()

            return [
                WeightDriftRecord(
                    material_id=row[0],
                    plant_id=row[1],
                    storage_location=row[2],
                    batch_id=row[3],
                    posting_date=row[4],
                    qty_cases=float(row[5]),
                    expected_weight_lb=float(row[6]),
                    actual_weight_lb=float(row[7]),
                    drift_lb=float(row[8]),
                    drift_pct=float(row[9]),
                    financial_exposure_usd=float(row[10]),
                    user_id=row[11],
                )
                for row in rows
            ]
    except Exception as e:
        logger.error(f"Error fetching weight drift data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dataproducts/weight-drift/summary", response_model=WeightDriftSummary)
def get_weight_drift_summary():
    """Get summary statistics for Weight Drift data product."""
    try:
        with get_db() as conn:
            conn.execute("SET search_path TO sap_poc")

            query = """
                SELECT
                    COUNT(*) as total_transactions,
                    SUM(drift_lb) as total_drift_lb,
                    AVG(drift_pct) as avg_drift_pct,
                    SUM(financial_exposure_usd) as total_financial_exposure,
                    MAX(drift_pct) as max_drift_pct,
                    MIN(drift_pct) as min_drift_pct
                FROM v_weight_drift_trend
            """

            row = conn.execute(query).fetchone()

            return WeightDriftSummary(
                total_transactions=row[0] or 0,
                total_drift_lb=float(row[1] or 0),
                avg_drift_pct=float(row[2] or 0),
                total_financial_exposure=float(row[3] or 0),
                max_drift_pct=float(row[4] or 0),
                min_drift_pct=float(row[5] or 0),
            )
    except Exception as e:
        logger.error(f"Error fetching weight drift summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dataproducts/margin-erosion", response_model=List[MarginErosionRecord])
def get_margin_erosion(limit: int = 100, offset: int = 0):
    """
    Get Margin Erosion data product.
    Tracks margin loss due to catch weight variance.
    """
    try:
        with get_db() as conn:
            conn.execute("SET search_path TO sap_poc")

            query = """
                SELECT
                    material_id,
                    plant_id,
                    storage_location,
                    batch_id,
                    posting_date::text,
                    qty_cases,
                    expected_shipped_lb,
                    actual_shipped_lb,
                    expected_margin_usd,
                    actual_margin_usd,
                    margin_erosion_usd,
                    erosion_pct,
                    price_per_lb,
                    movement_type,
                    user_id
                FROM v_margin_erosion
                ORDER BY posting_date DESC, margin_erosion_usd DESC
                LIMIT %s OFFSET %s
            """

            rows = conn.execute(query, (limit, offset)).fetchall()

            return [
                MarginErosionRecord(
                    material_id=row[0],
                    plant_id=row[1],
                    storage_location=row[2],
                    batch_id=row[3],
                    posting_date=row[4],
                    qty_cases=float(row[5]),
                    expected_shipped_lb=float(row[6]),
                    actual_shipped_lb=float(row[7]),
                    expected_margin_usd=float(row[8]),
                    actual_margin_usd=float(row[9]),
                    margin_erosion_usd=float(row[10]),
                    erosion_pct=float(row[11]),
                    price_per_lb=float(row[12]),
                    movement_type=row[13],
                    user_id=row[14],
                )
                for row in rows
            ]
    except Exception as e:
        logger.error(f"Error fetching margin erosion data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dataproducts/margin-erosion/summary", response_model=MarginErosionSummary)
def get_margin_erosion_summary():
    """Get summary statistics for Margin Erosion data product."""
    try:
        with get_db() as conn:
            conn.execute("SET search_path TO sap_poc")

            query = """
                SELECT
                    COUNT(*) as total_transactions,
                    SUM(margin_erosion_usd) as total_margin_erosion,
                    AVG(erosion_pct) as avg_erosion_pct,
                    SUM(expected_margin_usd) as total_expected_margin,
                    SUM(actual_margin_usd) as total_actual_margin
                FROM v_margin_erosion
            """

            row = conn.execute(query).fetchone()

            return MarginErosionSummary(
                total_transactions=row[0] or 0,
                total_margin_erosion=float(row[1] or 0),
                avg_erosion_pct=float(row[2] or 0),
                total_expected_margin=float(row[3] or 0),
                total_actual_margin=float(row[4] or 0),
            )
    except Exception as e:
        logger.error(f"Error fetching margin erosion summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dataproducts/weight-drift/by-material")
def get_weight_drift_by_material():
    """Get weight drift aggregated by material."""
    try:
        with get_db() as conn:
            conn.execute("SET search_path TO sap_poc")

            query = """
                SELECT
                    material_id,
                    COUNT(*) as transaction_count,
                    AVG(drift_pct) as avg_drift_pct,
                    SUM(financial_exposure_usd) as total_exposure
                FROM v_weight_drift_trend
                GROUP BY material_id
                ORDER BY total_exposure DESC
                LIMIT 10
            """

            rows = conn.execute(query).fetchall()

            return [
                {
                    "material_id": row[0],
                    "transaction_count": row[1],
                    "avg_drift_pct": float(row[2]),
                    "total_exposure": float(row[3]),
                }
                for row in rows
            ]
    except Exception as e:
        logger.error(f"Error fetching weight drift by material: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dataproducts/margin-erosion/by-material")
def get_margin_erosion_by_material():
    """Get margin erosion aggregated by material."""
    try:
        with get_db() as conn:
            conn.execute("SET search_path TO sap_poc")

            query = """
                SELECT
                    material_id,
                    COUNT(*) as transaction_count,
                    SUM(margin_erosion_usd) as total_erosion,
                    AVG(erosion_pct) as avg_erosion_pct
                FROM v_margin_erosion
                GROUP BY material_id
                ORDER BY total_erosion DESC
                LIMIT 10
            """

            rows = conn.execute(query).fetchall()

            return [
                {
                    "material_id": row[0],
                    "transaction_count": row[1],
                    "total_erosion": float(row[2]),
                    "avg_erosion_pct": float(row[3]),
                }
                for row in rows
            ]
    except Exception as e:
        logger.error(f"Error fetching margin erosion by material: {e}")
        raise HTTPException(status_code=500, detail=str(e))
