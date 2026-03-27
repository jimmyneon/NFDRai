# Repair App Sync - Implementation Complete ✅

## What Was Implemented

The AI Responder now automatically syncs all quote data to the Repair App via webhook integration.

---

## Files Created/Modified

### New Files:
1. **`/app/lib/repair-app-sync.ts`** - Webhook sync utility function
2. **`/scripts/sync-quotes-to-repair-app.ts`** - Bulk sync script for existing quotes
3. **`/REPAIR_APP_INTEGRATION_SPEC.md`** - Complete integration documentation

### Modified Files:
1. **`/app/api/public/start-repair/route.ts`** - Added sync call when new quotes created
2. **`/app/api/quotes/send/route.ts`** - Added sync call when quotes updated/sent

---

## How It Works

### Automatic Sync (New Quotes)

When a new quote is created via `/api/public/start-repair`:
1. Quote saved to database
2. SMS confirmation sent to customer
3. **Quote automatically synced to Repair App** ✅
4. MacroDroid notification sent

### Automatic Sync (Quote Updates)

When a quote is sent/updated via `/api/quotes/send`:
1. Quote price and status updated
2. SMS sent to customer
3. **Updated quote automatically synced to Repair App** ✅
4. Conversation switched to auto mode

### What Gets Synced

Every quote sync includes:
- `quote_request_id` - Unique identifier
- `customer_name`, `customer_phone`, `customer_email`
- `device_make`, `device_model`, `issue`
- `description`, `additional_issues`
- `quoted_price`, `status`, `type`
- `source_page`, `source`, `requires_parts_order`
- `conversation_id`, `created_at`

---

## Environment Variables

Already configured in Vercel:
```bash
REPAIR_APP_WEBHOOK_URL=https://your-repair-app-domain.com/api/quotes/sync
REPAIR_APP_WEBHOOK_SECRET=your-shared-secret-key
```

---

## Bulk Sync Existing Quotes

To sync all existing quotes from the last 90 days:

```bash
npx tsx scripts/sync-quotes-to-repair-app.ts
```

**What it does:**
- Fetches all quotes from last 90 days
- Sends each quote to Repair App webhook
- Shows progress with success/fail counts
- Rate limited to 100ms between requests

**Example output:**
```
🔄 Starting bulk quote sync to Repair App...

📅 Fetching quotes from 2025-12-14 onwards...
📊 Found 47 quotes to sync

────────────────────────────────────────────────────────────────────────────────
[1/47] John Smith - Apple iPhone 14 Pro... ✅
[2/47] Sarah Jones - Samsung Galaxy S23... ✅
[3/47] Mike Brown - Apple MacBook Pro... ✅
...
────────────────────────────────────────────────────────────────────────────────

📈 Sync Summary:
   ✅ Success: 47
   ❌ Failed:  0
   📊 Total:   47

🎉 All quotes synced successfully!
```

---

## Testing

### Test New Quote Creation

1. Submit a quote via website form
2. Check AI Responder logs: `[Repair App Sync] Syncing quote to Repair App`
3. Check Repair App: Quote should appear in search

### Test Quote Update

1. Send a quote via dashboard
2. Check AI Responder logs: `[Repair App Sync] ✅ Quote synced successfully`
3. Check Repair App: Quote should show updated price/status

### Test Bulk Sync

```bash
npx tsx scripts/sync-quotes-to-repair-app.ts
```

Check Repair App database:
```sql
SELECT COUNT(*) FROM quotes;
```

---

## Webhook Behavior

### Success (200 OK)
- Quote synced successfully
- Logs: `[Repair App Sync] ✅ Quote synced successfully`

### Failure (4xx/5xx)
- Error logged but doesn't break quote creation
- Logs: `[Repair App Sync] Failed to sync quote: [status] - [error]`
- Quote still saved in AI Responder database

### Not Configured
- If webhook URL/secret not set, sync is skipped silently
- Logs: `[Repair App Sync] Webhook not configured - skipping sync`

---

## Monitoring

Check Vercel logs for sync activity:

**Successful sync:**
```
[Repair App Sync] Syncing quote to Repair App: {
  quote_id: "550e8400-e29b-41d4-a716-446655440000",
  customer: "John Smith",
  device: "Apple iPhone 14 Pro"
}
[Repair App Sync] ✅ Quote synced successfully
```

**Failed sync:**
```
[Repair App Sync] Failed to sync quote: {
  status: 401,
  error: "Unauthorized"
}
```

---

## Troubleshooting

### Quotes Not Appearing in Repair App

1. **Check webhook URL is correct:**
   - Vercel → Settings → Environment Variables
   - `REPAIR_APP_WEBHOOK_URL` should be `https://your-repair-app.com/api/quotes/sync`

2. **Check webhook secret matches:**
   - AI Responder: `REPAIR_APP_WEBHOOK_SECRET`
   - Repair App: `AI_RESPONDER_WEBHOOK_SECRET`
   - Must be **exactly the same**

3. **Check Vercel logs:**
   - Look for `[Repair App Sync]` messages
   - Check for 401 (wrong secret) or 400 (bad payload) errors

4. **Test webhook manually:**
   ```bash
   curl -X POST https://repair-app.com/api/quotes/sync \
     -H "Content-Type: application/json" \
     -H "x-webhook-secret: your-secret" \
     -d '{
       "quote_request_id": "test-id",
       "customer_name": "Test",
       "customer_phone": "+447410123456",
       "device_make": "Apple",
       "device_model": "iPhone 14",
       "issue": "Screen"
     }'
   ```

### Bulk Sync Fails

1. **Check environment variables:**
   ```bash
   # In .env.local
   REPAIR_APP_WEBHOOK_URL=...
   REPAIR_APP_WEBHOOK_SECRET=...
   ```

2. **Check Repair App is running:**
   - Webhook endpoint must be accessible
   - Check Repair App logs for incoming requests

3. **Run with verbose logging:**
   - Script shows each quote sync attempt
   - Failed syncs show error details

---

## Next Steps

1. ✅ **Webhook integration complete** - No code changes needed
2. ✅ **Environment variables configured** - Already in Vercel
3. 🔄 **Run bulk sync** - Sync existing quotes:
   ```bash
   npx tsx scripts/sync-quotes-to-repair-app.ts
   ```
4. ✅ **Test** - Create a new quote and verify it appears in Repair App

---

## Summary

**What happens now:**
- ✅ New quotes → Automatically synced to Repair App
- ✅ Quote updates → Automatically synced to Repair App
- ✅ Existing quotes → Can be bulk synced with script
- ✅ Repair App → Can search and convert quotes to jobs

**No manual intervention needed** - Everything syncs automatically! 🎉
