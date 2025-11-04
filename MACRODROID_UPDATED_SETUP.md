# 📱 MacroDroid Updated Setup - Fixed Message Routing

**Last Updated**: November 4, 2025  
**Status**: CRITICAL UPDATE - Fixes wrong number routing issues  
**Priority**: HIGH - Implement immediately if experiencing routing problems

---

## 🚨 What Changed?

### Old Setup (PROBLEMATIC):
- Incoming macro received SMS → Sent to API → Got response → Sent SMS back
- **Problem**: Used `{sms_number}` variable which could be from wrong customer
- **Problem**: Used `{lv=ai_response}` variable which could be stale/old

### New Setup (FIXED):
- Incoming macro receives SMS → Notifies API only (no SMS send)
- API processes → Sends via webhook with EXACT phone number
- Webhook macro receives → Sends SMS to correct number
- **Result**: Dashboard controls routing, no variable issues

---

## 🎯 Three Macros You Need

### Macro 1: Incoming SMS (Notification Only)
**Purpose**: Tell dashboard about incoming messages  
**Does NOT**: Send SMS replies

### Macro 2: Outgoing SMS (Webhook)
**Purpose**: Receive commands from dashboard and send SMS  
**Triggered by**: Dashboard webhook

### Macro 3: Track Your Sent SMS
**Purpose**: Tell dashboard when you manually reply  
**Result**: AI pauses automatically

---

## 📥 Macro 1: Incoming SMS Setup

### Step 1: Create or Edit Macro

1. Open **MacroDroid**
2. If you have "SMS to AI Dashboard" macro:
   - Edit it
   - **DELETE** the "Send SMS" action if it exists
3. If starting fresh:
   - Tap **"+"** button
   - Tap **"Add Macro"**
   - Name: **"SMS to AI Dashboard"**

---

### Step 2: Configure Trigger

1. Tap **"Add Trigger"** (if new) or check existing
2. Select **"SMS/MMS"**
3. Select **"SMS Received"**
4. **Sender**: **"Any Contact"** or **"Any Number"**
5. Tap **"OK"**

---

### Step 3: Configure HTTP Action (IMPORTANT!)

1. Tap **"Add Action"** (if new) or edit existing
2. Select **"Connectivity"** → **"HTTP Request"**

**URL:**
```
For Local Testing:
http://YOUR_COMPUTER_IP:3000/api/messages/incoming

For Production:
https://your-app.vercel.app/api/messages/incoming
```

**Method:** `POST`

**Content Type:** `application/json`

**Request Body:**
```json
{
  "from": "{sms_number}",
  "message": "{sms_body}",
  "channel": "sms"
}
```

**IMPORTANT**: 
- ❌ Do NOT save HTTP response to variable
- ❌ Do NOT add "Send SMS" action after this
- ✅ Just send the notification and stop

3. Tap **"OK"**
4. Save macro
5. Enable macro

---

## 📤 Macro 2: Outgoing SMS (Webhook) Setup

### Step 1: Create Webhook Macro

1. Open **MacroDroid**
2. Tap **"+"** button
3. Tap **"Add Macro"**
4. Name: **"Dashboard to SMS"**

---

### Step 2: Configure Webhook Trigger

1. Tap **"Add Trigger"**
2. Select **"MacroDroid Specific"**
3. Select **"Webhook (URL)"**
4. **Copy the webhook URL** that appears:
   ```
   https://trigger.macrodroid.com/YOUR_UNIQUE_ID/send-sms
   ```
5. **SAVE THIS URL** - you'll need it for the dashboard!
6. Tap **"OK"**

---

### Step 3: Add Send SMS Action

1. Tap **"Add Action"**
2. Select **"Phone"**
3. Select **"Send SMS"**

**Recipient:**
```
{webhook_phone}
```

**Message:**
```
{webhook_message}
```

**IMPORTANT**: These come from the webhook payload, NOT from variables!

4. Tap **"OK"**
5. Save macro
6. **Enable the macro**

---

## 🔧 Dashboard Configuration

### Step 1: Update Environment Variables

1. Open your `.env.local` file
2. Add or update this line:
```env
MACRODROID_WEBHOOK_URL=https://trigger.macrodroid.com/YOUR_UNIQUE_ID/send-sms
```
3. Replace `YOUR_UNIQUE_ID` with your actual webhook URL from Macro 2
4. Save the file

---

### Step 2: Restart Dashboard

```bash
# Stop the server (Ctrl+C if running)
# Then restart:
npm run dev
```

**IMPORTANT**: Environment variables only load on startup!

---

## 📲 Macro 3: Track Your Sent SMS (Optional but Recommended)

This prevents AI from interfering when you manually reply.

### Setup:

1. Open **MacroDroid**
2. Tap **"+"** button
3. Name: **"Track My SMS Replies"**
4. **Trigger**: SMS Sent (Any)
5. **Action**: HTTP POST to `/api/messages/send`

**Request Body:**
```json
{
  "conversationId": "lookup-by-phone",
  "text": "{sms_body}",
  "sender": "staff",
  "customerPhone": "{sms_number}"
}
```

See `MACRODROID_SENT_SMS_TRACKING.md` for full details.

---

## 🧪 Testing the Complete Setup

### Test 1: Single Customer Flow

1. **Send SMS to your phone** from another phone:
   ```
   "How much for iPhone 14 screen?"
   ```

2. **Expected flow:**
   - MacroDroid receives SMS
   - Sends notification to dashboard
   - Dashboard processes with AI
   - Dashboard calls MacroDroid webhook with exact phone
   - MacroDroid sends SMS to customer
   - Customer receives: "iPhone 14 screen replacement is £149.99..."

3. **Check MacroDroid logs:**
   - Macro 1 (Incoming): ✅ Success
   - Macro 2 (Webhook): ✅ Success

4. **Check dashboard:**
   - Go to http://localhost:3000
   - Click "Conversations"
   - You should see the conversation!

---

### Test 2: Multiple Customers (CRITICAL!)

This test verifies the routing fix works:

1. **Customer A** (+1111) texts: "Hello"
2. Wait for AI response
3. **Customer B** (+2222) texts: "Hi there"
4. Wait for AI response
5. **Customer A** texts again: "Thanks"
6. **VERIFY**: Response goes to +1111 (NOT +2222!)

**If this fails**, the old setup is still active. Check:
- Macro 1 has NO "Send SMS" action
- Macro 2 is enabled
- MACRODROID_WEBHOOK_URL is set
- Dashboard was restarted

---

### Test 3: Dashboard Manual Send

1. **In the dashboard:**
   - Go to "Conversations"
   - Click on a conversation
   - Type a message: "We'll get back to you soon"
   - Click "Send"

2. **Expected flow:**
   - Dashboard calls MacroDroid webhook
   - Webhook includes exact phone number
   - MacroDroid sends SMS
   - Customer receives your message

3. **Verify:**
   - Check sent messages on your phone
   - Message should appear in SMS app
   - Sent to correct customer

---

## 🔍 Troubleshooting

### Issue: "Messages still going to wrong number"

**Check:**
1. Did you remove "Send SMS" action from Macro 1?
2. Is Macro 2 (webhook) enabled?
3. Is MACRODROID_WEBHOOK_URL correct in .env.local?
4. Did you restart dashboard after changing .env.local?

**Test webhook directly:**
```bash
curl -X POST "https://trigger.macrodroid.com/YOUR_ID/send-sms" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "message": "Test message"
  }'
```

You should receive SMS immediately!

---

### Issue: "No messages being sent at all"

**Check:**
1. Is Macro 2 enabled?
2. Check MacroDroid logs - is webhook being triggered?
3. Check dashboard terminal - any errors?
4. Verify webhook URL in .env.local matches Macro 2

**Dashboard logs should show:**
```
[MacroDroid] SMS sent to +1234567890
```

---

### Issue: "Old messages still appearing"

**Solution:**
1. Open MacroDroid
2. Go to Settings → Variables
3. Delete or clear all variables
4. Restart MacroDroid
5. Test again

With new setup, variables aren't used for responses!

---

### Issue: "Webhook not triggering"

**Check:**
1. Webhook URL copied correctly?
2. No extra spaces in .env.local?
3. Dashboard restarted after env change?
4. Macro 2 is enabled?

**Test:**
```bash
# Check if webhook is reachable
curl -X POST "https://trigger.macrodroid.com/YOUR_ID/send-sms" \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1234567890","message":"test"}'
```

---

## 📊 How It Works Now

### Complete Flow Diagram:

```
┌─────────────────────────────────────────────────────────┐
│ Customer sends SMS: "How much for screen?"              │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ Your Phone (MacroDroid Macro 1)                         │
│ - Receives SMS                                          │
│ - Extracts: from="+1234567890", message="How much..."  │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ HTTP POST to Dashboard                                  │
│ /api/messages/incoming                                  │
│ Body: {"from":"+1234567890","message":"How much..."}   │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ Dashboard Processing                                    │
│ 1. Find/create customer by phone                       │
│ 2. Find/create conversation                            │
│ 3. Save customer message                               │
│ 4. Generate AI response                                │
│ 5. Save AI message                                     │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ Dashboard Calls MacroDroid Webhook                      │
│ POST https://trigger.macrodroid.com/.../send-sms       │
│ Body: {                                                │
│   "phone": "+1234567890",  ← EXACT phone from database │
│   "message": "iPhone 14 screen is £149.99..."         │
│ }                                                       │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ MacroDroid Macro 2 (Webhook)                           │
│ - Receives webhook                                     │
│ - Extracts: phone="{webhook_phone}"                   │
│ - Extracts: message="{webhook_message}"               │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ Send SMS                                               │
│ To: +1234567890 ← Correct number!                     │
│ Message: "iPhone 14 screen is £149.99..."             │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ Customer receives AI response ✅                        │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Benefits of New Setup

### 1. Correct Phone Number Always
- Dashboard knows exact phone from database
- No reliance on `{sms_number}` variable
- Works with multiple simultaneous customers

### 2. No Stale Variables
- No variables used for responses
- Each message is fresh from API
- No old messages being resent

### 3. Dashboard Control
- Dashboard decides when to send
- Dashboard decides who to send to
- Dashboard tracks delivery status

### 4. Works for Manual Sends
- Same webhook for AI and manual
- Consistent behavior
- Full audit trail

---

## 📋 Quick Reference

### Macro 1: Incoming SMS
```
Trigger: SMS Received (Any)
Action: HTTP POST to /api/messages/incoming
  Body: {
    "from": "{sms_number}",
    "message": "{sms_body}",
    "channel": "sms"
  }
```

### Macro 2: Outgoing SMS (Webhook)
```
Trigger: Webhook URL
  https://trigger.macrodroid.com/YOUR_ID/send-sms
Action: Send SMS
  To: {webhook_phone}
  Message: {webhook_message}
```

### Macro 3: Track Sent SMS
```
Trigger: SMS Sent (Any)
Action: HTTP POST to /api/messages/send
  Body: {
    "conversationId": "lookup-by-phone",
    "text": "{sms_body}",
    "sender": "staff",
    "customerPhone": "{sms_number}"
  }
```

### Environment Variable:
```env
MACRODROID_WEBHOOK_URL=https://trigger.macrodroid.com/YOUR_ID/send-sms
```

---

## ✅ Final Verification Checklist

Before going live:

- [ ] Macro 1: Incoming SMS created and enabled
- [ ] Macro 1: NO "Send SMS" action (removed!)
- [ ] Macro 2: Webhook created and enabled
- [ ] Macro 2: Webhook URL copied
- [ ] Macro 3: Track Sent SMS created and enabled
- [ ] .env.local: MACRODROID_WEBHOOK_URL added
- [ ] Dashboard restarted after env change
- [ ] Test 1: Single customer works
- [ ] Test 2: Multiple customers work (correct routing!)
- [ ] Test 3: Dashboard send works
- [ ] Test 4: Manual reply tracking works
- [ ] MacroDroid logs show all macros working
- [ ] Dashboard logs show correct phone numbers

---

## 🎉 You're Done!

Your system now has:
- ✅ Correct phone number routing
- ✅ No stale message variables
- ✅ Dashboard-controlled sending
- ✅ Support for multiple simultaneous customers
- ✅ Manual reply tracking
- ✅ Full audit trail

---

## 🆘 Need Help?

### Common Issues:
1. **Wrong number** - Check Macro 1 has no "Send SMS" action
2. **Not sending** - Check webhook URL and dashboard restart
3. **Old messages** - Clear MacroDroid variables
4. **Multiple customers** - Verify webhook approach is active

### Debug Commands:
```bash
# Test webhook directly
curl -X POST "https://trigger.macrodroid.com/YOUR_ID/send-sms" \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1234567890","message":"test"}'

# Check dashboard logs
npm run dev
# Look for: [MacroDroid] SMS sent to +1234567890
```

---

**Last Updated**: November 4, 2025  
**Version**: 2.0  
**Status**: Production Ready - Fixes Critical Routing Issues 🚀
