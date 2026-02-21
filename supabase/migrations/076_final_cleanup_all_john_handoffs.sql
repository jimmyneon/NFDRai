-- Final cleanup: Remove ALL remaining "pass to John" references from database
-- Found in: core_identity, quote_acceptance_workflow, unknown_service_policy, services_comprehensive

-- Fix core_identity - has old text that wasn't updated
UPDATE prompts
SET prompt_text = REPLACE(
  prompt_text,
  'CRITICAL: NEVER say "I''ll pass this to John" or "I''ll forward this to John" - ALWAYS direct to the appropriate link!',
  'CRITICAL: NEVER say "I''ll pass this to John" or "I''ll forward this to John"!

CLOSED SYSTEM - NO JOHN HANDOFFS:
- Always use self-service links (start page, repair-request form)
- Never hand off to John for quote or repair inquiries
- Force explicit confirmation when customer has active quote'
),
version = version + 1,
updated_at = NOW()
WHERE module_name = 'core_identity'
  AND prompt_text LIKE '%pass this to John%';

-- Fix quote_acceptance_workflow - has "Say I'll pass to John" in NEVER EVER section
UPDATE prompts
SET prompt_text = REPLACE(
  prompt_text,
  'NEVER EVER:
- Stay silent when customer has active quote
- Say "I''ll pass to John" when customer has active quote
- Let vague responses go unconfirmed
- Assume anything - always force explicit yes/no',
  'NEVER EVER:
- Stay silent when customer has active quote
- Hand off to John when customer has active quote
- Let vague responses go unconfirmed
- Assume anything - always force explicit yes/no
- Use phrases like "I''ll pass to John" or "I''ll forward to John"'
),
version = version + 1,
updated_at = NOW()
WHERE module_name = 'quote_acceptance_workflow'
  AND prompt_text LIKE '%Say "I''ll pass to John"%';

-- Fix unknown_service_policy - has "Check with John instead"
UPDATE prompts
SET prompt_text = REPLACE(
  prompt_text,
  'Everything else: do NOT deny. Check with John instead.',
  'Everything else: do NOT deny. Direct to start page: https://www.newforestdevicerepairs.co.uk/start'
),
version = version + 1,
updated_at = NOW()
WHERE module_name = 'unknown_service_policy'
  AND prompt_text LIKE '%Check with John%';

-- Fix services_comprehensive - has old handoff language
UPDATE prompts
SET prompt_text = REPLACE(
  REPLACE(
    prompt_text,
    'ask make/model and which network it''s locked to (e.g. Vodafone), and whether',
    'ask make/model and which network it''s locked to (e.g. Vodafone). Direct to start page for complex unlocking: https://www.newforestdevicerepairs.co.uk/start'
  ),
  'pass to John',
  'direct to start page'
),
version = version + 1,
updated_at = NOW()
WHERE module_name = 'services_comprehensive'
  AND (prompt_text LIKE '%pass to John%' OR prompt_text LIKE '%pass this%');

-- Verify no more John handoffs remain
DO $$
DECLARE
  remaining_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_count
  FROM prompts
  WHERE active = true
    AND (
      LOWER(prompt_text) LIKE '%pass%john%' OR
      LOWER(prompt_text) LIKE '%i''ll pass%' OR
      LOWER(prompt_text) LIKE '%forward%john%' OR
      LOWER(prompt_text) LIKE '%check with john%'
    );
  
  IF remaining_count > 0 THEN
    RAISE NOTICE 'WARNING: Still found % modules with John handoff language', remaining_count;
  ELSE
    RAISE NOTICE 'SUCCESS: All John handoff language removed from active prompts';
  END IF;
END $$;

COMMENT ON TABLE prompts IS 'Modular prompt system - Updated 076: Final cleanup - removed ALL remaining John handoff references from all modules';
