-- Global cleanup: Replace ALL John handoff phrases across ALL modules in one go
-- This avoids the issue of multiple migrations conflicting with each other

-- Single comprehensive update that fixes ALL modules at once
UPDATE prompts
SET 
  prompt_text = REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              REGEXP_REPLACE(
                REGEXP_REPLACE(
                  REGEXP_REPLACE(
                    REGEXP_REPLACE(
                      prompt_text,
                      'John will', 'we''ll', 'gi'
                    ),
                    'John can', 'we can', 'gi'
                  ),
                  'John should', 'we should', 'gi'
                ),
                'to John', 'to staff', 'gi'
              ),
              'with John', 'with staff', 'gi'
            ),
            'get John', 'get staff', 'gi'
          ),
          'ask John', 'ask staff', 'gi'
        ),
        'pass.*?John', 'escalate', 'gi'
      ),
      'forward.*?John', 'escalate', 'gi'
    ),
    'JOHN HANDOFFS', 'STAFF HANDOFFS', 'gi'
  ),
  version = version + 1,
  updated_at = NOW()
WHERE active = true
  AND LOWER(prompt_text) ~ '(john)';

-- Verification
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
    RAISE NOTICE 'Remaining modules with John references: %', module_list;
    RAISE NOTICE 'Count: %', remaining_count;
  ELSE
    RAISE NOTICE '✅ SUCCESS: ALL John handoff references removed!';
  END IF;
END $$;

COMMENT ON TABLE prompts IS 'Modular prompt system - Updated 081: Global cleanup of all John references using nested REGEXP_REPLACE';
