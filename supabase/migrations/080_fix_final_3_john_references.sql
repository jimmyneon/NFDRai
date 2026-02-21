-- Fix the final 3 modules with John references

-- 1. core_identity - Remove "to John" from CRITICAL section
UPDATE prompts
SET prompt_text = REPLACE(
  prompt_text,
  'CRITICAL: NEVER mention passing or forwarding to John!',
  'CRITICAL: NEVER mention passing or forwarding to staff!'
),
version = version + 1,
updated_at = NOW()
WHERE module_name = 'core_identity';

UPDATE prompts
SET prompt_text = REPLACE(
  prompt_text,
  'CLOSED SYSTEM - NO JOHN HANDOFFS:',
  'CLOSED SYSTEM - SELF-SERVICE ONLY:'
),
version = version + 1,
updated_at = NOW()
WHERE module_name = 'core_identity';

-- 2. pricing_reminder - Replace "John will send" with "you'll receive"
UPDATE prompts
SET prompt_text = REGEXP_REPLACE(
  prompt_text,
  'John will send you the exact price',
  'you''ll receive the exact price',
  'gi'
),
version = version + 1,
updated_at = NOW()
WHERE module_name = 'pricing_reminder';

-- 3. webchat_contact_collection - Replace "John will" with "we'll"
UPDATE prompts
SET prompt_text = REGEXP_REPLACE(
  prompt_text,
  'confirm John will be in touch',
  'confirm we''ll be in touch',
  'gi'
),
version = version + 1,
updated_at = NOW()
WHERE module_name = 'webchat_contact_collection';

UPDATE prompts
SET prompt_text = REGEXP_REPLACE(
  prompt_text,
  'John will text/email you',
  'we''ll text/email you',
  'gi'
),
version = version + 1,
updated_at = NOW()
WHERE module_name = 'webchat_contact_collection';

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
    AND LOWER(prompt_text) ~ '(pass.*john|forward.*john|john\s+(will|can|should|might|could)|check\s+with\s+john|get\s+john|ask\s+john|to\s+john)';
  
  IF remaining_count > 0 THEN
    RAISE NOTICE 'WARNING: Still found % modules with John references: %', remaining_count, module_list;
  ELSE
    RAISE NOTICE '🎉 🎉 🎉 SUCCESS: ALL John references COMPLETELY REMOVED! 🎉 🎉 🎉';
  END IF;
END $$;

COMMENT ON TABLE prompts IS 'Modular prompt system - Updated 080: Fixed final 3 modules - ALL John references now removed';
