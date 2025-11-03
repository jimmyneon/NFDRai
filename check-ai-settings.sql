-- Check what columns ai_settings actually has
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'ai_settings'
ORDER BY ordinal_position;

-- Check current ai_settings values
SELECT * FROM ai_settings;

-- The API might be checking conversation status, not a global automation flag
-- Check if you have any conversations
SELECT * FROM conversations LIMIT 5;
