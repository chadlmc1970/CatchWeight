-- Forecasting Views for Planning & Analytics
-- Provides supplier performance scoring, reorder recommendations, and margin trends

SET search_path TO sap_poc;

-- =============================================================================
-- 1. SUPPLIER PERFORMANCE PROFILE
-- =============================================================================
-- Calculates supplier reliability scores and predicted weight variance ranges
-- Based on historical weight drift patterns by supplier/material combination

CREATE OR REPLACE VIEW v_supplier_performance_profile AS
WITH batch_patterns AS (
    SELECT
        material_id,
        SUBSTRING(batch_id, 1, 5) as supplier_code,
        COUNT(*) as receipt_count,
        AVG(drift_pct) as avg_drift_pct,
        STDDEV(drift_pct) as stddev_drift_pct,
        AVG(financial_exposure_usd) as avg_exposure
    FROM v_weight_drift_trend
    WHERE posting_date >= CURRENT_DATE - INTERVAL '90 days'
    GROUP BY material_id, SUBSTRING(batch_id, 1, 5)
)
SELECT
    material_id,
    supplier_code,
    SUM(receipt_count) as total_receipts,
    AVG(avg_drift_pct) as supplier_avg_drift,
    AVG(stddev_drift_pct) as supplier_drift_volatility,
    SUM(avg_exposure) as total_exposure,
    -- Reliability score: 100 - abs(avg_drift) - volatility
    GREATEST(0, 100 - ABS(AVG(avg_drift_pct)) - AVG(stddev_drift_pct)) as reliability_score,
    -- Predicted drift range (95% confidence interval: mean ± 2*stddev)
    AVG(avg_drift_pct) - 2 * AVG(stddev_drift_pct) as predicted_drift_min,
    AVG(avg_drift_pct) + 2 * AVG(stddev_drift_pct) as predicted_drift_max
FROM batch_patterns
GROUP BY material_id, supplier_code
ORDER BY reliability_score DESC;

COMMENT ON VIEW v_supplier_performance_profile IS 'Supplier reliability scores with predicted weight variance ranges';


-- =============================================================================
-- 2. INVENTORY REORDER RECOMMENDATIONS
-- =============================================================================
-- Identifies materials at risk of stockout based on consumption patterns
-- Calculates days of stock remaining and alert levels (CRITICAL/WARNING/OK)

CREATE OR REPLACE VIEW v_reorder_recommendations AS
WITH consumption_rate AS (
    SELECT
        material_id,
        plant_id,
        storage_location,
        COUNT(*) as movement_count,
        AVG(ABS(quantity_base_uom)) as avg_daily_consumption,
        MAX(h.posting_date) as last_movement_date
    FROM mseg m
    JOIN mkpf h ON m.document_number = h.document_number
    WHERE m.movement_type IN ('261', '601')  -- Consumption movements
        AND h.posting_date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY material_id, plant_id, storage_location
),
current_stock AS (
    SELECT
        material_id,
        plant_id,
        storage_location,
        stock_base_uom
    FROM mard
    WHERE stock_base_uom > 0  -- Only non-zero stock
)
SELECT
    cs.material_id,
    cs.plant_id,
    cs.storage_location,
    cs.stock_base_uom as current_stock,
    cr.avg_daily_consumption,
    cr.last_movement_date,
    -- Days until stockout
    CASE
        WHEN cr.avg_daily_consumption > 0
        THEN cs.stock_base_uom / cr.avg_daily_consumption
        ELSE NULL
    END as days_of_stock_remaining,
    -- Alert level thresholds
    CASE
        WHEN cr.avg_daily_consumption = 0 THEN 'OK'
        WHEN cs.stock_base_uom / cr.avg_daily_consumption < 7 THEN 'CRITICAL'
        WHEN cs.stock_base_uom / cr.avg_daily_consumption < 14 THEN 'WARNING'
        ELSE 'OK'
    END as alert_level
FROM current_stock cs
LEFT JOIN consumption_rate cr USING (material_id, plant_id, storage_location)
WHERE cr.avg_daily_consumption > 0  -- Only materials with consumption
ORDER BY
    CASE
        WHEN cr.avg_daily_consumption > 0
        THEN cs.stock_base_uom / cr.avg_daily_consumption
        ELSE 999
    END ASC;

COMMENT ON VIEW v_reorder_recommendations IS 'Inventory reorder alerts based on consumption patterns and stock levels';


-- =============================================================================
-- 3. MARGIN EROSION DAILY TREND
-- =============================================================================
-- Aggregates margin erosion by day for time-series forecasting
-- Used to calculate historical trends and project future erosion

CREATE OR REPLACE VIEW v_margin_erosion_daily AS
SELECT
    posting_date,
    COUNT(*) as transaction_count,
    SUM(margin_erosion_usd) as daily_erosion,
    AVG(erosion_pct) as avg_erosion_pct,
    SUM(expected_margin_usd) as total_expected_margin,
    SUM(actual_margin_usd) as total_actual_margin
FROM v_margin_erosion
GROUP BY posting_date
ORDER BY posting_date;

COMMENT ON VIEW v_margin_erosion_daily IS 'Daily margin erosion aggregates for trend analysis and forecasting';


-- =============================================================================
-- 4. FORECASTING SUMMARY METRICS
-- =============================================================================
-- Top-level KPIs for forecasting dashboard insights

CREATE OR REPLACE VIEW v_forecasting_summary AS
WITH supplier_stats AS (
    SELECT
        COUNT(*) as total_suppliers,
        MIN(reliability_score) as min_reliability,
        MAX(reliability_score) as max_reliability,
        AVG(reliability_score) as avg_reliability
    FROM v_supplier_performance_profile
),
reorder_stats AS (
    SELECT
        COUNT(*) as total_materials_tracked,
        COUNT(CASE WHEN alert_level = 'CRITICAL' THEN 1 END) as critical_alerts,
        COUNT(CASE WHEN alert_level = 'WARNING' THEN 1 END) as warning_alerts,
        MIN(days_of_stock_remaining) as min_days_remaining
    FROM v_reorder_recommendations
),
margin_stats AS (
    SELECT
        AVG(daily_erosion) as avg_daily_erosion,
        SUM(daily_erosion) as total_erosion_90days
    FROM v_margin_erosion_daily
    WHERE posting_date >= CURRENT_DATE - INTERVAL '90 days'
)
SELECT
    ss.total_suppliers,
    ss.min_reliability as worst_reliability_score,
    ss.max_reliability as best_reliability_score,
    ss.avg_reliability as avg_reliability_score,
    rs.total_materials_tracked,
    rs.critical_alerts,
    rs.warning_alerts,
    rs.min_days_remaining as next_reorder_in_days,
    ms.avg_daily_erosion,
    ms.total_erosion_90days
FROM supplier_stats ss, reorder_stats rs, margin_stats ms;

COMMENT ON VIEW v_forecasting_summary IS 'High-level forecasting KPIs for dashboard insights';
