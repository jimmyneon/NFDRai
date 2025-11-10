-- Create table to store extracted information from staff messages
-- This captures structured data from John's messages about repairs, quotes, etc.

CREATE TABLE IF NOT EXISTS public.staff_message_extractions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  
  -- Customer information
  customer_name TEXT,
  
  -- Device information
  device_type TEXT, -- e.g., "iPhone", "Samsung", "iPad", "MacBook"
  device_model TEXT, -- e.g., "iPhone 14 Pro", "Samsung S23"
  device_issue TEXT, -- e.g., "cracked screen", "battery replacement"
  
  -- Repair information
  repair_status TEXT CHECK (repair_status IN ('ready', 'in_progress', 'not_fixed', 'quoted', 'awaiting_parts', 'awaiting_customer')),
  repair_notes TEXT, -- Additional notes about the repair
  
  -- Pricing information
  price_quoted NUMERIC(10,2),
  price_final NUMERIC(10,2),
  currency TEXT DEFAULT 'GBP',
  
  -- Time information
  estimated_completion TIMESTAMPTZ,
  actual_completion TIMESTAMPTZ,
  
  -- Message type classification
  message_type TEXT CHECK (message_type IN ('ready_notification', 'quote', 'update', 'not_fixed', 'other')),
  
  -- Confidence and metadata
  extraction_confidence NUMERIC(3,2), -- 0.00 to 1.00
  extraction_method TEXT DEFAULT 'pattern_matching', -- 'pattern_matching', 'ai', 'manual'
  raw_extracted_data JSONB, -- Store all extracted data for debugging
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_staff_extractions_message ON public.staff_message_extractions(message_id);
CREATE INDEX idx_staff_extractions_conversation ON public.staff_message_extractions(conversation_id);
CREATE INDEX idx_staff_extractions_status ON public.staff_message_extractions(repair_status);
CREATE INDEX idx_staff_extractions_type ON public.staff_message_extractions(message_type);
CREATE INDEX idx_staff_extractions_device ON public.staff_message_extractions(device_type, device_model);
CREATE INDEX idx_staff_extractions_created ON public.staff_message_extractions(created_at DESC);

-- Add updated_at trigger
CREATE TRIGGER update_staff_extractions_updated_at 
  BEFORE UPDATE ON public.staff_message_extractions
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE public.staff_message_extractions ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view extractions
CREATE POLICY "Authenticated users can view staff extractions" 
  ON public.staff_message_extractions
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Authenticated users can insert extractions
CREATE POLICY "Authenticated users can insert staff extractions" 
  ON public.staff_message_extractions
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Admins and managers can update/delete
CREATE POLICY "Admins and managers can manage staff extractions" 
  ON public.staff_message_extractions
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Add comment explaining the table
COMMENT ON TABLE public.staff_message_extractions IS 
  'Stores structured information extracted from staff messages, including device details, repair status, pricing, and customer information. Used for analytics and future automation.';

COMMENT ON COLUMN public.staff_message_extractions.repair_status IS 
  'ready: Device is ready for pickup
   in_progress: Currently being repaired
   not_fixed: Could not be fixed
   quoted: Price quote provided
   awaiting_parts: Waiting for parts to arrive
   awaiting_customer: Waiting for customer decision/approval';

COMMENT ON COLUMN public.staff_message_extractions.message_type IS 
  'ready_notification: "Your device is ready" messages
   quote: Price quote messages
   update: Status update messages
   not_fixed: "Could not fix" messages
   other: Other staff messages';
