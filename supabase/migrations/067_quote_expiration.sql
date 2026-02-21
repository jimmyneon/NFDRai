-- Add quote expiration functionality
-- Quotes expire 7 days after being sent to customer

-- Add expires_at column to track when quote expires
ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Create function to calculate expiration date (7 days after quote sent)
CREATE OR REPLACE FUNCTION calculate_quote_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- When quote is sent (quoted_at is set), calculate expiration
  IF NEW.quoted_at IS NOT NULL AND OLD.quoted_at IS NULL THEN
    NEW.expires_at := NEW.quoted_at + INTERVAL '7 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-set expiration date
DROP TRIGGER IF EXISTS set_quote_expiration ON public.quote_requests;
CREATE TRIGGER set_quote_expiration
  BEFORE UPDATE ON public.quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION calculate_quote_expiration();

-- Create function to expire old quotes
CREATE OR REPLACE FUNCTION expire_old_quotes()
RETURNS void AS $$
BEGIN
  UPDATE public.quote_requests
  SET status = 'expired'
  WHERE status = 'quoted'
    AND expires_at IS NOT NULL
    AND expires_at < NOW()
    AND status != 'accepted'
    AND status != 'completed';
END;
$$ LANGUAGE plpgsql;

-- Add 'expired' to status check constraint
ALTER TABLE public.quote_requests
  DROP CONSTRAINT IF EXISTS quote_requests_status_check;

ALTER TABLE public.quote_requests
  ADD CONSTRAINT quote_requests_status_check
  CHECK (status IN ('pending', 'quoted', 'accepted', 'declined', 'completed', 'expired'));

-- Create index for expiration queries
CREATE INDEX IF NOT EXISTS idx_quote_requests_expires_at 
  ON public.quote_requests(expires_at) 
  WHERE status = 'quoted';

-- Add comment
COMMENT ON COLUMN public.quote_requests.expires_at IS 'Quote expiration date (7 days after quoted_at)';
COMMENT ON FUNCTION expire_old_quotes() IS 'Marks quotes as expired if they are older than 7 days and still in quoted status';

-- Backfill expires_at for existing quotes
UPDATE public.quote_requests
SET expires_at = quoted_at + INTERVAL '7 days'
WHERE quoted_at IS NOT NULL
  AND expires_at IS NULL;
