-- Check what intents are actually in the prompts table

SELECT 
  module_name,
  category,
  intent,
  active
FROM prompts
ORDER BY category, module_name;

-- Test the function with 'general_info'
SELECT 
  'Test: general_info' as test,
  COUNT(*) as modules_returned
FROM get_prompt_modules('general_info');

-- Test the function with 'screen_repair'
SELECT 
  'Test: screen_repair' as test,
  COUNT(*) as modules_returned
FROM get_prompt_modules('screen_repair');

-- Test the function with 'unknown'
SELECT 
  'Test: unknown' as test,
  COUNT(*) as modules_returned
FROM get_prompt_modules('unknown');

-- Show what the function actually returns for 'general_info'
SELECT * FROM get_prompt_modules('general_info');
