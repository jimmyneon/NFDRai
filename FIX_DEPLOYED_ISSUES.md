# Fix Deployed Issues

## Problem
After deploying to Vercel:
1. Conversation dialog still doesn't scroll to bottom
2. AI messages still showing as staff (blue)

## Root Causes

### 1. Browser Cache
Your browser is caching the old JavaScript code.

**Fix:**
- **Hard refresh:** Press `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)
- **Clear cache:** Open DevTools → Application → Clear Storage → Clear site data
- **Incognito mode:** Open site in incognito/private window

### 2. Existing Database Messages
Messages saved BEFORE the fix still have wrong sender type in database.

**Fix:** Run this SQL in Supabase:

```sql
-- Update existing messages with AI Steve signature
UPDATE messages
SET sender = 'ai'
WHERE 
  sender = 'staff'
  AND (
    text ILIKE '%many thanks, AI Steve%'
    OR text ILIKE '%best regards, AI Steve%'
    OR text ILIKE '%regards, AI Steve%'
    OR text ILIKE '%thanks, AI Steve%'
    OR text ILIKE '%cheers, AI Steve%'
    OR text ILIKE '%AI Steve from New Forest%'
  );
```

## Step-by-Step Fix

### Step 1: Clear Browser Cache
1. Open your site
2. Press `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)
3. Or open in incognito mode

### Step 2: Fix Database
1. Go to https://supabase.com
2. Open your project
3. Go to SQL Editor
4. Run the SQL script: `fix-existing-message-senders.sql`
5. Check results

### Step 3: Verify Fixes

**Test Auto-Scroll:**
1. Open conversation with many messages
2. Dialog should open at bottom
3. Latest messages should be visible immediately

**Test Sender Detection:**
1. Look at messages in conversation
2. Messages ending with "AI Steve" should have primary color (not blue)
3. Messages ending with "John" should have blue color

## Verification Commands

### Check if Vercel deployed latest code
```bash
git log --oneline -3
```

Should show:
```
3679b8a Fix sender detection for AI vs staff messages
30338da Fix UTF-8 encoding and conversation dialog UX
```

### Check database for wrong senders
```sql
-- Count messages with AI Steve signature but wrong sender
SELECT COUNT(*) 
FROM messages
WHERE sender = 'staff'
  AND text ILIKE '%AI Steve%';
```

Should return `0` after fix.

### Check browser cache
1. Open DevTools (F12)
2. Go to Network tab
3. Reload page
4. Check if JavaScript files show "200" or "304 (from cache)"
5. If "304", do hard refresh

## Still Not Working?

### Check Vercel Deployment
1. Go to https://vercel.com/dashboard
2. Find your project
3. Check latest deployment
4. Look for commit `3679b8a` or `30338da`
5. If not there, trigger redeploy

### Check Console Errors
1. Open DevTools (F12)
2. Go to Console tab
3. Look for errors
4. Share any errors you see

### Check Network Requests
1. Open DevTools (F12)
2. Go to Network tab
3. Open a conversation
4. Look for API calls to `/api/messages/`
5. Check response data

## Expected Behavior After Fix

### Conversation Dialog
- ✅ Opens at bottom showing newest messages
- ✅ No manual scrolling needed
- ✅ New messages appear in realtime
- ✅ Smooth scroll for new messages

### Message Styling
- ✅ AI messages (AI Steve): Primary color background
- ✅ Staff messages (John): Blue background
- ✅ Customer messages: Gray background
- ✅ Delivery status (✓✓) shows for all sent messages

## Quick Test

Run this in browser console:
```javascript
// Check if sender detection is loaded
fetch('/api/messages/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    conversationId: 'test',
    text: 'Test message. Many thanks, AI Steve'
  })
}).then(r => r.json()).then(console.log)
```

Check server logs for:
```
[Send Message] Sender detection: {
  providedSender: undefined,
  detectedSender: 'ai',
  textPreview: 'Test message. Many thanks, AI Steve'
}
```

## Contact
If still not working after these steps, check:
1. Vercel deployment logs
2. Browser console errors
3. Supabase database directly
4. Network tab for failed requests
