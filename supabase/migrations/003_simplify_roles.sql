-- Simplify RLS policies - allow all authenticated users to manage settings
-- This removes the admin-only restriction

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view ai_settings" ON public.ai_settings;
DROP POLICY IF EXISTS "Admins can manage ai_settings" ON public.ai_settings;

-- Create simpler policies - any authenticated user can manage
CREATE POLICY "Authenticated users can view ai_settings" ON public.ai_settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage ai_settings" ON public.ai_settings
  FOR ALL USING (auth.role() = 'authenticated');

-- Also simplify other policies if needed
DROP POLICY IF EXISTS "Admins can manage prices" ON public.prices;
CREATE POLICY "Authenticated users can manage prices" ON public.prices
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage faqs" ON public.faqs;
CREATE POLICY "Authenticated users can manage faqs" ON public.faqs
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage docs" ON public.docs;
CREATE POLICY "Authenticated users can manage docs" ON public.docs
  FOR ALL USING (auth.role() = 'authenticated');

-- Keep role column for future use, but make everyone admin by default
ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'admin';

-- Update existing users to admin
UPDATE public.users SET role = 'admin';

-- Update the trigger to create users as admin by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
