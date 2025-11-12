-- Customer Message Extractions
-- Extract ALL useful information from customer messages in a single AI call
-- Device details, issues, preferences, contact info, etc.

CREATE TABLE IF NOT EXISTS public.customer_message_extractions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  
  -- Customer information
  customer_name TEXT, -- First name extracted from any context
  preferred_name TEXT, -- "Call me Mike" even if name is Michael
  contact_preference TEXT, -- "phone", "text", "email"
  
  -- Device information
  device_type TEXT, -- "iPhone", "Samsung", "iPad", "MacBook", "Android"
  device_model TEXT, -- "iPhone 14 Pro", "Samsung S23 Ultra"
  device_color TEXT, -- "black", "white", "blue" (helps identify device)
  device_condition TEXT, -- "cracked screen", "water damaged", "won't turn on"
  
  -- Issue details
  issue_description TEXT, -- What's wrong with the device
  issue_category TEXT, -- "screen", "battery", "charging", "camera", "software", "water_damage"
  urgency_level TEXT CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
  
  -- Customer intent
  intent TEXT, -- "repair", "quote", "status_check", "buyback", "purchase", "question"
  specific_request TEXT, -- What exactly they're asking for
  
  -- Timing preferences
  preferred_time TEXT, -- "morning", "afternoon", "evening", "weekend"
  deadline TEXT, -- "need it by Friday", "urgent", "no rush"
  
  -- Location/pickup
  will_drop_off BOOLEAN, -- Customer says they'll bring device in
  needs_pickup BOOLEAN, -- Customer asks about pickup service
  location_mentioned TEXT, -- Any location they mention
  
  -- Budget/pricing
  budget_mentioned NUMERIC(10,2), -- If they mention a budget
  price_sensitive BOOLEAN, -- Mentions cost concerns
  
  -- Previous context
  references_previous_repair BOOLEAN, -- "like last time", "same as before"
  previous_device_mentioned TEXT, -- "my old iPhone"
  
  -- Sentiment indicators
  frustration_level TEXT CHECK (frustration_level IN ('none', 'mild', 'moderate', 'high', 'severe')),
  satisfaction_level TEXT CHECK (satisfaction_level IN ('very_unhappy', 'unhappy', 'neutral', 'happy', 'very_happy')),
  
  -- Additional structured data
  raw_extracted_data JSONB, -- Full AI extraction for debugging
  extraction_confidence NUMERIC(3,2) CHECK (extraction_confidence >= 0 AND extraction_confidence <= 1),
  extraction_method TEXT DEFAULT 'ai' CHECK (extraction_method IN ('ai', 'regex', 'hybrid')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_customer_extractions_message ON public.customer_message_extractions(message_id);
CREATE INDEX idx_customer_extractions_conversation ON public.customer_message_extractions(conversation_id);
CREATE INDEX idx_customer_extractions_device ON public.customer_message_extractions(device_type, device_model);
CREATE INDEX idx_customer_extractions_issue ON public.customer_message_extractions(issue_category);
CREATE INDEX idx_customer_extractions_intent ON public.customer_message_extractions(intent);
CREATE INDEX idx_customer_extractions_urgency ON public.customer_message_extractions(urgency_level);
CREATE INDEX idx_customer_extractions_created ON public.customer_message_extractions(created_at DESC);

-- Updated_at trigger
CREATE TRIGGER update_customer_extractions_updated_at 
  BEFORE UPDATE ON public.customer_message_extractions
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- RLS policies
ALTER TABLE public.customer_message_extractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view customer extractions" 
  ON public.customer_message_extractions
  FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert customer extractions" 
  ON public.customer_message_extractions
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins and managers can manage customer extractions" 
  ON public.customer_message_extractions
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Comments
COMMENT ON TABLE public.customer_message_extractions IS 
  'Stores ALL useful information extracted from customer messages using AI. Device details, issues, preferences, timing, budget, sentiment - everything in one extraction.';

COMMENT ON COLUMN public.customer_message_extractions.customer_name IS 
  'Customer first name extracted from ANY context: introductions, signatures, casual mentions';

COMMENT ON COLUMN public.customer_message_extractions.preferred_name IS 
  'If customer says "Call me Mike" even though name is Michael';

COMMENT ON COLUMN public.customer_message_extractions.issue_category IS 
  'Categorized issue type: screen, battery, charging, camera, software, water_damage, other';

COMMENT ON COLUMN public.customer_message_extractions.intent IS 
  'What customer wants: repair, quote, status_check, buyback, purchase, question, complaint';

COMMENT ON COLUMN public.customer_message_extractions.raw_extracted_data IS 
  'Full JSON of everything AI extracted - for debugging and future features';
