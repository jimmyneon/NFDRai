-- Fix infinite recursion in RLS policy
-- The problem: RLS policies on prompts table are causing recursion

-- SOLUTION 1: Disable RLS on prompts table (simplest)
ALTER TABLE prompts DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'prompts';

-- Expected: rls_enabled = false

-- Test that prompts are now readable
SELECT COUNT(*) FROM prompts WHERE active = true;

-- Expected: 15

-- SOLUTION 2 (Alternative): If you want to keep RLS, use SECURITY DEFINER on function
-- This makes the function run with owner privileges, bypassing RLS

-- Recreate function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_prompt_modules(
  p_intent TEXT,
  p_state TEXT DEFAULT NULL
)
RETURNS TABLE (
  module_name TEXT,
  prompt_text TEXT,
  priority INTEGER
) 
SECURITY DEFINER  -- This bypasses RLS
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.module_name,
    p.prompt_text,
    p.priority
  FROM prompts p
  WHERE p.active = true
    AND (
      p.category = 'core' -- Always include core modules
      OR p.intent = p_intent -- Include intent-specific module
    )
  ORDER BY p.priority DESC;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT COUNT(*) FROM get_prompt_modules('general_info');

-- Expected: 2 (core_identity + general_info)
