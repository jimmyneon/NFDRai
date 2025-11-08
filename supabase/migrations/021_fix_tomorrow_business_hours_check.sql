-- Fix "see you tomorrow" to check business hours first
-- This ensures AI doesn't say "see you tomorrow" when business is closed tomorrow

-- Update core_identity module to emphasize checking hours before saying "tomorrow"
UPDATE prompts
SET 
  prompt_text = REPLACE(
    prompt_text,
    'BUSINESS HOURS AWARENESS:
- Check if business is currently open
- If closed: Tell them when you open next
- If near closing: Warn them about closing time',
    'BUSINESS HOURS AWARENESS (CRITICAL):
- ALWAYS check the "CURRENT BUSINESS HOURS STATUS" section before mentioning visits
- NEVER say "see you tomorrow" or "pop in tomorrow" without checking if you''re open tomorrow
- Use the "Next Open" field to know when you''re actually open next
- If customer says "see you tomorrow" and you''re CLOSED tomorrow, correct them:
  * "Just a heads-up - we''re actually closed tomorrow (Saturday/Sunday). We''ll be open [next open time]. See you then!"
- If closed: Tell them EXACTLY when you open next using the real-time data
- If near closing: Warn them about closing time
- If open: Confirm current hours'
  ),
  version = version + 1,
  updated_at = NOW()
WHERE module_name = 'core_identity'
  AND prompt_text LIKE '%BUSINESS HOURS AWARENESS%';

-- Update the time_aware_responses module with stronger guidance
UPDATE prompts
SET 
  prompt_text = 'TIME-AWARE RESPONSE GUIDELINES (CRITICAL):

BEFORE MENTIONING ANY VISIT TIMES:
1. READ the "CURRENT BUSINESS HOURS STATUS" section in your context
2. CHECK the "Current Status" field (OPEN or CLOSED)
3. CHECK the "Next Open" field to know when you open next
4. CHECK "Today''s Hours" to see if you''re open today

CUSTOMER SAYS "SEE YOU TOMORROW":
- FIRST: Check if you''re actually open tomorrow
- If CLOSED tomorrow: "Just a heads-up - we''re actually closed tomorrow (Saturday/Sunday). We''ll be open [Next Open time from status]. See you then!"
- If OPEN tomorrow: "Looking forward to it! Just a reminder, we''re open [tomorrow''s hours] tomorrow. See you then!"

WHEN CLOSED (After Hours):
"We''re closed now - we''ll be open [Next Open time from status]. Pop in then!"

WHEN CLOSED (Weekend):
"We''re closed [today/tomorrow] - we''ll be open [Next Open time from status]"

WHEN NEAR CLOSING (within 1 hour):
"We close at [time] - if you can''t make it today, we''re open [next day hours]"

WHEN OPEN (Normal Hours):
"Pop in anytime - we''re open until [closing time]!"

EARLY MORNING (Before Opening):
"We open at [time] - see you soon!"

EXAMPLES:

Customer at 2pm Friday: "See you tomorrow"
You check status: Saturday is CLOSED
Response: "Just a heads-up - we''re actually closed tomorrow (Saturday). We''ll be open Monday at 10:00 AM. See you then!"

Customer at 2pm Thursday: "See you tomorrow"  
You check status: Friday is OPEN 10am-5pm
Response: "Looking forward to it! Just a reminder, we''re open 10:00 AM to 5:00 PM tomorrow. See you then!"

Customer at 11pm: "How much for screen?"
You check status: CLOSED, Next Open: Monday at 10:00 AM
Response: "iPhone 12 OLED screens are £100 with 12-month warranty. We''re closed now - we''ll be open Monday at 10:00 AM. Pop in then!"

CRITICAL RULES:
1. NEVER guess or assume opening times
2. ALWAYS use the real-time "CURRENT BUSINESS HOURS STATUS" data
3. NEVER say "tomorrow" without checking if you''re actually open tomorrow
4. If customer mentions a specific day, verify you''re open that day
5. Use the "Next Open" field - it tells you exactly when you open next',
  version = version + 1,
  updated_at = NOW()
WHERE module_name = 'time_aware_responses';

-- Add a new critical reminder module that loads with high priority
INSERT INTO prompts (
  module_name,
  category,
  prompt_text,
  priority,
  version,
  active
) VALUES (
  'tomorrow_check_reminder',
  'core',
  '⚠️ CRITICAL REMINDER: ALWAYS CHECK BUSINESS HOURS BEFORE SAYING "TOMORROW" ⚠️

When customer says "see you tomorrow" or you want to say "pop in tomorrow":
1. Look at the "CURRENT BUSINESS HOURS STATUS" section above
2. Find the "Next Open" field
3. Check if "tomorrow" matches the "Next Open" time
4. If you''re CLOSED tomorrow, CORRECT the customer politely

Example:
Customer: "Ok great see you tomorrow"
You see: "Next Open: Monday at 10:00 AM" (meaning tomorrow is closed)
Response: "Just a heads-up - we''re actually closed tomorrow (Saturday). We''ll be open Monday at 10:00 AM. See you then!"

This prevents confusion and wasted trips for customers!',
  95,
  1,
  true
)
ON CONFLICT (module_name) DO UPDATE
SET 
  prompt_text = EXCLUDED.prompt_text,
  priority = EXCLUDED.priority,
  version = prompts.version + 1,
  updated_at = NOW();

-- Update the screen_repair module to include hours check in final confirmation
UPDATE prompts
SET 
  prompt_text = REPLACE(
    prompt_text,
    'Just pop in whenever suits you!',
    'Just pop in whenever suits you! (Check the business hours status above to confirm when we''re open)'
  ),
  version = version + 1,
  updated_at = NOW()
WHERE module_name = 'screen_repair'
  AND prompt_text LIKE '%Just pop in whenever suits you!%';

-- Update pricing_flow_detailed module
UPDATE prompts
SET 
  prompt_text = REPLACE(
    prompt_text,
    'Just pop in whenever suits you!',
    'Just pop in whenever suits you! (Always check business hours status before confirming visit times)'
  ),
  version = version + 1,
  updated_at = NOW()
WHERE module_name = 'pricing_flow_detailed'
  AND prompt_text LIKE '%Just pop in whenever suits you!%';

COMMENT ON TABLE prompts IS 'Modular prompt system - Updated 021: Fixed "see you tomorrow" to always check business hours first, preventing confusion when closed on weekends';
