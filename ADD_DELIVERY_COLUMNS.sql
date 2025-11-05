-- Run this in Supabase SQL Editor to add delivery tracking columns

ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS delivered BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_messages_delivered ON public.messages(delivered);

-- Verify it worked
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name IN ('delivered', 'delivered_at');
