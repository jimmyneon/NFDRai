-- Human Control Window System
-- Prevents AI from interfering when John is actively handling a conversation

-- Add new columns to conversations table
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS ai_muted_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ai_mute_reason TEXT,
ADD COLUMN IF NOT EXISTS last_ai_response_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS human_control_active BOOLEAN DEFAULT false;

-- Add new enum for AI control mode
DO $$ BEGIN
  CREATE TYPE ai_control_mode AS ENUM ('auto', 'human_control', 'permanently_muted', 'safe_faq_only');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add control mode column
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS ai_control_mode ai_control_mode DEFAULT 'auto';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_conversations_ai_muted_until ON public.conversations(ai_muted_until);
CREATE INDEX IF NOT EXISTS idx_conversations_ai_control_mode ON public.conversations(ai_control_mode);
CREATE INDEX IF NOT EXISTS idx_conversations_last_ai_response ON public.conversations(last_ai_response_at);

-- Function to activate Human Control Window when staff sends message
CREATE OR REPLACE FUNCTION activate_human_control_window()
RETURNS TRIGGER AS $$
DECLARE
  control_window_hours INTEGER := 2; -- Configurable: 2-4 hours
BEGIN
  IF NEW.sender = 'staff' THEN
    UPDATE public.conversations
    SET 
      human_control_active = true,
      ai_muted_until = NOW() + (control_window_hours || ' hours')::INTERVAL,
      ai_mute_reason = 'Human Control Window - staff is handling conversation',
      ai_control_mode = 'human_control'
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to activate Human Control Window
DROP TRIGGER IF EXISTS trigger_activate_human_control ON public.messages;
CREATE TRIGGER trigger_activate_human_control
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION activate_human_control_window();

-- Function to track AI responses (for single-shot behavior)
CREATE OR REPLACE FUNCTION track_ai_response()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sender = 'ai' THEN
    UPDATE public.conversations
    SET last_ai_response_at = NEW.created_at
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to track AI responses
DROP TRIGGER IF EXISTS trigger_track_ai_response ON public.messages;
CREATE TRIGGER trigger_track_ai_response
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION track_ai_response();

-- Add comments
COMMENT ON COLUMN public.conversations.ai_muted_until IS 'AI will not respond until this timestamp (Human Control Window)';
COMMENT ON COLUMN public.conversations.ai_mute_reason IS 'Reason why AI is muted';
COMMENT ON COLUMN public.conversations.last_ai_response_at IS 'Timestamp of last AI response (for single-shot behavior)';
COMMENT ON COLUMN public.conversations.human_control_active IS 'Whether Human Control Window is currently active';
COMMENT ON COLUMN public.conversations.ai_control_mode IS 'AI control mode: auto, human_control, permanently_muted, safe_faq_only';

-- Create view for conversations needing human attention
CREATE OR REPLACE VIEW conversations_in_human_control AS
SELECT 
  c.*,
  cu.name as customer_name,
  cu.phone as customer_phone,
  EXTRACT(EPOCH FROM (c.ai_muted_until - NOW())) / 3600 AS hours_remaining
FROM public.conversations c
JOIN public.customers cu ON c.customer_id = cu.id
WHERE c.human_control_active = true 
  AND c.ai_muted_until > NOW()
ORDER BY c.ai_muted_until ASC;

COMMENT ON VIEW conversations_in_human_control IS 'Conversations currently in Human Control Window where AI is muted';
