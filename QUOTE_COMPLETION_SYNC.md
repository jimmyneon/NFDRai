# Quote Completion Sync - Daily Cron Job

## Overview
Automatically closes the loop on accepted quotes by checking the repair app daily and marking completed jobs.

---

## How It Works

**Daily at 2am UTC:**
1. Fetches all quotes with `status = 'accepted'`
2. For each quote, calls repair app API with customer's phone number
3. Matches job by device make/model
4. If job status = `COMPLETED` or `COLLECTED`, updates quote to `completed`

---

## Configuration

### **Vercel Cron Job**
```json
{
  "crons": [
    {
      "path": "/api/cron/sync-completed-quotes",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Schedule:** `0 2 * * *` = Daily at 2:00 AM UTC

### **Environment Variable Required**

Add to Vercel environment variables:

```bash
CRON_SECRET=your-random-secret-here
```

**Generate secret:**
```bash
openssl rand -base64 32
```

This prevents unauthorized access to the cron endpoint.

---

## API Endpoint

**URL:** `GET /api/cron/sync-completed-quotes`

**Headers:**
```
Authorization: Bearer {CRON_SECRET}
```

**Response:**
```json
{
  "success": true,
  "message": "Checked 5 quotes, marked 2 as completed",
  "checked": 5,
  "completed": 2,
  "results": [
    {
      "quote_id": "abc123",
      "phone": "+447410381247",
      "job_ref": "NFD-2024-001",
      "status": "completed"
    },
    {
      "quote_id": "def456",
      "phone": "+447410381248",
      "job_ref": "NFD-2024-002",
      "job_status": "IN_REPAIR",
      "status": "in_progress"
    }
  ]
}
```

---

## Quote Status Flow

```
1. pending → Customer requests quote
2. quoted → Quote sent via SMS
3. accepted → Customer accepts, sent to repair app
   ↓
   [Repair app processes job]
   ↓
4. completed → Daily cron detects COMPLETED/COLLECTED status
```

---

## Matching Logic

**Finds matching job by:**
- Customer phone number (from quote)
- Device make (e.g., "Apple")
- Device model (e.g., "iPhone 14 Pro")

**Marks as completed if repair app status is:**
- `COMPLETED`
- `COLLECTED`

---

## Logs

```
[Cron] Starting daily quote completion sync...
[Cron] Checking 3 accepted quotes...
[Cron] Checking quote abc123 for +447410381247...
[Cron] Found job NFD-2024-001 with status: COMPLETED
[Cron] ✅ Job NFD-2024-001 is complete - updating quote abc123
[Cron] ✅ Sync complete: 1 quotes marked as completed
```

---

## Error Handling

**No jobs found:**
- Logs: "No jobs found for quote"
- Status: `no_jobs_found`
- Quote remains `accepted`

**No matching job:**
- Logs: "No matching job found"
- Status: `no_match`
- Quote remains `accepted`

**Job still in progress:**
- Logs: "Job still in progress (IN_REPAIR)"
- Status: `in_progress`
- Quote remains `accepted`

**Update failed:**
- Logs error
- Status: `update_failed`
- Quote remains `accepted`

---

## Manual Testing

**Test the endpoint manually:**

```bash
curl -X GET \
  https://your-app.vercel.app/api/cron/sync-completed-quotes \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Expected response:**
```json
{
  "success": true,
  "message": "Checked X quotes, marked Y as completed",
  "checked": X,
  "completed": Y,
  "results": [...]
}
```

---

## Deployment Steps

1. **Add CRON_SECRET to Vercel:**
   - Go to Vercel → Project → Settings → Environment Variables
   - Add: `CRON_SECRET` = `{your-random-secret}`
   - Apply to Production

2. **Deploy code:**
   ```bash
   git add vercel.json app/api/cron/sync-completed-quotes/route.ts
   git commit -m "Add daily quote completion sync cron job"
   git push
   ```

3. **Verify cron is active:**
   - Vercel → Project → Settings → Cron Jobs
   - Should show: `/api/cron/sync-completed-quotes` running daily at 2am UTC

4. **Test manually:**
   ```bash
   curl -X GET \
     https://your-app.vercel.app/api/cron/sync-completed-quotes \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

---

## Why Daily?

- Repairs take hours/days anyway
- Just closes the loop for record-keeping
- Not time-sensitive (you're not checking quote system after handoff)
- Keeps API calls minimal
- Free on Vercel

---

## Benefits

✅ **Automatic closure** - No manual status updates needed
✅ **Complete audit trail** - See which quotes became completed repairs
✅ **Clean dashboard** - Accepted quotes automatically move to completed
✅ **Low overhead** - Runs once daily, minimal API calls
✅ **Free** - Vercel cron jobs are free

---

## Files

- `app/api/cron/sync-completed-quotes/route.ts` - Cron endpoint
- `vercel.json` - Cron schedule configuration
- `app/lib/repair-status-checker.ts` - Repair app API client (reused)

---

## Future Enhancements

If you want real-time updates instead of daily:
1. Add webhook endpoint to AI Steve
2. Repair app calls webhook when job completes
3. Instant status update (no polling needed)

But daily is fine for now since it's just for record-keeping.
