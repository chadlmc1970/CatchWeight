-- SAP S4 Catch-Weight POC: Schema + Core Tables
-- Steps 2-7 from build spec

-- Step 2: Schema namespace
CREATE SCHEMA IF NOT EXISTS sap_poc;
SET search_path TO sap_poc;

-- Step 3: Master tables

-- MARA — Material Master General Data
CREATE TABLE mara (
    material_id TEXT PRIMARY KEY,
    material_type TEXT,
    base_uom TEXT NOT NULL,
    catch_weight_flag BOOLEAN DEFAULT FALSE
);

-- MARM — Unit of Measure Conversions
CREATE TABLE marm (
    material_id TEXT REFERENCES mara(material_id),
    alt_uom TEXT,
    numerator NUMERIC(18,6) NOT NULL,
    denominator NUMERIC(18,6) NOT NULL,
    PRIMARY KEY (material_id, alt_uom)
);

-- Step 4: Document tables

-- MKPF — Material Document Header
CREATE TABLE mkpf (
    document_number TEXT,
    document_year TEXT,
    posting_date DATE NOT NULL,
    document_date DATE,
    entry_timestamp TIMESTAMP NOT NULL,
    user_id TEXT,
    PRIMARY KEY (document_number, document_year)
);

-- MSEG — Material Document Item
CREATE TABLE mseg (
    document_number TEXT,
    document_year TEXT,
    line_item INT,
    material_id TEXT REFERENCES mara(material_id),
    plant_id TEXT,
    storage_location TEXT,
    batch_id TEXT,
    movement_type TEXT,
    quantity_base_uom NUMERIC(18,6) NOT NULL,
    quantity_parallel_uom NUMERIC(18,6),
    uom_base TEXT,
    uom_parallel TEXT,
    PRIMARY KEY (document_number, document_year, line_item),
    FOREIGN KEY (document_number, document_year)
        REFERENCES mkpf(document_number, document_year)
);

-- Step 5: Stock balance tables

-- MARD — Storage Location Stock
CREATE TABLE mard (
    material_id TEXT,
    plant_id TEXT,
    storage_location TEXT,
    stock_base_uom NUMERIC(18,6) DEFAULT 0,
    stock_parallel_uom NUMERIC(18,6) DEFAULT 0,
    last_updated TIMESTAMP,
    PRIMARY KEY (material_id, plant_id, storage_location)
);

-- MCHB — Batch Stock
CREATE TABLE mchb (
    material_id TEXT,
    plant_id TEXT,
    storage_location TEXT,
    batch_id TEXT,
    stock_base_uom NUMERIC(18,6) DEFAULT 0,
    stock_parallel_uom NUMERIC(18,6) DEFAULT 0,
    last_updated TIMESTAMP,
    PRIMARY KEY (material_id, plant_id, storage_location, batch_id)
);

-- Step 6: Valuation table

-- MBEW — Material Valuation
CREATE TABLE mbew (
    material_id TEXT,
    plant_id TEXT,
    price_control TEXT CHECK (price_control IN ('S','V')),
    standard_price NUMERIC(18,6),
    moving_avg_price NUMERIC(18,6),
    valuation_class TEXT,
    PRIMARY KEY (material_id, plant_id)
);

-- Step 7: Optional change documents

-- CDHDR — Change Document Header
CREATE TABLE cdhdr (
    change_number TEXT PRIMARY KEY,
    object_class TEXT,
    object_id TEXT,
    change_timestamp TIMESTAMP NOT NULL
);

-- CDPOS — Change Document Position
CREATE TABLE cdpos (
    change_number TEXT REFERENCES cdhdr(change_number),
    field_name TEXT,
    old_value TEXT,
    new_value TEXT
);
