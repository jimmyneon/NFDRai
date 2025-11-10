-- Fix RLS policy for conversation status updates
-- Allow authenticated users to update conversation status (for block/unblock feature)

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Admins and managers can manage conversations" ON public.conversations;

-- Create separate policies for different operations

-- SELECT: All authenticated users can view conversations
-- (already exists: "Authenticated users can view conversations")

-- UPDATE: Authenticated users can update conversation status
CREATE POLICY "Authenticated users can update conversation status" ON public.conversations
  FOR UPDATE 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- INSERT: Only admins and managers can create conversations
CREATE POLICY "Admins and managers can insert conversations" ON public.conversations
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- DELETE: Only admins can delete conversations
CREATE POLICY "Admins can delete conversations" ON public.conversations
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add comment
COMMENT ON POLICY "Authenticated users can update conversation status" ON public.conversations IS 'Allows staff to update conversation status (auto/manual/blocked) for managing AI responses';
