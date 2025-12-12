-- Store originating page for quote requests (useful for multiple public forms)

ALTER TABLE public.quote_requests
ADD COLUMN IF NOT EXISTS page TEXT;

CREATE INDEX IF NOT EXISTS idx_quote_requests_page ON public.quote_requests(page);

COMMENT ON COLUMN public.quote_requests.page IS 'Originating page path/URL for the quote request (e.g. /sell-your-device/)';
