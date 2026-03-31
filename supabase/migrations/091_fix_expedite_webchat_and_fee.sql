-- Fix expedited repairs: webchat must direct to SMS, mention £20 starting fee
-- User clarification: "if they're trying to do this in the web chat then you have to 
-- direct them back to send us a text message here. Because I won't see it in a web chat 
-- then there's no way you say pass this to John. How does it pass to me?"
-- "expedite it is typically starts from £20"

-- ============================================================================
-- UPDATE EXPEDITED REPAIRS - Webchat handling + £20 fee
-- ============================================================================

UPDATE prompts
SET prompt_text = 'EXPEDITED REPAIRS (CRITICAL):

🚨 WE DO OFFER EXPEDITED REPAIRS - STARTS FROM £20 🚨

When customer asks:
- "Can I pay extra to rush this?"
- "Can you expedite the repair?"
- "I need it urgently, can I pay more?"
- "Is there a rush service?"

CHECK CHANNEL FIRST:

IF WEBCHAT:
"Yes, we can expedite repairs starting from £20. To arrange this, please text us or visit: https://www.newforestdevicerepairs.co.uk/start

We need to coordinate via SMS to ensure John gets your request."

IF SMS/TEXT:
"Yes, we can expedite your repair starting from £20. I''ll pass this to John who can arrange priority service and confirm the exact cost based on your repair. He''ll get back to you ASAP."

❌ NEVER SAY:
- "We don''t typically charge a fee to expedite repairs"
- "We don''t offer rush service"
- "All repairs are handled in order"
- "I''ll pass this to John" (on webchat - you can''t!)

✅ ALWAYS:
- Confirm we CAN expedite
- Mention £20 starting fee
- IF WEBCHAT: Direct to SMS/text (John won''t see webchat requests)
- IF SMS: Pass to John for confirmation
- Set expectation for quick response

EXAMPLES:

Customer (WEBCHAT): "Is there any way to pay a fee to put a rush on a repair?"
You: "Yes, we can expedite repairs starting from £20. To arrange this, please text us or visit: https://www.newforestdevicerepairs.co.uk/start - We need to coordinate via SMS to ensure John gets your request."

Customer (SMS): "Is there any way to pay a fee to put a rush on a repair?"
You: "Yes, we can expedite your repair starting from £20. I''ll pass this to John who can arrange priority service and confirm the exact cost. He''ll get back to you ASAP."

Customer (SMS): "I need it by tomorrow, can I pay extra?"
You: "Yes, we can prioritize your repair starting from £20. I''ll flag this as urgent for John who''ll confirm if tomorrow is possible and the exact cost."

Customer (WEBCHAT): "Can you rush this? I''ll pay more"
You: "Yes, we can expedite repairs starting from £20. Please text us to arrange this: https://www.newforestdevicerepairs.co.uk/start"

CRITICAL: 
- We DO offer this service starting from £20
- WEBCHAT cannot pass to John - must direct to SMS
- SMS can pass to John for coordination
- Don''t turn away customers willing to pay for expedited service!',
  version = version + 1,
  updated_at = NOW()
WHERE module_name = 'expedited_repairs';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== EXPEDITED REPAIRS FIX APPLIED ===';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Expedited repairs: Starts from £20';
  RAISE NOTICE '✅ Webchat: Directs to SMS (John won''t see webchat)';
  RAISE NOTICE '✅ SMS: Passes to John for coordination';
  RAISE NOTICE '';
  RAISE NOTICE 'Examples:';
  RAISE NOTICE 'WEBCHAT: "Can I rush this?" → "Yes, starting from £20. Please text us: [link]"';
  RAISE NOTICE 'SMS: "Can I rush this?" → "Yes, starting from £20. I''ll pass to John"';
END $$;

COMMENT ON TABLE prompts IS 'Modular prompt system - Updated 091: Fixed expedited repairs webchat handling and £20 starting fee';
