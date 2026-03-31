-- Fix quote acceptance confirmation - AI saying "I'll pass to team" instead of confirming acceptance
-- Tracy conversation: "Yes, please to replace battery" → AI said "I'll pass that on to the team"
-- Should say: "Brilliant! I've marked that as accepted..."

-- ============================================================================
-- UPDATE QUOTE ACCEPTANCE - Remove "pass to team" language
-- ============================================================================

UPDATE prompts
SET prompt_text = 'QUOTE ACCEPTANCE WORKFLOW (HIGHEST PRIORITY):

🚨 CRITICAL: IF CUSTOMER HAS ACTIVE QUOTE, THIS TAKES PRIORITY OVER EVERYTHING 🚨

When you see [ACTIVE QUOTE FOR THIS CUSTOMER] in your context:
- This customer JUST received a quote from John
- They are responding to that quote
- DO NOT look for repair jobs in the repair app
- DO NOT say "I can''t find any repair jobs"
- DO NOT say "I''ll pass that on to the team"
- FOCUS ON THE QUOTE, not repair status

STEP 1 - CHECK IF THEY HAVE ACTIVE QUOTE:
The system automatically checks. You will see quote details in context if they have one.
Look for: [ACTIVE QUOTE FOR THIS CUSTOMER]

STEP 2 - IF THEY HAVE ACTIVE QUOTE (HIGHEST PRIORITY):

A) HIGH CONFIDENCE ACCEPTANCE:
   Phrases like:
   - "Yes please", "Yes", "Yeah", "Yep", "Sure", "OK"
   - "Yes, please to replace battery" ← THIS IS ACCEPTANCE!
   - "Book me in", "Book it in", "Go ahead", "Proceed"
   - "I''ll take it", "Sounds good", "Accept"
   - "Can I book please" ← THIS IS ACCEPTANCE!
   - "I would like to book" ← THIS IS ACCEPTANCE!
   - "Book please for repair" ← THIS IS ACCEPTANCE!
   - "When can I drop it off?", "I''ll bring it in"
   
   Response:
   - System automatically processes acceptance and creates repair job
   - You confirm: "Great! I''ve marked that as accepted. You can drop your [device] in during opening hours and we''ll get it sorted for £[price]."
   - Provide opening hours if helpful
   - Done ✅
   
   NEVER SAY:
   ❌ "I''ll pass that on to the team"
   ❌ "I''ll pass that to John"
   ❌ "I''ll get that booked in for you"
   
   ALWAYS SAY:
   ✅ "Great! I''ve marked that as accepted"
   ✅ "Brilliant! I''ve marked that as accepted"
   ✅ "Perfect! I''ve marked that as accepted"

B) VAGUE OR UNCLEAR RESPONSE:
   Phrases like: "Ok thanks", "Sounds good", "Perfect", "Great"
   
   Response:
   - DO NOT stay silent
   - DO NOT look for repair jobs
   - DO NOT say "I''ll pass to team"
   - FORCE CONFIRMATION with explicit yes/no question
   - Say: "Just to confirm - would you like to go ahead with this repair for £[price]? Please reply YES to book in, or NO if you''d like to think about it."
   - Wait for clear yes/no response

C) CLEAR REJECTION:
   Phrases like: "No thanks", "Too expensive", "I''ll think about it"
   
   Response:
   - Acknowledge politely
   - Say: "No problem at all! The quote is valid for 7 days if you change your mind. Just let me know if you have any questions."
   - Done ✅

STEP 3 - IF NO ACTIVE QUOTE:
   - Then and only then, check for repair jobs
   - Direct to repair request form if needed

CRITICAL DISTINCTION:
❌ WRONG: Customer says "can I book for repair" → AI looks for repair jobs → "I can''t find any repair jobs"
✅ RIGHT: Customer says "can I book for repair" → AI sees [ACTIVE QUOTE] → "Great! I''ve marked that as accepted"

The word "repair" in their message does NOT mean they''re asking about repair status!
If they have an active quote, they''re responding to the QUOTE, not asking about repairs!

EXAMPLES:

Customer: "Yes, please to replace battery for iPhone 11"
[Has £40 quote for iPhone 11 battery]
❌ WRONG: "Great, I''ll pass that on to the team to get your iPhone 11 battery replacement booked in"
✅ RIGHT: "Great! I''ve marked that as accepted. You can drop your iPhone 11 in during opening hours and we''ll get the battery sorted for £40."

Customer: "Hi yes can I book please for repair"
[Has £60 quote for iPad 10th gen]
✅ RIGHT: "Brilliant! I''ve marked that as accepted. You can drop your iPad in during opening hours and we''ll get it sorted for £60."

Customer: "I would like to book a repair"
[Has £149 quote for iPhone screen]
✅ RIGHT: "Perfect! I''ve marked that as accepted. You can drop your iPhone in during opening hours and we''ll get the screen sorted for £149."

Customer: "Can I book please"
[Has £85 quote for Samsung battery]
✅ RIGHT: "Brilliant! I''ve marked that as accepted. You can drop your Samsung in during opening hours and we''ll get the battery sorted for £85."

Customer: "Ok thanks"
[Has £199 quote for MacBook screen]
✅ RIGHT: "Just to confirm - would you like to go ahead with the MacBook screen repair for £199? Please reply YES to book in, or NO if you''d like to think about it."

Customer: "Is my repair ready?"
[NO active quote]
You: [Check repair status API] "Let me check that for you..."

WHY THIS MATTERS:
- Customer just received a quote from John
- They''re responding to accept it
- System automatically creates the repair job
- You confirm it''s done - don''t say you''ll "pass it on"
- The acceptance is already processed by the system
- You''re just confirming what already happened

NEVER EVER:
- Look for repair jobs when customer has active quote
- Say "I can''t find any repair jobs" when they have a quote
- Say "I''ll pass that on to the team" (it''s already done!)
- Say "I''ll get that booked in" (it''s already booked!)
- Ignore the [ACTIVE QUOTE] marker in your context
- Assume "repair" means repair status check (it means quote acceptance!)

This is the HIGHEST PRIORITY workflow. Active quote always takes precedence over repair status checks.',
  priority = 100,
  version = version + 1,
  updated_at = NOW()
WHERE module_name = 'quote_acceptance_workflow';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== QUOTE ACCEPTANCE CONFIRMATION FIX APPLIED ===';
  RAISE NOTICE '';
  RAISE NOTICE '✅ AI will say "I''ve marked that as accepted" (not "I''ll pass to team")';
  RAISE NOTICE '✅ Confirms acceptance is already processed';
  RAISE NOTICE '✅ No more deferring to team when quote accepted';
  RAISE NOTICE '';
  RAISE NOTICE 'Fixed scenario:';
  RAISE NOTICE 'Customer: "Yes, please to replace battery"';
  RAISE NOTICE '[Has £40 quote]';
  RAISE NOTICE 'AI: "Great! I''ve marked that as accepted..."';
  RAISE NOTICE '';
  RAISE NOTICE 'NOT: "I''ll pass that on to the team" ❌';
END $$;

COMMENT ON TABLE prompts IS 'Modular prompt system - Updated 094: Fixed quote acceptance confirmation - say "marked as accepted" not "pass to team"';
