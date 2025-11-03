-- Add active/enabled toggles to prices, faqs, and docs tables
-- This allows hiding items without deleting them

-- Add active column to FAQs (if not exists)
ALTER TABLE public.faqs 
ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- Add active column to docs (if not exists)
ALTER TABLE public.docs 
ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- Note: prices table already has active column from migration 007

-- Create indexes for faster filtering
CREATE INDEX IF NOT EXISTS idx_faqs_active ON public.faqs(active);
CREATE INDEX IF NOT EXISTS idx_docs_active ON public.docs(active);

-- Add comments
COMMENT ON COLUMN public.faqs.active IS 'Whether this FAQ is visible to AI and users';
COMMENT ON COLUMN public.docs.active IS 'Whether this document is visible to AI and users';

-- Create views for active items only (AI-friendly)
CREATE OR REPLACE VIEW active_faqs AS
SELECT 
  id,
  question,
  answer,
  created_at,
  updated_at
FROM public.faqs
WHERE active = true
ORDER BY created_at DESC;

CREATE OR REPLACE VIEW active_docs AS
SELECT 
  id,
  title,
  content,
  version,
  created_at
FROM public.docs
WHERE active = true
ORDER BY created_at DESC;

CREATE OR REPLACE VIEW active_prices AS
SELECT 
  id,
  device,
  device_type,
  brand,
  model_series,
  repair_type,
  cost,
  turnaround,
  expiry,
  tags,
  priority,
  created_at,
  updated_at
FROM public.prices
WHERE active = true
  AND (expiry IS NULL OR expiry > NOW())
ORDER BY priority DESC, device_type, brand, device;

-- Add comments to views
COMMENT ON VIEW active_faqs IS 'Only active FAQs visible to AI';
COMMENT ON VIEW active_docs IS 'Only active documents visible to AI';
COMMENT ON VIEW active_prices IS 'Only active and non-expired prices visible to AI';

-- Create function to toggle item status
CREATE OR REPLACE FUNCTION toggle_item_status(
  table_name TEXT,
  item_id UUID,
  new_status BOOLEAN
)
RETURNS BOOLEAN AS $$
DECLARE
  result BOOLEAN;
BEGIN
  -- Validate table name to prevent SQL injection
  IF table_name NOT IN ('prices', 'faqs', 'docs') THEN
    RAISE EXCEPTION 'Invalid table name: %', table_name;
  END IF;

  -- Update the item
  EXECUTE format(
    'UPDATE public.%I SET active = $1, updated_at = NOW() WHERE id = $2 RETURNING active',
    table_name
  ) USING new_status, item_id INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to bulk toggle items
CREATE OR REPLACE FUNCTION bulk_toggle_items(
  table_name TEXT,
  item_ids UUID[],
  new_status BOOLEAN
)
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  -- Validate table name
  IF table_name NOT IN ('prices', 'faqs', 'docs') THEN
    RAISE EXCEPTION 'Invalid table name: %', table_name;
  END IF;

  -- Update the items
  EXECUTE format(
    'UPDATE public.%I SET active = $1, updated_at = NOW() WHERE id = ANY($2)',
    table_name
  ) USING new_status, item_ids;

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON FUNCTION toggle_item_status IS 'Toggle active status for a single item in prices, faqs, or docs';
COMMENT ON FUNCTION bulk_toggle_items IS 'Toggle active status for multiple items at once';

-- Example usage:
-- SELECT toggle_item_status('prices', 'uuid-here', false);  -- Disable a price
-- SELECT toggle_item_status('faqs', 'uuid-here', true);     -- Enable a FAQ
-- SELECT bulk_toggle_items('docs', ARRAY['uuid1', 'uuid2'], false);  -- Disable multiple docs
