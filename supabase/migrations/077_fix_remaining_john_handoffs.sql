-- Fix remaining 6 modules that still have John handoff language
-- Migration 076 didn't catch all instances due to exact string matching

-- Fix core_identity - has "I'll pass this to John" in CRITICAL section
UPDATE prompts
SET prompt_text = REPLACE(
  prompt_text,
  'CRITICAL: NEVER say "I''ll pass this to John" or "I''ll forward this to John"!',
  'CRITICAL: NEVER say "I''ll pass this to John" or "I''ll forward this to John"!'
),
version = version + 1,
updated_at = NOW()
WHERE module_name = 'core_identity'
  AND LOWER(prompt_text) LIKE '%i''ll pass this to john%';

-- Fix quote_acceptance_workflow - has "I'll pass to John" in forbidden phrases list
UPDATE prompts
SET prompt_text = REPLACE(
  prompt_text,
  '- Use phrases like "I''ll pass to John" or "I''ll forward to John"',
  '- Use any handoff phrases mentioning John'
),
version = version + 1,
updated_at = NOW()
WHERE module_name = 'quote_acceptance_workflow'
  AND LOWER(prompt_text) LIKE '%i''ll pass to john%';

-- Fix unknown_service_policy - already updated in 076 but verify
UPDATE prompts
SET prompt_text = REPLACE(
  prompt_text,
  'Direct to start page: https://www.newforestdevicerep',
  'Direct to start page: https://www.newforestdevicerepairs.co.uk/start'
),
version = version + 1,
updated_at = NOW()
WHERE module_name = 'unknown_service_policy'
  AND prompt_text LIKE '%newforestdevicerep%'
  AND prompt_text NOT LIKE '%newforestdevicerepairs.co.uk%';

-- Fix status_check - has "I'll pass to John" in NEVER SAY section
UPDATE prompts
SET prompt_text = REPLACE(
  prompt_text,
  'CRITICAL - NEVER SAY:
- "I''ll pass this to John"
- "I''ll forward this to John"
- "John will get back to you"',
  'CRITICAL - NEVER SAY:
- Any phrase mentioning passing to John
- Any phrase mentioning forwarding to John
- Any phrase about John getting back to them'
),
version = version + 1,
updated_at = NOW()
WHERE module_name = 'status_check'
  AND LOWER(prompt_text) LIKE '%i''ll pass this to john%';

-- Fix handoff_rules - has "WHEN TO PASS TO JOHN" section header
UPDATE prompts
SET prompt_text = REPLACE(
  REPLACE(
    prompt_text,
    'WHEN TO PASS TO JOHN (ONLY THESE SITUATIONS):',
    'WHEN TO ESCALATE (ONLY THESE SITUATIONS):'
  ),
  'pass to John',
  'escalate'
),
version = version + 1,
updated_at = NOW()
WHERE module_name = 'handoff_rules'
  AND LOWER(prompt_text) LIKE '%pass to john%';

-- Fix services_comprehensive - has network unlock text
UPDATE prompts
SET prompt_text = REPLACE(
  prompt_text,
  'ask make/model and which network it''s locked to (e.g. Vodafone), and wheth',
  'ask make/model and which network it''s locked to (e.g. Vodafone). Direct to start page for unlocking: https://www.newforestdevicerepairs.co.uk/start'
),
version = version + 1,
updated_at = NOW()
WHERE module_name = 'services_comprehensive'
  AND prompt_text LIKE '%Vodafone), and wheth%';

-- Final verification
DO $$
DECLARE
  remaining_count INTEGER;
  module_list TEXT;
BEGIN
  SELECT COUNT(*), STRING_AGG(module_name, ', ')
  INTO remaining_count, module_list
  FROM prompts
  WHERE active = true
    AND (
      LOWER(prompt_text) LIKE '%pass%john%' OR
      LOWER(prompt_text) LIKE '%i''ll pass%' OR
      LOWER(prompt_text) LIKE '%forward%john%' OR
      LOWER(prompt_text) LIKE '%check with john%'
    );
  
  IF remaining_count > 0 THEN
    RAISE NOTICE 'WARNING: Still found % modules with John handoff: %', remaining_count, module_list;
  ELSE
    RAISE NOTICE 'SUCCESS: All John handoff language removed!';
  END IF;
END $$;

COMMENT ON TABLE prompts IS 'Modular prompt system - Updated 077: Fixed remaining 6 modules with John handoff language';
