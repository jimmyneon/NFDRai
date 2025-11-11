# Setting Up the Cron Job

## What It Does

The cron job automatically resets conversations stuck in manual mode back to auto mode every 5 minutes.

**Resets conversations when:**
- Staff replied 30+ minutes ago
- No staff reply at all (conversation created in manual mode)

**Benefits:**
- ✅ Proactive - doesn't wait for customer to send another message
- ✅ Prevents conversations getting stuck
- ✅ Runs automatically in the background
- ✅ No manual intervention needed

---

## Setup Steps

### 1. Generate a Secret Token

Run this command to generate a random secret:

```bash
openssl rand -base64 32
```

Copy the output (e.g., `abc123xyz789...`)

### 2. Add to Vercel Environment Variables

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Name:** `CRON_SECRET`
   - **Value:** (paste the secret from step 1)
   - **Environments:** Production, Preview, Development
5. Click **Save**

### 3. Redeploy

The cron job will be automatically configured on your next deployment.

**Option A: Automatic**
- Just push to GitHub - Vercel will auto-deploy

**Option B: Manual**
- Go to Vercel Dashboard → Deployments
- Click "Redeploy" on the latest deployment

---

## Verify It's Working

### Check Cron Jobs in Vercel

1. Go to your project in Vercel
2. Click **Settings** → **Cron Jobs**
3. You should see:
   ```
   /api/cron/reset-stale-conversations
   Schedule: */5 * * * *
   ```

### Check Logs

1. Go to **Deployments** → Latest deployment
2. Click **Functions** → `api/cron/reset-stale-conversations`
3. Check logs for:
   ```
   [Cron] Starting stale conversation reset...
   [Cron] Found X manual conversations
   [Cron] ✅ Reset Y conversations in Zms
   ```

### Test Manually

You can trigger the cron job manually:

```bash
curl -X GET https://your-app.vercel.app/api/cron/reset-stale-conversations \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected response:
```json
{
  "success": true,
  "resetCount": 2,
  "totalManual": 5,
  "durationMs": 234,
  "timestamp": "2025-11-11T15:30:00.000Z"
}
```

---

## How It Works

### Schedule
- **Frequency:** Every 5 minutes
- **Cron Expression:** `*/5 * * * *`
- **Timezone:** UTC

### Logic

```typescript
For each conversation in manual mode:
  1. Find last staff message
  2. If no staff message → reset to auto
  3. If staff replied 30+ min ago → reset to auto
  4. Otherwise → keep in manual mode
```

### Performance
- Runs in ~200-500ms
- Single batch update (efficient)
- No impact on user experience

---

## Monitoring

### Success Metrics
- Check logs every day
- Should see `resetCount > 0` occasionally
- `totalManual` should be low (< 5)

### Warning Signs
- ⚠️ `totalManual` consistently high (> 10)
  - May indicate mode switching logic issues
  
- ⚠️ Cron job not running
  - Check CRON_SECRET is set
  - Check vercel.json is deployed
  
- ⚠️ Errors in logs
  - Check database connection
  - Check Supabase service role key

---

## Troubleshooting

### Cron Job Not Running

**Check 1: Is vercel.json deployed?**
```bash
# Check if file exists in deployment
curl https://your-app.vercel.app/vercel.json
```

**Check 2: Is CRON_SECRET set?**
- Go to Vercel → Settings → Environment Variables
- Verify `CRON_SECRET` exists

**Check 3: Check Vercel Cron Jobs page**
- Settings → Cron Jobs
- Should show the job

### Cron Job Returns 401 Unauthorized

- CRON_SECRET doesn't match
- Regenerate secret and update in Vercel

### Cron Job Returns 500 Error

- Check logs for specific error
- Usually database connection issue
- Verify SUPABASE_SERVICE_ROLE_KEY is set

---

## Cost

**Vercel Cron Jobs:**
- ✅ Free on all plans
- Runs every 5 minutes = 288 times/day
- Each run takes ~200-500ms
- Well within free tier limits

**Database Queries:**
- 1 SELECT query (fetch manual conversations)
- 1 UPDATE query (batch reset)
- Minimal cost

---

## Future Improvements

### Potential Enhancements

1. **Smarter Scheduling**
   - Run more frequently during business hours
   - Less frequent at night

2. **Analytics**
   - Track how many conversations get reset
   - Identify patterns

3. **Notifications**
   - Alert if too many conversations stuck
   - Daily summary email

4. **Configurable Timeout**
   - Make 30-minute timeout configurable
   - Different timeouts for different conversation types

---

## Alternative: Manual Reset

If you don't want to use cron jobs, you can manually reset conversations:

```bash
# Run the script we created earlier
node fix-stuck-manual-mode.js
```

Or run SQL directly in Supabase:

```sql
-- Reset all manual conversations where staff replied 30+ min ago
UPDATE conversations
SET status = 'auto', updated_at = NOW()
WHERE status = 'manual'
AND id IN (
  SELECT DISTINCT c.id
  FROM conversations c
  LEFT JOIN messages m ON m.conversation_id = c.id AND m.sender = 'staff'
  WHERE c.status = 'manual'
  AND (
    m.id IS NULL  -- No staff message
    OR EXTRACT(EPOCH FROM (NOW() - m.created_at)) / 60 > 30  -- 30+ min ago
  )
);
```

---

## Summary

✅ **Cron job is now set up** - it will run every 5 minutes
✅ **Conversations won't get stuck** - automatic reset after 30 minutes
✅ **No manual intervention needed** - fully automated
✅ **Free to run** - no additional cost

Just add the `CRON_SECRET` to Vercel and redeploy!
