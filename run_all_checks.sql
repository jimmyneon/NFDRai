-- COMPREHENSIVE SYSTEM CHECK
-- Run this in Supabase SQL Editor to verify everything is working

-- 1. Modules exist
SELECT 'Modules Check' as test, COUNT(*) as count, 
  CASE WHEN COUNT(*) >= 15 THEN '✓ PASS' ELSE '✗ FAIL' END as status
FROM prompts WHERE active = true;

-- 2. Core identity exists
SELECT 'Core Identity' as test, COUNT(*) as count,
  CASE WHEN COUNT(*) = 1 THEN '✓ PASS' ELSE '✗ FAIL' END as status
FROM prompts WHERE module_name = 'core_identity' AND active = true;

-- 3. Function exists
SELECT 'Function Check' as test, COUNT(*) as count,
  CASE WHEN COUNT(*) >= 1 THEN '✓ PASS' ELSE '✗ FAIL' END as status
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'get_prompt_modules';

-- 4. Function works
SELECT 'Function Test' as test, COUNT(*) as count,
  CASE WHEN COUNT(*) >= 1 THEN '✓ PASS' ELSE '✗ FAIL' END as status
FROM get_prompt_modules('screen_repair');

-- 5. Device detection guidance exists
SELECT 'Device Detection' as test, 
  CASE WHEN prompt_text ILIKE '%Settings > General > About%' THEN '✓ PASS' ELSE '✗ FAIL' END as status
FROM prompts WHERE module_name = 'core_identity';

-- 6. Turnaround strategy exists
SELECT 'Turnaround Strategy' as test, COUNT(*) as count,
  CASE WHEN COUNT(*) = 1 THEN '✓ PASS' ELSE '✗ FAIL' END as status
FROM prompts WHERE module_name = 'turnaround_strategy' AND active = true;

-- 7. Friendly tone exists
SELECT 'Friendly Tone' as test, COUNT(*) as count,
  CASE WHEN COUNT(*) = 1 THEN '✓ PASS' ELSE '✗ FAIL' END as status
FROM prompts WHERE module_name = 'friendly_tone' AND active = true;

-- 8. Context awareness exists
SELECT 'Context Awareness' as test, COUNT(*) as count,
  CASE WHEN COUNT(*) = 1 THEN '✓ PASS' ELSE '✗ FAIL' END as status
FROM prompts WHERE module_name = 'context_awareness' AND active = true;

-- 9. Services comprehensive exists
SELECT 'Services Info' as test, COUNT(*) as count,
  CASE WHEN COUNT(*) = 1 THEN '✓ PASS' ELSE '✗ FAIL' END as status
FROM prompts WHERE module_name = 'services_comprehensive' AND active = true;

-- 10. Handoff rules exist
SELECT 'Handoff Rules' as test, COUNT(*) as count,
  CASE WHEN COUNT(*) = 1 THEN '✓ PASS' ELSE '✗ FAIL' END as status
FROM prompts WHERE module_name = 'handoff_rules' AND active = true;

-- Summary
SELECT 
  'SUMMARY' as test,
  COUNT(*) as total_modules,
  SUM(LENGTH(prompt_text)) as total_chars,
  CASE 
    WHEN COUNT(*) >= 15 AND SUM(LENGTH(prompt_text)) > 20000 
    THEN '✓ ALL CHECKS PASS' 
    ELSE '✗ SOME CHECKS FAIL' 
  END as overall_status
FROM prompts WHERE active = true;

-- List all modules
SELECT 
  module_name,
  category,
  LENGTH(prompt_text) as chars,
  active
FROM prompts
ORDER BY module_name;
