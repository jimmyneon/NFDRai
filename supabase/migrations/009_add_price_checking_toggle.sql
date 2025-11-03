-- Add global toggle to enable/disable price checking
-- This allows you to turn off price quotes until you're confident they're correct

-- Add price_checking_enabled to ai_settings
ALTER TABLE public.ai_settings 
ADD COLUMN IF NOT EXISTS price_checking_enabled BOOLEAN NOT NULL DEFAULT true;

-- Add comment
COMMENT ON COLUMN public.ai_settings.price_checking_enabled IS 'Whether AI should quote prices from the database. Disable until prices are verified.';

-- Set default to false for safety (you enable it when ready)
UPDATE public.ai_settings 
SET price_checking_enabled = false 
WHERE price_checking_enabled = true;

-- Create function to toggle price checking
CREATE OR REPLACE FUNCTION toggle_price_checking(enabled BOOLEAN)
RETURNS BOOLEAN AS $$
DECLARE
  result BOOLEAN;
BEGIN
  UPDATE public.ai_settings 
  SET price_checking_enabled = enabled,
      updated_at = NOW()
  WHERE active = true
  RETURNING price_checking_enabled INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION toggle_price_checking IS 'Enable or disable AI price checking globally';

-- Create view to check if price checking is enabled
CREATE OR REPLACE VIEW price_checking_status AS
SELECT 
  price_checking_enabled,
  CASE 
    WHEN price_checking_enabled THEN 'AI will quote prices from database'
    ELSE 'AI will NOT quote prices - prices are being verified'
  END as status_message,
  updated_at as last_changed
FROM public.ai_settings
WHERE active = true
LIMIT 1;

COMMENT ON VIEW price_checking_status IS 'Quick view to check if price checking is enabled';

-- Example usage:
-- SELECT toggle_price_checking(false);  -- Disable price checking
-- SELECT toggle_price_checking(true);   -- Enable price checking
-- SELECT * FROM price_checking_status;  -- Check current status
