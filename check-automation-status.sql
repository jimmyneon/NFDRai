-- Check current automation status
SELECT 
  id,
  automation_enabled,
  active,
  provider,
  model_name
FROM ai_settings
WHERE active = true;

-- If automation is disabled, enable it
-- UPDATE ai_settings 
-- SET automation_enabled = true 
-- WHERE active = true;
