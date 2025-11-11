-- Fix RLS policies for conversations table
-- Allows authenticated users to update conversation status (for Block AI button)

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can update conversation status" ON conversations;
DROP POLICY IF EXISTS "Users can view all conversations" ON conversations;

-- Allow authenticated users to view all conversations
CREATE POLICY "Users can view all conversations"
ON conversations
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to update conversation status
-- This fixes the 400 error when clicking Block AI button
CREATE POLICY "Users can update conversation status"
ON conversations
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Verify policies are created
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'conversations'
ORDER BY policyname;
