# Quote Acceptance Not Sending to Repair App - Debug Guide

## Issue

Sarah's message "Thanks John. It is a pixel 6a Yes to battery replacement, pls go ahead" should have:
1. ✅ Detected quote acceptance (confidence 0.9) - WORKS
2. ✅ Processed the quote - SHOULD WORK
3. ❌ Sent to repair app - NOT HAPPENING

## What We Know

### Quote Acceptance Detection: ✅ WORKING
Test shows Sarah's message matches `/go\s+ahead/i` pattern with 0.9 confidence.

### Code Flow
```typescript
// Line 750-756 in incoming/route.ts
if (quoteCheck.isAcceptance && quoteCheck.confidence > 0.8) {
  console.log("[Quote Check] 🎯 High confidence acceptance - processing quote");
  await processQuoteAcceptance(quoteCheck.quote.id);
}
```

### What Should Happen
1. `processQuoteAcceptance()` called
2. Quote marked as "accepted" in database
3. Quote formatted for repair app
4. Sent to `https://nfd-repairs-app.vercel.app/api/jobs/create-v3`
5. Job ID returned and quote marked "completed"

## Possible Issues

### Issue 1: Quote Not Found
**Symptom:** `quoteCheck.hasActiveQuote = false`

**Check:**
```sql
-- Run in Supabase SQL Editor
SELECT * FROM quote_requests 
WHERE phone = '[Sarah's phone number]'
  AND status = 'quoted'
ORDER BY created_at DESC;
```

**Fix:** Ensure quote exists with status='quoted'

### Issue 2: processQuoteAcceptance Not Being Called
**Symptom:** No logs showing "[Quote Acceptance] Starting process"

**Possible causes:**
- `quoteCheck.isAcceptance` is false (but our test shows it should be true)
- `quoteCheck.confidence` is ≤ 0.8 (but our test shows 0.9)
- Code not deployed yet (old version running)

**Fix:** Check Vercel deployment logs

### Issue 3: Repair App Handoff Failing
**Symptom:** Logs show "[Quote Acceptance] ⚠️ Failed to send to repair app"

**Possible causes:**
- Repair app API down
- Invalid data format
- Network error
- Missing required fields

**Check logs for:**
```
[Repair App Handoff] ❌ Failed: [error message]
```

### Issue 4: Quote Already Accepted
**Symptom:** Quote status is already "accepted" or "completed"

**Check:**
```sql
SELECT status FROM quote_requests WHERE id = '[quote_id]';
```

**Fix:** Quote can only be accepted once. If already accepted, won't process again.

## Debug Steps

### Step 1: Verify Quote Exists
Run `check-sarah-quote.sql` in Supabase SQL Editor to find Sarah's quote.

Expected result:
- Quote exists
- Status = 'quoted'
- Phone matches Sarah's number

### Step 2: Check Vercel Logs
1. Go to Vercel dashboard
2. Find latest deployment
3. Check function logs for `/api/messages/incoming`
4. Search for Sarah's phone number or "Quote Check"

Look for these log lines:
```
[Quote Check] ✅ Customer has active quote
[Quote Check] 🎯 High confidence acceptance - processing quote
[Quote Acceptance] Starting process for quote: [id]
[Quote Acceptance] ✅ Quote marked as accepted
[Repair App Handoff] Sending accepted quote to repair app
[Repair App Handoff] ✅ Success
```

### Step 3: Test Quote Acceptance Manually
```bash
# Test the quote acceptance detector
node test-sarah-acceptance.js
```

Should show:
```
✅ DETECTED - Quote acceptance found!
   Pattern matched: /go\s+ahead/i
```

### Step 4: Check Repair App API
```bash
# Test if repair app API is accessible
curl -X POST https://nfd-repairs-app.vercel.app/api/jobs/create-v3 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "phone": "+44123456789",
    "device_make": "Test",
    "device_model": "Test",
    "issue": "Test",
    "quoted_price": 1
  }'
```

Should return job ID if working.

## Most Likely Issue

**The code changes were just pushed to GitHub but may not be deployed yet.**

The closed loop fix that forces auto mode was just committed (commit `c60ad93`). Vercel needs to deploy this before it takes effect.

**Check:**
1. Go to Vercel dashboard
2. Check if latest deployment is complete
3. Look for commit `c60ad93` in deployments

**If not deployed yet:**
- Wait for Vercel auto-deployment (usually 1-2 minutes)
- Or manually trigger deployment

## Quick Fix Test

To test if everything works once deployed, send a test message:

1. Create a test quote in database with status='quoted'
2. Send message: "Yes please go ahead"
3. Check logs for quote acceptance flow
4. Verify quote sent to repair app

## Logs to Watch For

**Success flow:**
```
[Quote Check] Checking if customer has active quote...
[Quote Check] ✅ Customer has active quote: { quoteId, price, isAcceptance: true, confidence: 0.9 }
[Quote Check] 🎯 High confidence acceptance - processing quote
[Quote Acceptance] Starting process for quote: [id]
[Quote Acceptance] ✅ Quote marked as accepted: [id]
[Quote Acceptance] Formatting quote for repair app...
[Quote Acceptance] Calling sendToRepairApp...
[Repair App Handoff] Sending accepted quote to repair app
[Repair App Handoff] ✅ Success: { jobId: [id] }
[Quote Acceptance] ✅ Sent to repair app. Job ID: [id]
```

**Failure at detection:**
```
[Quote Check] No active quote for this customer
```

**Failure at handoff:**
```
[Repair App Handoff] ❌ Failed: [error]
```

---

**Next Steps:**
1. Run `check-sarah-quote.sql` to verify quote exists
2. Check Vercel deployment status
3. Review Vercel function logs for Sarah's message
4. Identify which step is failing
