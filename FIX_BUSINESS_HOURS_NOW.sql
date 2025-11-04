-- Quick fix for business hours access issue
-- Run this in Supabase SQL Editor

-- Option 1: Disable RLS entirely (simplest for single-user app)
ALTER TABLE public.business_info DISABLE ROW LEVEL SECURITY;

-- If you want to keep RLS enabled, use Option 2 instead:
-- Option 2: Allow all authenticated users to read and admins to write
-- DROP POLICY IF EXISTS "Anyone can view business info" ON public.business_info;
-- DROP POLICY IF EXISTS "Admins can manage business info" ON public.business_info;

-- CREATE POLICY "Authenticated users can view business info" 
--   ON public.business_info FOR SELECT 
--   TO authenticated
--   USING (true);

-- CREATE POLICY "Admins can update business info" 
--   ON public.business_info FOR UPDATE
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.users 
--       WHERE users.id = auth.uid() 
--       AND users.role = 'admin'
--     )
--   );

-- CREATE POLICY "Admins can insert business info" 
--   ON public.business_info FOR INSERT
--   TO authenticated
--   WITH CHECK (
--     EXISTS (
--       SELECT 1 FROM public.users 
--       WHERE users.id = auth.uid() 
--       AND users.role = 'admin'
--     )
--   );

-- Verify it worked
SELECT * FROM business_info;
