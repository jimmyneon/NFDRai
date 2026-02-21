-- Final removal of ALL John handoff phrases from remaining 4 modules
-- These modules still have phrases that mention John in various contexts

-- 1. core_identity - Remove "I'll pass this to John" from CRITICAL section
UPDATE prompts
SET prompt_text = REPLACE(
  prompt_text,
  'CRITICAL: NEVER say "I''ll pass this to John" or "I''ll forward this to John"!',
  'CRITICAL: NEVER mention passing or forwarding to John!'
),
version = version + 1,
updated_at = NOW()
WHERE module_name = 'core_identity';

-- 2. unknown_service_policy - Remove "check with John" phrase
UPDATE prompts
SET prompt_text = REPLACE(
  prompt_text,
  'If you are unsure whether we offer something, assume it MAY be possible and say you will check with John and get back to them ASAP.',
  'If you are unsure whether we offer something, assume it MAY be possible and direct them to the start page for more info.'
),
version = version + 1,
updated_at = NOW()
WHERE module_name = 'unknown_service_policy';

UPDATE prompts
SET prompt_text = REPLACE(
  prompt_text,
  '"We can likely help, but it depends on the exact situation. If you tell me the model and what it''s doing, I''ll check with John and get back to you ASAP."',
  '"We can likely help, but it depends on the exact situation. You can get more info here: https://www.newforestdevicerepairs.co.uk/start or pop in during opening hours."'
),
version = version + 1,
updated_at = NOW()
WHERE module_name = 'unknown_service_policy';

-- 3. status_check - Remove "I'll pass to John" from NEVER SAY section
UPDATE prompts
SET prompt_text = REPLACE(
  prompt_text,
  '6. NEVER say "I''ll pass to John"',
  '6. NEVER mention John in responses'
),
version = version + 1,
updated_at = NOW()
WHERE module_name = 'status_check';

-- 4. handoff_rules - Remove all "pass to John" and "get John" phrases
UPDATE prompts
SET prompt_text = REPLACE(
  REPLACE(
    prompt_text,
    '5. MORE THAN 2 ISSUES - "Bear with me and I''ll get John to come up with a custom quote - we often make it cheaper if you get multiple things done at the same time"',
    '5. MORE THAN 2 ISSUES - Direct to start page for custom quote: https://www.newforestdevicerepairs.co.uk/start - mention we offer discounts for multiple repairs'
  ),
  'DO NOT PASS TO JOHN FOR:',
  'DO NOT ESCALATE FOR:'
),
version = version + 1,
updated_at = NOW()
WHERE module_name = 'handoff_rules';

-- 5. services_comprehensive - Remove "John can check" phrase
UPDATE prompts
SET prompt_text = REPLACE(
  prompt_text,
  '- If the network says "it''s nothing to do with us": suggest popping it in so John can check the IMEI/status and advise the best route.',
  '- If the network says "it''s nothing to do with us": suggest popping in during opening hours so we can check the IMEI/status and advise the best route.'
),
version = version + 1,
updated_at = NOW()
WHERE module_name = 'services_comprehensive';

UPDATE prompts
SET prompt_text = REPLACE(
  prompt_text,
  '- For cost/time: it varies by device/network; John will confirm once he''s seen it.',
  '- For cost/time: it varies by device/network; we''ll confirm once we''ve seen it in person.'
),
version = version + 1,
updated_at = NOW()
WHERE module_name = 'services_comprehensive';

-- Final verification with detailed output
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
      LOWER(prompt_text) LIKE '%check with john%' OR
      LOWER(prompt_text) LIKE '%get john%' OR
      LOWER(prompt_text) LIKE '%john can%' OR
      LOWER(prompt_text) LIKE '%john will%'
    );
  
  IF remaining_count > 0 THEN
    RAISE NOTICE 'WARNING: Still found % modules with John references: %', remaining_count, module_list;
  ELSE
    RAISE NOTICE '✅ SUCCESS: ALL John handoff language completely removed!';
  END IF;
END $$;

COMMENT ON TABLE prompts IS 'Modular prompt system - Updated 078: Final removal of ALL John handoff phrases from all modules';
