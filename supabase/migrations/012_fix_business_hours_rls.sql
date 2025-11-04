-- Fix business_info RLS policies
-- The issue is that the policy checks users.id = auth.uid() but the API checks userData.role
-- We need to make sure the policy allows admins to update

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage business info" ON public.business_info;

-- Recreate with correct logic
CREATE POLICY "Admins can manage business info" ON public.business_info
  FOR ALL 
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Also ensure SELECT policy allows authenticated users
DROP POLICY IF EXISTS "Anyone can view business info" ON public.business_info;

CREATE POLICY "Anyone can view business info" ON public.business_info
  FOR SELECT 
  USING (true);
