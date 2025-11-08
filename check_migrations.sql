-- Check if migrations have been applied
-- Run this in your Supabase SQL Editor

-- 1. Check if prompts table exists and has data
SELECT 
  'prompts table' as check_name,
  COUNT(*) as record_count,
  COUNT(DISTINCT module_name) as unique_modules
FROM prompts;

-- 2. List all prompt modules that should exist
SELECT 
  module_name,
  category,
  intent,
  active,
  version,
  LENGTH(prompt_text) as prompt_length,
  created_at,
  updated_at
FROM prompts
ORDER BY module_name;

-- 3. Check for specific modules from migrations 015-019
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM prompts WHERE module_name = 'business_hours_awareness') THEN '✓'
    ELSE '✗'
  END as business_hours_awareness,
  CASE 
    WHEN EXISTS (SELECT 1 FROM prompts WHERE module_name = 'warranty_mention') THEN '✓'
    ELSE '✗'
  END as warranty_mention,
  CASE 
    WHEN EXISTS (SELECT 1 FROM prompts WHERE module_name = 'turnaround_strategy') THEN '✓'
    ELSE '✗'
  END as turnaround_strategy,
  CASE 
    WHEN EXISTS (SELECT 1 FROM prompts WHERE module_name = 'friendly_tone') THEN '✓'
    ELSE '✗'
  END as friendly_tone,
  CASE 
    WHEN EXISTS (SELECT 1 FROM prompts WHERE module_name = 'screen_diagnosis_flow') THEN '✓'
    ELSE '✗'
  END as screen_diagnosis_flow,
  CASE 
    WHEN EXISTS (SELECT 1 FROM prompts WHERE module_name = 'context_awareness') THEN '✓'
    ELSE '✗'
  END as context_awareness,
  CASE 
    WHEN EXISTS (SELECT 1 FROM prompts WHERE module_name = 'services_comprehensive') THEN '✓'
    ELSE '✗'
  END as services_comprehensive,
  CASE 
    WHEN EXISTS (SELECT 1 FROM prompts WHERE module_name = 'pricing_flow_detailed') THEN '✓'
    ELSE '✗'
  END as pricing_flow_detailed,
  CASE 
    WHEN EXISTS (SELECT 1 FROM prompts WHERE module_name = 'operational_policies') THEN '✓'
    ELSE '✗'
  END as operational_policies,
  CASE 
    WHEN EXISTS (SELECT 1 FROM prompts WHERE module_name = 'handoff_rules') THEN '✓'
    ELSE '✗'
  END as handoff_rules,
  CASE 
    WHEN EXISTS (SELECT 1 FROM prompts WHERE module_name = 'common_scenarios') THEN '✓'
    ELSE '✗'
  END as common_scenarios;

-- 4. Expected module count
SELECT 
  'Expected: 11+ modules' as expected,
  CONCAT('Actual: ', COUNT(*), ' modules') as actual,
  CASE 
    WHEN COUNT(*) >= 11 THEN '✓ All migrations applied'
    ELSE '✗ Missing modules'
  END as status
FROM prompts;
