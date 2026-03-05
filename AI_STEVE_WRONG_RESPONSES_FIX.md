# AI Steve Wrong Responses - Investigation & Fix

## The Problem

**Conversation with Sue:**
- John quoted £50 for BIOS repair + £20 for system optimisation
- Sue accepted: "Yes please - both. Thank you"
- Sue asked: "Any idea how long it will take??"
- AI Steve responded: "I don't have the exact timeline for your repair, but you can check the status or get more details here: https://www.newforestdevicerepairs.co.uk/start"

## What's Wrong

**3 critical failures:**

1. **Not using turnaround time guidance**
   - AI said "I don't have the exact timeline"
   - Should have said: "Laptop software repairs are typically done same day, within a few hours"
   - The turnaround_times module exists but AI isn't using it!

2. **Directing existing customer to /start page**
   - Sue is ALREADY a customer (John just quoted her, she accepted)
   - /start page is for NEW customers who haven't contacted us yet
   - This makes no sense and looks broken

3. **Missing laptop software repair timeframes**
   - Turnaround module had "Laptops: Within 3 days"
   - But laptop SOFTWARE (BIOS, system optimisation) is much faster: Same day, few hours
   - Need to distinguish software vs hardware repairs

## Root Causes

### Issue 1: Turnaround Module Not Being Used

**Possible reasons:**
1. Module priority too low (85) - other modules overriding it
2. AI not recognizing "how long will it take" as turnaround question
3. AI treating existing repair differently than general inquiry
4. Module text not clear enough about when to use it

### Issue 2: Directing to /start Page

**Possible reasons:**
1. No module telling AI to NOT do this for existing customers
2. AI defaulting to "safe" response when unsure
3. No conversation history awareness for existing customers
4. Routing rules too aggressive (always route to website)

### Issue 3: Missing Laptop Software Timeframes

**Confirmed:**
- Turnaround module only had generic "Laptops: Within 3 days"
- No distinction between software (fast) and hardware (slower)
- Need to add: "Laptop software: Same day, few hours"

## The Fix

### Migration 088: Fix Turnaround and Existing Customer Issues

**Changes:**

1. **Updated turnaround_times module:**
   - Added laptop software repairs: "Same day within a few hours, or next day if busy"
   - Separated laptop software from hardware repairs
   - Added explicit examples for existing customers
   - Added CRITICAL RULES section emphasizing to USE the guidance
   - Priority remains 85 (general_info category)

2. **Created existing_customer_awareness module:**
   - Priority 100 (CRITICAL)
   - Explicitly forbids directing existing customers to /start page
   - Checks conversation history for John's messages
   - Identifies existing vs new customers
   - Provides correct responses for existing customers

3. **Key improvements:**
   - AI now knows: "If John quoted them and they accepted, they're in active repair"
   - AI explicitly told: "NEVER say 'I don't have exact timeline' - USE THE GUIDANCE!"
   - AI explicitly told: "NEVER direct existing customers to /start page"
   - Added examples of what NOT to do

## Expected Behavior After Fix

**Same scenario with Sue:**

Sue: "Any idea how long it will take??"

**AI Steve should now respond:**
"For laptop software work like BIOS repairs and system optimisation, it's normally done same day within a few hours. If we're busy it might be next day, but we'll get it sorted quickly."

**NOT:**
"I don't have the exact timeline for your repair, but you can check the status here: [link]"

## Testing Checklist

After running migration 088:

- [ ] Customer in active repair asks "How long will it take?"
  - Expected: Uses turnaround guidance (laptop software: same day, few hours)
  - NOT: "I don't have exact timeline" or /start link

- [ ] Existing customer asks general question
  - Expected: Answers directly, no /start link
  - NOT: "Check here: /start"

- [ ] New customer asks for quote
  - Expected: Can use /repair-request link (appropriate for new customers)
  - NOT: /start link

- [ ] Customer asks about laptop hardware repair
  - Expected: "Within 3 days normally"
  - NOT: Same day timeframe

- [ ] Customer asks about laptop software repair
  - Expected: "Same day within a few hours"
  - NOT: 3 days timeframe

## Monitoring

**Check Vercel logs for:**

✅ **Good patterns:**
```
[Turnaround Time] Using guidance for laptop software repair
[Existing Customer] Identified existing customer - not routing to /start
```

❌ **Bad patterns (should not see after fix):**
```
[Response] "I don't have the exact timeline"
[Response] "check the status here: /start"
```

## Why This Happened

**Likely causes:**

1. **Turnaround module too passive**
   - Said "when customers ask" but didn't emphasize MUST use
   - AI defaulted to "safe" non-committal response

2. **No existing customer detection**
   - AI treated all customers the same
   - Didn't check conversation history for John's messages
   - Defaulted to routing to website (strict routing assistant mode)

3. **Incomplete laptop guidance**
   - Only had generic "laptops: 3 days"
   - Didn't account for software vs hardware distinction

## Prevention

**Going forward:**

1. **Test existing customer scenarios**
   - Add to test suite: Customer in active repair asks question
   - Verify AI doesn't route to /start page

2. **Monitor turnaround usage**
   - Check if AI is actually using the guidance
   - Look for "I don't have" responses (should be rare)

3. **Distinguish repair types**
   - Software vs hardware
   - Common vs complex
   - In-stock vs parts-needed

## Files Modified

- `supabase/migrations/088_fix_turnaround_and_existing_customer.sql` (new)
- `AI_STEVE_WRONG_RESPONSES_FIX.md` (this document)

## Migration Required

```bash
cd /Users/johnhopwood/NFDRAIRESPONDER
supabase migration up
```

This will apply migration 088 which:
- Updates turnaround_times module with laptop software repairs
- Creates existing_customer_awareness module (priority 100)
- Fixes AI Steve's responses for existing customers
