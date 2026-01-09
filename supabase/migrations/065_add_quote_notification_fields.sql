-- Add fields to track repair request notifications and quote URLs
ALTER TABLE public.quote_requests
ADD COLUMN IF NOT EXISTS notification_url TEXT,
ADD COLUMN IF NOT EXISTS notification_received_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS quote_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS quote_sent_by UUID REFERENCES public.users(id);

COMMENT ON COLUMN public.quote_requests.notification_url IS 'URL received from MacroDroid notification';
COMMENT ON COLUMN public.quote_requests.notification_received_at IS 'When the notification was received';
COMMENT ON COLUMN public.quote_requests.quote_sent_at IS 'When the quote SMS was sent';
COMMENT ON COLUMN public.quote_requests.quote_sent_by IS 'User who sent the quote';
