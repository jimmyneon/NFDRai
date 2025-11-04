-- Run this in Supabase SQL Editor to create the api_logs table

-- API Logs Table
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
CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint ON public.api_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON public.api_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_status_code ON public.api_logs(status_code);

-- Disable RLS for simplicity (single-user app)
ALTER TABLE public.api_logs DISABLE ROW LEVEL SECURITY;

-- Verify it worked
SELECT COUNT(*) as table_exists FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'api_logs';
