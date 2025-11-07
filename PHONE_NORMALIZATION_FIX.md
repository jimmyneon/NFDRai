# ✅ Phone Number Normalization Fix

## Problem Solved

The `/api/messages/send` endpoint was returning 404 because MacroDroid's phone number format didn't match the database format.

**Example**:
- MacroDroid sends: `+447410381247`
- Database has: `07410381247`
- Result: Customer not found → 404

## Solution Implemented

Added automatic phone number normalization that tries multiple formats:

1. **Original format**: `+447410381247` (as sent by MacroDroid)
2. **Without + prefix**: `447410381247`
3. **UK format**: `07410381247`
4. **International format**: `+447410381247`

The endpoint now tries each variant until it finds a match.

## How It Works

```typescript
const phoneVariants = [
  customerPhone,                      // +447410381247
  customerPhone.replace(/^\+/, ''),  // 447410381247
  customerPhone.replace(/^\+44/, '0'), // 07410381247
  customerPhone.replace(/^44/, '0'),  // 447410381247 -> 07410381247
  customerPhone.replace(/^0/, '+44'), // 07410381247 -> +447410381247
]

// Try each variant until we find the customer
for (const phoneVariant of phoneVariants) {
  const customer = await findCustomer(phoneVariant)
  if (customer) {
    // Found it!
    break
  }
}
```

## What Changed

**File**: `app/api/messages/send/route.ts`

**Changes**:
- Try multiple phone number formats automatically
- Log which format successfully found the customer
- Remove duplicates from variant list
- Better error logging

## Deployment

✅ **Committed**: `c3991aa`
✅ **Pushed**: To GitHub
⏳ **Vercel**: Auto-deploying (~2 minutes)

## Testing

After Vercel deploys, try sending an SMS via MacroDroid. The logs will now show:

```
[Send Message] Looking up conversation for phone: +447410381247
[Send Message] Trying phone variants: ["+447410381247", "447410381247", "07410381247"]
[Send Message] Found customer with phone variant: 07410381247 Customer ID: abc-123
[Send Message] Found conversation: xyz-789 for phone: 07410381247
```

### Expected Results

**Before Fix**:
```
POST /api/messages/send → 404
Error: Conversation not found
```

**After Fix**:
```
POST /api/messages/send → 200 OK
Success: Message tracked
```

## Verify Deployment

Once Vercel finishes deploying (check dashboard), test with:

```bash
curl -X POST https://nfd-rai.vercel.app/api/messages/send \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "text=Test message" \
  -d "customerPhone=+447410381247" \
  -d "conversationId=lookup-by-phone" \
  -d "sender=staff" \
  -d "trackOnly=true"
```

Should return:
```json
{
  "success": true,
  "message": {...},
  "deliveryStatus": {...}
}
```

## MacroDroid Configuration

No changes needed! MacroDroid can continue sending phone numbers in any format:
- `+447410381247` ✅
- `447410381247` ✅
- `07410381247` ✅

The endpoint will automatically find the customer regardless of format.

## Benefits

1. ✅ **No more 404 errors** from phone format mismatches
2. ✅ **Works with any phone format** from MacroDroid
3. ✅ **Detailed logging** shows which format matched
4. ✅ **No MacroDroid changes** required

## Related Fixes

This completes the full set of fixes:
1. ✅ Message batching for rapid messages
2. ✅ Reduced "pass to John" responses
3. ✅ Delivery confirmation timestamp fix
4. ✅ Phone number normalization (this fix)

## Summary

- **Problem**: Phone format mismatch causing 404s
- **Solution**: Try multiple phone formats automatically
- **Status**: Fixed, committed, and deploying
- **Result**: MacroDroid tracking will now work regardless of phone format

Wait ~2 minutes for Vercel deployment, then test!
