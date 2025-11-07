# UI Changes Not Showing? Force Refresh

## The Issue
Browser is caching the old version of the conversation dialog component.

## Quick Fix - Hard Refresh

### On Mac:
**Chrome/Edge**: `Cmd + Shift + R`
**Safari**: `Cmd + Option + R`
**Firefox**: `Cmd + Shift + R`

### On Windows:
**Chrome/Edge/Firefox**: `Ctrl + Shift + R`

## Alternative: Clear Cache

### Chrome/Edge
1. Open DevTools (`Cmd + Option + I` on Mac, `F12` on Windows)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Safari
1. Go to Safari → Settings → Advanced
2. Check "Show Develop menu"
3. Develop → Empty Caches
4. Refresh page

## What Should You See After Refresh?

### Conversation Dialog
✅ **Auto-scrolls to bottom** - Latest message visible immediately
✅ **Staff messages in blue** - Your manual replies are blue
✅ **AI messages in green** - AI responses stay green
✅ **Real-time updates** - New messages appear without refresh

### Message Colors
- 👤 Customer (gray, left side)
- 🤖 AI (green, right side)
- 👨‍💼 Staff (blue, right side) ← **YOUR MESSAGES**

## Still Not Working?

### Check Vercel Deployment
1. Go to https://vercel.com/dashboard
2. Find your project
3. Check latest deployment status
4. Should show: "Fix conversation dialog scroll and staff message colors"

### Check Browser Console
1. Open DevTools (`F12` or `Cmd + Option + I`)
2. Go to Console tab
3. Look for any errors
4. Share errors if you see any

## Autoresponder Detection (New)

This is working on the backend. You won't see UI changes for this, but check logs:

```
[Autoresponder] Detected automated message
[Autoresponder] From: AMAZON
[Autoresponder] Reason: Known company automated message
```

Messages from eBay, Lebara, Dominos, delivery services, etc. will be saved but ignored (no AI response).

## Test the Changes

### Test Auto-Scroll
1. Open a conversation with many messages
2. Dialog should open scrolled to bottom
3. Send a new message via MacroDroid
4. Should auto-scroll to show new message

### Test Blue Staff Messages
1. Open a conversation where you manually replied
2. Your messages should be blue
3. AI messages should be green
4. Customer messages should be gray

### Test Autoresponder
1. Send a test message from a short code (e.g., 12345)
2. Or send message with "Your order has been delivered"
3. Check Vercel logs for `[Autoresponder]`
4. Should not get AI response

## Cache Busting URL

If hard refresh doesn't work, try adding `?v=2` to the URL:
```
https://your-domain.vercel.app/dashboard?v=2
```

This forces the browser to fetch fresh resources.
