# Migration 092: Quote Acceptance Priority Fix

**Date:** March 31, 2026  
**Migration:** `092_fix_quote_acceptance_priority.sql`  
**Status:** Ready to apply

## Problem - Real Conversation

**Carly's conversation:**
```
16:54 - System: "Your repair/quote request has been received"
16:58 - John: "Your quote for iPad 10th gen (Screen damage) is £60.00"
17:04 - Carly: "Hi yes can I book please for repair"
17:05 - AI Steve: "I can't find any repair jobs under this phone number"
```

**What went wrong:**
- Carly was responding to the quote John just sent
- AI Steve saw the word "repair" and triggered repair status check
- AI Steve looked for repair jobs in the repair app
- AI Steve said "I can't find any repair jobs" 
- **Completely missed the active quote!**

## Root Cause

The quote acceptance flow exists and works, but AI Steve got confused by the word "repair" in the customer's message.

**Customer said:** "Can I book please for repair"  
**AI Steve thought:** "They're asking about repair status"  
**AI Steve should have thought:** "They're accepting the quote!"

The word "repair" triggered the wrong logic path.

## Solution

Updated `quote_acceptance_workflow` module to:

1. **Highest priority (100)** - Same as payment methods and expedited repairs
2. **Clear instructions** - If `[ACTIVE QUOTE FOR THIS CUSTOMER]` is in context, that takes precedence
3. **Explicit patterns** - "Can I book for repair" = quote acceptance, NOT repair status check
4. **Never look for repair jobs** - When customer has active quote

## Key Changes

### Before:
```
Priority: 95
Instructions: Check for active quote, detect acceptance intent
```

### After:
```
Priority: 100 (HIGHEST)
Instructions: 
- IF [ACTIVE QUOTE] in context → This is quote acceptance
- DO NOT look for repair jobs
- DO NOT say "I can't find any repair jobs"
- The word "repair" does NOT mean repair status check
- Process the quote acceptance
```

## New Acceptance Patterns

Added explicit recognition of:
- "Can I book please" ✅
- "I would like to book" ✅
- "Book please for repair" ✅
- "Can I book for repair" ✅

All of these now recognized as **quote acceptance** when customer has active quote.

## How It Works Now

### Scenario 1: Customer Accepts Quote
```
16:58 - John: "Your quote for iPad 10th gen is £60.00"
17:04 - Customer: "Hi yes can I book please for repair"

AI Steve sees:
- [ACTIVE QUOTE FOR THIS CUSTOMER] iPad 10th gen | £60
- Customer message: "can I book please for repair"
- Pattern match: "can I book" = HIGH CONFIDENCE ACCEPTANCE
- Priority check: Quote acceptance (100) > Repair status (lower)

AI Steve responds:
"Brilliant! I've marked that as accepted. You can drop your iPad in during opening hours and we'll get it sorted for £60. We're open 10am-5pm today."

System automatically:
- Marks quote as accepted
- Sends to repair app for job creation
- Customer gets confirmation
```

### Scenario 2: Customer Asks About Different Repair (No Quote)
```
Customer: "Is my repair ready?"

AI Steve sees:
- NO [ACTIVE QUOTE FOR THIS CUSTOMER]
- Customer message: "is my repair ready"
- No quote to accept

AI Steve responds:
[Checks repair status API]
"Let me check that for you..."
```

## Critical Distinction

| Customer Has Active Quote | Customer Has No Quote |
|---------------------------|----------------------|
| "Can I book for repair" → **Quote acceptance** | "Can I book for repair" → Direct to repair request form |
| "Is it ready?" → **Asking about the quoted repair** | "Is it ready?" → Check repair status API |
| Focus on **the quote** | Focus on **repair status** |

## Real-World Impact

### Before (Broken):
```
Customer: "Hi yes can I book please for repair"
AI: "I can't find any repair jobs under this phone number"
Customer: [Confused - they just got a quote!]
John: [Has to manually intervene]
```

### After (Fixed):
```
Customer: "Hi yes can I book please for repair"
AI: "Brilliant! I've marked that as accepted. You can drop your iPad in during opening hours and we'll get it sorted for £60."
Customer: [Happy - booking confirmed]
John: [Job automatically created in repair app]
```

## Why This Happened

The existing quote acceptance flow was working, but:

1. **Priority issue** - Quote acceptance was priority 95, not high enough
2. **Pattern confusion** - Word "repair" triggered repair status logic
3. **Context not checked first** - AI didn't prioritize `[ACTIVE QUOTE]` marker

## How to Apply

```bash
cat supabase/migrations/092_fix_quote_acceptance_priority.sql | \
  PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h "$SUPABASE_DB_HOST" -U postgres -d postgres
```

## Testing

After applying, test these scenarios:

### Quote Acceptance Tests:
- [ ] Customer has quote → says "can I book please" → Should accept quote
- [ ] Customer has quote → says "book for repair" → Should accept quote  
- [ ] Customer has quote → says "I would like to book" → Should accept quote
- [ ] Customer has quote → says "yes please" → Should accept quote

### Repair Status Tests:
- [ ] Customer has NO quote → says "is my repair ready?" → Should check repair status
- [ ] Customer has NO quote → says "can I book?" → Should direct to repair request form

## Expected Behavior Changes

### Quote Acceptance (Has Active Quote):
- **Priority 100** - Takes precedence over repair status checks
- **Recognizes "book for repair"** as quote acceptance
- **Never looks for repair jobs** when customer has active quote
- **Processes acceptance immediately** for high confidence patterns

### Repair Status (No Active Quote):
- **Only runs if no active quote** exists
- **Checks repair app API** for job status
- **Provides tracking link** if jobs found

## Success Metrics

After deployment, monitor for:

1. **Quote acceptance rate** - Should increase (customers not confused)
2. **"Can't find repair jobs" errors** - Should drop to zero for customers with quotes
3. **Manual interventions** - Should decrease (AI handles quote acceptance properly)
4. **Customer confusion** - Should eliminate cases like Carly's

## Files Modified

**`supabase/migrations/092_fix_quote_acceptance_priority.sql`**
- Updated `quote_acceptance_workflow` module
- Priority: 95 → 100 (HIGHEST)
- Added explicit "book for repair" patterns
- Added critical distinction instructions
- Added never-look-for-repair-jobs rule

## Notes

- This is a **critical fix** for quote acceptance flow
- Apply **after** migrations 089, 090, 091
- Works with existing quote acceptance detection
- No code changes needed - prompt module only
- Fixes confusion between quote acceptance and repair status

## Related Issues Fixed

This migration addresses:
- Customers saying "book for repair" after receiving quote
- AI looking for repair jobs instead of recognizing quote
- Confusion between quote acceptance and repair status checks
- Word "repair" triggering wrong logic path

All real customer interactions that caused confusion and required manual intervention.
