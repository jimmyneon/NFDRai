-- Add support for additional issues in quote requests
-- This allows website forms to send multiple repairs in one quote request

-- Add new columns to quote_requests table
ALTER TABLE public.quote_requests 
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS additional_issues JSONB DEFAULT '[]'::jsonb;

-- Add index for JSONB queries on additional_issues
CREATE INDEX IF NOT EXISTS idx_quote_requests_additional_issues 
  ON public.quote_requests USING gin(additional_issues);

-- Add comments for documentation
COMMENT ON COLUMN public.quote_requests.description IS 'Detailed description of the main issue';
COMMENT ON COLUMN public.quote_requests.additional_issues IS 'Array of additional repairs: [{issue: string, description: string}]';

-- Example data structure for additional_issues:
-- [
--   {"issue": "Battery replacement", "description": "Battery health at 78%, drains quickly"},
--   {"issue": "Back glass repair", "description": "Small crack on back glass near camera"}
-- ]
