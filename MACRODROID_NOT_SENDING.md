# MacroDroid Not Sending Messages to Webhook

## Problem
AI only responds when you click "Retry with AI" button, not automatically when customers send messages.

## Root Cause
MacroDroid is **not calling the incoming webhook** when new SMS messages arrive.

## Evidence
- Customer message at 4:46 PM from Shopify - **no AI response**
- AI only responds when you manually click "Retry with AI"
- This means the `/api/messages/incoming` endpoint is NOT being called

## MacroDroid Setup Check

### Macro 1: Incoming SMS → Webhook
This macro should trigger when SMS arrives and send to your Vercel webhook.

**Required Setup:**
1. **Trigger:** SMS Received (Any Number)
2. **Action:** HTTP POST Request
   - URL: `https://your-app.vercel.app/api/messages/incoming`
   - Method: POST
   - Content Type: application/json
   - Body:
   ```json
   {
     "from": "{sender}",
     "message": "{smsrb}",
     "channel": "sms"
   }
   ```

### Common Issues:

#### Issue 1: Macro is Disabled
- Open MacroDroid app
- Go to Macros tab
- Check if "Incoming SMS" macro has a green checkmark
- If red X, tap to enable it

#### Issue 2: Wrong Webhook URL
- The URL must be your actual Vercel deployment URL
- Format: `https://your-app-name.vercel.app/api/messages/incoming`
- NOT localhost or 127.0.0.1

#### Issue 3: Macro Not Triggering
- Check MacroDroid logs
- Menu → Macro Log
- See if macro runs when SMS arrives
- If not running, trigger might be wrong

#### Issue 4: HTTP Request Failing
- Check MacroDroid logs for HTTP errors
- Common errors:
  - 404: Wrong URL
  - 400: Wrong JSON format
  - 500: Server error

## How to Test

### Test 1: Check if Macro Runs
1. Send yourself an SMS
2. Open MacroDroid
3. Go to Menu → Macro Log
4. See if "Incoming SMS" macro appears
5. If NO → Trigger is wrong or macro disabled
6. If YES → Check HTTP request details

### Test 2: Check HTTP Request
1. In Macro Log, tap on the macro run
2. Look for "HTTP Request" action
3. Check:
   - URL is correct
   - Status code (should be 200)
   - Response body
4. If status is 400/404/500 → See error details

### Test 3: Manual Webhook Test
Test the webhook directly with curl:

```bash
curl -X POST https://your-app.vercel.app/api/messages/incoming \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+447123456789",
    "message": "Test message",
    "channel": "sms"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "AI response sent"
}
```

## Fix Steps

### Step 1: Verify Macro Exists
1. Open MacroDroid
2. Go to Macros tab
3. Find "Incoming SMS" or similar macro
4. If missing → Create it (see setup above)

### Step 2: Check Macro is Enabled
1. Tap on the macro
2. Look for green checkmark at top
3. If disabled (red X), tap to enable

### Step 3: Verify Webhook URL
1. Tap on macro
2. Tap on "HTTP Request" action
3. Check URL matches your Vercel deployment
4. Get URL from: https://vercel.com/dashboard

### Step 4: Test the Macro
1. Send yourself a test SMS
2. Check MacroDroid logs
3. Verify HTTP request succeeded (200 status)
4. Check dashboard - AI should respond

### Step 5: Check Vercel Logs
1. Go to https://vercel.com/dashboard
2. Click on your project
3. Go to "Logs" tab
4. Filter for `/api/messages/incoming`
5. See if requests are arriving
6. If NO requests → MacroDroid not sending
7. If YES requests → Check for errors

## MacroDroid Macro Template

If you need to recreate the macro:

```
MACRO: Incoming SMS to AI

TRIGGER:
- SMS Received
  - From: Any Number
  - Content: Any

ACTIONS:
- HTTP Request
  - Method: POST
  - URL: https://YOUR-APP.vercel.app/api/messages/incoming
  - Content Type: application/json
  - Body:
    {
      "from": "{sender}",
      "message": "{smsrb}",
      "channel": "sms"
    }
  - Timeout: 30 seconds
  
CONSTRAINTS:
- None (always run)
```

## Quick Diagnosis

Run this command to see recent activity:
```bash
node check-recent-activity.js
```

Look for:
- ⚠️ Unanswered customer messages in AUTO mode
- This confirms AI isn't responding automatically

## Next Steps

1. **Check MacroDroid macro is enabled**
2. **Verify webhook URL is correct**
3. **Test with a real SMS**
4. **Check MacroDroid logs**
5. **Check Vercel logs**

Once MacroDroid is sending webhooks correctly, AI will respond automatically again.
