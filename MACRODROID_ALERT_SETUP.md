# MacroDroid Alert Notifications Setup

Get SMS alerts on YOUR phone when customers need manual responses!

## What You'll Get

When a customer needs manual intervention, you'll receive an SMS like:

```
🚨 Manual Response Needed

Customer: John Smith
Phone: +447410381247
Message: "Can you fix my iPhone today?"

View: https://nfd-rai.vercel.app/dashboard/conversations?id=xyz
```

## When Alerts Are Sent

You'll get notified when:
- ✅ Customer sends personal message ("Thanks John", "See you soon")
- ✅ AI has low confidence in its response
- ✅ Conversation is in manual mode and customer replies
- ✅ Customer asks complex question AI can't handle
- ✅ Global automation is disabled

**Rate limiting**: Max 1 alert per conversation every 15 minutes (prevents spam)

## Setup Steps

### 1. Create MacroDroid Macro

1. Open MacroDroid app
2. Tap **"+"** to create new macro
3. Name it: **"NFD AI Alert"**

### 2. Add Trigger

1. Tap **"Triggers"**
2. Select **"Webhook (URL Trigger)"**
3. MacroDroid will generate a URL like:
   ```
   https://trigger.macrodroid.com/abc123def456/alert
   ```
4. **Copy this URL** - you'll need it later

### 3. Add Action

1. Tap **"Actions"**
2. Select **"Messaging"** → **"Send SMS"**
3. **Recipient**: YOUR phone number (the one you want alerts on)
4. **Message**: `{text}`
   - This variable will contain the alert message
   - Don't type anything else, just `{text}`
5. Tap **"OK"**

### 4. Save Macro

1. Tap the checkmark to save
2. Make sure macro is **enabled** (toggle on)

### 5. Add to Environment Variables

#### Option A: Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Name**: `MACRODROID_ALERT_WEBHOOK_URL`
   - **Value**: Your webhook URL from step 2
   - **Environment**: Production
5. Click **"Save"**
6. Go to **Deployments** tab
7. Click **"..."** on latest deployment → **"Redeploy"**

#### Option B: Local .env File

1. Open `.env.local` in your project
2. Add this line:
   ```
   MACRODROID_ALERT_WEBHOOK_URL=https://trigger.macrodroid.com/YOUR_UNIQUE_ID/alert
   ```
3. Replace with your actual webhook URL
4. Commit and push to GitHub (Vercel will auto-deploy)

### 6. Test It!

1. Go to your dashboard
2. Open a conversation
3. Click **"Take Over"** (switch to manual mode)
4. Have someone send you a test message
5. You should receive an SMS alert on your phone!

## Advanced Configuration

### Using Same Webhook for Both

If you want to use the same webhook for sending messages AND receiving alerts:

```env
MACRODROID_WEBHOOK_URL=https://trigger.macrodroid.com/YOUR_ID/webhook
MACRODROID_ALERT_WEBHOOK_URL=https://trigger.macrodroid.com/YOUR_ID/webhook
```

The system will automatically use `MACRODROID_ALERT_WEBHOOK_URL` if set, otherwise falls back to `MACRODROID_WEBHOOK_URL`.

### Customizing Alert Messages

Edit `/app/lib/alert-notifier.ts` to customize alert messages:

```typescript
case 'manual_required':
  alertMessage = `🚨 Your custom message here\n\n`
  // ... customize as needed
```

### Alert Types

Different alert types with different messages:

- **manual_required** 🚨 - Customer needs manual response
- **low_confidence** ⚠️ - AI responded but wasn't confident
- **high_priority** 🔴 - Urgent attention needed

### Rate Limiting

To prevent spam, alerts are rate-limited:

- **Normal alerts**: Max 1 per conversation every 15 minutes
- **High priority**: Max 1 per conversation every 5 minutes

Edit in `/app/lib/alert-notifier.ts`:

```typescript
// For normal alerts, wait 15 minutes
if (minutesSinceLastNotification >= 15) {
  return true
}
```

## Troubleshooting

### Not Receiving Alerts?

1. **Check MacroDroid macro is enabled**
   - Open MacroDroid
   - Find "NFD AI Alert" macro
   - Toggle should be ON (green)

2. **Check webhook URL is correct**
   - Vercel dashboard → Settings → Environment Variables
   - Should start with `https://trigger.macrodroid.com/`

3. **Check Vercel logs**
   - Go to Vercel dashboard → Deployments
   - Click latest deployment → "View Function Logs"
   - Search for `[Alert]`
   - Should see: `[Alert] ✅ Notification sent successfully`

4. **Test webhook manually**
   - Use curl to test:
   ```bash
   curl -X POST "YOUR_WEBHOOK_URL" \
     -d "text=Test alert message"
   ```
   - You should receive SMS

5. **Check phone number format**
   - MacroDroid SMS action needs valid phone number
   - Use international format: +447410381247

### Alerts Too Frequent?

Increase rate limit in `/app/lib/alert-notifier.ts`:

```typescript
// Wait 30 minutes instead of 15
if (minutesSinceLastNotification >= 30) {
  return true
}
```

### Want Different Alert Sounds?

In MacroDroid macro:
1. Add action: **"Sound"** → **"Play Sound"**
2. Choose custom sound/ringtone
3. Place BEFORE the SMS action

## Example MacroDroid Flow

```
TRIGGER: Webhook (URL Trigger)
  ↓
ACTION: Send SMS
  - To: +447410381247 (your phone)
  - Message: {text}
  ↓
[Optional] ACTION: Play Sound
  - Sound: Custom alert tone
  ↓
[Optional] ACTION: Notification
  - Title: "Customer Alert"
  - Text: {text}
```

## Security Notes

- ⚠️ **Never share your webhook URL publicly**
- ⚠️ **Don't commit webhook URLs to public GitHub repos**
- ⚠️ **Use Vercel environment variables** (they're encrypted)
- ✅ Webhook URLs are unique and can't be guessed
- ✅ Only your Vercel app knows the URL

## Summary

✅ **Setup time**: ~5 minutes
✅ **Cost**: Free (uses your SMS allowance)
✅ **Reliability**: Instant notifications
✅ **Rate limited**: Won't spam you
✅ **Customizable**: Edit messages and timing

Now you'll never miss a customer who needs your attention! 🎉
