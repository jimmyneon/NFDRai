# ✅ Phone Number Normalization Fix - DEPLOYED

## Problem Fixed

**Duplicate conversations** caused by inconsistent phone number formats from MacroDroid:
- Incoming messages: `+447833454000` (with +)
- Outgoing tracking: `447833454000` (no +)

This created two separate customer records and conversations, causing:
- ❌ Messages split across two conversations
- ❌ AI responding when it should pause (couldn't see staff messages)
- ❌ UI showing incomplete conversation history

## Solution Implemented

### 1. Phone Normalizer Utility (`app/lib/phone-normalizer.ts`)

Normalizes all phone numbers to consistent `+44` format:

```typescript
normalizePhoneNumber('07833454000')    → '+447833454000'
normalizePhoneNumber('447833454000')   → '+447833454000'
normalizePhoneNumber('+447833454000')  → '+447833454000'
normalizePhoneNumber('0044 7833 454000') → '+447833454000'
```

### 2. Integration Points

**Incoming Messages** (`app/api/messages/incoming/route.ts`):
- Normalizes phone before customer lookup
- Prevents duplicate customer creation

**Outgoing Messages** (`app/api/messages/send/route.ts`):
- Normalizes phone in lookup-by-phone mode
- Ensures messages go to correct conversation

### 3. Immediate Fix Applied

Ran `fix-duplicate-conversations.js` to merge existing duplicates:
- Moved 4 staff messages from duplicate conversation
- Combined with 7 existing messages (3 customer + 4 AI)
- Total: 11 messages in one conversation
- Deleted empty duplicate

## Benefits

✅ **No more duplicate conversations**
- All phone formats normalize to same value
- One customer record per phone number
- One conversation per customer

✅ **AI pause logic works correctly**
- AI sees staff messages in same conversation
- Pauses for 30 min after staff replies
- Only responds to simple queries during pause

✅ **Complete conversation history**
- All messages visible in UI
- Correct message counts
- Proper timeline

## Testing

Run verification scripts:
```bash
# Check all messages in one conversation
node check-messages.js

# Test phone normalization
node test-phone-normalizer.js
```

## Files Changed

- `app/lib/phone-normalizer.ts` - NEW: Phone normalization utility
- `app/api/messages/incoming/route.ts` - Added normalization
- `app/api/messages/send/route.ts` - Added normalization
- `fix-duplicate-conversations.js` - One-time merge script
- `test-phone-normalizer.js` - Test suite

## Deployment

Committed and pushed to GitHub for automatic Vercel deployment.

## Future Prevention

Phone normalization now happens automatically on all incoming and outgoing messages. No MacroDroid changes needed - the server handles it

## Problem Solved

The `/api/messages/send` endpoint was returning 404 because MacroDroid's phone number format didn't match the database format.

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
