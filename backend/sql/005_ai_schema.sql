-- ================================================================
-- AI-Enhanced Reconciliation Schema
-- Adds authorization, AI analysis, approval workflows, and SAP controls
-- ================================================================

-- ================================================================
-- 1. AUTHORIZATION & USER MANAGEMENT
-- ================================================================

CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,  -- bcrypt hash
    role_id TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
    role_id TEXT PRIMARY KEY,
    role_name TEXT UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL  -- {"can_approve_corrections": true, "can_post": false}
);

-- Predefined roles matching SAP organizational structure
INSERT INTO roles (role_id, role_name, description, permissions) VALUES
('GR_CLERK', 'Goods Receipt Clerk', 'Can create correction requests', '{"can_view_reconciliation": true, "can_request_corrections": true, "can_approve_corrections": false, "can_post": false, "can_view_audit_trail": false}'),
('INV_MGR', 'Inventory Manager', 'Can approve and post corrections', '{"can_view_reconciliation": true, "can_request_corrections": true, "can_approve_corrections": true, "can_post": true, "can_view_audit_trail": true}'),
('AUDITOR', 'Auditor', 'Read-only access to all data and audit trails', '{"can_view_reconciliation": true, "can_view_audit_trail": true, "can_request_corrections": false, "can_approve_corrections": false, "can_post": false}'),
('CONTROLLER', 'Financial Controller', 'Can manage fiscal periods and override locks', '{"can_view_reconciliation": true, "can_approve_corrections": true, "can_post": true, "can_manage_fiscal_periods": true, "can_override_period_locks": true, "can_view_audit_trail": true}')
ON CONFLICT (role_id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ================================================================
-- 2. AI ANALYSIS STORAGE
-- ================================================================

CREATE TABLE IF NOT EXISTS ai_analyses (
    analysis_id TEXT PRIMARY KEY,
    analysis_type TEXT NOT NULL CHECK (analysis_type IN ('root_cause', 'predictive_alert', 'batch_reconciliation', 'back_posting_detection')),
    material_id TEXT,
    plant_id TEXT,
    storage_location TEXT,
    batch_id TEXT,
    discrepancy_base NUMERIC(18,6),
    discrepancy_parallel NUMERIC(18,6),

    -- AI analysis results
    root_causes JSONB,  -- [{"cause": "missing_reversal", "confidence": 0.89, "evidence": [...]}]
    affected_documents JSONB,  -- ["5000000123", "5000000124"]
    ai_explanation TEXT,  -- Natural language explanation

    -- LLM metadata
    llm_model TEXT DEFAULT 'claude-3-5-sonnet-20241022',
    llm_tokens_used INTEGER,
    llm_cost_usd NUMERIC(10,4),

    -- Tracking
    requested_by TEXT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT NOW(),
    cache_valid_until TIMESTAMP  -- For caching optimization (15 min TTL)
);

CREATE INDEX IF NOT EXISTS idx_ai_analyses_material ON ai_analyses(material_id, plant_id, storage_location);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_type ON ai_analyses(analysis_type);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_created ON ai_analyses(created_at DESC);
-- Note: Partial index with NOW() not supported, using simple index instead
CREATE INDEX IF NOT EXISTS idx_ai_analyses_cache ON ai_analyses(cache_valid_until);

-- ================================================================
-- 3. CORRECTION SUGGESTIONS & APPROVAL WORKFLOW
-- ================================================================

CREATE TABLE IF NOT EXISTS correction_suggestions (
    suggestion_id TEXT PRIMARY KEY,
    analysis_id TEXT REFERENCES ai_analyses(analysis_id),

    -- Suggestion details
    correction_type TEXT NOT NULL CHECK (correction_type IN ('reversal', 'adjustment', 'transfer', 'batch_correction')),
    suggested_postings JSONB NOT NULL,  -- Full posting.py compatible structure
    confidence_score NUMERIC(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
    financial_impact_usd NUMERIC(18,2),

    -- Approval workflow
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'posted', 'cancelled')),
    requested_by TEXT REFERENCES users(user_id) NOT NULL,
    approved_by TEXT REFERENCES users(user_id),
    rejected_by TEXT REFERENCES users(user_id),
    posted_by TEXT REFERENCES users(user_id),

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,
    posted_at TIMESTAMP,
    rejection_reason TEXT,

    -- Result tracking
    posted_document_number TEXT,
    posted_document_year TEXT,

    -- Constraints: SoD enforcement (requester cannot approve their own request)
    CONSTRAINT no_self_approval CHECK (
        requested_by != approved_by OR approved_by IS NULL
    ),
    CONSTRAINT no_self_rejection CHECK (
        requested_by != rejected_by OR rejected_by IS NULL
    )
);

CREATE INDEX IF NOT EXISTS idx_correction_status ON correction_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_correction_user ON correction_suggestions(requested_by);
CREATE INDEX IF NOT EXISTS idx_correction_posted_doc ON correction_suggestions(posted_document_number, posted_document_year);
CREATE INDEX IF NOT EXISTS idx_correction_created ON correction_suggestions(created_at DESC);

-- ================================================================
-- 4. FISCAL PERIOD MANAGEMENT
-- ================================================================

CREATE TABLE IF NOT EXISTS fiscal_periods (
    period_id TEXT PRIMARY KEY,  -- '2026-01', '2026-02'
    year INTEGER NOT NULL,
    period INTEGER NOT NULL CHECK (period BETWEEN 1 AND 12),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    closed_by TEXT REFERENCES users(user_id),
    closed_at TIMESTAMP,
    UNIQUE(year, period)
);

-- Pre-populate current and future periods
INSERT INTO fiscal_periods (period_id, year, period, start_date, end_date, status)
VALUES
    ('2026-01', 2026, 1, '2026-01-01', '2026-01-31', 'closed'),
    ('2026-02', 2026, 2, '2026-02-01', '2026-02-28', 'closed'),
    ('2026-03', 2026, 3, '2026-03-01', '2026-03-31', 'open'),
    ('2026-04', 2026, 4, '2026-04-01', '2026-04-30', 'open'),
    ('2026-05', 2026, 5, '2026-05-01', '2026-05-31', 'open'),
    ('2026-06', 2026, 6, '2026-06-01', '2026-06-30', 'open'),
    ('2026-07', 2026, 7, '2026-07-01', '2026-07-31', 'open'),
    ('2026-08', 2026, 8, '2026-08-01', '2026-08-31', 'open'),
    ('2026-09', 2026, 9, '2026-09-01', '2026-09-30', 'open'),
    ('2026-10', 2026, 10, '2026-10-01', '2026-10-31', 'open'),
    ('2026-11', 2026, 11, '2026-11-01', '2026-11-30', 'open'),
    ('2026-12', 2026, 12, '2026-12-01', '2026-12-31', 'open')
ON CONFLICT (year, period) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_fiscal_periods_status ON fiscal_periods(status);
CREATE INDEX IF NOT EXISTS idx_fiscal_periods_dates ON fiscal_periods(start_date, end_date);

-- ================================================================
-- 5. ENHANCED AUDIT TRAIL
-- ================================================================

CREATE TABLE IF NOT EXISTS ai_audit_trail (
    audit_id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'ai_analysis_created', 'correction_requested', 'correction_approved',
        'correction_rejected', 'correction_posted', 'correction_cancelled',
        'fiscal_period_closed', 'fiscal_period_opened', 'user_login',
        'period_lock_override'
    )),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('ai_analysis', 'correction_suggestion', 'goods_movement', 'fiscal_period', 'user')),
    entity_id TEXT NOT NULL,
    user_id TEXT REFERENCES users(user_id),
    event_timestamp TIMESTAMP DEFAULT NOW(),
    event_data JSONB,  -- Full context (before/after values, AI reasoning, etc.)
    ip_address TEXT,
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_ai_audit_event ON ai_audit_trail(event_type, event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_audit_entity ON ai_audit_trail(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_audit_user ON ai_audit_trail(user_id, event_timestamp DESC);

-- ================================================================
-- 6. PREDICTIVE ALERTS STORAGE
-- ================================================================

CREATE TABLE IF NOT EXISTS predictive_alerts (
    alert_id TEXT PRIMARY KEY,
    alert_type TEXT NOT NULL CHECK (alert_type IN (
        'high_risk_discrepancy', 'suspicious_back_posting', 'batch_weight_anomaly',
        'systematic_supplier_variance', 'frequent_reversals', 'unusual_pattern'
    )),
    material_id TEXT,
    plant_id TEXT,
    storage_location TEXT,
    batch_id TEXT,

    -- Prediction details
    predicted_issue TEXT NOT NULL,  -- Natural language description
    risk_score NUMERIC(3,2) CHECK (risk_score BETWEEN 0 AND 1),
    predicted_impact_usd NUMERIC(18,2),
    evidence JSONB,  -- Supporting data patterns

    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'false_positive')),
    acknowledged_by TEXT REFERENCES users(user_id),
    acknowledged_at TIMESTAMP,
    resolution_notes TEXT,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    llm_model TEXT,
    llm_tokens_used INTEGER
);

CREATE INDEX IF NOT EXISTS idx_alerts_status ON predictive_alerts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_material ON predictive_alerts(material_id);
CREATE INDEX IF NOT EXISTS idx_alerts_risk ON predictive_alerts(risk_score DESC) WHERE status = 'active';

-- ================================================================
-- 7. CONVERSATIONAL CHAT HISTORY
-- ================================================================

CREATE TABLE IF NOT EXISTS chat_sessions (
    session_id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(user_id),
    context_material_id TEXT,  -- Optional: scoped to specific material
    context_plant_id TEXT,
    context_type TEXT CHECK (context_type IN ('general', 'material_specific', 'discrepancy_investigation')),
    created_at TIMESTAMP DEFAULT NOW(),
    last_message_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS chat_messages (
    message_id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB,  -- Query results, analysis IDs referenced, function calls
    created_at TIMESTAMP DEFAULT NOW(),
    llm_tokens_used INTEGER
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at);

-- ================================================================
-- 8. SEED SAMPLE USERS FOR TESTING
-- ================================================================
-- Note: Passwords are 'password123' hashed with bcrypt
-- In production, users would be created via API with secure password hashing

INSERT INTO users (user_id, email, full_name, password_hash, role_id, is_active) VALUES
('clerk001', 'clerk@catchweight.example', 'John Smith', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIhLU7dXYG', 'GR_CLERK', TRUE),
('manager001', 'manager@catchweight.example', 'Sarah Johnson', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIhLU7dXYG', 'INV_MGR', TRUE),
('auditor001', 'auditor@catchweight.example', 'Michael Chen', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIhLU7dXYG', 'AUDITOR', TRUE),
('controller001', 'controller@catchweight.example', 'Emily Rodriguez', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIhLU7dXYG', 'CONTROLLER', TRUE)
ON CONFLICT (user_id) DO NOTHING;

-- ================================================================
-- 9. HELPER FUNCTIONS FOR AUDIT TRAIL
-- ================================================================

-- Function to log AI audit events
CREATE OR REPLACE FUNCTION log_ai_audit_event(
    p_event_type TEXT,
    p_entity_type TEXT,
    p_entity_id TEXT,
    p_user_id TEXT,
    p_event_data JSONB DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
    v_audit_id TEXT;
BEGIN
    v_audit_id := gen_random_uuid()::TEXT;

    INSERT INTO ai_audit_trail (
        audit_id, event_type, entity_type, entity_id,
        user_id, event_data, event_timestamp
    ) VALUES (
        v_audit_id, p_event_type, p_entity_type, p_entity_id,
        p_user_id, p_event_data, NOW()
    );

    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- SCHEMA VERSION TRACKING
-- ================================================================

CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT NOW(),
    description TEXT
);

INSERT INTO schema_version (version, description) VALUES
(5, 'AI-Enhanced Reconciliation with SAP Controls')
ON CONFLICT (version) DO NOTHING;

-- ================================================================
-- 10. VIEWS FOR AI FEATURES (must come after all tables)
-- ================================================================

-- View: Pending Corrections Dashboard
CREATE OR REPLACE VIEW v_pending_corrections AS
SELECT
    cs.suggestion_id,
    cs.correction_type,
    cs.confidence_score,
    cs.financial_impact_usd,
    cs.status,
    cs.created_at,
    u_req.full_name AS requested_by_name,
    u_req.email AS requested_by_email,
    aa.material_id,
    aa.plant_id,
    aa.storage_location,
    aa.discrepancy_base,
    aa.discrepancy_parallel,
    aa.ai_explanation
FROM correction_suggestions cs
LEFT JOIN users u_req ON cs.requested_by = u_req.user_id
LEFT JOIN ai_analyses aa ON cs.analysis_id = aa.analysis_id
WHERE cs.status IN ('pending', 'approved')
ORDER BY cs.created_at DESC;

-- View: Audit Trail Summary
CREATE OR REPLACE VIEW v_audit_summary AS
SELECT
    DATE(event_timestamp) AS event_date,
    event_type,
    COUNT(*) AS event_count,
    JSONB_AGG(DISTINCT user_id) AS users_involved
FROM ai_audit_trail
WHERE event_timestamp > NOW() - INTERVAL '30 days'
GROUP BY DATE(event_timestamp), event_type
ORDER BY event_date DESC, event_count DESC;

-- View: Active Alerts Dashboard
CREATE OR REPLACE VIEW v_active_alerts AS
SELECT
    alert_id,
    alert_type,
    material_id,
    plant_id,
    predicted_issue,
    risk_score,
    predicted_impact_usd,
    created_at,
    EXTRACT(DAYS FROM (NOW() - created_at)) AS days_active
FROM predictive_alerts
WHERE status = 'active'
ORDER BY risk_score DESC, created_at DESC;

-- ================================================================
-- GRANT PERMISSIONS (if using specific database users)
-- ================================================================
-- Uncomment and adjust if needed for production:
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA sap_poc TO catchweight_app;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA sap_poc TO catchweight_app;
