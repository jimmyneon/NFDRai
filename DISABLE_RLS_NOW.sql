-- Simple fix: Disable RLS for business_info table
-- This is the easiest solution for a single-user app

ALTER TABLE public.business_info DISABLE ROW LEVEL SECURITY;

-- Verify it worked
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'business_info';

-- Should show: rls_enabled = false

-- Now test if you can read the data
SELECT * FROM business_info;
