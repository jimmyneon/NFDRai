-- CRITICAL: Run this NOW to fix AI responses
-- The AI cannot respond because it can't read the prompts table

-- Add policy to allow service_role (API) to read prompts
DROP POLICY IF EXISTS "Allow service role to read prompts" ON prompts;

CREATE POLICY "Allow service role to read prompts"
ON prompts FOR SELECT
TO service_role
USING (true);

-- Also allow authenticated users (for dashboard)
DROP POLICY IF EXISTS "Allow authenticated to read prompts" ON prompts;

CREATE POLICY "Allow authenticated to read prompts"
ON prompts FOR SELECT
TO authenticated
USING (true);

-- Verify policies were created
SELECT 
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'prompts';

-- Test that prompts are now readable
SELECT 
  'Test Query' as test,
  COUNT(*) as modules_found
FROM prompts 
WHERE active = true;

-- Expected result: 15 modules found
