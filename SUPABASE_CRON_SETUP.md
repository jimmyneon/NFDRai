# Supabase Cron Job Setup

## Why Supabase Instead of Vercel?

Vercel Hobby plan only allows **daily** cron jobs. Our stale conversation reset needs to run **every 5 minutes**.

Supabase provides `pg_cron` extension for free on all plans! ✅

## What This Does

Automatically resets conversations stuck in "manual" mode back to "auto" mode after 30 minutes of staff inactivity.

**Runs:** Every 5 minutes  
**Checks:** Conversations in manual mode with no staff reply in 30+ minutes  
**Action:** Switches them back to auto mode

## How to Apply

### Step 1: Apply Migration

Go to Supabase Dashboard → SQL Editor and run:

```sql
-- Copy/paste contents of:
supabase/migrations/048_setup_cron_for_stale_conversations.sql
```

### Step 2: Verify Cron Job Created

```sql
-- Check cron job exists
SELECT * FROM cron.job WHERE jobname = 'reset-stale-conversations';
```

**Expected Result:**
```
jobid | schedule     | command                                      | nodename  | nodeport | database | username | active | jobname
------|--------------|----------------------------------------------|-----------|----------|----------|----------|--------|-------------------------
1     | */5 * * * *  | SELECT reset_stale_manual_conversations()   | localhost | 5432     | postgres | postgres | t      | reset-stale-conversations
```

### Step 3: Test Function Manually

```sql
-- Run function manually to test
SELECT reset_stale_manual_conversations();
```

Should return: `NOTICE: Reset X stale conversations from manual to auto mode`

## How It Works

### The Function
```sql
reset_stale_manual_conversations()
```

**Logic:**
1. Find conversations in "manual" mode
2. Check if updated more than 30 minutes ago
3. Check if no staff message in last 30 minutes
4. Switch those conversations to "auto" mode
5. Log how many were reset

### The Cron Schedule
```
*/5 * * * *  = Every 5 minutes
```

Runs 24/7 automatically in Supabase.

## Monitoring

### Check Cron Job Status
```sql
-- View all cron jobs
SELECT * FROM cron.job;

-- View cron job history
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'reset-stale-conversations')
ORDER BY start_time DESC 
LIMIT 10;
```

### Check Last Run
```sql
-- See when it last ran and if successful
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'reset-stale-conversations')
ORDER BY start_time DESC
LIMIT 5;
```

## Troubleshooting

### Issue 1: pg_cron Extension Not Available
**Solution:**
- pg_cron is available on Supabase Pro and higher
- If on Free plan, upgrade or use Supabase Edge Functions instead

### Issue 2: Cron Job Not Running
**Check:**
```sql
-- Verify job is active
SELECT jobname, active FROM cron.job WHERE jobname = 'reset-stale-conversations';
```

**Fix:**
```sql
-- Enable if inactive
UPDATE cron.job SET active = true WHERE jobname = 'reset-stale-conversations';
```

### Issue 3: Function Errors
**Check logs:**
```sql
SELECT return_message, start_time 
FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'reset-stale-conversations')
AND status = 'failed'
ORDER BY start_time DESC;
```

## Manual Operations

### Pause Cron Job
```sql
UPDATE cron.job 
SET active = false 
WHERE jobname = 'reset-stale-conversations';
```

### Resume Cron Job
```sql
UPDATE cron.job 
SET active = true 
WHERE jobname = 'reset-stale-conversations';
```

### Delete Cron Job
```sql
SELECT cron.unschedule('reset-stale-conversations');
```

### Recreate Cron Job
```sql
SELECT cron.schedule(
  'reset-stale-conversations',
  '*/5 * * * *',
  $$SELECT reset_stale_manual_conversations()$$
);
```

## Benefits vs Vercel Cron

| Feature | Vercel Hobby | Supabase pg_cron |
|---------|--------------|------------------|
| **Frequency** | Daily only | Every 5 minutes ✅ |
| **Cost** | Free | Free ✅ |
| **Reliability** | Good | Excellent ✅ |
| **Monitoring** | Limited | Full logs ✅ |
| **Setup** | Easy | Easy ✅ |

## Alternative: Supabase Edge Functions

If pg_cron is not available, use Edge Functions with cron trigger:

```typescript
// supabase/functions/reset-stale-conversations/index.ts
import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  // Reset stale conversations
  const { data, error } = await supabase.rpc('reset_stale_manual_conversations')
  
  return new Response(JSON.stringify({ success: !error, data }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

Then schedule in Supabase Dashboard → Edge Functions → Cron.

## Cleanup Old Vercel Cron

The Vercel cron endpoint can be deleted:
- `/app/api/cron/reset-stale-conversations/route.ts` (optional to keep as backup)
- `vercel.json` cron config removed ✅

## Verification Checklist

- [ ] Migration 048 applied
- [ ] Cron job shows in `cron.job` table
- [ ] Job is active (`active = true`)
- [ ] Function runs manually without errors
- [ ] Check `cron.job_run_details` after 5 minutes
- [ ] Verify conversations are being reset
- [ ] Remove Vercel cron config

## Next Steps

1. Apply migration 048 in Supabase
2. Verify cron job created
3. Test function manually
4. Wait 5 minutes and check job_run_details
5. Monitor for 24 hours to ensure working

Done! Your cron job now runs every 5 minutes in Supabase for free! 🎉
