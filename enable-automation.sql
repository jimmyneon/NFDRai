-- Enable AI automation globally
UPDATE ai_settings 
SET automation_enabled = true 
WHERE active = true;

-- Verify it's enabled
SELECT 
  id,
  automation_enabled,
  active,
  provider,
  model_name,
  updated_at
FROM ai_settings
WHERE active = true;
