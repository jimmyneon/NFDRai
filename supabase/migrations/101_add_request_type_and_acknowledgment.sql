-- Add request_type to distinguish between quote, technical support, and don't know requests
-- Add acknowledgment tracking to prevent duplicate messages

ALTER TABLE public.quote_requests
ADD COLUMN request_type TEXT NOT NULL DEFAULT 'quote' CHECK (request_type IN ('quote', 'technical_support', 'dont_know'));

CREATE INDEX IF NOT EXISTS idx_quote_requests_request_type ON public.quote_requests(request_type);

COMMENT ON COLUMN public.quote_requests.request_type IS 'Type of request: quote (default), technical_support, or dont_know';

-- Add acknowledgment tracking to prevent duplicate messages
ALTER TABLE public.quote_requests
ADD COLUMN acknowledgment_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN acknowledgment_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN public.quote_requests.acknowledgment_sent IS 'Whether acknowledgment SMS has been sent to customer';
COMMENT ON COLUMN public.quote_requests.acknowledgment_sent_at IS 'When acknowledgment SMS was sent';
