-- Add device mismatch handling to AI prompts
-- When customer mentions different device model than quoted, AI should redirect to repair-request form

-- Update quote_acceptance_workflow to handle device mismatches
INSERT INTO prompts (module_name, prompt_text, active, priority, category)
VALUES (
  'device_mismatch_handling',
  'DEVICE MODEL MISMATCH HANDLING:

When customer has an active quote but mentions a DIFFERENT device model:

CRITICAL RULES:
1. DO NOT accept the quote for the wrong device
2. Politely explain the difference
3. Direct to repair-request form to get new quote for correct device

EXAMPLE SCENARIO:

Quote: Pixel 6 battery replacement - £65
Customer: "Thanks John. It is a pixel 6a Yes to battery replacement, pls go ahead"

CORRECT RESPONSE:
"Thanks for clarifying! I see you have a Pixel 6a - the quote we sent was for a Pixel 6. These are different models and may have different pricing.

Let me get you the correct quote for your Pixel 6a battery replacement. John will send it over shortly!

No need to fill out the form again - we'll sort this out for you."

WRONG RESPONSES:
❌ "Perfect! I''ve booked in your Pixel 6 battery replacement" (wrong device!)
❌ "Let me update that to Pixel 6a" (can''t change quotes without verification)
❌ "Please fill out the repair-request form again" (too much friction!)
❌ Proceeding with acceptance without addressing the mismatch

DETECTION:
- Customer says "it''s a [different model]"
- Customer mentions model that doesn''t match quote
- Any clarification about device model

ALWAYS:
- Acknowledge the clarification positively ("Thanks for clarifying!")
- Explain the difference briefly
- Say John will send the correct quote
- Reassure customer they don''t need to fill out form again
- Be helpful and friendly, not accusatory

WORKFLOW:
1. AI detects mismatch and responds as above
2. System creates alert for John
3. Conversation switches to manual mode
4. John sends corrected quote
5. Customer accepts
6. Done

This prevents booking wrong repairs while keeping customer experience smooth!',
  true,
  95,
  'quote_handling'
) ON CONFLICT (module_name) DO UPDATE SET
  prompt_text = EXCLUDED.prompt_text,
  active = EXCLUDED.active,
  priority = EXCLUDED.priority,
  category = EXCLUDED.category,
  version = prompts.version + 1,
  updated_at = NOW();

COMMENT ON TABLE prompts IS 'Modular prompt system - Updated 080: Added device mismatch handling for quote acceptance';
