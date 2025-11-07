# Deploy Message Batching & Handoff Fixes

## Current Status

✅ **Local Build**: Successful - all routes compile correctly including `/api/messages/send`
❌ **Vercel Deployment**: 404 error - changes not deployed yet

## What Needs to be Deployed

### New Files
1. `app/lib/message-batcher.ts` - Message batching logic
2. `update-system-prompt-reduce-handoffs.sql` - Updated AI prompt
3. `MESSAGE_BATCHING_AND_HANDOFF_FIX.md` - Documentation
4. `apply-message-fixes.sh` - Setup script

### Modified Files
1. `app/api/messages/incoming/route.ts` - Batching integration
2. `lib/ai/response-generator.ts` - Enhanced prompt rules

## Deployment Steps

### Step 1: Commit and Push Changes
```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Fix: Add message batching and reduce unnecessary handoffs

- Implement 3-second batching window for rapid customer messages
- Update AI prompt to handle more queries independently
- Reduce 'pass to John' responses for standard queries
- Improve handoff detection patterns"

# Push to main branch (triggers Vercel deployment)
git push origin main
```

### Step 2: Monitor Vercel Deployment
1. Go to https://vercel.com/dashboard
2. Find your project: `nfd-rai`
3. Watch the deployment progress
4. Wait for "Ready" status (usually 1-2 minutes)

### Step 3: Update AI System Prompt in Supabase
Once deployed, update the AI settings:

**Option A - Via Supabase SQL Editor:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy contents of `update-system-prompt-reduce-handoffs.sql`
4. Click Run

**Option B - Via Dashboard Settings:**
1. Go to https://nfd-rai.vercel.app/dashboard/settings
2. Update the System Prompt field
3. Copy the prompt from `update-system-prompt-reduce-handoffs.sql`
4. Save changes

### Step 4: Verify Deployment
Test the `/api/messages/send` endpoint:
```bash
curl -X POST https://nfd-rai.vercel.app/api/messages/send \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "conversationId=lookup-by-phone" \
  -d "customerPhone=+1234567890" \
  -d "text=Test message" \
  -d "sender=staff" \
  -d "trackOnly=true"
```

Expected: `200 OK` response (not 404)

## Testing After Deployment

### Test 1: Rapid Message Batching
1. Send 3-4 quick SMS messages to your system
2. Expected: Single comprehensive response after 3 seconds
3. Check logs for: `[Batching] Combined X rapid messages from...`

### Test 2: Reduced Handoffs
Send these queries - AI should handle WITHOUT passing to John:
- "How much for iPhone screen repair?"
- "Do you buy phones?"
- "What are your hours?"
- "Got any cases?"

### Test 3: Proper Escalation
Send these - AI SHOULD pass to John:
- "Can I speak to the owner?"
- "I want to complain about..."

## Troubleshooting

### If 404 Persists After Deployment
1. Check Vercel deployment logs for errors
2. Verify environment variables are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Try manual redeploy in Vercel dashboard

### If Build Fails
1. Check for TypeScript errors: `npm run build`
2. Verify all imports are correct
3. Check Node.js version (should be 20+)

### If Batching Doesn't Work
1. Check server logs for batching messages
2. Verify `message-batcher.ts` is deployed
3. Test locally first: `npm run dev`

## Current Build Output

The local build shows all routes are working:
```
✓ Compiled successfully
Route (app)                                 Size  First Load JS
├ ƒ /api/messages/send                     153 B         102 kB  ✅
├ ƒ /api/messages/incoming                 153 B         102 kB  ✅
├ ƒ /api/messages/delivery-confirmation    153 B         102 kB  ✅
└ ƒ /api/messages/missed-call              153 B         102 kB  ✅
```

## Quick Deploy Command

```bash
# One-liner to commit and push
git add . && git commit -m "Fix: Message batching and handoff reduction" && git push origin main
```

Then wait for Vercel to deploy (check dashboard for status).
