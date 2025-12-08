-- Migration: Repair Flow Sessions
-- Purpose: Store repair flow conversation state for the website widget
-- This enables session persistence, analytics, and simpler frontend

-- ============================================
-- REPAIR FLOW SESSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS repair_flow_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Session identification
  session_id TEXT UNIQUE NOT NULL,  -- Frontend-generated session ID
  
  -- Current flow state
  step TEXT NOT NULL DEFAULT 'greeting',
  device_type TEXT,
  device_category TEXT,
  device_model TEXT,
  device_model_label TEXT,  -- Human-readable model name
  issue TEXT,
  symptom TEXT,
  selected_job TEXT,
  
  -- Identification progress (for "I don't know my model" flow)
  identification JSONB DEFAULT '{}',
  
  -- Pricing info once determined
  price_estimate TEXT,
  turnaround TEXT,
  needs_diagnostic BOOLEAN DEFAULT FALSE,
  
  -- Scene data for UI
  scene JSONB,
  
  -- Conversation history (for context)
  messages JSONB DEFAULT '[]',
  
  -- Customer info (if collected)
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  
  -- Outcome tracking
  outcome TEXT,  -- 'booked', 'called', 'abandoned', 'completed'
  outcome_at TIMESTAMPTZ,
  
  -- Metadata
  source_url TEXT,  -- Which page they started from
  user_agent TEXT,
  ip_address TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Expiry (sessions expire after 24 hours of inactivity)
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Index for fast session lookups
CREATE INDEX IF NOT EXISTS idx_repair_flow_sessions_session_id 
  ON repair_flow_sessions(session_id);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_repair_flow_sessions_created_at 
  ON repair_flow_sessions(created_at);

CREATE INDEX IF NOT EXISTS idx_repair_flow_sessions_device_type 
  ON repair_flow_sessions(device_type);

CREATE INDEX IF NOT EXISTS idx_repair_flow_sessions_outcome 
  ON repair_flow_sessions(outcome);

-- Index for cleanup of expired sessions
CREATE INDEX IF NOT EXISTS idx_repair_flow_sessions_expires_at 
  ON repair_flow_sessions(expires_at);

-- ============================================
-- AUTO-UPDATE TIMESTAMPS
-- ============================================

CREATE OR REPLACE FUNCTION update_repair_flow_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_activity_at = NOW();
  NEW.expires_at = NOW() + INTERVAL '24 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS repair_flow_session_updated ON repair_flow_sessions;
CREATE TRIGGER repair_flow_session_updated
  BEFORE UPDATE ON repair_flow_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_repair_flow_session_timestamp();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get or create a session
CREATE OR REPLACE FUNCTION get_or_create_repair_session(p_session_id TEXT)
RETURNS repair_flow_sessions AS $$
DECLARE
  v_session repair_flow_sessions;
BEGIN
  -- Try to get existing session
  SELECT * INTO v_session 
  FROM repair_flow_sessions 
  WHERE session_id = p_session_id 
    AND expires_at > NOW();
  
  -- If not found, create new one
  IF v_session IS NULL THEN
    INSERT INTO repair_flow_sessions (session_id)
    VALUES (p_session_id)
    RETURNING * INTO v_session;
  END IF;
  
  RETURN v_session;
END;
$$ LANGUAGE plpgsql;

-- Update session state
CREATE OR REPLACE FUNCTION update_repair_session(
  p_session_id TEXT,
  p_step TEXT DEFAULT NULL,
  p_device_type TEXT DEFAULT NULL,
  p_device_model TEXT DEFAULT NULL,
  p_device_model_label TEXT DEFAULT NULL,
  p_issue TEXT DEFAULT NULL,
  p_identification JSONB DEFAULT NULL,
  p_price_estimate TEXT DEFAULT NULL,
  p_turnaround TEXT DEFAULT NULL,
  p_needs_diagnostic BOOLEAN DEFAULT NULL,
  p_scene JSONB DEFAULT NULL,
  p_message JSONB DEFAULT NULL  -- Add to messages array
)
RETURNS repair_flow_sessions AS $$
DECLARE
  v_session repair_flow_sessions;
BEGIN
  UPDATE repair_flow_sessions
  SET
    step = COALESCE(p_step, step),
    device_type = COALESCE(p_device_type, device_type),
    device_model = COALESCE(p_device_model, device_model),
    device_model_label = COALESCE(p_device_model_label, device_model_label),
    issue = COALESCE(p_issue, issue),
    identification = COALESCE(p_identification, identification),
    price_estimate = COALESCE(p_price_estimate, price_estimate),
    turnaround = COALESCE(p_turnaround, turnaround),
    needs_diagnostic = COALESCE(p_needs_diagnostic, needs_diagnostic),
    scene = COALESCE(p_scene, scene),
    messages = CASE 
      WHEN p_message IS NOT NULL THEN messages || p_message
      ELSE messages
    END
  WHERE session_id = p_session_id
  RETURNING * INTO v_session;
  
  RETURN v_session;
END;
$$ LANGUAGE plpgsql;

-- Record session outcome
CREATE OR REPLACE FUNCTION complete_repair_session(
  p_session_id TEXT,
  p_outcome TEXT,
  p_customer_name TEXT DEFAULT NULL,
  p_customer_phone TEXT DEFAULT NULL,
  p_customer_email TEXT DEFAULT NULL
)
RETURNS repair_flow_sessions AS $$
DECLARE
  v_session repair_flow_sessions;
BEGIN
  UPDATE repair_flow_sessions
  SET
    outcome = p_outcome,
    outcome_at = NOW(),
    customer_name = COALESCE(p_customer_name, customer_name),
    customer_phone = COALESCE(p_customer_phone, customer_phone),
    customer_email = COALESCE(p_customer_email, customer_email)
  WHERE session_id = p_session_id
  RETURNING * INTO v_session;
  
  RETURN v_session;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ANALYTICS VIEW
-- ============================================

CREATE OR REPLACE VIEW repair_flow_analytics AS
SELECT
  DATE_TRUNC('day', created_at) AS date,
  device_type,
  issue,
  outcome,
  COUNT(*) AS session_count,
  COUNT(*) FILTER (WHERE outcome = 'booked') AS booked_count,
  COUNT(*) FILTER (WHERE outcome = 'called') AS called_count,
  COUNT(*) FILTER (WHERE outcome = 'abandoned') AS abandoned_count,
  AVG(EXTRACT(EPOCH FROM (COALESCE(outcome_at, last_activity_at) - created_at))) AS avg_duration_seconds
FROM repair_flow_sessions
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), device_type, issue, outcome
ORDER BY date DESC;

-- ============================================
-- CLEANUP FUNCTION (run via cron)
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_expired_repair_sessions()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM repair_flow_sessions
  WHERE expires_at < NOW()
    AND outcome IS NULL;  -- Keep completed sessions for analytics
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE repair_flow_sessions ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access to repair_flow_sessions"
  ON repair_flow_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can view analytics
CREATE POLICY "Authenticated users can view repair_flow_sessions"
  ON repair_flow_sessions
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT ALL ON repair_flow_sessions TO service_role;
GRANT SELECT ON repair_flow_sessions TO authenticated;
GRANT SELECT ON repair_flow_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_repair_session TO service_role;
GRANT EXECUTE ON FUNCTION update_repair_session TO service_role;
GRANT EXECUTE ON FUNCTION complete_repair_session TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_repair_sessions TO service_role;
