-- Check ALL ai_settings rows
SELECT * FROM ai_settings;

-- The query is looking for active = true, but maybe all rows have active = false
-- Let's check
SELECT id, active, automation_enabled FROM ai_settings;

-- If there are NO rows at all, we need to insert one
-- If there are rows but active = false, we need to set one to true

-- Option 1: If you have a row, set it to active
UPDATE ai_settings 
SET active = true
WHERE id = (SELECT id FROM ai_settings LIMIT 1);

-- Option 2: If NO rows exist, insert a default one
-- INSERT INTO ai_settings (
--   provider,
--   api_key,
--   model_name,
--   temperature,
--   max_tokens,
--   system_prompt,
--   confidence_threshold,
--   fallback_message,
--   active,
--   automation_enabled,
--   price_checking_enabled
-- ) VALUES (
--   'openai',
--   'sk-proj-YOUR_KEY_HERE',
--   'gpt-4o',
--   0.7,
--   500,
--   'You are a helpful assistant for New Forest Device Repairs.',
--   70.0,
--   'I''ll pass this to a team member for confirmation.',
--   true,
--   true,
--   false
-- );

-- Verify
SELECT id, active, automation_enabled, price_checking_enabled FROM ai_settings;
