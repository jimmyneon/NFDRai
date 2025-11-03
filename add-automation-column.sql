-- Add automation_enabled column to ai_settings
ALTER TABLE public.ai_settings 
ADD COLUMN IF NOT EXISTS automation_enabled BOOLEAN NOT NULL DEFAULT true;

-- Set it to true (enable AI)
UPDATE public.ai_settings 
SET automation_enabled = true 
WHERE active = true;

-- Verify
SELECT 
  id,
  provider,
  active,
  automation_enabled,
  price_checking_enabled
FROM ai_settings;
