"""Forecasting router — supplier performance, reorder alerts, margin trends."""

from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException
from catchweight.db import get_connection

router = APIRouter(tags=["forecasting"])


@router.get("/forecasting/supplier-performance")
def get_supplier_performance():
    """
    Supplier reliability scores with predicted variance ranges.
    Returns reliability scoring, avg drift, volatility, and forecast ranges.
    """
    try:
        with get_connection() as conn:
            conn.execute("SET search_path TO sap_poc")

            rows = conn.execute("""
                SELECT
                    material_id,
                    supplier_code,
                    total_receipts,
                    supplier_avg_drift,
                    supplier_drift_volatility,
                    reliability_score,
                    predicted_drift_min,
                    predicted_drift_max,
                    total_exposure
                FROM v_supplier_performance_profile
                ORDER BY reliability_score ASC, total_exposure DESC
            """).fetchall()

        return [
            {
                "material_id": r[0],
                "supplier_code": r[1],
                "receipt_count": r[2],
                "avg_drift_pct": float(r[3]) if r[3] else 0.0,
                "drift_volatility": float(r[4]) if r[4] else 0.0,
                "reliability_score": float(r[5]) if r[5] else 0.0,
                "forecast_range": {
                    "min": float(r[6]) if r[6] else 0.0,
                    "max": float(r[7]) if r[7] else 0.0
                },
                "financial_exposure": float(r[8]) if r[8] else 0.0
            }
            for r in rows
        ]
    except Exception as e:
        raise HTTPException(500, f"Failed to retrieve supplier performance: {e}")


@router.get("/forecasting/reorder-alerts")
def get_reorder_alerts(alert_level: str = None):
    """
    Inventory reorder alerts based on consumption patterns.
    Optionally filter by alert_level: CRITICAL, WARNING, or OK.
    """
    try:
        with get_connection() as conn:
            conn.execute("SET search_path TO sap_poc")

            # Build query with optional filter
            query = """
                SELECT
                    material_id,
                    plant_id,
                    storage_location,
                    current_stock,
                    avg_daily_consumption,
                    last_movement_date,
                    days_of_stock_remaining,
                    alert_level
                FROM v_reorder_recommendations
            """

            if alert_level and alert_level in ('CRITICAL', 'WARNING', 'OK'):
                query += f" WHERE alert_level = '{alert_level}'"

            query += " ORDER BY days_of_stock_remaining ASC"

            rows = conn.execute(query).fetchall()

        return [
            {
                "material_id": r[0],
                "plant_id": r[1],
                "storage_location": r[2],
                "current_stock": float(r[3]) if r[3] else 0.0,
                "avg_daily_consumption": float(r[4]) if r[4] else 0.0,
                "last_movement_date": r[5].isoformat() if r[5] else None,
                "days_of_stock_remaining": float(r[6]) if r[6] else None,
                "alert_level": r[7]
            }
            for r in rows
        ]
    except Exception as e:
        raise HTTPException(500, f"Failed to retrieve reorder alerts: {e}")


@router.get("/forecasting/margin-trend")
def forecast_margin_trend(forecast_days: int = 30):
    """
    Historical margin erosion + realistic forecast with volatility.
    Uses exponential smoothing with stochastic noise for natural variation.
    """
    try:
        import random
        with get_connection() as conn:
            conn.execute("SET search_path TO sap_poc")

            # Get historical daily erosion
            rows = conn.execute("""
                SELECT
                    posting_date,
                    daily_erosion,
                    avg_erosion_pct,
                    transaction_count
                FROM v_margin_erosion_daily
                ORDER BY posting_date
            """).fetchall()

        # Format historical data
        historical = [
            {
                "date": r[0].isoformat() if r[0] else None,
                "erosion": float(r[1]) if r[1] else 0.0,
                "avg_erosion_pct": float(r[2]) if r[2] else 0.0,
                "transaction_count": r[3]
            }
            for r in rows
        ]

        # Realistic forecast with exponential smoothing and stochastic volatility
        forecast = []
        min_days = min(7, len(historical))  # Use up to 7 days, or whatever is available
        if len(historical) >= 3:
            # Calculate baseline trend
            recent_erosion_values = [h["erosion"] for h in historical[-min_days:]]
            baseline = sum(recent_erosion_values) / len(recent_erosion_values)

            # Calculate historical volatility
            mean_erosion = baseline
            variance = sum((x - mean_erosion) ** 2 for x in recent_erosion_values) / len(recent_erosion_values)
            std_dev = variance ** 0.5

            # Get last actual value for smooth transition
            last_actual = historical[-1]["erosion"] if historical else baseline

            # Generate forecast with gradual mean reversion and daily volatility
            last_date = datetime.fromisoformat(historical[-1]["date"]) if historical else datetime.now()
            current_value = last_actual

            # Decay rate for mean reversion (gradual transition over ~2 weeks)
            alpha = 0.92  # Higher = slower convergence to baseline

            for i in range(1, forecast_days + 1):
                forecast_date = (last_date + timedelta(days=i)).date()

                # Exponential smoothing toward baseline with mean reversion
                current_value = alpha * current_value + (1 - alpha) * baseline

                # Add realistic daily volatility (±3-8% of std_dev)
                random.seed(forecast_date.toordinal())  # Deterministic for same date
                noise = random.gauss(0, std_dev * 0.05)
                predicted = current_value + noise

                # Confidence bands widen over time
                time_decay = min(1.0 + (i / 30) * 0.5, 1.5)  # Expands to 150% by day 30

                forecast.append({
                    "date": forecast_date.isoformat(),
                    "predicted_erosion": predicted,
                    "confidence_lower": predicted - (2 * std_dev * time_decay),
                    "confidence_upper": predicted + (2 * std_dev * time_decay),
                    "confidence": "high" if i <= 7 else "medium" if i <= 14 else "low"
                })

        return {
            "historical": historical,
            "forecast": forecast,
            "forecast_method": f"Exponential smoothing with stochastic volatility ({min_days}-day baseline)" if len(historical) >= 3 else "insufficient data",
            "forecast_days": forecast_days
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to generate margin trend forecast: {e}")


@router.get("/forecasting/summary")
def get_forecasting_summary():
    """
    High-level forecasting KPIs for dashboard insights.
    Returns summary metrics across all forecasting dimensions.
    """
    try:
        with get_connection() as conn:
            conn.execute("SET search_path TO sap_poc")

            row = conn.execute("""
                SELECT
                    total_suppliers,
                    worst_reliability_score,
                    best_reliability_score,
                    avg_reliability_score,
                    total_materials_tracked,
                    critical_alerts,
                    warning_alerts,
                    next_reorder_in_days,
                    avg_daily_erosion,
                    total_erosion_90days
                FROM v_forecasting_summary
            """).fetchone()

            if not row:
                return {
                    "total_suppliers": 0,
                    "worst_reliability_score": 0,
                    "best_reliability_score": 0,
                    "avg_reliability": 0,
                    "total_materials_tracked": 0,
                    "critical_alerts": 0,
                    "warning_alerts": 0,
                    "next_reorder_in_days": None,
                    "avg_daily_erosion": 0,
                    "total_erosion_90days": 0,
                    "high_risk_suppliers": 0,
                    "total_exposure": 0
                }

            # Calculate high_risk_suppliers (reliability < 70%) and total_exposure
            supplier_stats = conn.execute("""
                SELECT
                    COUNT(CASE WHEN reliability_score < 70 THEN 1 END) as high_risk,
                    COALESCE(SUM(total_exposure), 0) as total_exp
                FROM v_supplier_performance_profile
            """).fetchone()

            high_risk_suppliers = supplier_stats[0] if supplier_stats else 0
            total_exposure = float(supplier_stats[1]) if supplier_stats else 0.0

            return {
                "total_suppliers": row[0],
                "worst_reliability_score": float(row[1]) if row[1] else 0.0,
                "best_reliability_score": float(row[2]) if row[2] else 0.0,
                "avg_reliability": float(row[3]) if row[3] else 0.0,  # Changed from avg_reliability_score
                "total_materials_tracked": row[4],
                "critical_alerts": row[5],
                "warning_alerts": row[6],
                "next_reorder_in_days": float(row[7]) if row[7] else None,
                "avg_daily_erosion": float(row[8]) if row[8] else 0.0,
                "total_erosion_90days": float(row[9]) if row[9] else 0.0,
                "high_risk_suppliers": high_risk_suppliers,
                "total_exposure": total_exposure
            }
    except Exception as e:
        raise HTTPException(500, f"Failed to retrieve forecasting summary: {e}")
