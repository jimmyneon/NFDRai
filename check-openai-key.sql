-- Check if OpenAI API key is configured
SELECT 
  id,
  provider,
  LEFT(api_key, 10) || '...' as api_key_preview,
  model_name,
  active,
  automation_enabled
FROM ai_settings
WHERE active = true;

-- If api_key is empty or just 'your_openai_api_key', you need to set it
