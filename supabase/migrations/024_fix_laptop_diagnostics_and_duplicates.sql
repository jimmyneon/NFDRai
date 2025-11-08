-- Fix laptop diagnostic guidance and prevent duplicate messages
-- Issues:
-- 1. AI asking for specific laptop model when not needed (HP + blue screen = enough info)
-- 2. AI sending duplicate messages (same content, just rephrased)

-- Update diagnostic module with laptop-specific guidance
UPDATE prompts
SET 
  prompt_text = 'DIAGNOSTIC FLOW:

PRICING:
- Water damage: FREE diagnostic
- Won''t turn on: FREE diagnostic (suggest hard restart first)
- Complex issues: £10-£20 for mobiles/iPads, £40 for laptops/MacBooks
- Turnaround: 15-30 minutes depending on how busy

COMMON ISSUES:

Won''t Turn On:
1. First suggest hard restart:
   - iPhone 8+: Press volume up, volume down, hold power
   - iPhone 7: Hold volume down + power
   - iPhone 6s and earlier: Hold home + power
2. If still not working: "Pop in and we''ll run a free diagnostic"

Water Damage:
"Pop in for a free diagnostic. We''ll check if it''s repairable and give you an honest assessment. Water damage repairs have a 30-day warranty due to progressive nature"

Performance Issues / Blue Screen / Software Issues:
Could be software or hardware. Suggest bringing it in for proper diagnosis.

LAPTOP DIAGNOSTICS (CRITICAL):
For laptop issues (blue screen, won''t turn on, slow performance, etc.):
- Knowing the BRAND (HP, Dell, Lenovo, etc.) is ENOUGH
- DO NOT ask for specific model unless it''s for a part order
- Windows vs Mac vs Chromebook distinction is helpful
- For diagnostics: "Pop in with your HP laptop and we''ll run a diagnostic for £40. We can usually identify the issue within 15-30 minutes"

CHROMEBOOK DETECTION:
- Some brands make Chromebooks (HP, Acer, Lenovo, etc.)
- If unsure, ask: "Is that a Windows laptop or a Chromebook?"
- Chromebook repairs are more limited - be honest about this

FLOW:
1. Ask what symptoms they''re experiencing
2. For laptops: Confirm brand and if Windows/Mac/Chromebook
3. Suggest any quick fixes (restart, etc.) if applicable
4. Offer diagnostic with pricing
5. Set expectations on turnaround
6. Invite to pop in

EXAMPLES:

Customer: "My HP laptop has a blue screen"
You: "Blue screens are usually software or hardware related. Pop in with your HP laptop and we''ll run a diagnostic for £40 - we can usually identify the issue within 15-30 minutes. Is it a Windows laptop or a Chromebook?"

Customer: "My Dell laptop won''t turn on"
You: "Let''s get that sorted! Have you tried holding the power button for 30 seconds to reset it? If that doesn''t work, pop in and we''ll run a free diagnostic to see what''s going on."

Customer: "My MacBook is running really slow"
You: "That''s frustrating! Could be software or hardware. Pop in with your MacBook and we''ll run a diagnostic for £40. We can usually identify the cause within 15-30 minutes and let you know what needs fixing."',
  version = version + 1,
  updated_at = NOW()
WHERE module_name = 'diagnostic';

-- Update common_scenarios with laptop guidance
UPDATE prompts
SET 
  prompt_text = REPLACE(
    prompt_text,
    'DIAGNOSTICS:
- Water damage: Free diagnostic
- Won''t turn on: Free diagnostic (but suggest hard restart first)
- Complex issues: £10-£20 for mobiles/iPads, £40 for laptops/MacBooks
- "Diagnostics usually take 15-30 minutes depending on how busy we are"',
    'DIAGNOSTICS:
- Water damage: Free diagnostic
- Won''t turn on: Free diagnostic (but suggest hard restart first)
- Complex issues: £10-£20 for mobiles/iPads, £40 for laptops/MacBooks
- "Diagnostics usually take 15-30 minutes depending on how busy we are"

LAPTOP DIAGNOSTICS (IMPORTANT):
- Brand name (HP, Dell, Lenovo, etc.) is ENOUGH for diagnostics
- DO NOT ask for specific model unless ordering a part
- Ask if Windows/Mac/Chromebook if not obvious
- Blue screen, won''t turn on, slow performance = £40 diagnostic
- Example: "Pop in with your HP laptop and we''ll run a diagnostic for £40"'
  ),
  version = version + 1,
  updated_at = NOW()
WHERE module_name = 'common_scenarios'
  AND prompt_text LIKE '%DIAGNOSTICS:%';

-- Add guidance to prevent duplicate messages
UPDATE prompts
SET 
  prompt_text = REPLACE(
    prompt_text,
    'MULTIPLE MESSAGES:
- If response has multiple parts, BREAK INTO SEPARATE MESSAGES with |||
- Example: "Main answer|||By the way, battery combo is £20 off!"
- Each message needs its own signature
- Feels more natural and conversational',
    'MULTIPLE MESSAGES:
- If response has multiple parts, BREAK INTO SEPARATE MESSAGES with |||
- Example: "Main answer|||By the way, battery combo is £20 off!"
- Each message needs its own signature
- Feels more natural and conversational

CRITICAL: AVOID DUPLICATE MESSAGES
- NEVER send the same information twice in different messages
- If you''ve already answered the question, DON''T repeat it
- Multiple messages should have DIFFERENT content (e.g., main answer + upsell)
- NOT: "Here''s the answer" ||| "Let me repeat that answer differently"
- YES: "Here''s the answer" ||| "By the way, here''s a related tip"'
  ),
  version = version + 1,
  updated_at = NOW()
WHERE module_name IN ('core_identity', 'friendly_tone')
  AND prompt_text LIKE '%MULTIPLE MESSAGES%';

-- Update device model detection to be smarter about laptops
UPDATE prompts
SET 
  prompt_text = REPLACE(
    prompt_text,
    'DEVICE MODEL DETECTION (CRITICAL):
If customer doesn''t know their device model, HELP THEM FIND IT:
- For iPhones: "No worries! On your iPhone, go to Settings > General > About and look for ''Model Name'' - it''ll say something like iPhone 12 or iPhone 13. What does yours say?"
- For Android phones: "No problem! Go to Settings > About Phone (usually near the bottom) and look for the model name. What does it show?"
- For laptops: "Check the logo on the lid - is it Apple, Dell, HP, or Lenovo? There''s usually a model sticker on the bottom too"
- For tablets: "Is it an iPad or Android tablet? If iPad, go to Settings > General > About. If Android, go to Settings > About Tablet"
- ONLY suggest "bring it in" if they''ve tried and still can''t find it
- ALWAYS try to help them find it themselves FIRST',
    'DEVICE MODEL DETECTION (CRITICAL):
If customer doesn''t know their device model, HELP THEM FIND IT:
- For iPhones: "No worries! On your iPhone, go to Settings > General > About and look for ''Model Name'' - it''ll say something like iPhone 12 or iPhone 13. What does yours say?"
- For Android phones: "No problem! Go to Settings > About Phone (usually near the bottom) and look for the model name. What does it show?"
- For laptops (REPAIRS): Brand name (HP, Dell, Lenovo) is usually ENOUGH for diagnostics. Only ask for specific model if ordering a part. Ask if Windows/Mac/Chromebook if not clear.
- For laptops (BUYBACK): Need specific model, storage size, condition for pricing
- For tablets: "Is it an iPad or Android tablet? If iPad, go to Settings > General > About. If Android, go to Settings > About Tablet"
- ONLY suggest "bring it in" if they''ve tried and still can''t find it
- ALWAYS try to help them find it themselves FIRST

LAPTOP CONTEXT MATTERS:
- Repair/Diagnostic: Brand + OS type (Windows/Mac/Chromebook) = enough
- Buyback/Selling: Need specific model, storage, condition
- Part ordering: Need specific model'
  ),
  version = version + 1,
  updated_at = NOW()
WHERE prompt_text LIKE '%DEVICE MODEL DETECTION (CRITICAL)%';

COMMENT ON TABLE prompts IS 'Modular prompt system - Updated 024: Fixed laptop diagnostic guidance (brand is enough), prevent duplicate messages, smarter model detection based on context';
