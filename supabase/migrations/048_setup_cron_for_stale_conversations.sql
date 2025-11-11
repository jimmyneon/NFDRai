-- Migration: Setup pg_cron for resetting stale conversations
-- Purpose: Replace Vercel cron with Supabase pg_cron (free on all plans)
-- Runs every 5 minutes to reset manual conversations to auto mode

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Create function to reset stale conversations
CREATE OR REPLACE FUNCTION reset_stale_manual_conversations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Reset conversations that have been in manual mode for 30+ minutes
  -- with no staff reply, or staff replied 30+ minutes ago
  WITH stale_conversations AS (
    SELECT DISTINCT c.id
    FROM conversations c
    WHERE c.status = 'manual'
    AND c.updated_at < NOW() - INTERVAL '30 minutes'
    AND NOT EXISTS (
      SELECT 1 
      FROM messages m 
      WHERE m.conversation_id = c.id 
      AND m.sender = 'staff'
      AND m.created_at > NOW() - INTERVAL '30 minutes'
    )
  )
  UPDATE conversations
  SET 
    status = 'auto',
    updated_at = NOW()
  FROM stale_conversations
  WHERE conversations.id = stale_conversations.id;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Log the result
  RAISE NOTICE 'Reset % stale conversations from manual to auto mode', updated_count;
END;
$$;

-- Schedule the cron job to run every 5 minutes
SELECT cron.schedule(
  'reset-stale-conversations',  -- job name
  '*/5 * * * *',                -- every 5 minutes
  $$SELECT reset_stale_manual_conversations()$$
);

-- Verify cron job was created
SELECT * FROM cron.job WHERE jobname = 'reset-stale-conversations';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION reset_stale_manual_conversations() TO postgres;

-- Add comment
COMMENT ON FUNCTION reset_stale_manual_conversations() IS 'Resets conversations stuck in manual mode back to auto mode after 30 minutes of inactivity. Runs every 5 minutes via pg_cron.';
