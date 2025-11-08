-- Fix RLS policy for prompts table
-- The API can't read prompts because RLS is blocking it

-- 1. Check current RLS status
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'prompts';

-- 2. Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'prompts';

-- 3. Disable RLS (if you want prompts to be publicly readable)
-- ALTER TABLE prompts DISABLE ROW LEVEL SECURITY;

-- OR

-- 4. Add policy to allow service_role to read (recommended)
-- This allows the API (which uses service_role) to read prompts
DROP POLICY IF EXISTS "Allow service role to read prompts" ON prompts;

CREATE POLICY "Allow service role to read prompts"
ON prompts FOR SELECT
TO service_role
USING (true);

-- 5. Also allow authenticated users (if needed for dashboard)
DROP POLICY IF EXISTS "Allow authenticated to read prompts" ON prompts;

CREATE POLICY "Allow authenticated to read prompts"
ON prompts FOR SELECT
TO authenticated
USING (true);

-- 6. Verify policies were created
SELECT 
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'prompts';

-- 7. Test that prompts are now readable
SELECT COUNT(*) as total_prompts FROM prompts WHERE active = true;
