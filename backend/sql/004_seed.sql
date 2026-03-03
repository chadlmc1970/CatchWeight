-- SAP S4 Catch-Weight POC: Sample Seed Data (Tyson-like)

SET search_path TO sap_poc;

-- Clear existing data (order respects FK constraints)
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
-- UoM Conversions (MARM) — CS to LB nominal ratios
-- ============================================================
INSERT INTO marm (material_id, alt_uom, numerator, denominator) VALUES
    -- Chicken
    ('CHKBRST-001', 'LB', 25.0, 1.0),   -- 1 CS ≈ 25 LB nominal
    ('CHKWNG-002',  'LB', 30.0, 1.0),   -- 1 CS ≈ 30 LB nominal
    ('CHKTHG-003',  'LB', 28.0, 1.0),   -- 1 CS ≈ 28 LB nominal
    ('CHKTND-006',  'LB', 22.0, 1.0),   -- 1 CS ≈ 22 LB nominal
    ('CHKWHL-007',  'LB', 40.0, 1.0),   -- 1 CS ≈ 40 LB nominal (8-10 birds)
    -- Pork
    ('PRKRIB-004',  'LB', 35.0, 1.0),   -- 1 CS ≈ 35 LB nominal
    ('PRKCHP-008',  'LB', 30.0, 1.0),   -- 1 CS ≈ 30 LB nominal
    ('PRKSSG-009',  'LB', 18.0, 1.0),   -- 1 CS ≈ 18 LB nominal
    -- Beef
    ('BFGRD-005',   'LB', 20.0, 1.0),   -- 1 CS ≈ 20 LB nominal
    ('BFSTRP-010',  'LB', 45.0, 1.0),   -- 1 CS ≈ 45 LB nominal
    ('BFPTTY-011',  'LB', 24.0, 1.0),   -- 1 CS ≈ 24 LB nominal (quarter pounders)
    -- Value-Added
    ('CHKNGT-012',  'LB', 15.0, 1.0),   -- 1 CS ≈ 15 LB nominal
    ('CHKSKW-013',  'LB', 12.0, 1.0);   -- 1 CS ≈ 12 LB nominal

-- ============================================================
-- Valuation (MBEW) — pricing per pound
-- ============================================================
INSERT INTO mbew (material_id, plant_id, price_control, standard_price, moving_avg_price, valuation_class) VALUES
    -- Chicken - P100 (Arkansas Plant)
    ('CHKBRST-001', 'P100', 'V', NULL,  3.25, '7920'),  -- $3.25/LB moving avg
    ('CHKWNG-002',  'P100', 'V', NULL,  2.10, '7920'),  -- $2.10/LB moving avg
    ('CHKTHG-003',  'P100', 'S', 2.50,  NULL, '7920'),  -- $2.50/LB standard
    ('CHKTND-006',  'P100', 'V', NULL,  4.10, '7920'),  -- $4.10/LB moving avg
    ('CHKWHL-007',  'P100', 'V', NULL,  1.85, '7920'),  -- $1.85/LB moving avg
    ('CHKNGT-012',  'P100', 'V', NULL,  5.50, '7920'),  -- $5.50/LB moving avg (value-added)
    ('CHKSKW-013',  'P100', 'V', NULL,  6.20, '7920'),  -- $6.20/LB moving avg (value-added)
    -- Chicken - P200 (Missouri Plant)
    ('CHKBRST-001', 'P200', 'V', NULL,  3.30, '7920'),  -- Slightly higher cost
    ('CHKWNG-002',  'P200', 'V', NULL,  2.15, '7920'),
    -- Pork - P100
    ('PRKRIB-004',  'P100', 'V', NULL,  4.75, '7930'),  -- $4.75/LB moving avg
    ('PRKCHP-008',  'P100', 'S', 3.80,  NULL, '7930'),  -- $3.80/LB standard
    ('PRKSSG-009',  'P100', 'V', NULL,  2.95, '7930'),  -- $2.95/LB moving avg
    -- Beef - P200
    ('BFGRD-005',   'P200', 'V', NULL,  5.20, '7940'),  -- $5.20/LB moving avg
    ('BFSTRP-010',  'P200', 'S', 12.50, NULL, '7940'),  -- $12.50/LB standard (premium)
    ('BFPTTY-011',  'P200', 'V', NULL,  6.10, '7940');  -- $6.10/LB moving avg

-- ============================================================
-- Stock Balances (MARD) — current inventory positions
-- ============================================================
INSERT INTO mard (material_id, plant_id, storage_location, stock_base_uom, stock_parallel_uom, last_updated) VALUES
    -- P100 - Arkansas Plant
    ('CHKBRST-001', 'P100', 'S001', 215, 5396.20,  '2026-03-01 08:00:00'),  -- Main warehouse
    ('CHKBRST-001', 'P100', 'S002',  50, 1248.75,  '2026-03-01 08:00:00'),  -- Cold storage
    ('CHKWNG-002',  'P100', 'S001', 130, 3887.30,  '2026-03-01 08:00:00'),
    ('CHKTHG-003',  'P100', 'S001', 120, 3372.00,  '2026-03-01 08:00:00'),
    ('CHKTND-006',  'P100', 'S001',  95, 2089.45,  '2026-03-01 08:00:00'),
    ('CHKWHL-007',  'P100', 'S001',  45, 1798.80,  '2026-03-01 08:00:00'),
    ('PRKRIB-004',  'P100', 'S001',  80, 2812.40,  '2026-03-01 08:00:00'),
    ('PRKCHP-008',  'P100', 'S001',  65, 1952.50,  '2026-03-01 08:00:00'),
    ('PRKSSG-009',  'P100', 'S001', 110, 1978.20,  '2026-03-01 08:00:00'),
    ('CHKNGT-012',  'P100', 'S002',  75, 1126.50,  '2026-03-01 08:00:00'),  -- Value-added in cold storage
    ('CHKSKW-013',  'P100', 'S002',  40,  479.20,  '2026-03-01 08:00:00'),
    -- P200 - Missouri Plant
    ('CHKBRST-001', 'P200', 'S001', 100, 2510.00,  '2026-03-01 08:00:00'),
    ('CHKWNG-002',  'P200', 'S001',  85, 2557.50,  '2026-03-01 08:00:00'),
    ('BFGRD-005',   'P200', 'S001',  60, 1194.60,  '2026-03-01 08:00:00'),
    ('BFSTRP-010',  'P200', 'S001',  30, 1354.50,  '2026-03-01 08:00:00'),
    ('BFPTTY-011',  'P200', 'S001', 120, 2886.00,  '2026-03-01 08:00:00');

-- ============================================================
-- Batch Stock (MCHB) — batch-level tracking for traceability
-- ============================================================
INSERT INTO mchb (material_id, plant_id, storage_location, batch_id, stock_base_uom, stock_parallel_uom, last_updated) VALUES
    -- Chicken Breast - multiple batches showing weight variance
    ('CHKBRST-001', 'P100', 'S001', 'B20260225', 115, 2883.95, '2026-03-01 08:00:00'),  -- 25.08 LB/CS
    ('CHKBRST-001', 'P100', 'S001', 'B20260228', 100, 2512.25, '2026-03-01 08:00:00'),  -- 25.12 LB/CS
    ('CHKBRST-001', 'P100', 'S002', 'B20260225',  50, 1248.75, '2026-03-01 08:00:00'),  -- 24.98 LB/CS
    ('CHKBRST-001', 'P200', 'S001', 'B20260301', 100, 2510.00, '2026-03-01 08:00:00'),  -- 25.10 LB/CS
    -- Chicken Wings - shows more variability
    ('CHKWNG-002',  'P100', 'S001', 'B20260227', 130, 3887.30, '2026-03-01 08:00:00'),  -- 29.90 LB/CS
    ('CHKWNG-002',  'P200', 'S001', 'B20260301',  85, 2557.50, '2026-03-01 08:00:00'),  -- 30.09 LB/CS
    -- Other products
    ('CHKTHG-003',  'P100', 'S001', 'B20260226', 120, 3372.00, '2026-03-01 08:00:00'),  -- 28.10 LB/CS
    ('CHKTND-006',  'P100', 'S001', 'B20260301',  95, 2089.45, '2026-03-01 08:00:00'),  -- 21.99 LB/CS
    ('CHKWHL-007',  'P100', 'S001', 'B20260228',  45, 1798.80, '2026-03-01 08:00:00'),  -- 39.97 LB/CS
    ('PRKRIB-004',  'P100', 'S001', 'B20260228',  80, 2812.40, '2026-03-01 08:00:00'),  -- 35.16 LB/CS
    ('PRKCHP-008',  'P100', 'S001', 'B20260227',  65, 1952.50, '2026-03-01 08:00:00'),  -- 30.04 LB/CS
    ('PRKSSG-009',  'P100', 'S001', 'B20260301', 110, 1978.20, '2026-03-01 08:00:00'),  -- 17.98 LB/CS
    ('BFGRD-005',   'P200', 'S001', 'B20260301',  60, 1194.60, '2026-03-01 08:00:00'),  -- 19.91 LB/CS
    ('BFSTRP-010',  'P200', 'S001', 'B20260229',  30, 1354.50, '2026-03-01 08:00:00'),  -- 45.15 LB/CS
    ('BFPTTY-011',  'P200', 'S001', 'B20260301', 120, 2886.00, '2026-03-01 08:00:00'),  -- 24.05 LB/CS
    ('CHKNGT-012',  'P100', 'S002', 'B20260226',  75, 1126.50, '2026-03-01 08:00:00'),  -- 15.02 LB/CS (breaded adds weight)
    ('CHKSKW-013',  'P100', 'S002', 'B20260228',  40,  479.20, '2026-03-01 08:00:00');  -- 11.98 LB/CS (marinade adds weight)

-- ============================================================
-- Document Headers (MKPF) — goods receipts, issues, transfers
-- ============================================================
INSERT INTO mkpf (document_number, document_year, posting_date, document_date, entry_timestamp, user_id) VALUES
    -- Week 1: Initial receipts (Feb 25-26)
    ('5000000001', '2026', '2026-02-25', '2026-02-25', '2026-02-25 09:15:00', 'TYSUSER01'),
    ('5000000002', '2026', '2026-02-25', '2026-02-25', '2026-02-25 10:30:00', 'TYSUSER01'),
    ('5000000003', '2026', '2026-02-26', '2026-02-26', '2026-02-26 08:45:00', 'TYSUSER02'),
    ('5000000004', '2026', '2026-02-26', '2026-02-26', '2026-02-26 14:20:00', 'TYSUSER02'),
    -- Week 2: More receipts (Feb 27-28)
    ('5000000005', '2026', '2026-02-27', '2026-02-27', '2026-02-27 08:00:00', 'TYSUSER01'),
    ('5000000006', '2026', '2026-02-27', '2026-02-27', '2026-02-27 10:15:00', 'TYSUSER02'),
    ('5000000007', '2026', '2026-02-28', '2026-02-28', '2026-02-28 07:30:00', 'TYSUSER01'),
    ('5000000008', '2026', '2026-02-28', '2026-02-28', '2026-02-28 11:00:00', 'TYSUSER01'),
    ('5000000009', '2026', '2026-02-28', '2026-02-28', '2026-02-28 14:45:00', 'TYSUSER02'),
    -- Week 3: Current week (Mar 1-3)
    ('5000000010', '2026', '2026-03-01', '2026-03-01', '2026-03-01 07:30:00', 'TYSUSER01'),
    ('5000000011', '2026', '2026-03-01', '2026-03-01', '2026-03-01 08:00:00', 'TYSUSER01'),
    ('5000000012', '2026', '2026-03-01', '2026-03-01', '2026-03-01 09:00:00', 'TYSUSER01'),
    ('5000000013', '2026', '2026-03-01', '2026-03-01', '2026-03-01 10:15:00', 'TYSUSER02'),
    ('5000000014', '2026', '2026-03-02', '2026-03-02', '2026-03-02 08:30:00', 'TYSUSER01'),
    ('5000000015', '2026', '2026-03-02', '2026-03-02', '2026-03-02 11:00:00', 'TYSUSER02'),
    ('5000000016', '2026', '2026-03-03', '2026-03-03', '2026-03-03 07:45:00', 'TYSUSER01'),
    -- BACK-POSTING: entry on Mar 1 but posting date Feb 20 (shows late entry)
    ('5000000017', '2026', '2026-02-20', '2026-02-20', '2026-03-01 16:45:00', 'TYSUSER03'),
    -- Stock transfers between locations
    ('5000000018', '2026', '2026-03-02', '2026-03-02', '2026-03-02 13:20:00', 'TYSUSER02'),
    -- Physical inventory adjustments (showing shrinkage/waste)
    ('5000000019', '2026', '2026-03-03', '2026-03-03', '2026-03-03 09:30:00', 'TYSUSER03'),
    ('5000000020', '2026', '2026-03-03', '2026-03-03', '2026-03-03 10:00:00', 'TYSUSER03');

-- ============================================================
-- Document Items (MSEG) — movements showing weight variance patterns
-- Movement types: 101=GR, 601=GI to customer, 261=GI to production,
--                 311=Transfer posting, 701=Physical inventory
-- ============================================================
INSERT INTO mseg (document_number, document_year, line_item, material_id, plant_id, storage_location, batch_id, movement_type, quantity_base_uom, quantity_parallel_uom, uom_base, uom_parallel) VALUES
    -- Doc 1: GR 100 CS chicken breast → P100/S001 (actual 2508.25 LB vs 2500 expected = +0.33% drift)
    ('5000000001', '2026', 1, 'CHKBRST-001', 'P100', 'S001', 'B20260225', '101', 100, 2508.25, 'CS', 'LB'),

    -- Doc 2: GR 50 CS chicken breast → P100/S002 (actual 1248.75 LB vs 1250 expected = -0.10% drift)
    ('5000000002', '2026', 1, 'CHKBRST-001', 'P100', 'S002', 'B20260225', '101', 50, 1248.75, 'CS', 'LB'),

    -- Doc 3: GR 120 CS chicken thigh → P100/S001 (actual 3372.00 LB vs 3360 expected = +0.36% drift)
    ('5000000003', '2026', 1, 'CHKTHG-003', 'P100', 'S001', 'B20260226', '101', 120, 3372.00, 'CS', 'LB'),

    -- Doc 4: GR 75 CS chicken nuggets → P100/S002 (value-added, breading adds weight)
    ('5000000004', '2026', 1, 'CHKNGT-012', 'P100', 'S002', 'B20260226', '101', 75, 1126.50, 'CS', 'LB'),

    -- Doc 5: GR 150 CS chicken wings → P100/S001 (high variance product)
    ('5000000005', '2026', 1, 'CHKWNG-002', 'P100', 'S001', 'B20260227', '101', 150, 4485.30, 'CS', 'LB'),

    -- Doc 6: GR 65 CS pork chops → P100/S001
    ('5000000006', '2026', 1, 'PRKCHP-008', 'P100', 'S001', 'B20260227', '101', 65, 1952.50, 'CS', 'LB'),

    -- Doc 7: GR 80 CS pork ribs → P100/S001 (actual 2812.40 LB vs 2800 expected = +0.44% drift)
    ('5000000007', '2026', 1, 'PRKRIB-004', 'P100', 'S001', 'B20260228', '101', 80, 2812.40, 'CS', 'LB'),

    -- Doc 8: GR 100 CS chicken breast → P100/S001 (second batch, different weight)
    ('5000000008', '2026', 1, 'CHKBRST-001', 'P100', 'S001', 'B20260228', '101', 100, 2512.25, 'CS', 'LB'),

    -- Doc 9: GR 45 CS whole chickens → P100/S001 (actual 1798.80 LB vs 1800 expected = -0.07% drift)
    ('5000000009', '2026', 1, 'CHKWHL-007', 'P100', 'S001', 'B20260228', '101', 45, 1798.80, 'CS', 'LB'),

    -- Doc 10: GR 95 CS chicken tenders → P100/S001
    ('5000000010', '2026', 1, 'CHKTND-006', 'P100', 'S001', 'B20260301', '101', 95, 2089.45, 'CS', 'LB'),

    -- Doc 11: Multi-line document - mixed products to P200
    ('5000000011', '2026', 1, 'CHKBRST-001', 'P200', 'S001', 'B20260301', '101', 100, 2510.00, 'CS', 'LB'),
    ('5000000011', '2026', 2, 'BFGRD-005', 'P200', 'S001', 'B20260301', '101', 60, 1194.60, 'CS', 'LB'),
    ('5000000011', '2026', 3, 'CHKWNG-002', 'P200', 'S001', 'B20260301', '101', 85, 2557.50, 'CS', 'LB'),

    -- Doc 12: GI 10 CS chicken breast to customer (delivery - mvmt 601)
    ('5000000012', '2026', 1, 'CHKBRST-001', 'P100', 'S001', 'B20260225', '601', -10, -250.80, 'CS', 'LB'),

    -- Doc 13: GI 20 CS chicken wings to production (further processing - mvmt 261)
    ('5000000013', '2026', 1, 'CHKWNG-002', 'P100', 'S001', 'B20260227', '261', -20, -598.00, 'CS', 'LB'),

    -- Doc 14: GR 110 CS pork sausage → P100/S001 (actual 1978.20 LB vs 1980 expected = -0.09% drift)
    ('5000000014', '2026', 1, 'PRKSSG-009', 'P100', 'S001', 'B20260301', '101', 110, 1978.20, 'CS', 'LB'),

    -- Doc 15: GR of premium beef products to P200
    ('5000000015', '2026', 1, 'BFSTRP-010', 'P200', 'S001', 'B20260229', '101', 30, 1354.50, 'CS', 'LB'),
    ('5000000015', '2026', 2, 'BFPTTY-011', 'P200', 'S001', 'B20260301', '101', 120, 2886.00, 'CS', 'LB'),

    -- Doc 16: GR 40 CS chicken skewers → P100/S002 (marinated, weight varies)
    ('5000000016', '2026', 1, 'CHKSKW-013', 'P100', 'S002', 'B20260228', '101', 40, 479.20, 'CS', 'LB'),

    -- Doc 17: BACK-POSTING - GR 25 CS chicken breast (late entry - shows 9+ day delta)
    ('5000000017', '2026', 1, 'CHKBRST-001', 'P100', 'S001', 'B20260225', '101', 25, 626.50, 'CS', 'LB'),

    -- Doc 18: Stock transfer - 15 CS chicken breast from S001 to S002 (mvmt 311)
    ('5000000018', '2026', 1, 'CHKBRST-001', 'P100', 'S001', 'B20260225', '311', -15, -375.70, 'CS', 'LB'),
    ('5000000018', '2026', 2, 'CHKBRST-001', 'P100', 'S002', 'B20260225', '311',  15,  375.70, 'CS', 'LB'),

    -- Doc 19: Physical inventory adjustment - shrinkage on chicken wings (mvmt 701)
    -- Found 125 CS but system shows 130 CS = -5 CS shrinkage (waste/spoilage)
    ('5000000019', '2026', 1, 'CHKWNG-002', 'P100', 'S001', 'B20260227', '701', -5, -149.50, 'CS', 'LB'),

    -- Doc 20: Physical inventory adjustment - ground beef (weight loss due to moisture)
    -- Expected 60 CS @ 20 LB = 1200 LB, actual weighed 1194.60 LB
    ('5000000020', '2026', 1, 'BFGRD-005', 'P200', 'S001', 'B20260301', '701', 0, -5.40, 'CS', 'LB');

-- ============================================================
-- Change Documents (CDHDR/CDPOS) — Audit trail for price changes
-- Shows margin erosion when prices are updated
-- ============================================================
INSERT INTO cdhdr (change_number, object_class, object_id, change_timestamp) VALUES
    ('CHG0000001', 'MATERIAL', 'CHKBRST-001', '2026-02-28 16:30:00'),
    ('CHG0000002', 'MATERIAL', 'BFGRD-005', '2026-03-01 09:45:00'),
    ('CHG0000003', 'MATERIAL', 'CHKWNG-002', '2026-03-02 14:20:00');

INSERT INTO cdpos (change_number, field_name, old_value, new_value) VALUES
    -- Change 1: Chicken breast price increase at P100
    ('CHG0000001', 'MBEW-MOVING_AVG_PRICE', '3.15', '3.25'),
    ('CHG0000001', 'MBEW-PLANT_ID', 'P100', 'P100'),
    
    -- Change 2: Ground beef price drop at P200 (margin erosion scenario)
    ('CHG0000002', 'MBEW-MOVING_AVG_PRICE', '5.45', '5.20'),
    ('CHG0000002', 'MBEW-PLANT_ID', 'P200', 'P200'),
    
    -- Change 3: Chicken wings price adjustment at P100
    ('CHG0000003', 'MBEW-MOVING_AVG_PRICE', '2.05', '2.10'),
    ('CHG0000003', 'MBEW-PLANT_ID', 'P100', 'P100');
