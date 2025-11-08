# Context Switching & Clarification Fix

## Problem

AI misunderstood topic switches and clarifications, treating repair inquiries as status checks.

### Example of the Issue
```
Customer: "How about laptop" (asking about buyback)
AI: (buyback response - but incorrectly said don't buy)
Customer: "then i switch and still I mean for fixing"
AI: "I don't have access to repair statuses myself. However, if you provide 
me with your name and device details, I can pass this on to John..."
```

**Problem:** Customer said **"I mean for fixing"** = wants laptop **REPAIR**, but AI thought they were asking about **repair status**!

## Root Cause

AI didn't recognize clarification phrases like:
- "I mean for fixing" = NEW repair inquiry
- "actually I need it fixed" = Topic switch to repair
- "instead" / "no, I want" = Changing request

AI confused:
- **NEW repair inquiry** ("I mean for fixing") 
- **Status check** ("Is it ready?")

## Solution

### 1. Added Topic Switch Handler Module
New high-priority module (95) that teaches AI to recognize:
- Clarification phrases: "I mean", "actually", "instead"
- Repair keywords: "for fixing", "for repair", "need it fixed"
- Status check keywords: "Is it ready?", "Is it done?", "Can I pick it up?"

### 2. Updated Core Identity
Added section on handling topic switches:
- Recognize when customer clarifies intent
- Don't stick to wrong assumptions
- Adapt to what customer actually wants

### 3. Updated Status Check Module
Clarified what qualifies as status check:
- ✅ Status check: "Is it ready?", "Can I pick it up?"
- ❌ NOT status check: "I mean for fixing", "How much to fix"

## Expected Behavior After Fix

### Scenario 1: Buyback to Repair Switch
```
Customer: "How about laptop"
AI: "We buy laptops at good rates. What model is it..."
Customer: "I mean for fixing"
AI: "Ah, you want to get it repaired! What's wrong with your laptop? We 
repair all types of laptops - screen replacements, battery issues, won't 
turn on, etc."
```

### Scenario 2: Clarification
```
Customer: "Do you fix phones?"
AI: "Yes! What model phone is it?"
Customer: "actually I want to sell it"
AI: "Got it! We buy phones at good rates. What model is it, what's the 
storage size, and what condition is it in?"
```

### Scenario 3: Actual Status Check
```
Customer: "Is my iPhone repair ready?"
AI: "I don't have access to repair statuses, but if you give me your name 
and device details, I'll pass this to John who'll get back to you ASAP"
```

## Key Improvements

| Phrase | Old Interpretation | New Interpretation |
|--------|-------------------|-------------------|
| "I mean for fixing" | Status check | NEW repair inquiry |
| "How much to fix" | Status check | Pricing inquiry |
| "Can you repair" | Status check | Service inquiry |
| "Is it ready?" | Status check ✓ | Status check ✓ |

## Clarification Phrases Recognized

### Repair Intent
- "I mean for fixing"
- "I need it fixed"
- "for repair"
- "Can you repair"
- "How much to fix"

### Topic Switch
- "I mean"
- "actually"
- "instead"
- "no, I want"

### Status Check (Actual)
- "Is it ready?"
- "Is it done?"
- "Can I pick it up?"
- "When can I collect it?"
- "How's my repair going?"

## Changes Made

### File: `supabase/migrations/023_improve_context_switching.sql`

1. **Updated `core_identity` module**
   - Added "TOPIC SWITCHES (CRITICAL)" section
   - Examples of common switches
   - Guidance on adapting to clarifications

2. **Created `topic_switch_handler` module** (Priority 95)
   - High-priority module always loaded
   - Detailed examples of switches
   - Clear distinction between repair inquiry and status check

3. **Updated `status_check` module**
   - Clarified what qualifies as status check
   - Explicitly listed what is NOT a status check
   - Better guidance on when to use status check response

## Deployment

```bash
psql $DATABASE_URL -f supabase/migrations/023_improve_context_switching.sql
```

## Testing

### Test Case 1: Repair Clarification
```
Send: "How about laptop"
Then: "I mean for fixing"
Expected: "Ah, you want to get it repaired! What's wrong with your laptop?"
```

### Test Case 2: Buyback to Repair
```
Send: "Do you buy phones?"
Then: "actually I need it fixed"
Expected: "Got it! What's wrong with your phone? Screen damage, battery..."
```

### Test Case 3: Actual Status Check
```
Send: "Is my repair ready?"
Expected: "I don't have access to repair statuses, but if you give me your 
name and device details..."
```

### Test Case 4: Repair Pricing (Not Status)
```
Send: "How much to fix my laptop screen?"
Expected: Laptop screen pricing, NOT status check response
```

## Impact

### Before Fix
❌ Repair inquiries treated as status checks
❌ Offered to pass to John unnecessarily
❌ Didn't recognize clarifications
❌ Stuck on wrong assumptions

### After Fix
✅ Recognizes repair clarifications
✅ Adapts to topic switches
✅ Provides appropriate repair information
✅ Only treats actual status checks as status checks
✅ Better conversation flow

## Related Issues

This fix also helps with:
- Customers who aren't clear in first message
- Mixed inquiries (buyback then repair)
- Clarifying ambiguous requests
- Better context awareness

## Notes

- The `topic_switch_handler` module has priority 95 (very high)
- Always loaded to catch clarifications
- Works with existing intent classification
- Doesn't interfere with actual status checks

---

**Created:** 8 Nov 2024
**Migration:** `023_improve_context_switching.sql`
**Priority:** High - Improves conversation understanding
**Status:** Ready to deploy
