-- Check if RLS policies were actually created

-- 1. Check if RLS is enabled on prompts table
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'prompts';

-- 2. Check what policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'prompts';

-- 3. Test if we can actually read prompts
SELECT 
  'Direct Query Test' as test,
  COUNT(*) as count
FROM prompts 
WHERE active = true;

-- 4. Test the get_prompt_modules function
SELECT 
  'Function Test' as test,
  COUNT(*) as modules_returned
FROM get_prompt_modules('screen_repair');

-- 5. Show first few modules to verify content
SELECT 
  module_name,
  category,
  LENGTH(prompt_text) as text_length,
  active
FROM prompts
WHERE active = true
ORDER BY module_name
LIMIT 5;
