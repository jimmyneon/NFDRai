-- Disable name usage entirely - AI Steve keeps shouting names like "Tracy!"
-- User feedback: "If you can't do it properly, don't use names at all"
-- Issue: Even with 100% confidence rules, AI still using names incorrectly

-- ============================================================================
-- DISABLE NAME USAGE COMPLETELY
-- ============================================================================

UPDATE prompts
SET prompt_text = 'NAME USAGE POLICY (CRITICAL):

🚨 DO NOT USE CUSTOMER NAMES - EVER 🚨

ALWAYS use generic greetings:
✅ "Hi!"
✅ "Hi there!"
✅ "Hello!"

NEVER use customer names:
❌ "Hi Tracy!"
❌ "Tracy!"
❌ "Hi there, Sarah!"
❌ "Hello John!"

WHY:
- Name extraction is unreliable
- AI keeps shouting names ("Tracy!" alone)
- Better to be generic than wrong
- Customers don''t expect personalization from AI

EXAMPLES:

Customer: "Yes, please to replace battery"
❌ WRONG: "Tracy! Great, I''ll pass that on..."
✅ RIGHT: "Great! I''ve marked that as accepted..."

Customer: "My name is Sarah"
❌ WRONG: "Hi Sarah! How can I help?"
✅ RIGHT: "Hi! How can I help?"

Customer has quote with name "John Smith"
❌ WRONG: "Hi John! Your quote is ready"
✅ RIGHT: "Hi! Your quote is ready"

CRITICAL: No names means no mistakes. Keep it simple and professional.',
  version = version + 1,
  updated_at = NOW()
WHERE module_name = 'name_usage_policy';

-- ============================================================================
-- UPDATE GREETING RULE IN CORE SYSTEM
-- ============================================================================

-- This will be applied via code change to smart-response-generator.ts
-- Greeting rule should be: "ALWAYS greet: 'Hi!' or 'Hi there!' - NEVER use customer names"

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== NAME USAGE DISABLED ===';
  RAISE NOTICE '';
  RAISE NOTICE '✅ AI Steve will NO LONGER use customer names';
  RAISE NOTICE '✅ Always uses generic greetings: "Hi!" or "Hi there!"';
  RAISE NOTICE '✅ No more shouting names like "Tracy!"';
  RAISE NOTICE '';
  RAISE NOTICE 'Examples:';
  RAISE NOTICE '  Customer: "Yes please to replace battery"';
  RAISE NOTICE '  AI: "Great! I''ve marked that as accepted..." (no name)';
  RAISE NOTICE '';
  RAISE NOTICE '  Customer has quote with name';
  RAISE NOTICE '  AI: "Hi! Your quote is ready" (no name)';
END $$;

COMMENT ON TABLE prompts IS 'Modular prompt system - Updated 093: Disabled name usage entirely - AI keeps shouting names incorrectly';
