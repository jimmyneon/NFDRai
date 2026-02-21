-- Fix infinite recursion in users table RLS policy
-- The "Admins can view all users" policy queries the users table within itself, causing recursion

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Create a new policy that doesn't cause recursion
-- Use a simpler approach: check if user has admin role directly from auth metadata
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT
  USING (
    -- Allow if user is viewing their own profile
    auth.uid() = id
    OR
    -- Allow if user has admin role (check from auth.jwt() to avoid recursion)
    (auth.jwt() ->> 'role')::text = 'admin'
  );

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'users';
