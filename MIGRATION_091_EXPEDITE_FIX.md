# Migration 091: Expedited Repairs Webchat Fix

**Date:** March 31, 2026  
**Migration:** `091_fix_expedite_webchat_and_fee.sql`  
**Status:** Ready to apply

## User Clarification

**Quote:** "if they're trying to do this in the web chat then you have to direct them back to send us a text message here. Because I won't see it in a web chat then there's no way you say pass this to John. How does it pass to me?"

**Quote:** "expedite it is typically starts from £20"

## Problem

Migration 090 created `expedited_repairs` module that said:
- "I'll pass this to John who can arrange priority service"

**Issue:** This doesn't work on webchat because John won't see webchat messages!

## Solution

Updated `expedited_repairs` module to:

### On WEBCHAT:
```
"Yes, we can expedite repairs starting from £20. To arrange this, please text us or visit: https://www.newforestdevicerepairs.co.uk/start

We need to coordinate via SMS to ensure John gets your request."
```

### On SMS/Text:
```
"Yes, we can expedite your repair starting from £20. I'll pass this to John who can arrange priority service and confirm the exact cost based on your repair. He'll get back to you ASAP."
```

## Key Changes

1. **Added £20 starting fee** - "starts from £20"
2. **Webchat detection** - Directs to SMS instead of saying "I'll pass to John"
3. **Channel-aware responses** - Different response based on webchat vs SMS

## Why This Matters

**Webchat limitations:**
- John doesn't see webchat messages in real-time
- Can't "pass to John" from webchat
- Must funnel to SMS for coordination

**SMS advantages:**
- John sees SMS messages
- Can pass requests to John
- Better for coordination

## Real-World Example

**Before (Migration 090):**
```
Customer (webchat): "Can I pay to rush this?"
AI: "Yes, we can expedite your repair for an additional fee. I'll pass this to John..."
John: [Never sees this message - it's on webchat]
```

**After (Migration 091):**
```
Customer (webchat): "Can I pay to rush this?"
AI: "Yes, we can expedite repairs starting from £20. To arrange this, please text us or visit: https://www.newforestdevicerepairs.co.uk/start - We need to coordinate via SMS to ensure John gets your request."
Customer: [Texts instead]
John: [Sees SMS, can coordinate]
```

## Other Modules - Do They Need This?

### Payment Methods - NO ✅
- Payment methods are general info (not sensitive)
- Can be provided on webchat
- Doesn't require "passing to John"
- **No change needed**

### Collection Time Confirmation - NO ✅
- Just confirming opening hours
- Doesn't require "passing to John"
- **No change needed**

### Webchat Repair Status - ALREADY HANDLED ✅
- Already directs to SMS tracking
- Already asks for phone number
- **Already correct**

## How to Apply

```bash
# Apply migration 091
cat supabase/migrations/091_fix_expedite_webchat_and_fee.sql | \
  PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h "$SUPABASE_DB_HOST" -U postgres -d postgres
```

## Testing

After applying, test:

### Webchat Tests:
- [ ] Webchat: "Can I rush this?" → Should direct to SMS with £20 fee
- [ ] Webchat: "Can I pay extra?" → Should direct to SMS, NOT say "I'll pass to John"

### SMS Tests:
- [ ] SMS: "Can I rush this?" → Should say "starting from £20, I'll pass to John"
- [ ] SMS: "I need it urgently" → Should mention £20 and pass to John

## Notes

- This is a **critical fix** for migration 090
- Apply **after** migration 090
- Only affects `expedited_repairs` module
- Other modules don't need webchat vs SMS distinction
