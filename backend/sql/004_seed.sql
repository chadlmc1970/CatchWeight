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
-- Materials (MARA)
-- ============================================================
INSERT INTO mara (material_id, material_type, base_uom, catch_weight_flag) VALUES
    ('CHKBRST-001', 'FERT', 'CS', TRUE),
    ('CHKWNG-002',  'FERT', 'CS', TRUE),
    ('CHKTHG-003',  'FERT', 'CS', TRUE),
    ('PRKRIB-004',  'FERT', 'CS', TRUE),
    ('BFGRD-005',   'FERT', 'CS', TRUE);

-- ============================================================
-- UoM Conversions (MARM) — CS to LB nominal ratios
-- ============================================================
INSERT INTO marm (material_id, alt_uom, numerator, denominator) VALUES
    ('CHKBRST-001', 'LB', 25.0, 1.0),   -- 1 CS ≈ 25 LB nominal
    ('CHKWNG-002',  'LB', 30.0, 1.0),   -- 1 CS ≈ 30 LB nominal
    ('CHKTHG-003',  'LB', 28.0, 1.0),   -- 1 CS ≈ 28 LB nominal
    ('PRKRIB-004',  'LB', 35.0, 1.0),   -- 1 CS ≈ 35 LB nominal
    ('BFGRD-005',   'LB', 20.0, 1.0);   -- 1 CS ≈ 20 LB nominal

-- ============================================================
-- Valuation (MBEW) — initial pricing
-- ============================================================
INSERT INTO mbew (material_id, plant_id, price_control, standard_price, moving_avg_price, valuation_class) VALUES
    ('CHKBRST-001', 'P100', 'V', NULL,  3.25, '7920'),
    ('CHKBRST-001', 'P200', 'V', NULL,  3.30, '7920'),
    ('CHKWNG-002',  'P100', 'V', NULL,  2.10, '7920'),
    ('CHKTHG-003',  'P100', 'S', 2.50,  NULL, '7920'),
    ('PRKRIB-004',  'P100', 'V', NULL,  4.75, '7920'),
    ('BFGRD-005',   'P200', 'V', NULL,  5.20, '7920');

-- ============================================================
-- Stock Balances (MARD) — initial positions
-- ============================================================
INSERT INTO mard (material_id, plant_id, storage_location, stock_base_uom, stock_parallel_uom, last_updated) VALUES
    ('CHKBRST-001', 'P100', 'S001', 215, 5396.20,  '2026-03-01 08:00:00'),
    ('CHKBRST-001', 'P100', 'S002',  50, 1248.75,  '2026-03-01 08:00:00'),
    ('CHKBRST-001', 'P200', 'S001', 100, 2510.00,  '2026-03-01 08:00:00'),
    ('CHKWNG-002',  'P100', 'S001', 130, 3887.30,  '2026-03-01 08:00:00'),
    ('CHKTHG-003',  'P100', 'S001', 120, 3372.00,  '2026-03-01 08:00:00'),
    ('PRKRIB-004',  'P100', 'S001',  80, 2812.40,  '2026-03-01 08:00:00'),
    ('BFGRD-005',   'P200', 'S001',  60, 1194.60,  '2026-03-01 08:00:00');

-- ============================================================
-- Batch Stock (MCHB) — batch-level detail
-- ============================================================
INSERT INTO mchb (material_id, plant_id, storage_location, batch_id, stock_base_uom, stock_parallel_uom, last_updated) VALUES
    ('CHKBRST-001', 'P100', 'S001', 'B20260225', 115, 2883.95, '2026-03-01 08:00:00'),
    ('CHKBRST-001', 'P100', 'S001', 'B20260228', 100, 2512.25, '2026-03-01 08:00:00'),
    ('CHKBRST-001', 'P100', 'S002', 'B20260225',  50, 1248.75, '2026-03-01 08:00:00'),
    ('CHKWNG-002',  'P100', 'S001', 'B20260227', 130, 3887.30, '2026-03-01 08:00:00'),
    ('CHKTHG-003',  'P100', 'S001', 'B20260226', 120, 3372.00, '2026-03-01 08:00:00'),
    ('PRKRIB-004',  'P100', 'S001', 'B20260228',  80, 2812.40, '2026-03-01 08:00:00'),
    ('BFGRD-005',   'P200', 'S001', 'B20260301',  60, 1194.60, '2026-03-01 08:00:00');

-- ============================================================
-- Document Headers (MKPF) — goods receipts + 1 back-posting
-- ============================================================
INSERT INTO mkpf (document_number, document_year, posting_date, document_date, entry_timestamp, user_id) VALUES
    ('5000000001', '2026', '2026-02-25', '2026-02-25', '2026-02-25 09:15:00', 'TYSUSER01'),
    ('5000000002', '2026', '2026-02-25', '2026-02-25', '2026-02-25 10:30:00', 'TYSUSER01'),
    ('5000000003', '2026', '2026-02-27', '2026-02-27', '2026-02-27 08:45:00', 'TYSUSER02'),
    ('5000000004', '2026', '2026-02-28', '2026-02-28', '2026-02-28 11:00:00', 'TYSUSER01'),
    ('5000000005', '2026', '2026-02-26', '2026-02-26', '2026-02-26 14:20:00', 'TYSUSER02'),
    ('5000000006', '2026', '2026-03-01', '2026-03-01', '2026-03-01 07:30:00', 'TYSUSER01'),
    ('5000000007', '2026', '2026-03-01', '2026-03-01', '2026-03-01 08:00:00', 'TYSUSER01'),
    -- Back-posting: entry on Mar 1 but posting date Feb 20
    ('5000000008', '2026', '2026-02-20', '2026-02-20', '2026-03-01 16:45:00', 'TYSUSER03'),
    -- Goods issues
    ('5000000009', '2026', '2026-03-01', '2026-03-01', '2026-03-01 09:00:00', 'TYSUSER01'),
    ('5000000010', '2026', '2026-03-01', '2026-03-01', '2026-03-01 10:15:00', 'TYSUSER02');

-- ============================================================
-- Document Items (MSEG) — movements with actual catch weights
-- ============================================================
INSERT INTO mseg (document_number, document_year, line_item, material_id, plant_id, storage_location, batch_id, movement_type, quantity_base_uom, quantity_parallel_uom, uom_base, uom_parallel) VALUES
    -- Doc 1: GR 100 CS chicken breast → P100/S001 (actual 2508.25 LB)
    ('5000000001', '2026', 1, 'CHKBRST-001', 'P100', 'S001', 'B20260225', '101', 100, 2508.25, 'CS', 'LB'),
    -- Doc 2: GR 50 CS chicken breast → P100/S002
    ('5000000002', '2026', 1, 'CHKBRST-001', 'P100', 'S002', 'B20260225', '101', 50, 1248.75, 'CS', 'LB'),
    -- Doc 3: GR 150 CS chicken wings → P100/S001
    ('5000000003', '2026', 1, 'CHKWNG-002', 'P100', 'S001', 'B20260227', '101', 150, 4485.30, 'CS', 'LB'),
    -- Doc 4: GR 100 CS chicken breast → P100/S001 (second batch)
    ('5000000004', '2026', 1, 'CHKBRST-001', 'P100', 'S001', 'B20260228', '101', 100, 2512.25, 'CS', 'LB'),
    -- Doc 5: GR 120 CS chicken thigh → P100/S001
    ('5000000005', '2026', 1, 'CHKTHG-003', 'P100', 'S001', 'B20260226', '101', 120, 3372.00, 'CS', 'LB'),
    -- Doc 6: GR 80 CS pork ribs → P100/S001
    ('5000000006', '2026', 1, 'PRKRIB-004', 'P100', 'S001', 'B20260228', '101', 80, 2812.40, 'CS', 'LB'),
    -- Doc 7: GR 100 CS chicken breast → P200/S001
    ('5000000007', '2026', 1, 'CHKBRST-001', 'P200', 'S001', 'B20260301', '101', 100, 2510.00, 'CS', 'LB'),
    -- Doc 7 line 2: GR 60 CS ground beef → P200/S001
    ('5000000007', '2026', 2, 'BFGRD-005', 'P200', 'S001', 'B20260301', '101', 60, 1194.60, 'CS', 'LB'),
    -- Doc 8: Back-posting — GR 25 CS chicken breast (late entry)
    ('5000000008', '2026', 1, 'CHKBRST-001', 'P100', 'S001', 'B20260225', '101', 25, 626.50, 'CS', 'LB'),
    -- Doc 9: GI 10 CS chicken breast from P100/S001 (delivery)
    ('5000000009', '2026', 1, 'CHKBRST-001', 'P100', 'S001', 'B20260225', '601', -10, -250.80, 'CS', 'LB'),
    -- Doc 10: GI 20 CS chicken wings from P100/S001 (production)
    ('5000000010', '2026', 1, 'CHKWNG-002', 'P100', 'S001', 'B20260227', '261', -20, -598.00, 'CS', 'LB');
