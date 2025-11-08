# "See You Tomorrow" Business Hours Check Fix

## Problem

AI was saying "see you tomorrow" or "Looking forward to seeing you then!" without checking if the business is actually open tomorrow. This causes confusion when:
- Customer says "see you tomorrow" on Friday (but you're closed Saturday)
- Customer says "see you tomorrow" on Saturday (but you're closed Sunday)
- AI confirms visits without verifying business hours

## Example of the Issue

```
Customer (Friday 2:22pm): "Ok great see you tomorrow"
AI: "Looking forward to seeing you then! Just a heads-up, we're open from 
10:00 AM to 5:00 PM on Monday. Safe travels!"
```

**Problem:** AI said "see you tomorrow" but then mentioned Monday hours, creating confusion. If tomorrow is Saturday and you're closed, the AI should have corrected the customer.

## Root Cause

The AI has access to business hours data but wasn't explicitly checking it before:
1. Responding to "see you tomorrow" from customers
2. Saying "pop in tomorrow" in its own responses
3. Confirming visit times

## Solution

Enhanced the prompt system to:
1. **Always check business hours** before mentioning any visit times
2. **Correct customers politely** when they say "tomorrow" but you're closed
3. **Use "Next Open" field** to know exactly when you open next
4. **Never guess** - always use real-time business hours data

## Changes Made

### File: `/supabase/migrations/021_fix_tomorrow_business_hours_check.sql`

#### 1. Updated Core Identity Module
Added stronger business hours awareness:
- Must check "CURRENT BUSINESS HOURS STATUS" before mentioning visits
- Never say "tomorrow" without verifying you're open
- Correct customers if they say "tomorrow" when closed

#### 2. Enhanced Time-Aware Responses Module
Added specific handling for "see you tomorrow":
- Check if actually open tomorrow
- If closed: Politely correct with actual opening time
- If open: Confirm with tomorrow's hours

#### 3. New High-Priority Reminder Module
Created `tomorrow_check_reminder` module that loads with priority 95:
- Critical reminder shown to AI in every response
- Emphasizes checking before saying "tomorrow"
- Provides clear example of correct behavior

#### 4. Updated Visit Confirmation Messages
Modified screen repair and pricing modules:
- Added reminders to check business hours
- Ensures consistency across all modules

## Expected Behavior

### Scenario 1: Customer Says "Tomorrow" When Closed

**Customer (Friday 2pm):** "Ok great see you tomorrow"

**AI checks business hours:**
- Current Status: OPEN
- Today's Hours: 10:00 AM - 5:00 PM
- Next Open: Monday at 10:00 AM

**AI Response:**
```
"Just a heads-up - we're actually closed tomorrow (Saturday). We'll be open 
Monday at 10:00 AM. See you then!"
```

### Scenario 2: Customer Says "Tomorrow" When Open

**Customer (Thursday 2pm):** "Ok great see you tomorrow"

**AI checks business hours:**
- Current Status: OPEN
- Today's Hours: 10:00 AM - 5:00 PM
- Next Open: Friday at 10:00 AM (if currently closed) OR Today's hours show Friday is open

**AI Response:**
```
"Looking forward to it! Just a reminder, we're open 10:00 AM to 5:00 PM 
tomorrow. See you then!"
```

### Scenario 3: AI Suggests Visit After Hours

**Customer (11pm Friday):** "How much for iPhone screen?"

**AI checks business hours:**
- Current Status: CLOSED
- Next Open: Monday at 10:00 AM

**AI Response:**
```
"iPhone 12 OLED screens are £100 with 12-month warranty. We're closed now - 
we'll be open Monday at 10:00 AM. Pop in then!"
```

## Business Hours Data Structure

The AI receives this data in every response:

```
CURRENT BUSINESS HOURS STATUS (REAL-TIME):
**Current Status:** OPEN or CLOSED
**Current Time:** 14:22
**Today's Hours:** 10:00 AM - 5:00 PM (or "Closed")
**Next Open:** Monday at 10:00 AM (when currently closed)

**Full Schedule:**
Monday: 10:00 AM - 5:00 PM
Tuesday: 10:00 AM - 5:00 PM
Wednesday: 10:00 AM - 5:00 PM
Thursday: 10:00 AM - 5:00 PM
Friday: 10:00 AM - 5:00 PM
Saturday: Closed
Sunday: Closed
```

## Key Improvements

| Aspect | Before | After |
|--------|--------|-------|
| **Tomorrow Check** | Assumed tomorrow is open | Always verifies before saying "tomorrow" |
| **Customer Correction** | Accepted "tomorrow" blindly | Politely corrects if closed tomorrow |
| **Hours Reference** | Sometimes ignored | Always uses real-time data |
| **Clarity** | Vague confirmations | Specific opening times |
| **Confusion Prevention** | Could cause wasted trips | Prevents customer confusion |

## Testing

### Test Case 1: Friday Afternoon (Closed Saturday)
```
Customer: "Ok great see you tomorrow"
Expected: "Just a heads-up - we're actually closed tomorrow (Saturday). 
We'll be open Monday at 10:00 AM. See you then!"
```

### Test Case 2: Thursday Afternoon (Open Friday)
```
Customer: "Ok great see you tomorrow"
Expected: "Looking forward to it! Just a reminder, we're open 10:00 AM to 
5:00 PM tomorrow. See you then!"
```

### Test Case 3: Saturday Afternoon (Closed Sunday)
```
Customer: "Can I come in tomorrow?"
Expected: "We're closed tomorrow (Sunday). We'll be open Monday at 10:00 AM. 
Pop in then!"
```

### Test Case 4: Late Night Inquiry
```
Customer (11pm): "I'll come by tomorrow"
Expected: Check if tomorrow is open, respond accordingly with actual hours
```

## Implementation

### 1. Apply Migration
```bash
psql $DATABASE_URL -f supabase/migrations/021_fix_tomorrow_business_hours_check.sql
```

### 2. Verify Changes
```sql
-- Check updated modules
SELECT module_name, version, updated_at 
FROM prompts 
WHERE module_name IN (
  'core_identity', 
  'time_aware_responses', 
  'tomorrow_check_reminder'
)
ORDER BY updated_at DESC;
```

### 3. Test in Production
Send test messages on different days to verify the AI checks hours correctly.

## Benefits

### For Customers:
✅ **No wasted trips** - Won't show up when you're closed
✅ **Clear expectations** - Know exactly when you're open
✅ **Better planning** - Can schedule their visit accurately
✅ **Professional experience** - Shows attention to detail

### For Business:
✅ **Fewer confused customers** - No one showing up when closed
✅ **Better reputation** - Accurate information builds trust
✅ **Less frustration** - Customers aren't disappointed
✅ **Clearer communication** - Reduces follow-up questions

## Module Priority

The new `tomorrow_check_reminder` module has priority **95** (very high) to ensure it's always included in the AI's context, making this check a top priority.

## Related Files

- **Migration:** `supabase/migrations/021_fix_tomorrow_business_hours_check.sql`
- **Business Hours Logic:** `lib/business-hours.ts`
- **Hours API:** `app/api/business-hours/route.ts`
- **Response Generator:** `lib/ai/response-generator.ts` (includes hours in context)

## Notes

- The business hours data is fetched in real-time for every AI response
- The AI always has access to current status, today's hours, and next opening time
- This fix ensures the AI actually uses this data before confirming visits
- Works for all scenarios: weekends, holidays, after hours, etc.

---

**Created:** 8 Nov 2024
**Migration:** `021_fix_tomorrow_business_hours_check.sql`
**Priority:** Critical - Prevents customer confusion and wasted trips
