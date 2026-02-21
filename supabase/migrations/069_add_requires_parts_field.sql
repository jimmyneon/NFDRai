-- Add requires_parts_order field to track when parts need to be ordered

ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS requires_parts_order BOOLEAN DEFAULT FALSE;

-- Add index for filtering quotes that need parts
CREATE INDEX IF NOT EXISTS idx_quote_requests_requires_parts 
  ON public.quote_requests(requires_parts_order) 
  WHERE requires_parts_order = true;

-- Add comment
COMMENT ON COLUMN public.quote_requests.requires_parts_order IS 'Indicates if parts need to be ordered for this repair (normally next day delivery excluding weekends)';
