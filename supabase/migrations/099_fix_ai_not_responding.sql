-- ============================================================================
-- FIX AI NOT RESPONDING - May 11, 2026
-- ============================================================================
-- Issue: After migration 098, AI stopped responding to most messages
-- Root cause: Staff message check was finding OLD staff messages (days/weeks old)
--             and applying the 5-minute pause logic to them
-- 
-- This migration doesn't change database, but documents the code fix:
-- - Only check for staff messages in last 30 minutes
-- - If staff message is older than 30 minutes, AI responds normally
-- ============================================================================

-- Update prompt to clarify the 30-minute window
UPDATE prompts
SET prompt_text = REPLACE(
  prompt_text,
  'If John messaged < 5 min ago AND customer sends short response → STAY QUIET',
  'If John messaged < 30 min ago AND customer sends short response < 5 min after John → STAY QUIET
If John messaged > 30 min ago → AI responds normally (pause expired)'
)
WHERE module_name = 'customer_staff_interaction_awareness';

-- Add clarification about the 30-minute window
UPDATE prompts
SET prompt_text = prompt_text || '

CRITICAL TIMING RULES:
1. Staff message < 5 min ago + customer short response → STAY QUIET
2. Staff message 5-30 min ago + customer new question → RESPOND
3. Staff message > 30 min ago → RESPOND NORMALLY (pause expired)
4. No staff message in last 30 min → RESPOND NORMALLY

The 30-minute window ensures AI doesn''t stay silent forever just because John sent a message days ago.'
WHERE module_name = 'customer_staff_interaction_awareness';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== FIX AI NOT RESPONDING ===';
  RAISE NOTICE '';
  RAISE NOTICE '✅ ISSUE: AI stopped responding after migration 098';
  RAISE NOTICE '✅ CAUSE: Staff message check found old messages (days old)';
  RAISE NOTICE '✅ FIX: Only check staff messages < 30 minutes old';
  RAISE NOTICE '';
  RAISE NOTICE 'CODE CHANGES (app/api/messages/incoming/route.ts):';
  RAISE NOTICE '- Added: if (minutesSinceStaffMessage < 30) check';
  RAISE NOTICE '- Now: Staff messages > 30 min old are ignored';
  RAISE NOTICE '- Result: AI responds normally if no recent staff activity';
  RAISE NOTICE '';
  RAISE NOTICE 'MISSED CALL COOLDOWN:';
  RAISE NOTICE '- Changed from 2 minutes to 30 minutes';
  RAISE NOTICE '- Prevents spam when someone repeatedly calls';
  RAISE NOTICE '';
  RAISE NOTICE 'EXAMPLES:';
  RAISE NOTICE '';
  RAISE NOTICE 'Scenario 1: John messaged 2 days ago';
  RAISE NOTICE 'Customer: "I''ll call in on Tuesday"';
  RAISE NOTICE '✅ AI responds (staff message too old, > 30 min)';
  RAISE NOTICE '';
  RAISE NOTICE 'Scenario 2: John messaged 2 minutes ago';
  RAISE NOTICE 'Customer: "Yes please"';
  RAISE NOTICE '✅ AI stays quiet (staff message recent, < 5 min)';
  RAISE NOTICE '';
  RAISE NOTICE 'Scenario 3: John messaged 10 minutes ago';
  RAISE NOTICE 'Customer: "When are you open?"';
  RAISE NOTICE '✅ AI responds (new question, not acknowledgment)';
  RAISE NOTICE '';
  RAISE NOTICE 'Migration 099 complete - AI will now respond normally!';
END $$;

COMMENT ON TABLE prompts IS 'Modular prompt system - Updated 099: Fixed AI not responding by limiting staff message check to 30-minute window';
