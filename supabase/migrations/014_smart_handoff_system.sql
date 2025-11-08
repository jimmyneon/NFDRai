-- Smart Handoff System: Tiered pricing, customer history, and smart upselling

-- 1. Add confidence levels to prices table
ALTER TABLE prices ADD COLUMN IF NOT EXISTS confidence_level TEXT DEFAULT 'standard';
ALTER TABLE prices ADD COLUMN IF NOT EXISTS price_range_min NUMERIC(10,2);
ALTER TABLE prices ADD COLUMN IF NOT EXISTS price_range_max NUMERIC(10,2);
ALTER TABLE prices ADD COLUMN IF NOT EXISTS requires_assessment BOOLEAN DEFAULT false;

COMMENT ON COLUMN prices.confidence_level IS 'standard = Steve quotes confidently, estimated = Steve gives range, quote_required = Steve hands off to John';
COMMENT ON COLUMN prices.requires_assessment IS 'True if device needs to be seen before quoting (e.g., water damage, complex repairs)';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_prices_confidence ON prices(confidence_level);

-- 2. Create customer history table
CREATE TABLE IF NOT EXISTS customer_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT NOT NULL,
  name TEXT,
  email TEXT,
  
  -- History tracking
  first_contact TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_contact TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_conversations INTEGER DEFAULT 1,
  total_repairs INTEGER DEFAULT 0,
  
  -- Preferences
  preferred_contact_method TEXT, -- 'sms', 'whatsapp', 'messenger'
  notes TEXT,
  
  -- Device history
  devices_owned JSONB DEFAULT '[]'::jsonb, -- Array of devices they've mentioned
  
  -- Relationship
  customer_type TEXT DEFAULT 'new', -- 'new', 'returning', 'regular', 'vip'
  lifetime_value NUMERIC(10,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_customer_history_phone ON customer_history(phone);
CREATE INDEX idx_customer_history_type ON customer_history(customer_type);
CREATE INDEX idx_customer_history_last_contact ON customer_history(last_contact);

-- Create trigger for updated_at
CREATE TRIGGER update_customer_history_updated_at 
  BEFORE UPDATE ON customer_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS policies
ALTER TABLE customer_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view customer history" ON customer_history
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage customer history" ON customer_history
  FOR ALL USING (auth.role() = 'service_role');

-- 3. Create device age reference table (for smart upselling)
CREATE TABLE IF NOT EXISTS device_age_reference (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_model TEXT NOT NULL UNIQUE,
  release_year INTEGER NOT NULL,
  typical_battery_life_years INTEGER DEFAULT 2,
  recommend_battery_replacement BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_device_age_model ON device_age_reference(device_model);

-- Insert common iPhone models with release years
INSERT INTO device_age_reference (device_model, release_year, typical_battery_life_years, recommend_battery_replacement) VALUES
('iPhone 6', 2014, 2, true),
('iPhone 6 Plus', 2014, 2, true),
('iPhone 6s', 2015, 2, true),
('iPhone 6s Plus', 2015, 2, true),
('iPhone 7', 2016, 2, true),
('iPhone 7 Plus', 2016, 2, true),
('iPhone 8', 2017, 2, true),
('iPhone 8 Plus', 2017, 2, true),
('iPhone X', 2017, 2, true),
('iPhone XR', 2018, 2, true),
('iPhone XS', 2018, 2, true),
('iPhone XS Max', 2018, 2, true),
('iPhone 11', 2019, 2, true),
('iPhone 11 Pro', 2019, 2, true),
('iPhone 11 Pro Max', 2019, 2, true),
('iPhone SE (2nd gen)', 2020, 2, false),
('iPhone 12', 2020, 2, false),
('iPhone 12 Mini', 2020, 2, false),
('iPhone 12 Pro', 2020, 2, false),
('iPhone 12 Pro Max', 2020, 2, false),
('iPhone 13', 2021, 2, false),
('iPhone 13 Mini', 2021, 2, false),
('iPhone 13 Pro', 2021, 2, false),
('iPhone 13 Pro Max', 2021, 2, false),
('iPhone 14', 2022, 2, false),
('iPhone 14 Plus', 2022, 2, false),
('iPhone 14 Pro', 2022, 2, false),
('iPhone 14 Pro Max', 2022, 2, false),
('iPhone 15', 2023, 2, false),
('iPhone 15 Plus', 2023, 2, false),
('iPhone 15 Pro', 2023, 2, false),
('iPhone 15 Pro Max', 2023, 2, false)
ON CONFLICT (device_model) DO NOTHING;

-- 4. Function to get customer history
CREATE OR REPLACE FUNCTION get_customer_history(p_phone TEXT)
RETURNS TABLE (
  name TEXT,
  customer_type TEXT,
  total_conversations INTEGER,
  total_repairs INTEGER,
  last_contact TIMESTAMPTZ,
  devices_owned JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ch.name,
    ch.customer_type,
    ch.total_conversations,
    ch.total_repairs,
    ch.last_contact,
    ch.devices_owned
  FROM customer_history ch
  WHERE ch.phone = p_phone;
END;
$$ LANGUAGE plpgsql;

-- 5. Function to update customer history
CREATE OR REPLACE FUNCTION update_customer_history(
  p_phone TEXT,
  p_name TEXT DEFAULT NULL,
  p_device TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_exists BOOLEAN;
  v_devices JSONB;
BEGIN
  -- Check if customer exists
  SELECT EXISTS(SELECT 1 FROM customer_history WHERE phone = p_phone) INTO v_exists;
  
  IF v_exists THEN
    -- Update existing customer
    UPDATE customer_history
    SET 
      last_contact = NOW(),
      total_conversations = total_conversations + 1,
      name = COALESCE(p_name, name),
      customer_type = CASE 
        WHEN total_conversations >= 10 THEN 'regular'
        WHEN total_conversations >= 3 THEN 'returning'
        ELSE customer_type
      END,
      devices_owned = CASE 
        WHEN p_device IS NOT NULL AND NOT devices_owned ? p_device 
        THEN devices_owned || jsonb_build_array(p_device)
        ELSE devices_owned
      END
    WHERE phone = p_phone;
  ELSE
    -- Insert new customer
    INSERT INTO customer_history (phone, name, devices_owned)
    VALUES (
      p_phone, 
      p_name,
      CASE WHEN p_device IS NOT NULL THEN jsonb_build_array(p_device) ELSE '[]'::jsonb END
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 6. Function to check if device needs battery upsell
CREATE OR REPLACE FUNCTION should_upsell_battery(p_device_model TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_recommend BOOLEAN;
BEGIN
  SELECT recommend_battery_replacement INTO v_recommend
  FROM device_age_reference
  WHERE device_model ILIKE p_device_model;
  
  RETURN COALESCE(v_recommend, false);
END;
$$ LANGUAGE plpgsql;

-- 7. Function to get pricing with confidence level
CREATE OR REPLACE FUNCTION get_price_with_confidence(
  p_device TEXT,
  p_repair_type TEXT
)
RETURNS TABLE (
  cost NUMERIC,
  confidence_level TEXT,
  price_range_min NUMERIC,
  price_range_max NUMERIC,
  requires_assessment BOOLEAN,
  turnaround TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.cost,
    p.confidence_level,
    p.price_range_min,
    p.price_range_max,
    p.requires_assessment,
    p.turnaround
  FROM prices p
  WHERE p.device ILIKE '%' || p_device || '%'
    AND p.repair_type ILIKE '%' || p_repair_type || '%'
    AND (p.expiry IS NULL OR p.expiry > NOW())
  ORDER BY p.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 8. Update existing prices with confidence levels (examples)
-- Standard iPhone repairs - high confidence
UPDATE prices 
SET confidence_level = 'standard',
    requires_assessment = false
WHERE device ILIKE '%iPhone%' 
  AND repair_type ILIKE '%screen%'
  AND device NOT ILIKE '%water%';

-- Battery replacements - standard confidence
UPDATE prices 
SET confidence_level = 'standard',
    requires_assessment = false
WHERE repair_type ILIKE '%battery%';

-- MacBook repairs - estimated confidence (need to see it)
UPDATE prices 
SET confidence_level = 'estimated',
    price_range_min = cost * 0.9,
    price_range_max = cost * 1.3,
    requires_assessment = true
WHERE device ILIKE '%MacBook%' OR device ILIKE '%laptop%';

-- Water damage - quote required
UPDATE prices 
SET confidence_level = 'quote_required',
    requires_assessment = true
WHERE repair_type ILIKE '%water%' OR repair_type ILIKE '%liquid%';

COMMENT ON TABLE customer_history IS 'Tracks customer interaction history for personalized service';
COMMENT ON TABLE device_age_reference IS 'Device release years for smart upselling decisions';
COMMENT ON FUNCTION get_customer_history IS 'Retrieves customer history by phone number';
COMMENT ON FUNCTION update_customer_history IS 'Updates or creates customer history record';
COMMENT ON FUNCTION should_upsell_battery IS 'Determines if battery upsell is appropriate based on device age';
COMMENT ON FUNCTION get_price_with_confidence IS 'Gets pricing with confidence level for smart handoff decisions';
