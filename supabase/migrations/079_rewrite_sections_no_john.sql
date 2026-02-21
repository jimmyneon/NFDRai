-- Complete rewrite of sections that mention John - remove ALL John references
-- Previous migrations kept adding John back in the replacement text

-- 1. core_identity - Rewrite CRITICAL section completely
UPDATE prompts
SET prompt_text = REGEXP_REPLACE(
  prompt_text,
  'CRITICAL: NEVER say "I''ll pass this to John" or "I''ll forward this to John"!

CLOSED SYSTEM - NO JOHN HANDOFFS:
- Always use self-service links \(start page, repair-request form\)
- Never hand off to John for quote or repair inquiries
- Force explicit confirmation when customer has active quote',
  'CRITICAL: NEVER mention passing or forwarding to staff!

CLOSED SYSTEM - SELF-SERVICE ONLY:
- Always use self-service links (start page, repair-request form)
- Never hand off for quote or repair inquiries
- Force explicit confirmation when customer has active quote',
  'g'
),
version = version + 1,
updated_at = NOW()
WHERE module_name = 'core_identity';

-- 2. pricing_question_handler - Remove "John will" references
UPDATE prompts
SET prompt_text = REGEXP_REPLACE(
  prompt_text,
  'John will',
  'we''ll',
  'gi'
),
version = version + 1,
updated_at = NOW()
WHERE module_name = 'pricing_question_handler';

-- 3. pricing_reminder - Remove "John can" references
UPDATE prompts
SET prompt_text = REGEXP_REPLACE(
  prompt_text,
  'John can',
  'we can',
  'gi'
),
version = version + 1,
updated_at = NOW()
WHERE module_name = 'pricing_reminder';

-- 4. multi_message_best_practices - Remove "John will" references
UPDATE prompts
SET prompt_text = REGEXP_REPLACE(
  prompt_text,
  'John will',
  'we''ll',
  'gi'
),
version = version + 1,
updated_at = NOW()
WHERE module_name = 'multi_message_best_practices';

-- 5. status_check - Rewrite CRITICAL section
UPDATE prompts
SET prompt_text = REGEXP_REPLACE(
  prompt_text,
  'CRITICAL - NEVER SAY:
- Any phrase mentioning passing to John
- Any phrase mentioning forwarding to John
- Any phrase about John getting back to them',
  'CRITICAL - NEVER SAY:
- Any phrase about passing to staff
- Any phrase about forwarding to staff
- Any phrase about staff getting back to them',
  'g'
),
version = version + 1,
updated_at = NOW()
WHERE module_name = 'status_check';

-- 6. confidence_based_handoff - Remove "John will" references
UPDATE prompts
SET prompt_text = REGEXP_REPLACE(
  prompt_text,
  'John will',
  'we''ll',
  'gi'
),
version = version + 1,
updated_at = NOW()
WHERE module_name = 'confidence_based_handoff';

-- 7. common_scenarios - Remove "John will" references
UPDATE prompts
SET prompt_text = REGEXP_REPLACE(
  prompt_text,
  'John will',
  'we''ll',
  'gi'
),
version = version + 1,
updated_at = NOW()
WHERE module_name = 'common_scenarios';

-- 8. webchat_contact_collection - Remove "John can" references
UPDATE prompts
SET prompt_text = REGEXP_REPLACE(
  prompt_text,
  'John can',
  'we can',
  'gi'
),
version = version + 1,
updated_at = NOW()
WHERE module_name = 'webchat_contact_collection';

-- 9. pricing_flow_detailed - Remove "John will" references
UPDATE prompts
SET prompt_text = REGEXP_REPLACE(
  prompt_text,
  'John will',
  'we''ll',
  'gi'
),
version = version + 1,
updated_at = NOW()
WHERE module_name = 'pricing_flow_detailed';

-- Final comprehensive verification
DO $$
DECLARE
  remaining_count INTEGER;
  module_list TEXT;
BEGIN
  SELECT COUNT(*), STRING_AGG(module_name, ', ')
  INTO remaining_count, module_list
  FROM prompts
  WHERE active = true
    AND LOWER(prompt_text) ~ '(pass.*john|forward.*john|john\s+(will|can|should|might|could)|check\s+with\s+john|get\s+john|ask\s+john)';
  
  IF remaining_count > 0 THEN
    RAISE NOTICE 'WARNING: Still found % modules with John references: %', remaining_count, module_list;
  ELSE
    RAISE NOTICE '✅ ✅ ✅ SUCCESS: ALL John references completely removed! ✅ ✅ ✅';
  END IF;
END $$;

COMMENT ON TABLE prompts IS 'Modular prompt system - Updated 079: Complete rewrite of sections to remove ALL John references using regex replacement';
