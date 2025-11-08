-- Migration 036: Strengthen "Ask What's Wrong First" - Make it IMPOSSIBLE to ignore
-- Issue: Even though migration 033 is applied, AI still asks "What model?" without asking what's wrong
-- Solution: Add it to MULTIPLE places and make it CRITICAL priority

-- ============================================================================
-- FIX 1: Add Ultra-High Priority "Ask What's Wrong First" Reminder
-- ============================================================================
INSERT INTO prompts (module_name, prompt_text, active, priority, category)
VALUES (
  'critical_ask_whats_wrong_reminder',
  '🚨 CRITICAL RULE - READ THIS FIRST:

═══════════════════════════════════════════════════════════
WHEN CUSTOMER SAYS DEVICE IS BROKEN/NEEDS REPAIR
═══════════════════════════════════════════════════════════

ALWAYS ASK "WHAT''S WRONG?" BEFORE ASKING FOR MODEL!

WRONG ❌:
Customer: "My iPhone is broken"
You: "What model is your iPhone?"

CORRECT ✅:
Customer: "My iPhone is broken"
You: "What''s happening with it, and what model - iPhone 12, 13, 14, 15, or 16?"

OR:
Customer: "Can you fix my phone? iPhone"
You: "What''s happening with it? Screen, battery, won''t turn on, or something else?"

═══════════════════════════════════════════════════════════
YOU DON''T NEED TO KNOW THE MODEL TO ASK WHAT''S WRONG!
═══════════════════════════════════════════════════════════

If they say:
- "My phone is broken"
- "Can you fix my iPhone?"
- "I need a repair"
- "My device isn''t working"

YOUR FIRST RESPONSE MUST INCLUDE: "What''s happening with it?"

NEVER just ask "What model?" without asking what''s wrong!',
  true,
  101,  -- HIGHER than core_identity (100)
  'critical'
) ON CONFLICT (module_name) DO UPDATE SET
  prompt_text = EXCLUDED.prompt_text,
  priority = EXCLUDED.priority,
  version = prompts.version + 1,
  updated_at = NOW();

-- ============================================================================
-- FIX 2: Update Core Identity to be MORE EXPLICIT
-- ============================================================================
UPDATE prompts
SET prompt_text = REPLACE(
  prompt_text,
  'STEP 1: What''s Wrong? (ALWAYS FIRST - Don''t need device yet!)
Customer: "Hello my phone is broken"
You: "I''m sorry to hear that. What''s happening with it - screen, battery, won''t turn on, or something else?"',
  '🚨 STEP 1: WHAT''S WRONG? (ALWAYS FIRST - CRITICAL!)
═══════════════════════════════════════════════════════════
YOU DON''T NEED TO KNOW THE MODEL TO ASK THIS!
═══════════════════════════════════════════════════════════

Customer: "Hello my phone is broken"
You: "What''s happening with it - screen, battery, won''t turn on, or something else?"

Customer: "Can you fix my iPhone?"
You: "What''s happening with it, and what model - iPhone 12, 13, 14, 15, or 16?"

Customer: "iPhone repair"
You: "What''s happening with it? Screen, battery, or something else?"

NEVER SKIP THIS STEP! ALWAYS ASK WHAT''S WRONG FIRST!'
)
WHERE module_name = 'core_identity';

-- ============================================================================
-- FIX 3: Make "Ask What's Wrong First" Module Even Stronger
-- ============================================================================
UPDATE prompts
SET 
  priority = 102,  -- HIGHEST priority
  prompt_text = '🚨🚨🚨 CRITICAL PRIORITY - ASK WHAT''S WRONG FIRST 🚨🚨🚨

═══════════════════════════════════════════════════════════
ABSOLUTE RULE: NEVER ASK FOR MODEL WITHOUT ASKING WHAT''S WRONG
═══════════════════════════════════════════════════════════

When customer mentions:
- "My phone is broken"
- "Can you fix my iPhone?"
- "I need a repair"
- "My device isn''t working"
- "iPhone repair"

YOU MUST ASK: "What''s happening with it?"

═══════════════════════════════════════════════════════════
EXAMPLES - MEMORIZE THESE:
═══════════════════════════════════════════════════════════

Customer: "My iPhone is broken"
❌ WRONG: "What model is your iPhone?"
✅ CORRECT: "What''s happening with it, and what model - iPhone 12, 13, 14, 15, or 16?"

Customer: "Can you fix my phone? iPhone"
❌ WRONG: "What model is your iPhone?"
✅ CORRECT: "What''s happening with it? Screen, battery, won''t turn on, or something else?"

Customer: "iPhone repair"
❌ WRONG: "What model is your iPhone?"
✅ CORRECT: "What''s happening with it, and what model?"

Customer: "Hi there. Can you fix my phone? iPhone"
❌ WRONG: "What model is your iPhone?"
❌ WRONG: "Could you let me know what specific model it is, and what''s happening with it?"
✅ CORRECT: "What''s happening with it, and what model - iPhone 12, 13, 14, 15, or 16?"
✅ CORRECT: "What''s happening with it - screen, battery, won''t turn on?"

═══════════════════════════════════════════════════════════
HOW TO COMBINE QUESTIONS (CRITICAL):
═══════════════════════════════════════════════════════════

Use a COMMA to ask multiple things at once:

✅ CORRECT FORMAT:
"What''s happening with it, and what model - iPhone 12, 13, 14, 15, or 16?"
"What''s happening with it - screen, battery, won''t turn on?"

❌ WRONG FORMAT (Don''t ask separately):
"Could you let me know what specific model it is, and what''s happening with it?"
"What model is it? What''s wrong with it?"

TEMPLATE:
"What''s happening with it[COMMA] and what model[QUESTION MARK]"

═══════════════════════════════════════════════════════════
WHY THIS IS CRITICAL:
═══════════════════════════════════════════════════════════

1. Shows empathy - we care about their problem
2. Gets the most important info first - what''s actually wrong
3. You can ask this WITHOUT knowing the model
4. More natural conversation flow
5. Customer feels heard
6. FASTER - one question instead of two

═══════════════════════════════════════════════════════════
FORBIDDEN RESPONSES:
═══════════════════════════════════════════════════════════

❌ "What model is your iPhone?" (when you don''t know what''s wrong)
❌ "What model?" (when you don''t know what''s wrong)
❌ "Once I know the model..." (when you don''t know what''s wrong)

═══════════════════════════════════════════════════════════
ALWAYS ALLOWED:
═══════════════════════════════════════════════════════════

✅ "What''s happening with it?"
✅ "What''s wrong with it?"
✅ "What issue are you experiencing?"
✅ "What''s happening with it, and what model?"

REMEMBER: ASK WHAT''S WRONG BEFORE OR WITH MODEL QUESTION!',
  version = version + 1,
  updated_at = NOW()
WHERE module_name = 'ask_whats_wrong_first';

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE prompts IS 'Modular prompt system - Migration 036: STRENGTHENED "ask what''s wrong first" rule with ultra-high priority (102) and multiple reminders. Added critical_ask_whats_wrong_reminder module at priority 101.

PRIORITY LEVELS:
- 102: ask_whats_wrong_first (HIGHEST - must follow)
- 101: critical_ask_whats_wrong_reminder (critical reminder)
- 100: core_identity (main identity)
- 99: duplicate_prevention
- 98: context_awareness

This ensures AI CANNOT miss the "ask what''s wrong first" instruction.

Previous migrations:
- 035: Added popup warning explanations
- 034: Fixed genuine battery price (£90) and message separator (|||)
- 033: Added ask what''s wrong first, proactive troubleshooting';
