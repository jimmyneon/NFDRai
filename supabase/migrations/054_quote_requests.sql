-- Create quote_requests table to store repair quote submissions
-- These come from external forms/websites and trigger SMS confirmation

CREATE TABLE IF NOT EXISTS public.quote_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Customer details
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  
  -- Device details
  device_make TEXT NOT NULL,
  device_model TEXT NOT NULL,
  issue TEXT NOT NULL,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'quoted', 'accepted', 'declined', 'completed')),
  quoted_price NUMERIC(10,2),
  quoted_at TIMESTAMPTZ,
  quoted_by UUID REFERENCES public.users(id),
  
  -- SMS tracking
  sms_sent BOOLEAN DEFAULT FALSE,
  sms_sent_at TIMESTAMPTZ,
  
  -- Link to conversation if one is created
  conversation_id UUID REFERENCES public.conversations(id),
  customer_id UUID REFERENCES public.customers(id),
  
  -- Source tracking
  source TEXT DEFAULT 'website',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_quote_requests_phone ON public.quote_requests(phone);
CREATE INDEX idx_quote_requests_status ON public.quote_requests(status);
CREATE INDEX idx_quote_requests_created_at ON public.quote_requests(created_at DESC);

-- Add updated_at trigger
CREATE TRIGGER update_quote_requests_updated_at 
  BEFORE UPDATE ON public.quote_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view quote requests
CREATE POLICY "Authenticated users can view quote_requests" ON public.quote_requests
  FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated users can insert quote requests (for API)
CREATE POLICY "Authenticated users can insert quote_requests" ON public.quote_requests
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Admins and managers can update quote requests
CREATE POLICY "Admins and managers can update quote_requests" ON public.quote_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Allow service role full access (for API endpoints)
CREATE POLICY "Service role has full access to quote_requests" ON public.quote_requests
  FOR ALL USING (auth.role() = 'service_role');

-- Allow anon role to insert (for public API)
CREATE POLICY "Anon can insert quote_requests" ON public.quote_requests
  FOR INSERT WITH CHECK (true);

COMMENT ON TABLE public.quote_requests IS 'Stores repair quote requests from external sources (website forms, etc)';
