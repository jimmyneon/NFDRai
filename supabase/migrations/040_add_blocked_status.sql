-- Add 'blocked' status to conversations
-- Allows permanently blocking AI from responding to specific conversations

-- Update the status column to allow 'blocked' value
-- Current values: 'auto', 'manual', 'closed'
-- New value: 'blocked'

COMMENT ON COLUMN public.conversations.status IS 'Conversation status: auto (AI responds), manual (staff only), blocked (AI permanently disabled), closed (archived)';

-- Add index for blocked conversations
CREATE INDEX IF NOT EXISTS idx_conversations_blocked ON public.conversations(status) WHERE status = 'blocked';

-- Note: The status column already exists as TEXT, so 'blocked' can be used immediately
-- No ALTER TABLE needed - just documentation and index
