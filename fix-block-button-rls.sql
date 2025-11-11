-- Fix RLS policy for blocking conversations
-- The 400 error suggests RLS is preventing the update

-- Check current policies on conversations table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'conversations';

-- Add policy to allow authenticated users to update conversation status
-- This allows the Block AI button to work
DROP POLICY IF EXISTS "Users can update conversation status" ON conversations;

CREATE POLICY "Users can update conversation status"
ON conversations
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Also ensure users can read conversations
DROP POLICY IF EXISTS "Users can view all conversations" ON conversations;

CREATE POLICY "Users can view all conversations"
ON conversations
FOR SELECT
TO authenticated
USING (true);
