# Message Display Issues - Diagnosis

## Problems Identified

### 1. ❌ **CRITICAL: Customer and AI Messages Not Being Saved**

**Evidence:**
- Database only shows 3 staff messages for most recent conversation
- NO customer messages
- NO AI messages
- Only staff messages from MacroDroid tracking are being saved

**Root Cause:**
MacroDroid is NOT sending incoming customer messages to `/api/messages/incoming` webhook.

**What's Happening:**
1. Customer sends message → MacroDroid receives it
2. MacroDroid should call `/api/messages/incoming` → **NOT HAPPENING**
3. AI should respond → **NEVER TRIGGERED**
4. You manually reply → MacroDroid tracks via `/api/messages/send` → ✅ Works

**Fix Required:**
Configure MacroDroid to send incoming SMS to webhook:
```
URL: https://your-domain.vercel.app/api/messages/incoming
Method: POST
Body: {
  "from": "{smsf}",
  "message": "{smsm}",
  "channel": "sms"
}
```

---

### 2. ❌ **AI Responding When It Should Pause**

**Evidence:**
From your messages:
- 14:06 - You send message
- 14:19 - You send another message (13 min later)
- 15:23 - You send another message (64 min later)
- AI Steve is still responding

**Root Cause:**
The 30-minute pause logic checks for staff messages in the database, but if incoming customer messages aren't being saved, the AI never sees the staff messages as "recent" in the conversation context.

**What Should Happen:**
1. You send message → Saved as 'staff' sender
2. Customer replies → AI checks: "Staff replied 5 min ago, is this a simple query?"
3. If complex query → AI pauses, creates alert
4. If simple query (hours, location) → AI responds
5. After 30 min → AI resumes full operation

**What's Actually Happening:**
1. You send message → Saved as 'staff' sender ✅
2. Customer replies → **Never reaches webhook** ❌
3. AI never triggered ❌
4. You manually reply again

---

## How to Fix

### Step 1: Configure MacroDroid Incoming Webhook

**MacroDroid Macro:**
1. Trigger: SMS Received
2. Action: HTTP Request
   - URL: `https://nfdrai.vercel.app/api/messages/incoming`
   - Method: POST
   - Content Type: application/json
   - Body:
     ```json
     {
       "from": "{smsf}",
       "message": "{smsm}",
       "channel": "sms"
     }
     ```

### Step 2: Test Incoming Webhook

Send yourself a test SMS and check:
1. MacroDroid receives it
2. MacroDroid calls webhook
3. Check logs: `node check-messages.js`
4. Should see customer message in database

### Step 3: Verify AI Pause Logic

Once incoming messages work:
1. Send yourself a message
2. Reply manually
3. Send another message within 30 min
4. AI should pause (unless simple query)
5. Check logs for: `[Staff Activity Check] Should AI respond? false`

---

## Quick Test Commands

```bash
# Check recent messages
node check-messages.js

# Test incoming webhook (requires dev server running)
node check-incoming-webhook.js

# Check MacroDroid logs
# Look for HTTP Request action logs in MacroDroid app
```

---

## Expected Behavior After Fix

**Scenario 1: Complex Query During Pause**
```
14:06 - You: "Hi there. Total cost for MacBook A2337 LCD would be £260"
14:07 - Customer: "How much do I owe you?"
       → AI: [PAUSED] Staff replied 1 min ago - waiting for staff
       → Alert created for you
```

**Scenario 2: Simple Query During Pause**
```
14:06 - You: "Hi there. Total cost for MacBook A2337 LCD would be £260"
14:07 - Customer: "When are you open?"
       → AI: "We're open Monday-Friday 10am-5pm, Saturday 10am-3pm..."
```

**Scenario 3: After 30 Minutes**
```
14:06 - You: "Hi there. Total cost for MacBook A2337 LCD would be £260"
14:40 - Customer: "How much do I owe you?"
       → AI: "Based on John's message, the total cost is £260..."
```

---

## Why This Matters

Without incoming messages being saved:
- ❌ AI never responds automatically
- ❌ You don't see customer messages in dashboard
- ❌ No conversation history
- ❌ No sentiment analysis
- ❌ No name extraction
- ❌ No automatic alerts
- ❌ System is essentially just a message tracker, not an AI responder

**Bottom line:** MacroDroid incoming webhook is the critical missing piece.
