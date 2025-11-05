-- Add delivery tracking columns to messages table
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS delivered BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Add index for faster delivery status queries
CREATE INDEX IF NOT EXISTS idx_messages_delivered ON public.messages(delivered);

-- Add comment
COMMENT ON COLUMN public.messages.delivered IS 'Whether the message was confirmed as delivered by MacroDroid';
COMMENT ON COLUMN public.messages.delivered_at IS 'Timestamp when delivery was confirmed';
