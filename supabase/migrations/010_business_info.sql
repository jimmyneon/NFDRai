-- Create business_info table for storing business hours and location info
CREATE TABLE public.business_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name TEXT NOT NULL DEFAULT 'New Forest Device Repairs',
  google_maps_url TEXT,
  timezone TEXT NOT NULL DEFAULT 'Europe/London',
  
  -- Opening hours (stored as time without timezone)
  monday_open TIME,
  monday_close TIME,
  tuesday_open TIME,
  tuesday_close TIME,
  wednesday_open TIME,
  wednesday_close TIME,
  thursday_open TIME,
  thursday_close TIME,
  friday_open TIME,
  friday_close TIME,
  saturday_open TIME,
  saturday_close TIME,
  sunday_open TIME,
  sunday_close TIME,
  
  -- Special closures or notes
  special_hours_note TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.business_info ENABLE ROW LEVEL SECURITY;

-- Everyone can read business info (including unauthenticated for AI responses)
CREATE POLICY "Anyone can view business info" ON public.business_info
  FOR SELECT USING (true);

-- Only admins can manage business info
CREATE POLICY "Admins can manage business info" ON public.business_info
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add updated_at trigger
CREATE TRIGGER update_business_info_updated_at BEFORE UPDATE ON public.business_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default business hours (Monday-Friday 9am-6pm, Saturday 10am-4pm, Sunday closed)
INSERT INTO public.business_info (
  business_name,
  google_maps_url,
  timezone,
  monday_open, monday_close,
  tuesday_open, tuesday_close,
  wednesday_open, wednesday_close,
  thursday_open, thursday_close,
  friday_open, friday_close,
  saturday_open, saturday_close,
  sunday_open, sunday_close
) VALUES (
  'New Forest Device Repairs',
  'https://www.google.com/maps/search/?api=1&query=New+Forest+Device+Repairs',
  'Europe/London',
  '09:00', '18:00',
  '09:00', '18:00',
  '09:00', '18:00',
  '09:00', '18:00',
  '09:00', '18:00',
  '10:00', '16:00',
  NULL, NULL
);

-- Update database types
COMMENT ON TABLE public.business_info IS 'Stores business operating hours and location information for AI responses';
