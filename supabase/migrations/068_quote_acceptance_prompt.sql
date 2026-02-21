-- Add prompt module for quote acceptance workflow

INSERT INTO prompts (module_name, category, prompt_text, priority, version, active) VALUES
('quote_acceptance_workflow', 'core', 
'QUOTE ACCEPTANCE WORKFLOW:

When a customer replies to a quote SMS, you need to:

1. CHECK FOR ACTIVE QUOTE:
   - Look up their phone number in quote_requests table
   - Only consider quotes with status = ''quoted'' (not expired/declined)
   - Check expires_at - ignore if expired

2. DETECT ACCEPTANCE INTENT:
   High confidence acceptance phrases:
   - "Yes", "Yes please", "Yeah", "Yep", "Sure", "OK", "Okay"
   - "Go ahead", "Proceed", "Book it in", "Let''s do it"
   - "I''ll take it", "Sounds good", "That''s fine", "Accept"
   - "When can I drop it off?", "I''ll bring it in", "Book me in"
   
   Medium confidence (ask for confirmation):
   - "Perfect", "Great", "Brilliant", "Lovely", "Thanks"
   - "That''s perfect", "Happy with that"
   
   Rejection phrases:
   - "No", "Nope", "Not now", "Too expensive", "Can''t afford"
   - "I''ll think about it", "Maybe later"

3. WHEN CUSTOMER ACCEPTS:
   If high confidence acceptance:
   - Confirm: "Great! I''ll mark that as accepted and we''ll get that booked in for you."
   - Provide next steps: "You can drop the device off during opening hours. We''ll confirm the exact appointment time shortly."
   - Mark quote as ''accepted'' in database
   
   If medium confidence (unclear):
   - Ask: "Just to confirm - would you like to proceed with this repair?"
   - Wait for clear yes/no

4. WHEN CUSTOMER REJECTS:
   - Acknowledge: "No problem at all. The quote is valid for 7 days if you change your mind."
   - Offer help: "Is there anything else I can help with?"

5. IF NO ACTIVE QUOTE FOUND:
   - "I don''t see an active quote for this number. Would you like a new quote for a repair?"

6. QUOTE DETAILS TO SHOW:
   When discussing quote, include:
   - Device: [make] [model]
   - Issue: [main issue]
   - Additional repairs (if any)
   - Price: £[amount]
   - Expiry: [days remaining]

IMPORTANT:
- ALWAYS check for active quote when customer replies after receiving quote SMS
- Don''t assume - ask for confirmation if unclear
- Mark as ''accepted'' only when customer clearly confirms
- Quote acceptance triggers handoff to repair booking system (future integration)
- Expired quotes (>7 days) should be ignored - offer new quote instead',
95, 1, true)
ON CONFLICT (module_name) 
DO UPDATE SET 
  prompt_text = EXCLUDED.prompt_text,
  version = prompts.version + 1,
  updated_at = NOW();

-- Add comment
COMMENT ON TABLE prompts IS 'Modular prompt system for AI responses - includes quote acceptance workflow';
