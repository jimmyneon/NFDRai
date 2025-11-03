-- Enhance docs table with categories and better organization
ALTER TABLE public.docs ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general';
ALTER TABLE public.docs ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE public.docs ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.docs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Add index for better search performance
CREATE INDEX IF NOT EXISTS idx_docs_category ON public.docs(category);
CREATE INDEX IF NOT EXISTS idx_docs_active ON public.docs(active);
CREATE INDEX IF NOT EXISTS idx_docs_tags ON public.docs USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_docs_content_search ON public.docs USING gin(to_tsvector('english', title || ' ' || content));

-- Add updated_at trigger
CREATE TRIGGER update_docs_updated_at BEFORE UPDATE ON public.docs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies for docs management
CREATE POLICY "Admins can manage docs" ON public.docs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert sample docs
INSERT INTO public.docs (title, content, category, tags, active) VALUES
  (
    'Warranty Policy',
    'All repairs come with a 90-day warranty on parts and labor. This warranty covers defects in workmanship and parts failure. It does not cover accidental damage, liquid damage, or misuse of the device after repair.',
    'policies',
    ARRAY['warranty', 'terms', 'repairs'],
    true
  ),
  (
    'Pricing Information',
    'Our pricing is competitive and transparent. All quotes include parts and labor. We offer same-day service for most screen replacements when parts are in stock. Battery replacements typically take 1-2 hours.',
    'pricing',
    ARRAY['pricing', 'quotes', 'turnaround'],
    true
  ),
  (
    'Data Protection Policy',
    'We take your privacy seriously. We do not access your personal data during repairs unless absolutely necessary for testing. We recommend backing up your device before any repair. We are not responsible for data loss during repairs.',
    'policies',
    ARRAY['privacy', 'data', 'gdpr'],
    true
  ),
  (
    'Payment Terms',
    'Payment is due upon completion of repair. We accept cash, all major credit/debit cards, and contactless payments including Apple Pay and Google Pay. We do not offer payment plans at this time.',
    'policies',
    ARRAY['payment', 'terms'],
    true
  )
ON CONFLICT DO NOTHING;

-- Add comment
COMMENT ON TABLE public.docs IS 'Knowledge base documents for policies, pricing info, terms & conditions that AI can reference';
