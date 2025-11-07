# ⚠️ Vercel Redeploy Required

## Issue
Getting 404 error on `/api/messages/send` endpoint on Vercel, but the code is already pushed to GitHub.

## Why This Happens
Your changes are committed and pushed (commit `009b39e`), but Vercel hasn't automatically deployed them yet. This can happen if:
- Vercel deployment failed silently
- Auto-deploy is disabled
- There was a build error on Vercel

## Solution: Force Redeploy on Vercel

### Option 1: Redeploy via Vercel Dashboard (Easiest)
1. Go to https://vercel.com/dashboard
2. Find your project: `nfd-rai`
3. Click on the latest deployment
4. Click the **"Redeploy"** button (three dots menu → Redeploy)
5. Wait 1-2 minutes for deployment to complete
6. Test: https://nfd-rai.vercel.app/api/messages/send

### Option 2: Push an Empty Commit (Alternative)
```bash
# Create an empty commit to trigger Vercel
git commit --allow-empty -m "Trigger Vercel redeploy"
git push origin main
```

### Option 3: Check Vercel Deployment Logs
1. Go to https://vercel.com/dashboard
2. Click on your project
3. Go to "Deployments" tab
4. Check the latest deployment status
5. If it failed, click on it to see error logs

## What's Already Done ✅

All code changes are committed and pushed:
- ✅ `app/lib/message-batcher.ts` - Message batching logic
- ✅ `app/api/messages/incoming/route.ts` - Updated with batching
- ✅ `lib/ai/response-generator.ts` - Enhanced AI rules
- ✅ `update-system-prompt-reduce-handoffs.sql` - New AI prompt

Commit: `009b39e` - "Add real-time business hours, AI improvements, and message batching"

## After Vercel Deploys

Once Vercel shows "Ready" status:

### 1. Test the Endpoint
```bash
curl -X POST https://nfd-rai.vercel.app/api/messages/send \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "text=Test" \
  -d "conversationId=lookup-by-phone" \
  -d "customerPhone=+1234567890" \
  -d "trackOnly=true"
```

Expected: `200 OK` (not 404)

### 2. Update AI System Prompt
Run this SQL in Supabase:
```sql
-- Copy contents of update-system-prompt-reduce-handoffs.sql
-- Or run via: psql $DATABASE_URL -f update-system-prompt-reduce-handoffs.sql
```

### 3. Test the Fixes

**Test Rapid Messages:**
- Send 3-4 quick SMS messages
- Expected: Single comprehensive response after 3 seconds

**Test Reduced Handoffs:**
- "How much for iPhone screen?" → AI quotes price (no handoff)
- "Do you buy phones?" → AI explains process (no handoff)
- "What are your hours?" → AI checks status (no handoff)

## Quick Check: Is Vercel Deployed?

Run this to see the deployed version:
```bash
curl -I https://nfd-rai.vercel.app/api/messages/send
```

- If you get `HTTP/2 404` → Vercel needs to redeploy
- If you get `HTTP/2 400` or `HTTP/2 200` → Endpoint is live!

## Current Status

- ✅ Code committed and pushed to GitHub
- ✅ Local build successful
- ❌ Vercel deployment pending
- ⏳ Waiting for Vercel to deploy

**Next Step:** Go to Vercel dashboard and trigger a redeploy!
