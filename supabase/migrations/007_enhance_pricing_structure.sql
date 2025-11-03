-- Enhance prices table with device types and better categorization
-- This helps AI find prices faster and more accurately

-- Add device_type column for better categorization
ALTER TABLE public.prices 
ADD COLUMN IF NOT EXISTS device_type TEXT;

-- Add brand column for filtering
ALTER TABLE public.prices 
ADD COLUMN IF NOT EXISTS brand TEXT;

-- Add model_series column for grouping (e.g., "iPhone 14", "Galaxy S23")
ALTER TABLE public.prices 
ADD COLUMN IF NOT EXISTS model_series TEXT;

-- Add tags for flexible searching
ALTER TABLE public.prices 
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Add active status
ALTER TABLE public.prices 
ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- Add priority for featured repairs
ALTER TABLE public.prices 
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;

-- Create indexes for faster AI queries
CREATE INDEX IF NOT EXISTS idx_prices_device_type ON public.prices(device_type);
CREATE INDEX IF NOT EXISTS idx_prices_brand ON public.prices(brand);
CREATE INDEX IF NOT EXISTS idx_prices_model_series ON public.prices(model_series);
CREATE INDEX IF NOT EXISTS idx_prices_active ON public.prices(active);
CREATE INDEX IF NOT EXISTS idx_prices_tags ON public.prices USING gin(tags);

-- Full-text search index for device names
CREATE INDEX IF NOT EXISTS idx_prices_device_search 
ON public.prices USING gin(to_tsvector('english', device || ' ' || COALESCE(brand, '') || ' ' || COALESCE(model_series, '')));

-- Update existing data with device types based on device names
UPDATE public.prices 
SET device_type = CASE
  WHEN LOWER(device) LIKE '%iphone%' THEN 'phone'
  WHEN LOWER(device) LIKE '%ipad%' THEN 'tablet'
  WHEN LOWER(device) LIKE '%macbook%' THEN 'laptop'
  WHEN LOWER(device) LIKE '%imac%' THEN 'desktop'
  WHEN LOWER(device) LIKE '%samsung%' AND LOWER(device) LIKE '%galaxy%' AND LOWER(device) NOT LIKE '%tab%' THEN 'phone'
  WHEN LOWER(device) LIKE '%samsung%' AND LOWER(device) LIKE '%tab%' THEN 'tablet'
  WHEN LOWER(device) LIKE '%laptop%' THEN 'laptop'
  WHEN LOWER(device) LIKE '%phone%' THEN 'phone'
  WHEN LOWER(device) LIKE '%tablet%' THEN 'tablet'
  WHEN LOWER(device) LIKE '%watch%' THEN 'watch'
  WHEN LOWER(device) LIKE '%airpods%' OR LOWER(device) LIKE '%earbuds%' THEN 'audio'
  WHEN LOWER(device) LIKE '%console%' OR LOWER(device) LIKE '%playstation%' OR LOWER(device) LIKE '%xbox%' THEN 'gaming'
  ELSE 'other'
END
WHERE device_type IS NULL;

-- Update brand information
UPDATE public.prices 
SET brand = CASE
  WHEN LOWER(device) LIKE '%iphone%' OR LOWER(device) LIKE '%ipad%' OR LOWER(device) LIKE '%macbook%' OR LOWER(device) LIKE '%imac%' OR LOWER(device) LIKE '%apple%' THEN 'Apple'
  WHEN LOWER(device) LIKE '%samsung%' THEN 'Samsung'
  WHEN LOWER(device) LIKE '%google%' OR LOWER(device) LIKE '%pixel%' THEN 'Google'
  WHEN LOWER(device) LIKE '%huawei%' THEN 'Huawei'
  WHEN LOWER(device) LIKE '%oneplus%' THEN 'OnePlus'
  WHEN LOWER(device) LIKE '%xiaomi%' THEN 'Xiaomi'
  WHEN LOWER(device) LIKE '%sony%' THEN 'Sony'
  WHEN LOWER(device) LIKE '%lg%' THEN 'LG'
  WHEN LOWER(device) LIKE '%motorola%' THEN 'Motorola'
  WHEN LOWER(device) LIKE '%nokia%' THEN 'Nokia'
  WHEN LOWER(device) LIKE '%oppo%' THEN 'Oppo'
  WHEN LOWER(device) LIKE '%vivo%' THEN 'Vivo'
  WHEN LOWER(device) LIKE '%playstation%' THEN 'Sony'
  WHEN LOWER(device) LIKE '%xbox%' THEN 'Microsoft'
  WHEN LOWER(device) LIKE '%nintendo%' THEN 'Nintendo'
  ELSE NULL
END
WHERE brand IS NULL;

-- Add helpful tags
UPDATE public.prices 
SET tags = ARRAY[
  device_type,
  brand,
  CASE 
    WHEN LOWER(repair_type) LIKE '%screen%' THEN 'screen'
    WHEN LOWER(repair_type) LIKE '%battery%' THEN 'battery'
    WHEN LOWER(repair_type) LIKE '%charging%' OR LOWER(repair_type) LIKE '%port%' THEN 'charging'
    WHEN LOWER(repair_type) LIKE '%camera%' THEN 'camera'
    WHEN LOWER(repair_type) LIKE '%speaker%' OR LOWER(repair_type) LIKE '%audio%' THEN 'audio'
    WHEN LOWER(repair_type) LIKE '%button%' THEN 'button'
    WHEN LOWER(repair_type) LIKE '%water%' OR LOWER(repair_type) LIKE '%liquid%' THEN 'water-damage'
    ELSE 'other'
  END
]::TEXT[]
WHERE tags IS NULL;

-- Create view for AI-friendly price queries
CREATE OR REPLACE VIEW prices_search AS
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
  active,
  priority,
  created_at,
  -- Searchable text for AI
  device || ' ' || 
  COALESCE(brand, '') || ' ' || 
  COALESCE(model_series, '') || ' ' || 
  repair_type || ' ' || 
  COALESCE(turnaround, '') AS search_text,
  -- Formatted price for display
  '£' || cost::TEXT AS formatted_price,
  -- Is this price still valid?
  (expiry IS NULL OR expiry > NOW()) AS is_valid
FROM public.prices
WHERE active = true
ORDER BY priority DESC, device_type, brand, device;

-- Add comment
COMMENT ON COLUMN public.prices.device_type IS 'Type of device: phone, tablet, laptop, desktop, watch, audio, gaming, other';
COMMENT ON COLUMN public.prices.brand IS 'Device brand: Apple, Samsung, Google, etc.';
COMMENT ON COLUMN public.prices.model_series IS 'Model series for grouping: iPhone 14, Galaxy S23, etc.';
COMMENT ON COLUMN public.prices.tags IS 'Searchable tags for AI queries';
COMMENT ON COLUMN public.prices.priority IS 'Display priority (higher = show first)';
COMMENT ON VIEW prices_search IS 'AI-optimized view for price lookups with full-text search';

-- Insert sample data for different device types
INSERT INTO public.prices (device, device_type, brand, model_series, repair_type, cost, turnaround, tags, priority, active) VALUES
  -- Phones
  ('iPhone 14 Pro Max', 'phone', 'Apple', 'iPhone 14', 'Screen Replacement', 349.99, 'Same Day', ARRAY['phone', 'Apple', 'screen'], 10, true),
  ('iPhone 14 Pro', 'phone', 'Apple', 'iPhone 14', 'Screen Replacement', 329.99, 'Same Day', ARRAY['phone', 'Apple', 'screen'], 10, true),
  ('iPhone 14', 'phone', 'Apple', 'iPhone 14', 'Screen Replacement', 279.99, 'Same Day', ARRAY['phone', 'Apple', 'screen'], 10, true),
  ('iPhone 13', 'phone', 'Apple', 'iPhone 13', 'Screen Replacement', 249.99, 'Same Day', ARRAY['phone', 'Apple', 'screen'], 9, true),
  ('Samsung Galaxy S23', 'phone', 'Samsung', 'Galaxy S23', 'Screen Replacement', 299.99, '1-2 Days', ARRAY['phone', 'Samsung', 'screen'], 9, true),
  ('Google Pixel 7', 'phone', 'Google', 'Pixel 7', 'Screen Replacement', 249.99, '2-3 Days', ARRAY['phone', 'Google', 'screen'], 8, true),
  
  -- Tablets
  ('iPad Pro 12.9"', 'tablet', 'Apple', 'iPad Pro', 'Screen Replacement', 499.99, '2-3 Days', ARRAY['tablet', 'Apple', 'screen'], 8, true),
  ('iPad Air', 'tablet', 'Apple', 'iPad Air', 'Screen Replacement', 349.99, '2-3 Days', ARRAY['tablet', 'Apple', 'screen'], 8, true),
  ('Samsung Galaxy Tab S8', 'tablet', 'Samsung', 'Galaxy Tab', 'Screen Replacement', 399.99, '3-5 Days', ARRAY['tablet', 'Samsung', 'screen'], 7, true),
  
  -- Laptops
  ('MacBook Pro 16"', 'laptop', 'Apple', 'MacBook Pro', 'Screen Replacement', 899.99, '5-7 Days', ARRAY['laptop', 'Apple', 'screen'], 7, true),
  ('MacBook Air M2', 'laptop', 'Apple', 'MacBook Air', 'Screen Replacement', 699.99, '5-7 Days', ARRAY['laptop', 'Apple', 'screen'], 7, true),
  ('MacBook Pro 14"', 'laptop', 'Apple', 'MacBook Pro', 'Battery Replacement', 299.99, '3-5 Days', ARRAY['laptop', 'Apple', 'battery'], 6, true),
  
  -- Watches
  ('Apple Watch Series 8', 'watch', 'Apple', 'Apple Watch', 'Screen Replacement', 199.99, '3-5 Days', ARRAY['watch', 'Apple', 'screen'], 6, true),
  ('Apple Watch SE', 'watch', 'Apple', 'Apple Watch', 'Screen Replacement', 149.99, '3-5 Days', ARRAY['watch', 'Apple', 'screen'], 6, true),
  
  -- Audio
  ('AirPods Pro 2', 'audio', 'Apple', 'AirPods', 'Battery Replacement', 79.99, '5-7 Days', ARRAY['audio', 'Apple', 'battery'], 5, true),
  ('AirPods Max', 'audio', 'Apple', 'AirPods', 'Cushion Replacement', 49.99, '1-2 Days', ARRAY['audio', 'Apple', 'other'], 5, true)
ON CONFLICT DO NOTHING;

-- Create function for AI to search prices
CREATE OR REPLACE FUNCTION search_prices(
  search_query TEXT,
  device_type_filter TEXT DEFAULT NULL,
  brand_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  device TEXT,
  device_type TEXT,
  brand TEXT,
  repair_type TEXT,
  cost DECIMAL,
  formatted_price TEXT,
  turnaround TEXT,
  is_valid BOOLEAN,
  relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.device,
    p.device_type,
    p.brand,
    p.repair_type,
    p.cost,
    p.formatted_price,
    p.turnaround,
    p.is_valid,
    ts_rank(
      to_tsvector('english', p.search_text),
      plainto_tsquery('english', search_query)
    ) AS relevance
  FROM prices_search p
  WHERE 
    (device_type_filter IS NULL OR p.device_type = device_type_filter)
    AND (brand_filter IS NULL OR p.brand = brand_filter)
    AND p.is_valid = true
    AND to_tsvector('english', p.search_text) @@ plainto_tsquery('english', search_query)
  ORDER BY relevance DESC, p.priority DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT * FROM search_prices('iPhone 14 screen');
-- SELECT * FROM search_prices('laptop battery', 'laptop', 'Apple');
-- SELECT * FROM search_prices('Samsung phone screen', 'phone');

COMMENT ON FUNCTION search_prices IS 'AI-optimized full-text search for prices with optional filters';
