-- Create custom_closures table for illness, sick days, and other temporary closures
-- This allows adding specific date ranges when business is closed beyond regular hours

CREATE TABLE public.custom_closures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Closure details
  reason TEXT NOT NULL, -- e.g., "Illness", "Sick day", "Emergency", "Personal leave"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Optional message to display (if null, uses generic message)
  custom_message TEXT,
  
  -- Active flag (allows disabling without deleting)
  active BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure end_date is not before start_date
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Enable RLS
ALTER TABLE public.custom_closures ENABLE ROW LEVEL SECURITY;

-- Everyone can read active closures (including unauthenticated for AI responses)
CREATE POLICY "Anyone can view active closures" ON public.custom_closures
  FOR SELECT USING (active = true);

-- Only admins can manage closures
CREATE POLICY "Admins can manage closures" ON public.custom_closures
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add updated_at trigger
CREATE TRIGGER update_custom_closures_updated_at BEFORE UPDATE ON public.custom_closures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create index for efficient date range queries
CREATE INDEX idx_custom_closures_dates ON public.custom_closures(start_date, end_date) WHERE active = true;

-- Add comment
COMMENT ON TABLE public.custom_closures IS 'Stores temporary business closures for illness, sick days, emergencies, etc.';
COMMENT ON COLUMN public.custom_closures.reason IS 'Reason for closure (e.g., Illness, Sick day, Emergency)';
COMMENT ON COLUMN public.custom_closures.custom_message IS 'Optional custom message to display instead of generic closure message';
COMMENT ON COLUMN public.custom_closures.active IS 'Whether this closure is active (allows disabling without deleting)';
