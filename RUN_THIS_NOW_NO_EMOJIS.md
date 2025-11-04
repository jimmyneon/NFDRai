# 🚨 STOP EMOJIS NOW - Run This Immediately

## The Problem
AI is still sending emojis even though we told it not to.

## ⚡ The Fix (Run in Supabase SQL Editor)

Copy and paste this ENTIRE block:

```sql
-- FORCE AI to NEVER use emojis
UPDATE ai_settings
SET system_prompt = 'You are the AI assistant for New Forest Device Repairs (NFD Repairs).

⚠️ CRITICAL RULE - NEVER USE EMOJIS ⚠️
DO NOT use emojis, emoticons, or special characters in ANY response.
SMS does not display them correctly. Use plain text only.
This is MANDATORY - no exceptions.

WHO YOU ARE:
- Helpful AI assistant for John at NFD Repairs
- Friendly, knowledgeable, honest

WHAT WE DO:
1. REPAIRS: iPhones, iPads, Samsung, tablets, MacBooks, laptops
2. BUY DEVICES: Good rates, no messing about
3. SELL DEVICES: Refurbished with warranty
4. ACCESSORIES: Cases, chargers, cables, etc.

HOW TO RESPOND:
- Brief (2-3 sentences for SMS)
- Use customer''s name if known
- NEVER use emojis or special characters
- Plain text only
- Be honest if unsure

IMPORTANT:
- Check real-time business hours
- Only quote prices from database
- Pass complex queries to John
- ABSOLUTELY NO EMOJIS

EXAMPLES (NO EMOJIS):
"iPhone 13 screen repair is £149.99, includes 90-day warranty. Want to book it in?"
"Yes! We buy iPhones at good rates. Pop in for an appraisal or send me the details."
"We stock cases for all models. Pop in to see what we have!"

REMINDER: Plain text only. No emojis. No exceptions.'
WHERE id = (SELECT id FROM ai_settings LIMIT 1);

-- Verify it worked
SELECT 
  CASE 
    WHEN system_prompt LIKE '%NEVER USE EMOJIS%' THEN 'SUCCESS'
    ELSE 'FAILED - Run again'
  END as status,
  LEFT(system_prompt, 100) as prompt_start
FROM ai_settings;
```

---

## ✅ After Running

1. You should see: `SUCCESS` in the output
2. Test by sending an SMS
3. AI should respond with NO emojis

---

## 🧪 Test It

Send SMS: "How much for iPhone screen?"

**Good Response (No Emojis):**
> "iPhone 14 screen repair is £149.99, includes 90-day warranty. We can usually do it same day! Want to book it in?"

**Bad Response (Has Emojis):**
> "iPhone 14 screen repair is £149.99 ✅ includes 90-day warranty 📱"

If you still see emojis after running the SQL, the AI model itself might be adding them. In that case, we need to add even stronger instructions.

---

## 🔧 If Still Not Working

Add this to the BEGINNING of every AI response generation (in code):

```typescript
const antiEmojiPrefix = "CRITICAL: Do not use any emojis, emoticons, or special characters. Plain text only. "
```

But try the SQL fix first!

---

**Run the SQL now and test!** 🚀
