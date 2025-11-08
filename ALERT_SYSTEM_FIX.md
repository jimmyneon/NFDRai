# Alert System Fix - Database Inserts Now Working

## Problem

The alert system was never creating alerts in the database, and no notifications were being sent. The alerts table remained empty despite the code attempting to insert alerts.

## Root Cause

**RLS (Row Level Security) Policy Issue**

1. The `alerts` table had RLS enabled with only a SELECT policy for authenticated users
2. **No INSERT policy existed** for the alerts table
3. The API route (`/app/api/messages/incoming/route.ts`) was using `createClient()` which uses the **anon key**
4. Webhook calls from MacroDroid have no authenticated user session
5. Without an INSERT policy and no user session, all alert inserts were **silently blocked by RLS**

## Solution

**Use Service Role Client for Alert Operations**

Instead of adding a permissive INSERT policy (security risk), we now use the **service role client** for alert operations, which bypasses RLS:

### Changes Made

**File: `/app/api/messages/incoming/route.ts`**

1. **Import service client**:
   ```typescript
   import { createServiceClient } from '@/lib/supabase/service'
   ```

2. **Initialize service client** (line 130):
   ```typescript
   const supabase = await createClient()
   const supabaseService = createServiceClient() // For operations that bypass RLS
   ```

3. **Replace all alert inserts** with service client:
   - Line 353: Global automation disabled
   - Line 444: Manual mode - staff replied
   - Line 465: Manual mode - no staff reply yet
   - Line 503: Staff recently active (waiting)
   - Line 587: Low confidence or manual handoff

   All changed from:
   ```typescript
   await supabase.from('alerts').insert({ ... })
   ```
   
   To:
   ```typescript
   await supabaseService.from('alerts').insert({ ... })
   ```

## Why This Approach?

### ✅ Secure
- Service role client only used for specific operations (alerts)
- Regular client still used for customer/conversation/message operations
- No permissive RLS policies that could be exploited

### ✅ Reliable
- Bypasses RLS for alert inserts (intended behavior)
- Works with webhook calls that have no user session
- No authentication required for alert creation

### ✅ Maintainable
- Clear separation: `supabase` for user operations, `supabaseService` for system operations
- Easy to identify which operations bypass RLS
- Follows existing patterns in codebase

## Testing

Run the test script to verify:
```bash
node test-alert-system.js
```

**Expected output:**
```
✅ Alert system is working correctly!
✅ Alerts can be created and queried
✅ Relations are working properly
```

## Alert Triggers

Alerts are now created when:

1. **AI Automation Disabled** (`type: 'manual_required'`)
   - Global kill switch is off
   - All messages require manual handling

2. **Manual Mode - Staff Engaged** (`type: 'manual_required'`)
   - Conversation is in manual mode
   - Staff has replied
   - Customer sends follow-up that needs manual attention

3. **Manual Mode - No Staff Reply** (`type: 'manual_required'`)
   - Conversation is in manual mode
   - No staff reply yet
   - Waiting for staff to engage

4. **Staff Recently Active** (`type: 'manual_required'`)
   - Staff replied within last 5 minutes
   - Giving staff time to respond
   - Alert notifies of new customer message

5. **Low Confidence Response** (`type: 'low_confidence'`)
   - AI responded but confidence was below threshold
   - Staff should review the conversation

6. **Manual Handoff Indicated** (`type: 'manual_required'`)
   - AI response indicates handoff to staff
   - Phrases like "I'll pass this to John"

## Notification System

When alerts are created:

1. **Database Record**: Alert saved to `alerts` table
2. **SMS Notification**: If rate limit allows, SMS sent via MacroDroid webhook
3. **Dashboard Alert**: Alert appears in `/dashboard/alerts` page
4. **Real-time Updates**: Alert center updates via Supabase realtime

## Rate Limiting

Notifications are rate-limited to prevent spam:
- **Normal alerts**: Max 1 per 15 minutes per conversation
- **High priority**: Max 1 per 5 minutes per conversation

## Verification

To verify alerts are working in production:

1. **Check database**:
   ```sql
   SELECT * FROM alerts ORDER BY created_at DESC LIMIT 10;
   ```

2. **Check dashboard**: Visit `/dashboard/alerts`

3. **Trigger test alert**: 
   - Disable AI automation in settings
   - Send a test message
   - Check if alert appears

## Files Modified

- `/app/api/messages/incoming/route.ts` - Added service client for alerts
- `/test-alert-system.js` - Test script to verify functionality
- `/ALERT_SYSTEM_FIX.md` - This documentation

## Related Files

- `/lib/supabase/service.ts` - Service role client implementation
- `/app/lib/alert-notifier.ts` - SMS notification logic
- `/components/alerts/alerts-table.tsx` - Dashboard display
- `/app/dashboard/alerts/page.tsx` - Alerts page

## Migration Not Required

No database migration needed - the alerts table structure is correct. The issue was purely in the application code not using the right client for inserts.

## Security Notes

- Service role key must be set in environment: `SUPABASE_SERVICE_ROLE_KEY`
- Service client only used for system operations (alerts, API logs)
- Never expose service role key to client-side code
- Regular client still enforces RLS for user operations

---

**Status**: ✅ Fixed and tested
**Date**: November 8, 2024
**Impact**: Alert system now fully functional
