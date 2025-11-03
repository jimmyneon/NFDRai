-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  phone TEXT,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'whatsapp', 'messenger')),
  status TEXT NOT NULL DEFAULT 'auto' CHECK (status IN ('auto', 'manual', 'paused')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('customer', 'ai', 'staff')),
  text TEXT NOT NULL,
  ai_provider TEXT,
  ai_model TEXT,
  ai_confidence NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create prices table
CREATE TABLE public.prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device TEXT NOT NULL,
  repair_type TEXT NOT NULL,
  cost NUMERIC(10,2) NOT NULL,
  turnaround TEXT NOT NULL,
  expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create FAQs table
CREATE TABLE public.faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create docs table
CREATE TABLE public.docs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create AI settings table
CREATE TABLE public.ai_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL,
  api_key TEXT NOT NULL,
  model_name TEXT NOT NULL,
  temperature NUMERIC(3,2) NOT NULL DEFAULT 0.7,
  max_tokens INTEGER NOT NULL DEFAULT 500,
  system_prompt TEXT NOT NULL,
  confidence_threshold NUMERIC(5,2) NOT NULL DEFAULT 70.0,
  fallback_message TEXT NOT NULL DEFAULT 'I''ll pass this to a team member for confirmation.',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create alerts table
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  notified_to TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create staff notes table
CREATE TABLE public.staff_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_conversations_customer ON public.conversations(customer_id);
CREATE INDEX idx_conversations_status ON public.conversations(status);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_alerts_conversation ON public.alerts(conversation_id);
CREATE INDEX idx_staff_notes_conversation ON public.staff_notes(conversation_id);
CREATE INDEX idx_prices_device ON public.prices(device);
CREATE INDEX idx_faqs_question ON public.faqs USING gin(to_tsvector('english', question));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prices_updated_at BEFORE UPDATE ON public.prices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_settings_updated_at BEFORE UPDATE ON public.ai_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_notes ENABLE ROW LEVEL SECURITY;

-- Users policies (authenticated users can read their own data)
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Admin-only policies for sensitive tables
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- All authenticated users can read customers, conversations, messages
CREATE POLICY "Authenticated users can view customers" ON public.customers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view conversations" ON public.conversations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view messages" ON public.messages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view prices" ON public.prices
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view faqs" ON public.faqs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view docs" ON public.docs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view alerts" ON public.alerts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view staff notes" ON public.staff_notes
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admin and manager can insert/update/delete
CREATE POLICY "Admins and managers can manage customers" ON public.customers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins and managers can manage conversations" ON public.conversations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Authenticated users can insert messages" ON public.messages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage prices" ON public.prices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage faqs" ON public.faqs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage docs" ON public.docs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view ai_settings" ON public.ai_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage ai_settings" ON public.ai_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can insert staff notes" ON public.staff_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name', 'employee');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default AI settings
INSERT INTO public.ai_settings (provider, api_key, model_name, system_prompt, active)
VALUES (
  'openai',
  'your-api-key-here',
  'gpt-4-turbo-preview',
  'You are a helpful customer service assistant for New Forest Device Repairs. Be friendly, professional, and concise. Always reference our pricing and FAQ database when answering questions. If you''re not confident about an answer, say so.',
  false
);

-- Insert sample FAQs
INSERT INTO public.faqs (question, answer) VALUES
  ('What are your opening hours?', 'We are open Monday to Friday, 9:00 AM to 6:00 PM, and Saturday 10:00 AM to 4:00 PM. We are closed on Sundays.'),
  ('How long does a typical repair take?', 'Most repairs are completed within 1-2 business days. Screen replacements are often same-day if parts are in stock.'),
  ('Do you offer a warranty?', 'Yes! All repairs come with a 90-day warranty on parts and labor.'),
  ('What payment methods do you accept?', 'We accept cash, all major credit/debit cards, and contactless payments including Apple Pay and Google Pay.');

-- Insert sample prices
INSERT INTO public.prices (device, repair_type, cost, turnaround) VALUES
  ('iPhone 14', 'Screen Replacement', 149.99, 'Same Day'),
  ('iPhone 14', 'Battery Replacement', 79.99, '1-2 Hours'),
  ('iPhone 13', 'Screen Replacement', 129.99, 'Same Day'),
  ('iPhone 13', 'Battery Replacement', 69.99, '1-2 Hours'),
  ('Samsung Galaxy S23', 'Screen Replacement', 199.99, '1-2 Days'),
  ('Samsung Galaxy S23', 'Battery Replacement', 89.99, '1-2 Days'),
  ('iPad Air', 'Screen Replacement', 249.99, '2-3 Days'),
  ('iPad Air', 'Battery Replacement', 149.99, '2-3 Days');
