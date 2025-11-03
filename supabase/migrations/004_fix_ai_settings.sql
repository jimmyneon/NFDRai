-- Fix AI settings table to ensure only one active setting at a time

-- First, delete all but the most recent ai_settings entry
DELETE FROM public.ai_settings
WHERE id NOT IN (
  SELECT id FROM public.ai_settings
  ORDER BY created_at DESC
  LIMIT 1
);

-- Add a unique constraint to ensure only one active setting
-- (This will prevent multiple active settings in the future)
CREATE UNIQUE INDEX IF NOT EXISTS ai_settings_single_active 
ON public.ai_settings (active) 
WHERE active = true;

-- Ensure the remaining setting is active
UPDATE public.ai_settings SET active = true;
