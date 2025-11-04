-- Verify automation_enabled is actually true
SELECT 
  id,
  active,
  automation_enabled,
  price_checking_enabled,
  updated_at
FROM ai_settings
WHERE active = true;

-- Force update it again
UPDATE ai_settings 
SET 
  automation_enabled = true,
  updated_at = NOW()
WHERE active = true;

-- Verify again
SELECT 
  id,
  active,
  automation_enabled,
  updated_at
FROM ai_settings
WHERE active = true;
