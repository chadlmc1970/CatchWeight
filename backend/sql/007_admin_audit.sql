-- Admin Audit Log Table
-- Tracks all administrative actions (data resets, clears, loads)

SET search_path TO sap_poc;

CREATE TABLE IF NOT EXISTS admin_audit_log (
    log_id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    user_id TEXT NOT NULL DEFAULT 'WEBUSER',
    action_type TEXT NOT NULL CHECK (action_type IN ('data_reset', 'data_clear', 'data_load')),
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'in_progress')),
    details JSONB,
    duration_ms INTEGER
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_admin_audit_timestamp ON admin_audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_user ON admin_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON admin_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_status ON admin_audit_log(status);

COMMENT ON TABLE admin_audit_log IS 'Audit trail for administrative operations';
COMMENT ON COLUMN admin_audit_log.log_id IS 'Unique identifier for each audit entry';
COMMENT ON COLUMN admin_audit_log.timestamp IS 'When the action occurred';
COMMENT ON COLUMN admin_audit_log.user_id IS 'User who performed the action';
COMMENT ON COLUMN admin_audit_log.action_type IS 'Type of action: data_reset, data_clear, data_load';
COMMENT ON COLUMN admin_audit_log.status IS 'Status: success, error, in_progress';
COMMENT ON COLUMN admin_audit_log.details IS 'JSONB with action-specific details (steps, errors, etc.)';
COMMENT ON COLUMN admin_audit_log.duration_ms IS 'How long the action took in milliseconds';
