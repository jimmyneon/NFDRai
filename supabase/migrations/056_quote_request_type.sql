-- Add type to quote_requests to distinguish repair quotes vs device sell/buyback enquiries

ALTER TABLE public.quote_requests
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'repair'
CHECK (type IN ('repair', 'sell'));

CREATE INDEX IF NOT EXISTS idx_quote_requests_type ON public.quote_requests(type);

COMMENT ON COLUMN public.quote_requests.type IS 'Quote request type: repair (default) or sell (customer selling device to us)';
