# 🔗 Complete Webhook Guide - All MacroDroid Webhooks

**Question**: Do I need different webhooks for AI vs Dashboard sends?  
**Answer**: NO - Use the SAME webhook for all outgoing SMS!

---

## 🎯 Webhook Overview

### You Need ONE Webhook for Outgoing SMS

**Webhook Purpose**: Send SMS from your phone  
**Webhook Identifier**: `send-sms` (you choose this)  
**Used By**: 
- AI responses (from incoming messages)
- Manual sends (from dashboard)
- Any other outgoing SMS

**Why One Webhook?**
- Same action (send SMS)
- Same phone (your Android)
- Simpler to manage
- Less confusion

---

## 📱 Complete MacroDroid Setup

### Macro 1: Incoming SMS → Dashboard
**Purpose**: Notify dashboard of incoming messages  
**Trigger**: SMS Received  
**Action**: HTTP POST to `/api/messages/incoming`  
**Webhook**: None (uses HTTP POST)

---

### Macro 2: Outgoing SMS (THE WEBHOOK)
**Purpose**: Send SMS when dashboard requests  
**Trigger**: Webhook URL  
**Webhook Identifier**: `send-sms`  
**Used By**: AI responses AND manual dashboard sends

**Setup:**
```
Trigger: Webhook (URL)
  URL: https://trigger.macrodroid.com/YOUR_ID/send-sms
                                              ↑
                                        Your identifier

Action: Send SMS
  To: {webhook_phone}
  Message: {webhook_message}
```

**This webhook handles:**
- ✅ AI responses to incoming SMS
- ✅ Manual sends from dashboard
- ✅ Any other outgoing messages

---

### Macro 3: Track Your Sent SMS
**Purpose**: Tell dashboard when you manually reply  
**Trigger**: SMS Sent  
**Action**: HTTP POST to `/api/messages/send`  
**Webhook**: None (uses HTTP POST)

---

### Macro 4: Missed Call Response (NEW!)
**Purpose**: Auto-respond to missed calls  
**Trigger**: Missed Call  
**Action 1**: HTTP POST to `/api/messages/missed-call`  
**Action 2**: Send SMS with response  
**Webhook**: None (uses HTTP POST, then sends SMS directly)

---

## 🔄 How Each Flow Works

### Flow 1: Customer Texts You (AI Response)
```
1. Customer texts: "How much for screen?"
   ↓
2. MacroDroid Macro 1 receives SMS
   ↓
3. HTTP POST to /api/messages/incoming
   ↓
4. Dashboard generates AI response
   ↓
5. Dashboard calls Macro 2 webhook ← SAME WEBHOOK
   POST https://trigger.macrodroid.com/YOUR_ID/send-sms
   Body: {"phone": "+1234567890", "message": "£149.99..."}
   ↓
6. MacroDroid sends SMS to customer ✅
```

---

### Flow 2: You Send from Dashboard (Manual)
```
1. You type message in dashboard
   ↓
2. Click "Send"
   ↓
3. Dashboard calls Macro 2 webhook ← SAME WEBHOOK
   POST https://trigger.macrodroid.com/YOUR_ID/send-sms
   Body: {"phone": "+1234567890", "message": "Your message"}
   ↓
4. MacroDroid sends SMS to customer ✅
```

---

### Flow 3: You Reply from Phone (Tracking)
```
1. You send SMS from your phone
   ↓
2. MacroDroid Macro 3 detects SMS Sent
   ↓
3. HTTP POST to /api/messages/send
   Body: {
     "conversationId": "lookup-by-phone",
     "text": "Your message",
     "sender": "staff",
     "customerPhone": "+1234567890"
   }
   ↓
4. Dashboard logs it as staff message
   ↓
5. AI pauses (knows you took over) ✅
```

---

### Flow 4: Missed Call (NEW!)
```
1. Customer calls, you miss it
   ↓
2. MacroDroid Macro 4 detects missed call
   ↓
3. Wait 5-10 seconds
   ↓
4. HTTP POST to /api/messages/missed-call
   Body: {"from": "+1234567890", "channel": "sms"}
   ↓
5. Dashboard generates personalized response
   ↓
6. MacroDroid sends SMS directly (no webhook needed)
   ↓
7. Customer receives helpful message ✅
```

---

## 🎯 Key Points

### 1. One Webhook for All Outgoing SMS
```
Webhook: https://trigger.macrodroid.com/YOUR_ID/send-sms
         ↑                                      ↑
    Always same domain                  Your identifier
```

**Receives:**
```json
{
  "phone": "+1234567890",
  "message": "Text to send"
}
```

**Doesn't matter if from:**
- AI response
- Dashboard manual send
- Scheduled message
- Any other source

**MacroDroid just sends it!**

---

### 2. HTTP POST vs Webhook

**HTTP POST** (MacroDroid → Dashboard):
- Macro 1: Incoming SMS
- Macro 3: Track sent SMS
- Macro 4: Missed call (first action)

**Webhook** (Dashboard → MacroDroid):
- Macro 2: Outgoing SMS
- Used by AI and manual sends

---

### 3. Missed Call Uses Direct SMS

**Why not use webhook for missed call?**
- Response is immediate (no dashboard delay)
- Simpler flow
- Less points of failure
- Still logged in dashboard

**Could use webhook if you prefer:**
- More consistent
- Better tracking
- Centralized sending

**Your choice!** Current setup is simpler.

---

## 📋 Complete Macro Summary

### Macro 1: Incoming SMS
```
Name: SMS to AI Dashboard
Trigger: SMS Received (Any)
Action: HTTP POST
  URL: http://YOUR_IP:3000/api/messages/incoming
  Body: {
    "from": "{sms_number}",
    "message": "{sms_body}",
    "channel": "sms"
  }
```

### Macro 2: Outgoing SMS (WEBHOOK)
```
Name: Dashboard to SMS
Trigger: Webhook (URL)
  URL: https://trigger.macrodroid.com/YOUR_ID/send-sms
Action: Send SMS
  To: {webhook_phone}
  Message: {webhook_message}
```

### Macro 3: Track Sent SMS
```
Name: Track My SMS Replies
Trigger: SMS Sent (Any)
Action: HTTP POST
  URL: http://YOUR_IP:3000/api/messages/send
  Body: {
    "conversationId": "lookup-by-phone",
    "text": "{sms_body}",
    "sender": "staff",
    "customerPhone": "{sms_number}"
  }
```

### Macro 4: Missed Call Response
```
Name: Missed Call AI Response
Trigger: Missed Call (Any)
Action 1: Wait 5-10 seconds
Action 2: HTTP POST
  URL: http://YOUR_IP:3000/api/messages/missed-call
  Body: {
    "from": "{call_number}",
    "channel": "sms"
  }
  Save response to: missed_call_response
Action 3: Send SMS
  To: {call_number}
  Message: {lv=missed_call_response}
```

---

## ⚙️ Configuration

### Environment Variable (Required)
```env
MACRODROID_WEBHOOK_URL=https://trigger.macrodroid.com/YOUR_ID/send-sms
```

**Get this from:**
1. MacroDroid Macro 2
2. Webhook trigger
3. Copy the URL shown

**Used by:**
- `/api/messages/incoming` (AI responses)
- `/api/messages/send` (manual sends)
- Any other API that needs to send SMS

---

## 🧪 Testing

### Test 1: AI Response (Webhook)
```bash
# Send SMS to your phone
# Check MacroDroid logs:
# - Macro 1: ✅ Received and posted
# - Macro 2: ✅ Webhook triggered and sent
```

### Test 2: Dashboard Send (Webhook)
```bash
# Send from dashboard
# Check MacroDroid logs:
# - Macro 2: ✅ Webhook triggered and sent
```

### Test 3: Manual Reply (HTTP POST)
```bash
# Reply from your phone
# Check MacroDroid logs:
# - Macro 3: ✅ Posted to dashboard
# Check dashboard:
# - Message shows as "staff"
```

### Test 4: Missed Call (HTTP POST + Direct SMS)
```bash
# Call your phone, don't answer
# Check MacroDroid logs:
# - Macro 4: ✅ Posted to API and sent SMS
# Check you received SMS
```

---

## 🔍 Debugging

### Check Webhook URL
```bash
# Test webhook directly
curl -X POST "https://trigger.macrodroid.com/YOUR_ID/send-sms" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "message": "Test message"
  }'

# Should receive SMS immediately!
```

### Check MacroDroid Logs
1. Open MacroDroid
2. Tap on macro
3. Tap "View Log"
4. Look for:
   - ✅ Green = Success
   - ❌ Red = Failed
   - ⏸️ Yellow = Skipped

### Check Dashboard Logs
```bash
npm run dev

# Look for:
[MacroDroid] SMS sent to +1234567890
[Missed Call] Generated response for +1234567890
```

---

## 💡 Pro Tips

### 1. Use Descriptive Identifiers
```
Good: send-sms, receive-sms, missed-call
Bad: webhook1, test, abc123
```

### 2. Keep Webhook URL Secret
- Don't share publicly
- Don't commit to git
- Store in .env.local only

### 3. Test Each Macro Individually
- Disable others while testing
- Check logs after each test
- Verify expected behavior

### 4. Monitor for First Few Days
- Check logs regularly
- Verify correct routing
- Watch for errors

---

## 🎉 Summary

### One Webhook Does It All
```
Webhook: send-sms
Used by: AI responses + Manual sends + Any outgoing SMS
Receives: {"phone": "...", "message": "..."}
Action: Send SMS to specified phone
```

### HTTP POST for Incoming
```
Incoming SMS → POST to /api/messages/incoming
Sent SMS → POST to /api/messages/send
Missed Call → POST to /api/messages/missed-call
```

### Result
- ✅ Simple setup
- ✅ One webhook to manage
- ✅ Works for all scenarios
- ✅ Easy to debug
- ✅ Professional responses

---

## 📞 Quick Reference

### Webhook URL Format
```
https://trigger.macrodroid.com/[YOUR_UNIQUE_ID]/[identifier]
                                      ↑                ↑
                              Auto-generated    You choose this
```

### Example
```
https://trigger.macrodroid.com/abc123xyz/send-sms
```

### Payload Format
```json
{
  "phone": "+1234567890",
  "message": "Text to send"
}
```

### MacroDroid Variables
```
{webhook_phone}   ← Phone number from payload
{webhook_message} ← Message text from payload
```

---

**Last Updated**: November 4, 2025  
**Status**: Complete guide  
**Priority**: Reference document 📚
