-- SAP S4 Catch-Weight POC: REALISTIC Tyson Seed Data
-- Real-world variances based on industry standards

SET search_path TO sap_poc;

-- Clear existing data
DELETE FROM cdpos;
DELETE FROM cdhdr;
DELETE FROM mseg;
DELETE FROM mkpf;
DELETE FROM mchb;
DELETE FROM mard;
DELETE FROM mbew;
DELETE FROM marm;
DELETE FROM mara;

-- ============================================================
-- Materials (MARA) - Tyson Product Portfolio
-- ============================================================
INSERT INTO mara (material_id, material_type, base_uom, catch_weight_flag) VALUES
    -- Chicken Products
    ('CHKBRST-001', 'FERT', 'CS', TRUE),   -- Boneless Skinless Chicken Breast
    ('CHKWNG-002',  'FERT', 'CS', TRUE),   -- Chicken Wings
    ('CHKTHG-003',  'FERT', 'CS', TRUE),   -- Chicken Thighs
    ('CHKTND-006',  'FERT', 'CS', TRUE),   -- Chicken Tenders
    ('CHKWHL-007',  'FERT', 'CS', TRUE),   -- Whole Chicken
    -- Pork Products
    ('PRKRIB-004',  'FERT', 'CS', TRUE),   -- Pork Ribs (St. Louis Style)
    ('PRKCHP-008',  'FERT', 'CS', TRUE),   -- Pork Chops
    ('PRKSSG-009',  'FERT', 'CS', TRUE),   -- Pork Sausage Links
    -- Beef Products
    ('BFGRD-005',   'FERT', 'CS', TRUE),   -- Ground Beef 80/20
    ('BFSTRP-010',  'FERT', 'CS', TRUE),   -- Beef Strip Steaks
    ('BFPTTY-011',  'FERT', 'CS', TRUE),   -- Beef Patties (pre-formed)
    -- Value-Added Products
    ('CHKNGT-012',  'FERT', 'CS', TRUE),   -- Chicken Nuggets (breaded)
    ('CHKSKW-013',  'FERT', 'CS', TRUE);   -- Chicken Skewers (marinated)

-- ============================================================
-- UoM Conversions (MARM) — Planning baseline (target weights)
-- These are the EXPECTED weights used for forecasting
-- ============================================================
INSERT INTO marm (material_id, alt_uom, numerator, denominator) VALUES
    -- Chicken (target weights)
    ('CHKBRST-001', 'LB', 25.0, 1.0),   -- 1 CS ≈ 25 LB target
    ('CHKWNG-002',  'LB', 30.0, 1.0),   -- 1 CS ≈ 30 LB target
    ('CHKTHG-003',  'LB', 28.0, 1.0),   -- 1 CS ≈ 28 LB target
    ('CHKTND-006',  'LB', 22.0, 1.0),   -- 1 CS ≈ 22 LB target
    ('CHKWHL-007',  'LB', 40.0, 1.0),   -- 1 CS ≈ 40 LB target
    -- Pork (target weights)
    ('PRKRIB-004',  'LB', 35.0, 1.0),   -- 1 CS ≈ 35 LB target
    ('PRKCHP-008',  'LB', 30.0, 1.0),   -- 1 CS ≈ 30 LB target
    ('PRKSSG-009',  'LB', 18.0, 1.0),   -- 1 CS ≈ 18 LB target
    -- Beef (target weights)
    ('BFGRD-005',   'LB', 20.0, 1.0),   -- 1 CS ≈ 20 LB target
    ('BFSTRP-010',  'LB', 45.0, 1.0),   -- 1 CS ≈ 45 LB target
    ('BFPTTY-011',  'LB', 24.0, 1.0),   -- 1 CS ≈ 24 LB target
    -- Value-Added
    ('CHKNGT-012',  'LB', 15.0, 1.0),   -- 1 CS ≈ 15 LB target
    ('CHKSKW-013',  'LB', 12.0, 1.0);   -- 1 CS ≈ 12 LB target

-- ============================================================
-- Valuation (MBEW) — Realistic pricing per pound (2026 market)
-- ============================================================
INSERT INTO mbew (material_id, plant_id, price_control, standard_price, moving_avg_price, valuation_class) VALUES
    -- Chicken - P100 (Arkansas Plant)
    ('CHKBRST-001', 'P100', 'V', NULL,  3.25, '7920'),  -- $3.25/LB
    ('CHKWNG-002',  'P100', 'V', NULL,  2.10, '7920'),  -- $2.10/LB
    ('CHKTHG-003',  'P100', 'S', 2.50,  NULL, '7920'),  -- $2.50/LB
    ('CHKTND-006',  'P100', 'V', NULL,  4.10, '7920'),  -- $4.10/LB
    ('CHKWHL-007',  'P100', 'V', NULL,  1.85, '7920'),  -- $1.85/LB
    ('CHKNGT-012',  'P100', 'V', NULL,  5.50, '7920'),  -- $5.50/LB
    ('CHKSKW-013',  'P100', 'V', NULL,  6.20, '7920'),  -- $6.20/LB
    -- Chicken - P200 (Missouri Plant)
    ('CHKBRST-001', 'P200', 'V', NULL,  3.30, '7920'),
    ('CHKWNG-002',  'P200', 'V', NULL,  2.15, '7920'),
    -- Pork - P100
    ('PRKRIB-004',  'P100', 'V', NULL,  4.75, '7930'),  -- $4.75/LB
    ('PRKCHP-008',  'P100', 'S', 3.80,  NULL, '7930'),  -- $3.80/LB
    ('PRKSSG-009',  'P100', 'V', NULL,  2.95, '7930'),  -- $2.95/LB
    -- Beef - P200
    ('BFGRD-005',   'P200', 'V', NULL,  5.20, '7940'),  -- $5.20/LB
    ('BFSTRP-010',  'P200', 'S', 12.50, NULL, '7940'), -- $12.50/LB
    ('BFPTTY-011',  'P200', 'V', NULL,  6.10, '7940');  -- $6.10/LB

-- ============================================================
-- Document Headers (MKPF) — Realistic transaction timeline
-- ============================================================
INSERT INTO mkpf (document_number, document_year, posting_date, document_date, entry_timestamp, user_id) VALUES
    -- Week 1: Feb 18-21 (earlier week for better historical data)
    ('5000000001', '2026', '2026-02-18', '2026-02-18', '2026-02-18 07:45:00', 'TYSUSER01'),
    ('5000000002', '2026', '2026-02-18', '2026-02-18', '2026-02-18 10:15:00', 'TYSUSER02'),
    ('5000000003', '2026', '2026-02-19', '2026-02-19', '2026-02-19 08:30:00', 'TYSUSER01'),
    ('5000000004', '2026', '2026-02-19', '2026-02-19', '2026-02-19 14:00:00', 'TYSUSER02'),
    ('5000000005', '2026', '2026-02-20', '2026-02-20', '2026-02-20 09:20:00', 'TYSUSER01'),
    ('5000000006', '2026', '2026-02-21', '2026-02-21', '2026-02-21 07:50:00', 'TYSUSER02'),
    -- Week 2: Feb 24-28
    ('5000000007', '2026', '2026-02-24', '2026-02-24', '2026-02-24 08:00:00', 'TYSUSER01'),
    ('5000000008', '2026', '2026-02-24', '2026-02-24', '2026-02-24 11:30:00', 'TYSUSER02'),
    ('5000000009', '2026', '2026-02-25', '2026-02-25', '2026-02-25 07:30:00', 'TYSUSER01'),
    ('5000000010', '2026', '2026-02-25', '2026-02-25', '2026-02-25 13:45:00', 'TYSUSER02'),
    ('5000000011', '2026', '2026-02-26', '2026-02-26', '2026-02-26 08:15:00', 'TYSUSER01'),
    ('5000000012', '2026', '2026-02-27', '2026-02-27', '2026-02-27 09:00:00', 'TYSUSER02'),
    ('5000000013', '2026', '2026-02-28', '2026-02-28', '2026-02-28 07:45:00', 'TYSUSER01'),
    ('5000000014', '2026', '2026-02-28', '2026-02-28', '2026-02-28 14:20:00', 'TYSUSER02'),
    -- Week 3: Mar 3-7 (current week)
    ('5000000015', '2026', '2026-03-03', '2026-03-03', '2026-03-03 08:00:00', 'TYSUSER01'),
    ('5000000016', '2026', '2026-03-03', '2026-03-03', '2026-03-03 10:30:00', 'TYSUSER02'),
    ('5000000017', '2026', '2026-03-04', '2026-03-04', '2026-03-04 07:30:00', 'TYSUSER01'),
    ('5000000018', '2026', '2026-03-04', '2026-03-04', '2026-03-04 11:15:00', 'TYSUSER02'),
    ('5000000019', '2026', '2026-03-05', '2026-03-05', '2026-03-05 08:45:00', 'TYSUSER01'),
    ('5000000020', '2026', '2026-03-06', '2026-03-06', '2026-03-06 09:20:00', 'TYSUSER02'),
    ('5000000021', '2026', '2026-03-07', '2026-03-07', '2026-03-07 08:10:00', 'TYSUSER01'),
    -- Goods issues (shipments to customers/production)
    ('5000000022', '2026', '2026-02-26', '2026-02-26', '2026-02-26 15:30:00', 'TYSUSER03'),
    ('5000000023', '2026', '2026-02-27', '2026-02-27', '2026-02-27 16:00:00', 'TYSUSER03'),
    ('5000000024', '2026', '2026-03-04', '2026-03-04', '2026-03-04 14:45:00', 'TYSUSER03'),
    ('5000000025', '2026', '2026-03-05', '2026-03-05', '2026-03-05 15:20:00', 'TYSUSER03'),
    ('5000000026', '2026', '2026-03-06', '2026-03-06', '2026-03-06 16:10:00', 'TYSUSER03'),
    -- Physical inventory adjustments (shrinkage)
    ('5000000027', '2026', '2026-03-07', '2026-03-07', '2026-03-07 17:00:00', 'TYSINV01'),
    ('5000000028', '2026', '2026-03-07', '2026-03-07', '2026-03-07 17:30:00', 'TYSINV01');

-- ============================================================
-- Document Items (MSEG) — REALISTIC weight variances
-- Chicken: 2-4% variance, Pork: 3-6%, Beef: 4-8%
-- Some suppliers consistently over-deliver, others under-deliver
-- ============================================================
INSERT INTO mseg (document_number, document_year, line_item, material_id, plant_id, storage_location, batch_id, movement_type, quantity_base_uom, quantity_parallel_uom, uom_base, uom_parallel) VALUES
    -- ===== SUPPLIER A: Premium supplier (slight over-delivery) =====
    -- GR 150 CS chicken breast (MARM: 25 LB/CS, Actual: 25.65 LB/CS = +2.6% drift)
    ('5000000001', '2026', 1, 'CHKBRST-001', 'P100', 'S001', 'B20260218A', '101', 150, 3847.50, 'CS', 'LB'),

    -- GR 200 CS chicken wings (MARM: 30 LB/CS, Actual: 30.85 LB/CS = +2.8% drift)
    ('5000000002', '2026', 1, 'CHKWNG-002', 'P100', 'S001', 'B20260218A', '101', 200, 6170.00, 'CS', 'LB'),

    -- GR 100 CS chicken thighs (MARM: 28 LB/CS, Actual: 28.92 LB/CS = +3.3% drift)
    ('5000000003', '2026', 1, 'CHKTHG-003', 'P100', 'S001', 'B20260219A', '101', 100, 2892.00, 'CS', 'LB'),

    -- ===== SUPPLIER B: Budget supplier (under-delivers) =====
    -- GR 180 CS chicken breast (MARM: 25 LB/CS, Actual: 24.15 LB/CS = -3.4% drift)
    ('5000000004', '2026', 1, 'CHKBRST-001', 'P100', 'S001', 'B20260219B', '101', 180, 4347.00, 'CS', 'LB'),

    -- GR 120 CS chicken tenders (MARM: 22 LB/CS, Actual: 21.35 LB/CS = -3.0% drift)
    ('5000000005', '2026', 1, 'CHKTND-006', 'P100', 'S001', 'B20260220B', '101', 120, 2562.00, 'CS', 'LB'),

    -- GR 80 CS whole chickens (MARM: 40 LB/CS, Actual: 38.80 LB/CS = -3.0% drift - smaller birds)
    ('5000000006', '2026', 1, 'CHKWHL-007', 'P100', 'S001', 'B20260221B', '101', 80, 3104.00, 'CS', 'LB'),

    -- ===== PORK SUPPLIER C: High variance (bone-in products) =====
    -- GR 100 CS pork ribs (MARM: 35 LB/CS, Actual: 36.80 LB/CS = +5.1% drift)
    ('5000000007', '2026', 1, 'PRKRIB-004', 'P100', 'S001', 'B20260224C', '101', 100, 3680.00, 'CS', 'LB'),

    -- GR 90 CS pork chops (MARM: 30 LB/CS, Actual: 28.60 LB/CS = -4.7% drift)
    ('5000000008', '2026', 1, 'PRKCHP-008', 'P100', 'S001', 'B20260224C', '101', 90, 2574.00, 'CS', 'LB'),

    -- GR 150 CS pork sausage (MARM: 18 LB/CS, Actual: 18.65 LB/CS = +3.6% drift)
    ('5000000009', '2026', 1, 'PRKSSG-009', 'P100', 'S001', 'B20260225C', '101', 150, 2797.50, 'CS', 'LB'),

    -- ===== BEEF SUPPLIER D: Premium beef (high variance due to cuts) =====
    -- GR 80 CS ground beef (MARM: 20 LB/CS, Actual: 21.45 LB/CS = +7.3% drift)
    ('5000000010', '2026', 1, 'BFGRD-005', 'P200', 'S001', 'B20260225D', '101', 80, 1716.00, 'CS', 'LB'),

    -- GR 50 CS beef strip steaks (MARM: 45 LB/CS, Actual: 43.20 LB/CS = -4.0% drift)
    ('5000000011', '2026', 1, 'BFSTRP-010', 'P200', 'S001', 'B20260226D', '101', 50, 2160.00, 'CS', 'LB'),

    -- GR 140 CS beef patties (MARM: 24 LB/CS, Actual: 25.80 LB/CS = +7.5% drift)
    ('5000000012', '2026', 1, 'BFPTTY-011', 'P200', 'S001', 'B20260227D', '101', 140, 3612.00, 'CS', 'LB'),

    -- ===== VALUE-ADDED PRODUCTS (more consistent) =====
    -- GR 100 CS chicken nuggets (MARM: 15 LB/CS, Actual: 15.18 LB/CS = +1.2% drift - breading adds weight)
    ('5000000013', '2026', 1, 'CHKNGT-012', 'P100', 'S002', 'B20260228E', '101', 100, 1518.00, 'CS', 'LB'),

    -- GR 75 CS chicken skewers (MARM: 12 LB/CS, Actual: 12.45 LB/CS = +3.8% drift - marinade)
    ('5000000014', '2026', 1, 'CHKSKW-013', 'P100', 'S002', 'B20260228E', '101', 75, 933.75, 'CS', 'LB'),

    -- ===== SECOND BATCH FROM PREMIUM SUPPLIER A (consistent quality) =====
    -- GR 125 CS chicken breast (MARM: 25 LB/CS, Actual: 25.72 LB/CS = +2.9% drift)
    ('5000000015', '2026', 1, 'CHKBRST-001', 'P100', 'S001', 'B20260303A', '101', 125, 3215.00, 'CS', 'LB'),

    -- GR 180 CS chicken wings (MARM: 30 LB/CS, Actual: 30.95 LB/CS = +3.2% drift)
    ('5000000016', '2026', 1, 'CHKWNG-002', 'P100', 'S001', 'B20260303A', '101', 180, 5571.00, 'CS', 'LB'),

    -- ===== SECOND BATCH FROM BUDGET SUPPLIER B =====
    -- GR 160 CS chicken breast (MARM: 25 LB/CS, Actual: 24.25 LB/CS = -3.0% drift)
    ('5000000017', '2026', 1, 'CHKBRST-001', 'P100', 'S001', 'B20260304B', '101', 160, 3880.00, 'CS', 'LB'),

    -- GR 90 CS chicken thighs (MARM: 28 LB/CS, Actual: 27.20 LB/CS = -2.9% drift)
    ('5000000018', '2026', 1, 'CHKTHG-003', 'P100', 'S001', 'B20260304B', '101', 90, 2448.00, 'CS', 'LB'),

    -- ===== CROSS-PLANT RECEIPTS (Missouri P200) =====
    -- GR 110 CS chicken breast to P200 (MARM: 25 LB/CS, Actual: 25.55 LB/CS = +2.2% drift)
    ('5000000019', '2026', 1, 'CHKBRST-001', 'P200', 'S001', 'B20260305A', '101', 110, 2810.50, 'CS', 'LB'),

    -- GR 95 CS chicken wings to P200 (MARM: 30 LB/CS, Actual: 31.20 LB/CS = +4.0% drift)
    ('5000000020', '2026', 1, 'CHKWNG-002', 'P200', 'S001', 'B20260306A', '101', 95, 2964.00, 'CS', 'LB'),

    -- ===== ADDITIONAL BEEF & PORK =====
    -- GR 70 CS ground beef (MARM: 20 LB/CS, Actual: 21.60 LB/CS = +8.0% drift)
    ('5000000021', '2026', 1, 'BFGRD-005', 'P200', 'S001', 'B20260307D', '101', 70, 1512.00, 'CS', 'LB'),

    -- ===== GOODS ISSUES (showing margin erosion from shrinkage) =====
    -- GI 50 CS chicken breast from Supplier A batch (received at 25.65 LB/CS)
    -- Issue weight: 50 CS * 25.40 LB/CS = 1270 LB (0.25 LB/CS shrinkage = -1.0%)
    ('5000000022', '2026', 1, 'CHKBRST-001', 'P100', 'S001', 'B20260218A', '601', -50, -1270.00, 'CS', 'LB'),

    -- GI 75 CS chicken wings to production (received at 30.85 LB/CS)
    -- Issue weight: 75 * 30.60 LB/CS = 2295 LB (0.25 LB/CS loss = -0.8%)
    ('5000000023', '2026', 1, 'CHKWNG-002', 'P100', 'S001', 'B20260218A', '261', -75, -2295.00, 'CS', 'LB'),

    -- GI 60 CS chicken breast from Budget supplier (received at 24.15 LB/CS)
    -- Issue weight: 60 * 23.75 LB/CS = 1425 LB (0.40 LB/CS shrinkage = -1.7% - more loss!)
    ('5000000024', '2026', 1, 'CHKBRST-001', 'P100', 'S001', 'B20260219B', '601', -60, -1425.00, 'CS', 'LB'),

    -- GI 40 CS pork ribs (received at 36.80 LB/CS)
    -- Issue weight: 40 * 36.00 LB/CS = 1440 LB (0.80 LB/CS loss = -2.2% - bone drying)
    ('5000000025', '2026', 1, 'PRKRIB-004', 'P100', 'S001', 'B20260224C', '601', -40, -1440.00, 'CS', 'LB'),

    -- GI 25 CS beef strip steaks (received at 43.20 LB/CS)
    -- Issue weight: 25 * 42.50 LB/CS = 1062.50 LB (0.70 LB/CS loss = -1.6% - moisture loss)
    ('5000000026', '2026', 1, 'BFSTRP-010', 'P200', 'S001', 'B20260226D', '601', -25, -1062.50, 'CS', 'LB'),

    -- ===== PHYSICAL INVENTORY ADJUSTMENTS (realistic shrinkage scenarios) =====
    -- Chicken wings shrinkage (found 105 CS but should have 125 CS = 20 CS loss @ 30.85 LB/CS)
    -- This is 16% shrinkage - spoilage/waste over 2 weeks
    ('5000000027', '2026', 1, 'CHKWNG-002', 'P100', 'S001', 'B20260218A', '701', -20, -617.00, 'CS', 'LB'),

    -- Ground beef moisture loss (reweighed: -15 LB from 70 CS batch)
    -- Batch had 1512 LB, now 1497 LB = 1% moisture loss during cold storage
    ('5000000028', '2026', 1, 'BFGRD-005', 'P200', 'S001', 'B20260307D', '701', 0, -15.00, 'CS', 'LB');

-- ============================================================
-- Stock calculation (derived from transactions above)
-- These will be auto-calculated by inventory rebuild view
-- ============================================================
-- Note: MARD and MCHB are populated by the system based on MSEG movements
-- In a real SAP system, these would be automatically maintained
-- For the POC, we rely on v_inventory_rebuild view instead

-- ============================================================
-- Change Documents (price volatility showing real market dynamics)
-- ============================================================
INSERT INTO cdhdr (change_number, object_class, object_id, change_timestamp) VALUES
    ('CHG0000001', 'MATERIAL', 'CHKBRST-001', '2026-02-20 16:00:00'),
    ('CHG0000002', 'MATERIAL', 'BFGRD-005', '2026-02-27 10:30:00'),
    ('CHG0000003', 'MATERIAL', 'PRKRIB-004', '2026-03-04 14:15:00'),
    ('CHG0000004', 'MATERIAL', 'CHKWNG-002', '2026-03-06 09:45:00');

INSERT INTO cdpos (change_number, field_name, old_value, new_value) VALUES
    -- Chicken breast price increase (avian flu concerns)
    ('CHG0000001', 'MBEW-MOVING_AVG_PRICE', '3.15', '3.25'),
    ('CHG0000001', 'MBEW-PLANT_ID', 'P100', 'P100'),

    -- Ground beef price surge (supply shortage)
    ('CHG0000002', 'MBEW-MOVING_AVG_PRICE', '4.85', '5.20'),
    ('CHG0000002', 'MBEW-PLANT_ID', 'P200', 'P200'),

    -- Pork ribs seasonal price adjustment
    ('CHG0000003', 'MBEW-MOVING_AVG_PRICE', '4.50', '4.75'),
    ('CHG0000003', 'MBEW-PLANT_ID', 'P100', 'P100'),

    -- Chicken wings price drop (over-supply)
    ('CHG0000004', 'MBEW-MOVING_AVG_PRICE', '2.25', '2.10'),
    ('CHG0000004', 'MBEW-PLANT_ID', 'P100', 'P100');
