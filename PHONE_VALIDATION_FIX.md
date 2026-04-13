# Phone Validation Fix - Missed Call SMS Logic

## Problem

The missed call handler was sending SMS messages to **all UK numbers**, including:

- ❌ Landlines (01/02 numbers) - cannot receive SMS
- ❌ 0800/freephone numbers - cannot receive SMS
- ❌ International numbers - expensive SMS costs

This caused wasted SMS costs and failed message delivery.

## Solution

Updated phone validator to **ONLY** allow UK mobile numbers:

- ✅ `07` (national format)
- ✅ `+447` (international format)
- ✅ `00447` (alternative international format)

All other numbers are now **BLOCKED**.

## What Gets Blocked

### UK Landlines

- `01202123456` (Bournemouth landline)
- `02012345678` (London landline)
- `+441202123456` (international format)
- `00441202123456` (alternative format)

**Reason:** Landlines cannot receive SMS messages

### 0800/Freephone Numbers

- `08001234567`
- `08081234567`
- `+448001234567`
- `00448001234567`

**Reason:** Freephone numbers cannot receive SMS

### International Numbers

- `+1234567890` (US)
- `+33123456789` (France)
- `+353123456789` (Ireland)
- `+61123456789` (Australia)

**Reason:** International SMS costs are expensive

### Invalid Numbers

- Empty strings
- Too short numbers
- Non-numeric strings

**Reason:** Safety - block anything we can't verify

## What Gets Allowed

### UK Mobile Numbers ONLY

- `07123456789` (national format)
- `+447123456789` (international format)
- `00447123456789` (alternative format)
- `07 1234 56789` (with spaces)
- `+44 7123 456789` (with spaces)

**Reason:** UK mobiles can receive SMS and are cost-effective

## Changes Made

### File: `/lib/phone-validator.ts`

1. **Added `isUKMobileNumber()` function**
   - Specifically checks for UK mobile patterns (07/+447/00447)
   - Blocks all other UK number types

2. **Updated `shouldSendSMS()` function**
   - Now uses `isUKMobileNumber()` instead of `isUKNumber()`
   - Explicitly blocks landlines with clear reason
   - Explicitly blocks 0800 numbers with clear reason
   - Better error messages for each block type

3. **Kept `isUKNumber()` function**
   - Still available for general UK number detection
   - Used for analytics/reporting (not SMS sending)

## Testing

Created comprehensive test script: `test-phone-validation.js`

Tests 27 scenarios:

- ✅ 6 UK mobile formats (should allow)
- ❌ 6 UK landline formats (should block)
- ❌ 4 0800/freephone formats (should block)
- ❌ 4 international numbers (should block)
- ❌ 3 invalid numbers (should block)

Run tests:

```bash
node test-phone-validation.js
```

## Behavior

### Before Fix

```
Missed call from: 01202123456 (landline)
→ ✅ SMS sent (WASTED - landlines can't receive SMS)

Missed call from: 08001234567 (0800)
→ ✅ SMS sent (WASTED - freephone can't receive SMS)

Missed call from: +1234567890 (US)
→ ✅ SMS sent (EXPENSIVE - international SMS)
```

### After Fix

```
Missed call from: 01202123456 (landline)
→ ❌ SMS blocked - "UK landline - SMS blocked (landlines cannot receive SMS)"

Missed call from: 08001234567 (0800)
→ ❌ SMS blocked - "0800/freephone number - SMS blocked"

Missed call from: +1234567890 (US)
→ ❌ SMS blocked - "International number (US/Canada) - SMS blocked to avoid costs"

Missed call from: 07123456789 (mobile)
→ ✅ SMS sent - "UK mobile number - SMS allowed"
```

## Logs

When a number is blocked, you'll see:

```
[Missed Call - International Block] ❌ UK landline - SMS blocked (landlines cannot receive SMS)
[Missed Call - International Block] Country: UK
[Missed Call - International Block] Number: 01202123456
```

When a number is allowed:

```
[Missed Call - UK Number] ✅ Verified UK number - SMS allowed
```

## Cost Savings

**Before:** SMS sent to all UK numbers (including landlines/0800)

- Wasted SMS credits on undeliverable messages
- Potential international SMS costs

**After:** SMS only sent to UK mobiles

- No wasted credits
- No international SMS costs
- Better delivery rates

## Integration

The phone validator is now used in:

1. **Missed Call Handler** (`/app/api/messages/missed-call/route.ts`)
   - Checks before sending missed call SMS
   - Blocks non-mobile numbers

2. **Quote Sending** (`/app/api/quotes/send/route.ts`)
   - Checks before sending quote SMS
   - Returns error if number is not a UK mobile
   - Prevents wasted SMS on landlines/0800/international

3. **Incoming Messages** (`/app/api/messages/incoming/route.ts`)
   - Already had validation in place
   - Blocks international numbers from triggering AI responses

## Next Steps

Consider integrating this validation into:

- Booking confirmation endpoint (if exists)
- Any other places where SMS is sent

## Files Modified

- `/lib/phone-validator.ts` - Updated validation logic
- `/app/api/quotes/send/route.ts` - Added phone validation before sending quotes
- `/test-phone-validation.js` - Created test suite
- `/PHONE_VALIDATION_FIX.md` - This documentation

## Deployment

1. Review changes: `git diff lib/phone-validator.ts`
2. Run tests: `node test-phone-validation.js`
3. Commit: `git add . && git commit -m "Fix: Only send SMS to UK mobile numbers (block landlines/0800/international)"`
4. Push: `git push`
5. Vercel will auto-deploy

## Monitoring

After deployment, monitor logs for:

- `[Missed Call - International Block]` - Numbers being blocked
- `[Missed Call - UK Number]` - Numbers being allowed

Check that legitimate UK mobile numbers are still getting through.
