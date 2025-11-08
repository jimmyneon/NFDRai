-- Comprehensive system verification

-- 1. Check prompts table has data
SELECT 
  'Prompts Table' as check_name,
  COUNT(*) as total_modules,
  COUNT(DISTINCT category) as categories,
  SUM(LENGTH(prompt_text)) as total_chars
FROM prompts
WHERE active = true;

-- 2. Test get_prompt_modules function
SELECT 
  'get_prompt_modules function' as check_name,
  module_name,
  category,
  LENGTH(prompt_text) as chars
FROM get_prompt_modules('screen_repair', 'new_inquiry')
ORDER BY module_name;

-- 3. Check if all expected modules exist
SELECT 
  'Expected Modules Check' as check_name,
  CASE WHEN EXISTS (SELECT 1 FROM prompts WHERE module_name = 'services_comprehensive') THEN '✓' ELSE '✗' END as services_comprehensive,
  CASE WHEN EXISTS (SELECT 1 FROM prompts WHERE module_name = 'operational_policies') THEN '✓' ELSE '✗' END as operational_policies,
  CASE WHEN EXISTS (SELECT 1 FROM prompts WHERE module_name = 'handoff_rules') THEN '✓' ELSE '✗' END as handoff_rules,
  CASE WHEN EXISTS (SELECT 1 FROM prompts WHERE module_name = 'common_scenarios') THEN '✓' ELSE '✗' END as common_scenarios,
  CASE WHEN EXISTS (SELECT 1 FROM prompts WHERE module_name = 'pricing_flow_detailed') THEN '✓' ELSE '✗' END as pricing_flow_detailed,
  CASE WHEN EXISTS (SELECT 1 FROM prompts WHERE module_name = 'friendly_tone') THEN '✓' ELSE '✗' END as friendly_tone,
  CASE WHEN EXISTS (SELECT 1 FROM prompts WHERE module_name = 'context_awareness') THEN '✓' ELSE '✗' END as context_awareness;

-- 4. Check module sizes (should be reasonable, not too large)
SELECT 
  module_name,
  LENGTH(prompt_text) as chars,
  CASE 
    WHEN LENGTH(prompt_text) < 500 THEN 'Small'
    WHEN LENGTH(prompt_text) < 2000 THEN 'Medium'
    WHEN LENGTH(prompt_text) < 5000 THEN 'Large'
    ELSE 'Very Large'
  END as size_category
FROM prompts
WHERE active = true
ORDER BY LENGTH(prompt_text) DESC;

-- 5. Test different intents
SELECT 
  'screen_repair intent' as test_case,
  COUNT(*) as modules_returned
FROM get_prompt_modules('screen_repair');

SELECT 
  'battery_replacement intent' as test_case,
  COUNT(*) as modules_returned
FROM get_prompt_modules('battery_replacement');

SELECT 
  'general_info intent' as test_case,
  COUNT(*) as modules_returned
FROM get_prompt_modules('general_info');
