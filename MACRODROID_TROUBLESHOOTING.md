# 🔧 MacroDroid Troubleshooting Guide - Message Routing Issues

**Problem**: Messages being sent to wrong numbers, old messages being reused, or messages not sending at all

---

## 🚨 Critical Issues Identified

### Issue 1: Variable Reuse (OLD MESSAGES)
**Problem**: MacroDroid variables persist between macro runs. If the API fails or returns empty, the old value stays!

**Example:**
```
Message 1: Customer A texts → Variable stores "Response A" → Sends to Customer A ✅
Message 2: Customer B texts → API fails → Variable STILL has "Response A" → Sends to Customer B ❌
```

**Solution**: Clear variables or use unique variables per conversation

---

### Issue 2: Phone Number Routing
**Problem**: The API does NOT tell MacroDroid which number to send to! MacroDroid uses `{sms_number}` which is the LAST person who texted.

**Example:**
```
10:00 - Customer A (+1111) texts
10:01 - AI responds to Customer A ✅
10:02 - Customer B (+2222) texts  
10:03 - AI responds but {sms_number} = +2222
10:04 - Customer A's response goes to +2222 ❌ WRONG!
```

**Solution**: API must return the phone number, or use separate webhooks

---

### Issue 3: No Send/Receive Separation
**Problem**: Using one macro for both receiving and sending creates timing issues and variable conflicts

**Solution**: Separate macros for incoming vs outgoing

---

## ✅ Recommended Fix: Separate Webhooks

### Current Setup (PROBLEMATIC):
```
Macro 1: SMS Received → HTTP POST → Send SMS with {lv=ai_response}
```

**Problems:**
- Variable `ai_response` can be stale
- `{sms_number}` might be wrong if multiple people text
- No way to send from dashboard reliably

---

### Better Setup (RECOMMENDED):

#### **Macro 1: Incoming SMS (Customer → Dashboard)**
```
Trigger: SMS Received (Any)
Action 1: HTTP POST to /api/messages/incoming
  Body: {
    "from": "{sms_number}",
    "message": "{sms_body}",
    "channel": "sms"
  }
Action 2: (REMOVED - Don't send SMS here!)
```

**Key Change**: Don't send SMS in this macro! Just notify the dashboard.

---

#### **Macro 2: Outgoing SMS (Dashboard → Customer)**
```
Trigger: Webhook (URL)
  URL: https://trigger.macrodroid.com/YOUR_ID/send-sms
  
Action: Send SMS
  Recipient: {webhook_phone}
  Message: {webhook_message}
```

**Key Change**: Dashboard triggers this via webhook with EXACT phone number

---

#### **Macro 3: Track Your Sent SMS (You → Dashboard)**
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

**This one stays the same** - tracks your manual replies

---

## 🔧 Implementation Steps

### Step 1: Update Incoming Macro

1. Open MacroDroid
2. Edit "SMS to AI Dashboard" macro
3. **REMOVE** the "Send SMS" action
4. Keep only the HTTP POST action
5. Save

**Result**: Now it only notifies dashboard, doesn't try to reply

---

### Step 2: Update Dashboard to Send via Webhook

The code is already set up! Just verify your `.env.local`:

```env
MACRODROID_WEBHOOK_URL=https://trigger.macrodroid.com/YOUR_ID/send-sms
```

**How it works:**
```typescript
// Dashboard receives incoming message
// Generates AI response
// Sends to MacroDroid webhook with EXACT phone number
await fetch(MACRODROID_WEBHOOK_URL, {
  method: 'POST',
  body: JSON.stringify({
    phone: "+1234567890",  // ← Exact number from database
    message: "AI response"  // ← Fresh response
  })
})
```

---

### Step 3: Verify Webhook Macro

1. Open MacroDroid
2. Find "Dashboard to SMS" macro
3. Check trigger shows webhook URL
4. Check action sends to `{webhook_phone}` with `{webhook_message}`
5. Enable macro

---

## 🧪 Testing the Fix

### Test 1: Single Customer
```
1. Customer A texts: "Hello"
2. Check MacroDroid log - HTTP POST sent ✅
3. Wait 2-3 seconds
4. Check Customer A receives AI response ✅
5. Check dashboard shows conversation ✅
```

---

### Test 2: Multiple Customers (Critical!)
```
1. Customer A (+1111) texts: "Hello"
2. Wait for response
3. Customer B (+2222) texts: "Hi"
4. Wait for response
5. Customer A texts again: "Thanks"
6. VERIFY: Response goes to +1111 (not +2222!) ✅
```

---

### Test 3: Dashboard Sending
```
1. Open dashboard
2. Go to Conversations
3. Click on a conversation
4. Type message and send
5. Check customer receives it ✅
6. Check it's from YOUR phone number ✅
```

---

## 🔍 Debugging

### Check MacroDroid Logs

1. Open MacroDroid
2. Tap on macro
3. Tap "View Log"
4. Look for:
   - ✅ Green = Success
   - ❌ Red = Failed
   - ⏸️ Yellow = Skipped

### Check Dashboard Logs

In terminal where `npm run dev` runs:
```
[MacroDroid] SMS sent to +1234567890  ← Good!
[MacroDroid] Failed: HTTP 500         ← Bad!
```

### Check Variables

1. In MacroDroid, go to Variables
2. Check `ai_response` value
3. If it's old/stale, that's the problem!
4. Solution: Don't use variables for responses

---

## 📊 Flow Comparison

### ❌ OLD WAY (Problematic):
```
Customer texts
    ↓
MacroDroid receives
    ↓
HTTP POST to dashboard
    ↓
Dashboard returns response in HTTP body
    ↓
MacroDroid stores in variable
    ↓
MacroDroid sends SMS to {sms_number}
    ↓
❌ Problems:
   - Variable can be stale
   - {sms_number} might be wrong
   - No control from dashboard
```

---

### ✅ NEW WAY (Recommended):
```
Customer texts
    ↓
MacroDroid receives
    ↓
HTTP POST to dashboard (notification only)
    ↓
Dashboard processes
    ↓
Dashboard generates response
    ↓
Dashboard calls MacroDroid webhook with EXACT phone
    ↓
MacroDroid sends SMS to specified phone
    ↓
✅ Benefits:
   - No stale variables
   - Correct phone number always
   - Dashboard has full control
   - Works for manual sends too
```

---

## 🎯 Why This Fixes Your Issues

### Issue: "Messages not always being sent"
**Cause**: Variable `ai_response` was empty or API failed
**Fix**: Webhook approach doesn't rely on variables

### Issue: "Sends wrong message to wrong person"
**Cause**: `{sms_number}` was from different customer
**Fix**: Dashboard sends exact phone number in webhook

### Issue: "Old message in variable"
**Cause**: Variable persists between runs
**Fix**: No variables needed with webhook approach

---

## 🔒 Best Practices

### 1. Separate Concerns
- **Incoming macro**: Just notify dashboard
- **Outgoing macro**: Just send SMS
- **Tracking macro**: Just log your replies

### 2. Let Dashboard Control Routing
- Dashboard knows exact phone numbers
- Dashboard has conversation context
- Dashboard handles all logic

### 3. MacroDroid is Just Transport
- Receives SMS → Forwards to dashboard
- Receives webhook → Sends SMS
- That's it!

---

## 📋 Updated Macro Summary

### Macro 1: Incoming SMS
```
Name: SMS to AI Dashboard
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
Name: Dashboard to SMS
Trigger: Webhook URL
Action: Send SMS
  To: {webhook_phone}
  Message: {webhook_message}
```

### Macro 3: Track Sent SMS
```
Name: Track My SMS Replies
Trigger: SMS Sent (Any)
Action: HTTP POST to /api/messages/send
  Body: {
    "conversationId": "lookup-by-phone",
    "text": "{sms_body}",
    "sender": "staff",
    "customerPhone": "{sms_number}"
  }
```

---

## ✅ Verification Checklist

After implementing fixes:

- [ ] Incoming macro only does HTTP POST (no SMS send)
- [ ] Webhook macro is enabled
- [ ] MACRODROID_WEBHOOK_URL is in .env.local
- [ ] Dashboard restarted after env change
- [ ] Test: Single customer works
- [ ] Test: Multiple customers work (correct routing)
- [ ] Test: Dashboard send works
- [ ] Test: Your manual replies tracked
- [ ] Check logs show correct phone numbers

---

## 🆘 Still Having Issues?

### If messages still go to wrong number:
1. Check dashboard logs - what phone number is it sending?
2. Check MacroDroid webhook log - what did it receive?
3. Verify `{webhook_phone}` is used (not `{sms_number}`)

### If messages not sending at all:
1. Check webhook URL is correct in .env.local
2. Restart dashboard after changing env
3. Check MacroDroid webhook macro is enabled
4. Test webhook directly with curl

### If old messages still appearing:
1. Clear MacroDroid variables (Settings → Variables → Clear All)
2. Verify you removed "Send SMS" from incoming macro
3. Verify webhook macro is being triggered

---

## 💡 Pro Tip: Test with Curl

Test the webhook directly:
```bash
curl -X POST "https://trigger.macrodroid.com/YOUR_ID/send-sms" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "message": "Test message"
  }'
```

You should receive an SMS immediately!

---

**Last Updated**: November 4, 2025  
**Priority**: CRITICAL - Fixes message routing issues  
**Status**: Recommended Implementation 🚀
