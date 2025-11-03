# 📱 MacroDroid Setup Guide - Step by Step

**Purpose**: Connect your Android phone to the NFD AI Responder dashboard  
**Time Required**: 15-20 minutes  
**Cost**: Free (MacroDroid app is free)

---

## 📋 Prerequisites

- [ ] Android phone (your business phone)
- [ ] MacroDroid app installed
- [ ] Dashboard running (locally or deployed)
- [ ] Both phone and computer on same WiFi (for local testing)

---

## 🎯 What We're Building

### Two Macros:

1. **Incoming SMS → Dashboard** (Receives customer messages, sends to AI)
2. **Dashboard → Outgoing SMS** (Receives dashboard replies, sends to customer)

---

## 📥 Part 1: Incoming SMS Macro (Customer → Dashboard)

### Step 1: Install MacroDroid

1. Open **Google Play Store**
2. Search for **"MacroDroid"**
3. Install **MacroDroid - Device Automation**
4. Open the app
5. Grant all requested permissions:
   - SMS
   - Phone
   - Contacts
   - Notifications

---

### Step 2: Create New Macro

1. Open **MacroDroid**
2. Tap **"+"** button (bottom right)
3. Tap **"Add Macro"**
4. Name it: **"SMS to AI Dashboard"**
5. Tap **"Add Trigger"**

---

### Step 3: Configure SMS Trigger

1. Select **"SMS/MMS"**
2. Select **"SMS Received"**
3. **Sender**: Select **"Any Contact"** or **"Any Number"**
   - (This will catch all incoming SMS)
4. **Content Filter**: Leave blank
   - (We want all messages)
5. Tap **"OK"**

---

### Step 4: Add HTTP Request Action

1. Tap **"Add Action"**
2. Select **"Connectivity"**
3. Select **"HTTP Request"**

#### Configure HTTP Request:

**URL:**
```
For Local Testing:
http://YOUR_COMPUTER_IP:3000/api/messages/incoming

For Production (Vercel):
https://your-app-name.vercel.app/api/messages/incoming
```

**Method:** POST

**Content Type:** application/json

**Content Body:**
```json
{
  "from": "{sms_number}",
  "message": "{sms_body}",
  "channel": "sms"
}
```

**Save HTTP Response in String Variable:**
- Tap **"HTTP Response in String Variable"**
- Create new string variable: `ai_response`
- This will store the AI's reply

**Save HTTP Return Code:**
- Optional: Create integer variable `http_code` to check if request succeeded
- 200 = success, 400/500 = error

**Query Params:** (Leave empty - not needed)

**Header Params:** (Leave empty - not needed)

**Advanced Options:**
- ✅ Enable **"Follow Redirects"**
- ✅ Enable **"Trust All Certificates"** (for local testing only)

5. Tap **"OK"**

---

### Step 5: Add SMS Reply Action

1. Tap **"Add Action"**
2. Select **"Phone"**
3. Select **"Send SMS"**

#### Configure SMS Reply:

**Recipient:**
```
{sms_number}
```

**Message:**
```
{lv=ai_response}
```

**Note**: This uses the response from the HTTP request

4. Tap **"OK"**

---

### Step 6: Test the Incoming Macro

1. Tap **"✓"** (checkmark) to save macro
2. **Enable the macro** (toggle switch)
3. **Test it:**
   - Send an SMS to your phone from another phone
   - Message: "How much for iPhone 14 screen?"
   - Wait 2-3 seconds
   - You should receive AI response back!

---

## 📤 Part 2: Track Your Sent Messages (Important!)

**Why?** When you manually reply from your phone, the AI needs to know so it doesn't interfere!

### Step 1: Create Outgoing SMS Macro

1. In MacroDroid, tap **"+"** button
2. Tap **"Add Macro"**
3. Name it: **"Track My SMS Replies"**
4. Tap **"Add Trigger"**

---

### Step 2: Configure SMS Sent Trigger

1. Select **"SMS/MMS"**
2. Select **"SMS Sent"**
3. **Recipient**: Select **"Any Contact"** or **"Any Number"**
   - (This tracks all your outgoing SMS)
4. Tap **"OK"**

---

### Step 3: Send to Dashboard

1. Tap **"Add Action"**
2. Select **"Connectivity"**
3. Select **"HTTP Request"**

#### Configure HTTP Request:

**URL:**
```
For Local Testing:
http://YOUR_COMPUTER_IP:3000/api/messages/send

For Production (Vercel):
https://your-app-name.vercel.app/api/messages/send
```

**Method:** POST

**Content Type:** application/json

**Content Body:**
```json
{
  "conversationId": "lookup-by-phone",
  "text": "{sms_body}",
  "sender": "staff",
  "customerPhone": "{sms_number}",
  "sendVia": "none"
}
```

**Save HTTP Response in String Variable:** (Optional - not needed)

**Save HTTP Return Code:** (Optional)

**Query Params:** (Leave empty)

**Header Params:** (Leave empty)

**Note:** The dashboard will find the conversation by phone number

4. Tap **"OK"**
5. Save macro

**Result**: When you reply from your phone, the dashboard knows and AI will pause! ✅

---

## 📤 Part 3: Dashboard → Outgoing SMS (Webhook)

### Step 1: Create Third Macro

1. In MacroDroid, tap **"+"** button
2. Tap **"Add Macro"**
3. Name it: **"Dashboard to SMS"**
4. Tap **"Add Trigger"**

---

### Step 2: Configure Webhook Trigger

1. Select **"MacroDroid Specific"**
2. Select **"Webhook (URL)"**
3. **Webhook URL** will be auto-generated:
   ```
   https://trigger.macrodroid.com/YOUR_UNIQUE_ID/send-sms
   ```
4. **Copy this URL** - you'll need it for the dashboard!
5. Tap **"OK"**

---

### Step 3: Add SMS Send Action

1. Tap **"Add Action"**
2. Select **"Phone"**
3. Select **"Send SMS"**

#### Configure SMS Send:

**Recipient:**
```
{webhook_phone}
```

**Message:**
```
{webhook_message}
```

**Note**: These come from the webhook payload

4. Tap **"OK"**

---

### Step 4: Save and Enable

1. Tap **"✓"** (checkmark) to save
2. **Enable the macro** (toggle switch)
3. **Copy the webhook URL** from the trigger
4. Save it somewhere - we need it for the dashboard!

---

## 🔧 Part 4: Configure Dashboard

### Step 1: Update Environment Variables

1. Open your `.env.local` file
2. Add this line:
```env
MACRODROID_WEBHOOK_URL=https://trigger.macrodroid.com/YOUR_UNIQUE_ID/send-sms
```
3. Replace `YOUR_UNIQUE_ID` with your actual webhook URL
4. Save the file
5. Restart your dev server: `npm run dev`

---

### Step 2: Update Send Message API

The code is already set up! The `/api/messages/send/route.ts` will automatically use the webhook.

If you need to verify, check that this code exists:

```typescript
// In /app/api/messages/send/route.ts
const webhookUrl = process.env.MACRODROID_WEBHOOK_URL

if (webhookUrl) {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: customerPhone,
      message: text,
    }),
  })
}
```

---

## 🧪 Testing the Complete Setup

### Test 1: Incoming Message (Customer → AI)

1. **Send SMS to your phone:**
   ```
   "How much for iPhone 14 screen?"
   ```

2. **Expected flow:**
   - MacroDroid receives SMS
   - Sends to dashboard
   - Dashboard processes with AI
   - Returns response to MacroDroid
   - MacroDroid sends SMS back
   - You receive: "iPhone 14 screen replacement is £149.99..."

3. **Check dashboard:**
   - Go to http://localhost:3000
   - Click "Conversations"
   - You should see the conversation!

---

### Test 2: Outgoing Message (Dashboard → Customer)

1. **In the dashboard:**
   - Go to "Conversations"
   - Click on a conversation
   - Type a message in the composer
   - Click "Send"

2. **Expected flow:**
   - Dashboard sends to MacroDroid webhook
   - MacroDroid receives webhook
   - MacroDroid sends SMS to customer
   - Customer receives your message!

3. **Verify:**
   - Check the sent messages on your phone
   - Message should appear in your SMS app

---

## 🔍 Troubleshooting

### Issue: "HTTP Request Failed"

**Solution:**
1. Check your computer's IP address:
   ```bash
   # On Mac/Linux:
   ifconfig | grep "inet "
   
   # On Windows:
   ipconfig
   ```
2. Update the URL in MacroDroid
3. Make sure both devices are on same WiFi
4. Try pinging your computer from phone

---

### Issue: "No Response from AI"

**Solution:**
1. Check dashboard is running: `npm run dev`
2. Check URL is correct (http:// not https:// for local)
3. Check port is 3000
4. Look at terminal for errors
5. Test the API directly:
   ```bash
   curl -X POST http://YOUR_IP:3000/api/messages/incoming \
     -H "Content-Type: application/json" \
     -d '{"from":"+1234567890","message":"test","channel":"sms"}'
   ```

---

### Issue: "Webhook Not Triggering"

**Solution:**
1. Check webhook URL is correct in `.env.local`
2. Restart dev server after changing env vars
3. Check MacroDroid webhook macro is enabled
4. Test webhook directly:
   ```bash
   curl -X POST "https://trigger.macrodroid.com/YOUR_ID/send-sms" \
     -H "Content-Type: application/json" \
     -d '{"phone":"+1234567890","message":"test"}'
   ```

---

### Issue: "SMS Not Sending"

**Solution:**
1. Check SMS permissions in MacroDroid
2. Check default SMS app is set
3. Try sending test SMS manually
4. Check phone has signal/credit
5. Look at MacroDroid logs (tap macro → "View Log")

---

## 📱 Finding Your Computer's IP Address

### On Mac:
```bash
# Open Terminal and run:
ifconfig | grep "inet " | grep -v 127.0.0.1

# Look for something like: 192.168.1.100
```

### On Windows:
```bash
# Open Command Prompt and run:
ipconfig

# Look for "IPv4 Address" under your WiFi adapter
# Something like: 192.168.1.100
```

### On Linux:
```bash
# Open Terminal and run:
hostname -I

# First IP is usually your local network IP
```

---

## 🌐 Production Setup (Vercel)

### When You Deploy to Vercel:

1. **Update Incoming Macro:**
   - Edit "SMS to AI Dashboard" macro
   - Change URL to: `https://your-app.vercel.app/api/messages/incoming`
   - Save

2. **Webhook stays the same:**
   - MacroDroid webhook URL doesn't change
   - Already configured in environment variables
   - Will work automatically

3. **Test production:**
   - Send test SMS
   - Check Vercel logs for requests
   - Verify responses work

---

## 🎛️ Advanced Configuration

### Add Conditions (Optional)

**Only respond during business hours:**

1. Edit "SMS to AI Dashboard" macro
2. Tap "Add Constraint"
3. Select "Time/Date"
4. Select "Time Period"
5. Set: Monday-Friday, 9am-6pm
6. Outside hours: Send different message

**Filter spam numbers:**

1. Edit macro
2. In SMS trigger, tap "Sender"
3. Select "Specific Contact" or "Not in Contacts"
4. Choose to ignore unknown numbers

**Different handling for keywords:**

1. Add "If" condition
2. Check if message contains "urgent"
3. Send immediate notification
4. Or bypass AI and alert staff

---

## 📊 Monitoring

### MacroDroid Logs

1. Open MacroDroid
2. Tap on your macro
3. Tap "View Log"
4. See all executions:
   - ✅ Success (green)
   - ❌ Failed (red)
   - ⏸️ Skipped (yellow)

### Dashboard Logs

1. Check terminal where `npm run dev` is running
2. Look for:
   ```
   POST /api/messages/incoming 200
   POST /api/messages/send 200
   ```
3. Any errors will show here

---

## 🔒 Security Notes

### For Local Testing:
- ✅ OK to use HTTP (not HTTPS)
- ✅ OK to trust all certificates
- ✅ Only works on your local network

### For Production:
- ✅ Must use HTTPS (Vercel provides this)
- ✅ Webhook URLs are secret (don't share)
- ✅ Consider IP whitelisting if possible
- ✅ Monitor for unusual activity

---

## 📋 Quick Reference

### Macro 1: Incoming SMS (Customer → AI)
```
Trigger: SMS Received (Any)
Action 1: HTTP POST to dashboard
Action 2: Send SMS (AI response)
```

### Macro 2: Track Sent SMS (You → Dashboard)
```
Trigger: SMS Sent (Any)
Action: HTTP POST to dashboard (marks as staff message)
```

### Macro 3: Dashboard Outgoing (Dashboard → Customer)
```
Trigger: Webhook URL
Action: Send SMS (from webhook data)
```

### Environment Variable:
```env
MACRODROID_WEBHOOK_URL=https://trigger.macrodroid.com/YOUR_ID/send-sms
```

---

## ✅ Verification Checklist

Before going live, verify:

- [ ] MacroDroid installed and permissions granted
- [ ] **Macro 1**: Incoming SMS created and enabled
- [ ] **Macro 2**: Track Sent SMS created and enabled (IMPORTANT!)
- [ ] **Macro 3**: Dashboard webhook created and enabled
- [ ] Webhook URL copied to `.env.local`
- [ ] Dashboard running (local or production)
- [ ] Test SMS received and AI responded
- [ ] Test: Reply from your phone → Check dashboard shows it as "staff"
- [ ] Test: AI pauses after you manually reply
- [ ] Test dashboard reply sent successfully
- [ ] Conversation appears in dashboard
- [ ] All three macros show in MacroDroid logs

---

## 🎉 You're Done!

Your system is now fully connected:

```
Customer SMS
    ↓
Your Phone (MacroDroid)
    ↓
Dashboard (AI Processing)
    ↓
MacroDroid (Send SMS)
    ↓
Customer receives reply
```

**And for manual replies:**

```
You type in Dashboard
    ↓
Dashboard webhook
    ↓
MacroDroid
    ↓
SMS sent to customer
```

---

## 🆘 Need Help?

### Common Issues:
1. **Can't find IP address** - See "Finding Your Computer's IP Address" above
2. **Webhook not working** - Check URL in `.env.local` and restart server
3. **SMS not sending** - Check MacroDroid permissions and logs
4. **AI not responding** - Check dashboard terminal for errors

### Debug Mode:
Enable detailed logging in MacroDroid:
1. Settings → Advanced → Enable Debug Mode
2. Check logs after each test

---

**Last Updated**: November 3, 2025  
**Version**: 1.0  
**Status**: Production Ready 🚀
