-- APPLY THIS IN SUPABASE SQL EDITOR NOW
-- This fixes the 400 error when clicking "Block AI" button

-- Drop existing policies
DROP POLICY IF EXISTS "Users can update conversation status" ON conversations;
DROP POLICY IF EXISTS "Users can view all conversations" ON conversations;

-- Allow authenticated users to view all conversations
CREATE POLICY "Users can view all conversations"
ON conversations
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to update conversation status
CREATE POLICY "Users can update conversation status"
ON conversations
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Verify it worked
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'conversations'
ORDER BY policyname;
