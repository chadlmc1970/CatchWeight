-- SAP S4 Catch-Weight POC: Analytical Views
-- Steps 9-11 from build spec

SET search_path TO sap_poc;

-- Step 9: Inventory Reconstruction (rebuild stock from documents)
CREATE OR REPLACE VIEW v_inventory_rebuild AS
SELECT
    m.material_id,
    m.plant_id,
    m.storage_location,
    SUM(m.quantity_base_uom) AS total_base,
    SUM(m.quantity_parallel_uom) AS total_parallel
FROM mseg m
GROUP BY m.material_id, m.plant_id, m.storage_location;

-- Step 10: Inventory Valuation (Use Case 1 Core)
CREATE OR REPLACE VIEW v_inventory_valuation AS
SELECT
    r.material_id,
    r.plant_id,
    r.storage_location,
    r.total_base,
    r.total_parallel,
    CASE
        WHEN b.price_control = 'S' THEN r.total_base * b.standard_price
        WHEN b.price_control = 'V' THEN r.total_base * b.moving_avg_price
    END AS inventory_value
FROM v_inventory_rebuild r
JOIN mbew b
  ON r.material_id = b.material_id
 AND r.plant_id = b.plant_id;

-- Step 11: Back-Posting Detection
CREATE OR REPLACE VIEW v_back_postings AS
SELECT
    h.document_number,
    h.document_year,
    h.posting_date,
    h.entry_timestamp
FROM mkpf h
WHERE h.entry_timestamp::date > h.posting_date;

-- ============================================================
-- DATA PRODUCT 1: CWM_Weight_Drift_Trend_DP
-- Tracks weight variance from baseline (expected vs actual)
-- ============================================================
CREATE OR REPLACE VIEW v_weight_drift_trend AS
WITH movement_drift AS (
    SELECT
        seg.material_id,
        seg.plant_id,
        seg.storage_location,
        seg.batch_id,
        hdr.posting_date,
        seg.quantity_base_uom AS qty_cases,
        seg.quantity_parallel_uom AS actual_weight_lb,
        -- Calculate expected weight from UoM conversion
        seg.quantity_base_uom * (uom.numerator / uom.denominator) AS expected_weight_lb,
        -- Calculate drift
        seg.quantity_parallel_uom - (seg.quantity_base_uom * (uom.numerator / uom.denominator)) AS drift_lb,
        -- Calculate drift percentage
        ((seg.quantity_parallel_uom - (seg.quantity_base_uom * (uom.numerator / uom.denominator)))
         / (seg.quantity_base_uom * (uom.numerator / uom.denominator)) * 100) AS drift_pct,
        -- Financial exposure (drift * price)
        (seg.quantity_parallel_uom - (seg.quantity_base_uom * (uom.numerator / uom.denominator))) *
        CASE
            WHEN val.price_control = 'S' THEN val.standard_price
            WHEN val.price_control = 'V' THEN val.moving_avg_price
            ELSE 0
        END AS financial_exposure_usd,
        seg.movement_type,
        hdr.user_id
    FROM mseg seg
    JOIN mkpf hdr
        ON seg.document_number = hdr.document_number
        AND seg.document_year = hdr.document_year
    JOIN mara mat
        ON seg.material_id = mat.material_id
    JOIN marm uom
        ON seg.material_id = uom.material_id
        AND seg.uom_parallel = uom.alt_uom
    LEFT JOIN mbew val
        ON seg.material_id = val.material_id
        AND seg.plant_id = val.plant_id
    WHERE mat.catch_weight_flag = TRUE
        AND seg.movement_type = '101'  -- Goods receipts only
        AND seg.quantity_base_uom > 0
)
SELECT
    material_id,
    plant_id,
    storage_location,
    batch_id,
    posting_date,
    qty_cases,
    expected_weight_lb,
    actual_weight_lb,
    drift_lb,
    drift_pct,
    financial_exposure_usd,
    user_id
FROM movement_drift
ORDER BY posting_date DESC, ABS(drift_pct) DESC;

-- ============================================================
-- DATA PRODUCT 2: CWM_Margin_Erosion_DP
-- Tracks margin loss due to catch weight variance
-- ============================================================
CREATE OR REPLACE VIEW v_margin_erosion AS
WITH sales_movements AS (
    SELECT
        seg.material_id,
        seg.plant_id,
        seg.storage_location,
        seg.batch_id,
        hdr.posting_date,
        seg.quantity_base_uom AS qty_cases,
        seg.quantity_parallel_uom AS actual_shipped_lb,
        -- Expected/planned weight
        seg.quantity_base_uom * (uom.numerator / uom.denominator) AS expected_shipped_lb,
        -- Pricing
        CASE
            WHEN val.price_control = 'S' THEN val.standard_price
            WHEN val.price_control = 'V' THEN val.moving_avg_price
            ELSE 0
        END AS unit_price,
        seg.movement_type,
        hdr.user_id
    FROM mseg seg
    JOIN mkpf hdr
        ON seg.document_number = hdr.document_number
        AND seg.document_year = hdr.document_year
    JOIN mara mat
        ON seg.material_id = mat.material_id
    JOIN marm uom
        ON seg.material_id = uom.material_id
        AND seg.uom_parallel = uom.alt_uom
    LEFT JOIN mbew val
        ON seg.material_id = val.material_id
        AND seg.plant_id = val.plant_id
    WHERE mat.catch_weight_flag = TRUE
        AND seg.movement_type IN ('601', '261')  -- Customer sales & production issues
        AND seg.quantity_base_uom < 0  -- Issues are negative
)
SELECT
    material_id,
    plant_id,
    storage_location,
    batch_id,
    posting_date,
    qty_cases,
    expected_shipped_lb,
    actual_shipped_lb,
    -- Margin calculation
    ABS(expected_shipped_lb) * unit_price AS expected_margin_usd,
    ABS(actual_shipped_lb) * unit_price AS actual_margin_usd,
    (ABS(expected_shipped_lb) - ABS(actual_shipped_lb)) * unit_price AS margin_erosion_usd,
    ((ABS(expected_shipped_lb) - ABS(actual_shipped_lb)) / ABS(expected_shipped_lb) * 100) AS erosion_pct,
    unit_price AS price_per_lb,
    movement_type,
    user_id
FROM sales_movements
ORDER BY posting_date DESC, margin_erosion_usd DESC;
