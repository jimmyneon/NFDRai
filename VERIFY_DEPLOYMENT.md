# Verify Unified Analyzer Deployment

## Check Vercel Deployment

1. **Go to Vercel Dashboard:**
   - https://vercel.com/jimmyneon/nfdrai/deployments
   - Check latest deployment status
   - Should show commit `40de894`

2. **Check Deployment Logs:**
   - Click on latest deployment
   - Check build logs for errors
   - Verify build succeeded

## Check if Changes Are Live

### Method 1: Check Vercel Environment
```bash
# Check current deployment
curl https://your-app.vercel.app/api/health
```

### Method 2: Trigger Manual Redeploy
If Vercel didn't auto-deploy:

1. Go to Vercel Dashboard → Your Project
2. Click "Deployments" tab
3. Find commit `40de894` 
4. Click "..." → "Redeploy"

OR

5. Go to Settings → Git
6. Click "Redeploy" button

### Method 3: Force Push (if needed)
```bash
# Force Vercel to see changes
git commit --allow-empty -m "Force Vercel redeploy"
git push origin main
```

## Verify New Code is Running

Once deployed, check logs for new unified analyzer:

### In Vercel Dashboard → Logs:
Look for these new log messages:
```
[Unified Analysis] Analyzing customer message...
[Unified Analysis] Result: { sentiment, intent, contentType, ... }
[Module Selection] Loading specific modules: [...]
[Prompt Modules] Loading specific modules from unified analyzer: [...]
```

### Old logs (should NOT see these anymore):
```
[Sentiment Analysis] Analyzing message...
[Context Check] Checking if message makes sense...
[AI Name Extraction] Found customer name...
```

## Test with Real Message

Send a test message to your system and check logs:

**Test Message:** "How much for iPhone screen?"

**Expected Logs:**
```
[Unified Analysis] Analyzing customer message...
[Unified Analysis] Result: {
  sentiment: 'neutral',
  intent: 'question',
  contentType: 'pricing',
  shouldRespond: true,
  requiresAttention: false,
  confidence: 0.9
}
[Module Selection] { 
  intent: 'question', 
  contentType: 'pricing', 
  modulesCount: 5, 
  modules: 'core_identity, context_awareness, duplicate_prevention, pricing_flow_detailed, services_comprehensive' 
}
[Prompt Modules] Loading specific modules from unified analyzer: [...]
```

## Common Issues

### Issue 1: Vercel Not Auto-Deploying
**Solution:** 
- Check Vercel Git integration is connected
- Manually trigger redeploy
- Check build logs for errors

### Issue 2: Build Fails
**Solution:**
- Check Vercel build logs
- Verify TypeScript compiles locally: `npm run build`
- Check for missing dependencies

### Issue 3: Old Code Still Running
**Solution:**
- Clear Vercel cache: Settings → Clear Cache
- Force redeploy
- Check deployment is using correct branch (main)

### Issue 4: Environment Variables
**Solution:**
- Verify all env vars are set in Vercel
- Check OPENAI_API_KEY is present
- Redeploy after adding env vars

## Quick Verification Checklist

- [ ] Latest commit is `40de894`
- [ ] Vercel shows successful deployment
- [ ] Build logs show no errors
- [ ] Test message shows new log format
- [ ] No TypeScript errors in logs
- [ ] Database migration applied (separate step)

## Force Redeploy Command

If nothing works, force a redeploy:

```bash
cd /Users/johnhopwood/NFDRAIRESPONDER
git commit --allow-empty -m "Force Vercel redeploy - unified analyzer"
git push origin main
```

Then check Vercel dashboard for new deployment.

## Contact Vercel Support

If still not deploying:
1. Check Vercel status page: https://www.vercel-status.com/
2. Contact Vercel support with deployment URL
3. Check GitHub webhook is working: GitHub repo → Settings → Webhooks
