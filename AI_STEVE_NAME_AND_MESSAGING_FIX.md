# AI Steve Name Usage and Confident Messaging Fix

**Date:** March 30, 2026  
**Migration:** `089_fix_name_usage_and_confident_messaging.sql`  
**Status:** Ready to apply

## Problem Analysis

Based on real conversation thread analysis, AI Steve had several issues:

### 1. **Incorrect Name Usage**
- Used names extracted from partner messages: "My partner Lewis Wilson"
- AI greeted with "Hi Lewis!" when talking to Lewis's partner
- Should only use names with 100% confidence from quote/booking systems

### 2. **Unconfident Messaging**
- ❌ "I don't have access to repair statuses"
- ❌ "Unfortunately, I don't have access to specific timelines"
- ❌ "I can't check that information"
- This created customer doubt and confusion

### 3. **Not Checking API/History**
- Customer: "Is my Samsung available?"
- AI: "I don't have access to repair statuses"
- **BUT:** John had already sent messages about parts being ordered
- **AND:** API data was available in context

### 4. **Turnaround Time Confusion**
- Customer: "When will it be ready?"
- AI: "I don't have access to timelines"
- Should have checked John's previous messages and reiterated that info

## Solutions Implemented

### Fix 1: Name Usage Policy (Priority 100)

**New Module:** `name_usage_policy`

**Rules:**
- ✅ Use name ONLY if from quote/booking system API
- ✅ Use name ONLY if customer explicitly said "My name is..."
- ✅ Use name ONLY if confirmed in previous AI messages
- ❌ DON'T use names from partner messages
- ❌ DON'T use names mentioned in passing
- ❌ DON'T use uncertain extractions

**Default:** When in doubt, use "Hi!" or "Hi there!"

**Examples:**

```
✅ CORRECT:
Context: [ACTIVE QUOTE] Name: Sarah Johnson
AI: "Hi Sarah! Your quote is ready."

✅ CORRECT:
Customer: "My partner Lewis Wilson has a phone with you"
AI: "Hi there! Let me check on that repair for you."
(NOT "Hi Lewis!" - talking to partner, not Lewis)

✅ CORRECT:
Customer: "My name is Carol"
AI: "Hi Carol! How can I help?"
```

### Fix 2: Confident Messaging (Priority 100)

**New Module:** `confident_messaging`

**Philosophy:** Tell customers what you DO know, not what you DON'T know

**Before:**
```
❌ "I don't have access to repair statuses"
❌ "Unfortunately, I don't have access to specific timelines"
❌ "I can't check that information"
```

**After:**
```
✅ Check API data in context
✅ Check conversation history for John's messages
✅ Share the information you HAVE
✅ Provide tracking link
✅ If no data: "We'll be in touch ASAP with an update."
```

**Process:**
1. Check [REPAIR STATUS INFORMATION] in context
2. Check conversation history for John's messages
3. Share what you found
4. Provide tracking link
5. NEVER say "I don't have access"

### Fix 3: Status Check Protocol (Priority 98)

**Updated Module:** `status_check`

**New 4-Step Process:**

**STEP 1:** Check context for API data
- [REPAIR STATUS INFORMATION]
- [ACTIVE QUOTE FOR THIS CUSTOMER]
- [NO REPAIR JOBS FOUND]

**STEP 2:** Check conversation history
- What did John say?
- Parts ordered?
- Timeline mentioned?
- Ready for collection?

**STEP 3:** Respond with what you found
- Share API status
- Reference John's messages
- Provide tracking link

**STEP 4:** If no data found anywhere
- Generic message: "We'll be in touch ASAP with an update."
- Don't apologize
- Keep it simple and confident

**Examples:**

```
Customer: "Is my phone ready?"
Process:
1. Check context → [REPAIR STATUS] Ready for collection
2. Check history → John: "Your device is ready"
3. AI: "Yes! Your phone is ready to collect. John sent you a message earlier confirming it's done."

Customer: "When will it be ready?"
Process:
1. Check context → [REPAIR STATUS] Awaiting parts
2. Check history → John: "Parts ordered, normally next day"
3. AI: "The parts are on order - John mentioned normally next-day delivery. You'll get an update as soon as they arrive and the repair is complete. Track it here: [link]"

Customer: "What's the status?"
Process:
1. Check context → [NO REPAIR JOBS FOUND]
2. Check history → No repair messages
3. AI: "We'll be in touch ASAP with an update."
```

### Fix 4: Updated conversation-state.ts

**Changed:** `follow_up` state guidance

**Before:**
```
- CRITICAL: You CANNOT check repair status - you don't have access
- INSTEAD: "I don't have access to repair statuses, but..."
```

**After:**
```
- CRITICAL: Check [REPAIR STATUS INFORMATION] in your context AND conversation history
- Look for John's previous messages about status, parts, timelines
- Share what you find from API data or conversation history
- NEVER say "I don't have access" - you DO have access
- If genuinely no data: Provide tracking link only
```

## Real-World Impact

### Before (From Actual Conversation):

```
Customer: "Good morning just checking in if the Samsung is available to collect?"

AI: "Hi there! I can't seem to find any repair jobs under this phone number. 
Could you please try texting from the number you used when booking, or provide 
your job reference number?"
```

**Problems:**
- Said "can't find" when should check API
- Asked for info instead of checking history
- John had already sent multiple messages about the repair

### After (Expected):

```
Customer: "Good morning just checking in if the Samsung is available to collect?"

AI: "The parts are on order - John mentioned normally next-day delivery. 
You'll get an update as soon as they arrive and the repair is complete. 
Track it here: [link]"
```

**Better because:**
- Checked conversation history
- Referenced John's previous messages
- Provided tracking link
- Confident, helpful tone

## Files Modified

1. **`supabase/migrations/089_fix_name_usage_and_confident_messaging.sql`**
   - New module: `name_usage_policy` (priority 100)
   - New module: `confident_messaging` (priority 100)
   - Updated module: `status_check` (priority 98)

2. **`lib/ai/conversation-state.ts`**
   - Updated `follow_up` state guidance
   - Removed "I don't have access" messaging
   - Added API and history checking instructions

## How to Apply

```bash
# Option 1: Using the script
./apply-089.sh

# Option 2: Manual application
cat supabase/migrations/089_fix_name_usage_and_confident_messaging.sql | \
  PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h "$SUPABASE_DB_HOST" -U postgres -d postgres
```

## Testing Checklist

After applying migration, test these scenarios:

### Name Usage Tests:
- [ ] Partner message: "My partner Lewis has a phone with you" → Should say "Hi there!" not "Hi Lewis!"
- [ ] Quote system: Customer with name in quote → Should use name
- [ ] Explicit: "My name is Sarah" → Should use name
- [ ] Uncertain: Name mentioned in passing → Should use "Hi there!"

### Status Check Tests:
- [ ] Status ready: Should check API and say "ready to collect"
- [ ] Parts ordered: Should reference John's message about parts
- [ ] No data: Should say "We'll be in touch ASAP" (not "I don't have access")
- [ ] Turnaround question: Should reiterate existing info from history

### Confident Messaging Tests:
- [ ] No "I don't have access to..." messages
- [ ] No "Unfortunately, I don't have..." messages
- [ ] No "I can't check..." messages
- [ ] Always provides tracking link or useful info

## Expected Behavior Changes

### Name Usage:
- **More conservative** - only uses names with 100% confidence
- **Safer defaults** - "Hi!" or "Hi there!" when uncertain
- **No more wrong person greetings**

### Status Checks:
- **Always checks API first** - uses [REPAIR STATUS INFORMATION]
- **Always checks history** - references John's messages
- **Confident tone** - shares what IS known
- **Generic fallback** - "We'll be in touch ASAP" when no data

### Turnaround Questions:
- **Reiterates existing info** - from John's messages
- **Doesn't promise new timescales**
- **Provides tracking link**
- **No unconfident messaging**

## Success Metrics

After deployment, monitor for:

1. **Reduction in "I don't have access" messages** → Should be 0%
2. **Increase in API data usage** → Should check context every time
3. **Reduction in wrong name usage** → Should only use verified names
4. **Increase in conversation history references** → Should cite John's messages
5. **Customer satisfaction** → Less confusion, more confidence

## Notes

- Migration is **non-destructive** - adds new modules, updates existing
- All changes are in prompt modules - no code changes required
- Can be rolled back by deactivating the new modules
- Works with existing AI infrastructure
- Minimal changes for maximum impact

## Related Issues Fixed

This migration addresses the issues seen in conversation thread where:
- Customer's partner was incorrectly addressed by name
- AI said "I don't have access" multiple times
- AI didn't check John's previous messages
- Customer became frustrated with repeated "I don't have access" responses
- AI didn't use available API data or conversation history
