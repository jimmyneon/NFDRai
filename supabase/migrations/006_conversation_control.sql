-- Add conversation control and staff activity tracking
-- This prevents AI from interfering after manual intervention

-- Add automation_enabled to ai_settings if not exists
ALTER TABLE public.ai_settings 
ADD COLUMN IF NOT EXISTS automation_enabled BOOLEAN NOT NULL DEFAULT true;

-- Add last_staff_activity to conversations
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS last_staff_activity TIMESTAMPTZ;

-- Add assigned_to for conversation assignment
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.users(id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_to ON public.conversations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_conversations_last_staff_activity ON public.conversations(last_staff_activity);

-- Function to update last_staff_activity when staff sends a message
CREATE OR REPLACE FUNCTION update_last_staff_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sender = 'staff' THEN
    UPDATE public.conversations
    SET last_staff_activity = NEW.created_at
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update last_staff_activity
DROP TRIGGER IF EXISTS trigger_update_last_staff_activity ON public.messages;
CREATE TRIGGER trigger_update_last_staff_activity
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_last_staff_activity();

-- Add comment
COMMENT ON COLUMN public.conversations.last_staff_activity IS 'Timestamp of last staff message - used to prevent AI from interfering after manual intervention';
COMMENT ON COLUMN public.conversations.assigned_to IS 'Staff member assigned to this conversation';
COMMENT ON COLUMN public.ai_settings.automation_enabled IS 'Global kill switch for AI automation';

-- Update existing ai_settings to have automation_enabled
UPDATE public.ai_settings 
SET automation_enabled = true 
WHERE automation_enabled IS NULL;
