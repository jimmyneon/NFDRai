-- Verification Script for AI Steve Fixes
-- Run this in Supabase SQL Editor to verify all changes are applied correctly

-- 1. Check core_identity module has no pricing or John references
SELECT 
  module_name,
  CASE 
    WHEN prompt_text ~* '£\d+' THEN '❌ Contains pricing'
    WHEN prompt_text ~* 'john will' THEN '❌ Contains "John will"'
    WHEN prompt_text ~* 'pass.*to john' THEN '❌ Contains "pass to John"'
    WHEN prompt_text ~* 'typically.*£' THEN '❌ Contains "typically £"'
    WHEN prompt_text ~* 'around.*£' THEN '❌ Contains "around £"'
    ELSE '✅ Clean'
  END as status,
  version,
  updated_at
FROM prompts
WHERE module_name = 'core_identity'
  AND active = true;

-- 2. Check acknowledgment_responses module exists
SELECT 
  module_name,
  CASE 
    WHEN module_name = 'acknowledgment_responses' THEN '✅ Exists'
    ELSE '❌ Missing'
  END as status,
  priority,
  active,
  created_at
FROM prompts
WHERE module_name = 'acknowledgment_responses';

-- 3. Count all active modules with pricing references
SELECT 
  COUNT(*) as modules_with_pricing,
  STRING_AGG(module_name, ', ') as module_names
FROM prompts
WHERE active = true
  AND (
    prompt_text ~ '£\d+' OR
    prompt_text ~* 'typically.*£' OR
    prompt_text ~* 'usually.*£' OR
    prompt_text ~* 'around.*£'
  );

-- 4. Count all active modules with John handoff references
SELECT 
  COUNT(*) as modules_with_john_refs,
  STRING_AGG(module_name, ', ') as module_names
FROM prompts
WHERE active = true
  AND (
    prompt_text ~* 'john will' OR
    prompt_text ~* 'i''ll pass.*to john' OR
    prompt_text ~* 'pass.*to john' OR
    prompt_text ~* 'check with john'
  );

-- 5. List all active modules with their priorities
SELECT 
  module_name,
  priority,
  category,
  version,
  LENGTH(prompt_text) as text_length,
  updated_at
FROM prompts
WHERE active = true
ORDER BY priority DESC, module_name;

-- 6. Summary report
SELECT 
  COUNT(*) as total_active_modules,
  COUNT(CASE WHEN prompt_text ~ '£\d+' THEN 1 END) as modules_with_pricing,
  COUNT(CASE WHEN prompt_text ~* 'john will' THEN 1 END) as modules_with_john_will,
  COUNT(CASE WHEN module_name = 'acknowledgment_responses' THEN 1 END) as has_acknowledgment_module,
  COUNT(CASE WHEN module_name = 'core_identity' THEN 1 END) as has_core_identity
FROM prompts
WHERE active = true;

-- Expected results:
-- ✅ total_active_modules: ~32-33
-- ✅ modules_with_pricing: 0 (or only in examples/documentation)
-- ✅ modules_with_john_will: 0 (or only in "NEVER say John will" instructions)
-- ✅ has_acknowledgment_module: 1
-- ✅ has_core_identity: 1
