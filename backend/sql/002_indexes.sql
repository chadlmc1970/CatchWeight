-- SAP S4 Catch-Weight POC: Performance Indexes
-- Step 8 from build spec

SET search_path TO sap_poc;

CREATE INDEX IF NOT EXISTS idx_mseg_material ON mseg(material_id);
CREATE INDEX IF NOT EXISTS idx_mseg_posting_date ON mkpf(posting_date);
CREATE INDEX IF NOT EXISTS idx_mard_material ON mard(material_id);
CREATE INDEX IF NOT EXISTS idx_mbew_material ON mbew(material_id);
