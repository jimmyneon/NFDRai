# International Number Blocking

## Overview

To avoid international SMS costs, the system now blocks all AI responses and auto-messages to non-UK phone numbers.

## Implementation

### Files Created
- **`lib/phone-validator.ts`** - Phone number validation utilities

### Files Modified
- **`app/api/messages/incoming/route.ts`** - Added international blocking for incoming messages
- **`app/api/messages/missed-call/route.ts`** - Added international blocking for missed call auto-responses

## How It Works

### 1. Phone Number Validation

The `shouldSendSMS()` function checks if a number is UK-based:

```typescript
const smsCheck = shouldSendSMS(from);
if (!smsCheck.allowed) {
  // Block - international number
  return blocked response
}
```

### 2. UK Number Detection

UK numbers are identified by:
- `+44...` (international format)
- `44...` (international without +)
- `0...` (national format)
- `7...` (mobile without leading 0)

### 3. International Number Detection

International numbers are identified by:
- `+1...` (US/Canada)
- `+33...` (France)
- `+34...` (Spain)
- `+49...` (Germany)
- `+353...` (Ireland)
- Any other `+XX...` prefix

## Behavior

### Incoming Messages (SMS/WhatsApp)
- **UK number**: ✅ Process normally, AI responds
- **International number**: ❌ Block processing, return success (no error)
- **Unknown/invalid**: ❌ Block for safety

### Missed Calls
- **UK number**: ✅ Send auto-response SMS
- **International number**: ❌ Log call but don't send SMS
- **Unknown/invalid**: ❌ Block for safety

## Logging

When an international number is blocked:

```
[International Block] ❌ International number (France) - SMS blocked to avoid costs
[International Block] Country: France
[International Block] Number: +33123456789
```

When a UK number is allowed:

```
[UK Number] ✅ Verified UK number - processing allowed
```

## Response Format

When blocking an international number:

```json
{
  "success": true,
  "blocked": true,
  "reason": "International number (France) - SMS blocked to avoid costs",
  "country": "France",
  "message": "Message received but not processed (international number)"
}
```

## Cost Savings

### Before
- International SMS: £0.10 - £0.50 per message
- Spam from international numbers could cost £££

### After
- International SMS: £0.00 (blocked)
- Only UK numbers processed
- Significant cost savings

## Testing

Run the test suite:

```bash
node test-international-block.js
```

Expected output:
```
✅ PASS: UK mobile (+44)
✅ PASS: UK mobile (0)
❌ BLOCKED: US/Canada number
❌ BLOCKED: France number
❌ BLOCKED: Spain number
...
🎉 ALL TESTS PASSED!
```

## Edge Cases

### What if a UK customer texts from abroad?

If a UK customer is traveling and texts from an international number, they will be blocked. This is intentional to avoid costs. They can:
1. Call instead (no auto-response cost)
2. Use WhatsApp (if supported)
3. Wait until back in UK

### What if number format is unclear?

If the system cannot determine if a number is UK or international, it blocks for safety. Better to miss one message than incur international SMS costs.

## Configuration

No configuration needed - blocking is automatic based on phone number prefix.

To modify UK number patterns, edit `lib/phone-validator.ts`:

```typescript
export function isUKNumber(phone: string): boolean {
  // Add custom patterns here
}
```

## Deployment

Changes are live after:
1. Code deployed to Vercel (automatic from GitHub push)
2. No database migration required
3. No configuration changes needed

## Monitoring

Check logs for blocked numbers:
- Search for `[International Block]` in Vercel logs
- Review blocked countries and frequencies
- Adjust patterns if needed

## Summary

✅ **Cost Control**: No international SMS charges
✅ **Automatic**: No manual intervention needed
✅ **Safe**: Blocks unknown numbers by default
✅ **Transparent**: Clear logging of blocked numbers
✅ **Simple**: No configuration required
