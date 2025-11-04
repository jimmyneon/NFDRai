-- API Logs Table
-- Track all API calls for debugging and monitoring

CREATE TABLE IF NOT EXISTS public.api_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  request_body JSONB,
  response_body JSONB,
  error TEXT,
  ip_address TEXT,
  user_agent TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_api_logs_endpoint ON public.api_logs(endpoint);
CREATE INDEX idx_api_logs_created_at ON public.api_logs(created_at DESC);
CREATE INDEX idx_api_logs_status_code ON public.api_logs(status_code);

-- RLS Policies
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;

-- Admin can view all logs
CREATE POLICY "Admin can view api_logs"
  ON public.api_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- System can insert logs
CREATE POLICY "System can insert api_logs"
  ON public.api_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to clean old logs (keep last 30 days)
CREATE OR REPLACE FUNCTION clean_old_api_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.api_logs
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add message_type to messages table for better categorization
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'normal'
CHECK (message_type IN ('normal', 'missed_call', 'auto_reply', 'manual_reply', 'system'));

-- Update existing messages
UPDATE public.messages
SET message_type = CASE
  WHEN sender = 'system' THEN 'system'
  WHEN sender = 'staff' THEN 'manual_reply'
  WHEN sender = 'ai' AND ai_model = 'missed-call-template' THEN 'missed_call'
  WHEN sender = 'ai' THEN 'auto_reply'
  ELSE 'normal'
END
WHERE message_type = 'normal';
