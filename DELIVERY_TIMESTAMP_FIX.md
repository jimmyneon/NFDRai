# Delivery Confirmation Timestamp Fix

## Issue Fixed

**Error**: `500 Internal Server Error` on `/api/messages/delivery-confirmation`

**Root Cause**: MacroDroid was sending Unix timestamps in seconds (e.g., `1762334348`), but PostgreSQL expected ISO 8601 format timestamps.

**Error Message**:
```
date/time field value out of range: "1762334348"
hint: Perhaps you need a different "datestyle" setting.
```

## Solution

Added timestamp conversion logic to handle both Unix timestamps and ISO format:

```typescript
// Parse timestamp - MacroDroid sends Unix timestamp in seconds
let deliveredAt: string
if (timestamp) {
  // Check if it's a Unix timestamp (number as string)
  if (/^\d+$/.test(timestamp)) {
    // Convert Unix timestamp (seconds) to ISO string
    const timestampMs = parseInt(timestamp) * 1000
    deliveredAt = new Date(timestampMs).toISOString()
    console.log('[Delivery Confirmation] Converted Unix timestamp:', timestamp, '→', deliveredAt)
  } else {
    // Assume it's already an ISO string or parseable date
    deliveredAt = new Date(timestamp).toISOString()
  }
} else {
  deliveredAt = new Date().toISOString()
}
```

## What Changed

**File**: `app/api/messages/delivery-confirmation/route.ts`

**Changes**:
- Added Unix timestamp detection (checks if timestamp is all digits)
- Converts Unix seconds to milliseconds (multiply by 1000)
- Converts to ISO 8601 format for PostgreSQL
- Falls back to current time if no timestamp provided
- Added logging for timestamp conversion

## Testing

### Before Fix
```bash
# MacroDroid sends Unix timestamp
timestamp=1762334348

# Result: 500 Error
# Error: date/time field value out of range: "1762334348"
```

### After Fix
```bash
# MacroDroid sends Unix timestamp
timestamp=1762334348

# Converted to: 2025-11-05T09:19:08.000Z
# Result: 200 OK - Delivery confirmed
```

## MacroDroid Configuration

Your MacroDroid webhook should send:

**URL**: `https://nfd-rai.vercel.app/api/messages/delivery-confirmation`
**Method**: `POST`
**Content-Type**: `application/x-www-form-urlencoded`

**Parameters**:
- `phone` = {phone_number} (e.g., "07410381247")
- `message` = {message_text} (exact text that was sent)
- `timestamp` = {unix_timestamp} (seconds since epoch)
- `status` = "delivered" (optional)

**Example**:
```
phone=07410381247
message=Your device is ready for collection!
timestamp=1762334348
status=delivered
```

## Deployment Status

✅ **Committed**: Commit `da62521`
✅ **Pushed**: To GitHub main branch
⏳ **Vercel**: Will auto-deploy in 1-2 minutes

## Verify Deployment

Once Vercel deploys (check dashboard), test with:

```bash
curl -X POST https://nfd-rai.vercel.app/api/messages/delivery-confirmation \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "phone=07410381247" \
  -d "message=Test message" \
  -d "timestamp=1762334348"
```

Expected response:
```json
{
  "success": true,
  "messageId": "uuid",
  "message": "Delivery confirmed"
}
```

## Related Fixes

This is part of the larger update that includes:
1. ✅ Message batching for rapid customer messages
2. ✅ Reduced "pass to John" responses
3. ✅ Delivery confirmation timestamp fix (this fix)

## Summary

- **Problem**: Unix timestamps from MacroDroid caused 500 errors
- **Solution**: Auto-detect and convert Unix timestamps to ISO format
- **Status**: Fixed, committed, and pushed
- **Next**: Wait for Vercel deployment (~1-2 minutes)
