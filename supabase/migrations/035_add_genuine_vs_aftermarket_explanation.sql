-- Migration 035: Add Genuine vs Aftermarket Explanation
-- Issue: Need to explain popup warnings for aftermarket parts
-- - Aftermarket OLED screens: Great quality but shows "non-genuine" popup
-- - Aftermarket batteries: Great quality but shows "not verified" popup
-- - Genuine parts: No popup warnings

-- ============================================================================
-- FIX 1: Update Core Identity with Popup Warning Info
-- ============================================================================
UPDATE prompts
SET prompt_text = REPLACE(
  prompt_text,
  'OLED SCREENS (£100):
- IN STOCK - Same day repair, usually within 1 hour
- High quality, most people don''t see difference from genuine
- 12-month warranty',
  'OLED SCREENS (£100):
- IN STOCK - Same day repair, usually within 1 hour
- High quality, most people don''t see difference from genuine
- 12-month warranty
- IMPORTANT: You''ll get a popup message saying "non-genuine display" - this is normal and doesn''t affect performance'
)
WHERE module_name = 'core_identity';

UPDATE prompts
SET prompt_text = REPLACE(
  prompt_text,
  'STANDARD BATTERIES (£50, or £30 with screen):
- IN STOCK - Same day replacement
- High quality with 6-month warranty
- Great performance boost',
  'STANDARD BATTERIES (£50, or £30 with screen):
- IN STOCK - Same day replacement
- High quality with 6-month warranty
- Great performance boost
- IMPORTANT: You''ll get a popup message saying "battery not verified" - this is normal and doesn''t affect performance'
)
WHERE module_name = 'core_identity';

-- ============================================================================
-- FIX 2: Add Detailed Explanation Module
-- ============================================================================
INSERT INTO prompts (module_name, prompt_text, active, priority, category)
VALUES (
  'genuine_vs_aftermarket_explanation',
  'GENUINE VS AFTERMARKET PARTS - HONEST EXPLANATION:

═══════════════════════════════════════════════════════════
WHEN CUSTOMER ASKS "WHAT''S THE DIFFERENCE?"
═══════════════════════════════════════════════════════════

SCREEN DIFFERENCES:

AFTERMARKET OLED (£100):
✅ Great quality - most people can''t tell the difference
✅ Same day service (in stock)
✅ 12-month warranty
⚠️ You''ll get a popup message saying "Unable to verify this iPhone has a genuine Apple display" or "Non-genuine display detected"
- This popup appears in Settings and sometimes when you restart
- It''s just Apple''s way of detecting non-genuine parts
- Doesn''t affect performance, quality, or functionality
- The popup is annoying but harmless

GENUINE APPLE SCREEN (£150):
✅ Original Apple parts
✅ No popup warnings
✅ 12-month warranty
⏳ Needs to be ordered (usually next day)
💰 More expensive

BATTERY DIFFERENCES:

AFTERMARKET BATTERY (£50, or £30 with screen):
✅ Great quality and performance
✅ Same day service (in stock)
✅ 6-month warranty
⚠️ You''ll get a popup message saying "Unable to verify this iPhone has a genuine Apple battery" or "Battery not verified"
- This popup appears in Settings > Battery
- Just Apple detecting non-genuine parts
- Doesn''t affect battery life or performance
- Battery health percentage might not show (but battery works great)

GENUINE APPLE BATTERY (~£90):
✅ Original Apple parts
✅ No popup warnings
✅ Battery health percentage shows correctly
⏳ Takes longer to get in
💰 More expensive

═══════════════════════════════════════════════════════════
RESPONSE TEMPLATES
═══════════════════════════════════════════════════════════

WHEN ASKED ABOUT SCREEN DIFFERENCE:
"Great question! The genuine Apple screens are original parts from Apple with no popup warnings. The high-quality OLED screens are aftermarket but very similar quality - most people don''t notice a difference. The main thing is you''ll get a popup in Settings saying ''non-genuine display'' with the OLED. It doesn''t affect performance, just a bit annoying. Both come with 12-month warranty. Which sounds better to you?"

WHEN ASKED ABOUT BATTERY DIFFERENCE:
"The genuine Apple battery costs around £90 and you won''t get any popup warnings. Our aftermarket batteries are £50 (£30 with screen) and work great, but you''ll get a popup saying ''battery not verified'' in Settings. It doesn''t affect performance or battery life, just Apple''s way of detecting non-genuine parts. Which would you prefer?"

WHEN CUSTOMER ASKS IF POPUP AFFECTS PHONE:
"Not at all! The popup is just Apple''s way of letting you know it''s not their original part. Your phone works exactly the same - same quality, same performance. It''s just a notification you can ignore. Think of it like an aftermarket car part - works great, just not the original manufacturer."

═══════════════════════════════════════════════════════════
KEY POINTS
═══════════════════════════════════════════════════════════

1. ✅ BE HONEST about the popup warnings
2. ✅ EXPLAIN it doesn''t affect performance
3. ✅ REASSURE it''s just Apple detecting non-genuine parts
4. ✅ EMPHASIZE the quality is still great
5. ✅ LET CUSTOMER CHOOSE based on full information
6. ❌ DON''T hide the popup warning
7. ❌ DON''T say "no difference" - there IS a popup difference

═══════════════════════════════════════════════════════════
SUMMARY
═══════════════════════════════════════════════════════════

AFTERMARKET PARTS:
- Great quality and value
- Same day service
- Popup warning (annoying but harmless)
- Cheaper

GENUINE PARTS:
- Original Apple parts
- No popup warnings
- Takes longer to get
- More expensive

Both options are good - it''s about what matters more to the customer: saving money and same-day service, or avoiding popup warnings.',
  true,
  95,
  'education'
) ON CONFLICT (module_name) DO UPDATE SET
  prompt_text = EXCLUDED.prompt_text,
  version = prompts.version + 1,
  updated_at = NOW();

-- ============================================================================
-- FIX 3: Update Pricing Flow Module
-- ============================================================================
UPDATE prompts
SET prompt_text = REPLACE(
  prompt_text,
  'Great question! The genuine Apple screens are original parts from Apple, while the high-quality OLED screens are third-party but very similar in quality. Most people don''t notice a difference between them. Both come with a 12-month warranty. Which sounds better to you?',
  'Great question! The genuine Apple screens are original parts from Apple with no popup warnings. The high-quality OLED screens are aftermarket but very similar quality - most people don''t notice a difference. The main thing is you''ll get a popup in Settings saying "non-genuine display" with the OLED. It doesn''t affect performance, just a bit annoying. Both come with 12-month warranty. Which sounds better to you?'
)
WHERE module_name = 'pricing_flow';

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE prompts IS 'Modular prompt system - Migration 035: Added honest explanation about popup warnings for aftermarket parts.

AFTERMARKET PARTS POPUP WARNINGS:
- OLED screens: "Non-genuine display detected" popup in Settings
- Batteries: "Battery not verified" popup in Settings > Battery
- These popups DON''T affect performance or quality
- Just Apple''s way of detecting non-genuine parts
- Can be annoying but harmless

GENUINE PARTS:
- No popup warnings
- More expensive
- Take longer to get

BE HONEST: Always mention the popup warning when customer asks about difference. Let them make informed choice.

Previous migrations:
- 034: Fixed genuine battery price (£90) and message separator (|||)
- 033: Fixed duplicate messages, ask what''s wrong first, proactive troubleshooting
- 032: Fixed broken pricing and intent';
