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
