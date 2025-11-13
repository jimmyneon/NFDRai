# Fix: Messages Not Showing & AI Responding Incorrectly

## 🔴 Critical Issue Found

**Your MacroDroid is NOT sending incoming customer messages to the webhook.**

This is why:
- ❌ You only see your staff messages in the UI
- ❌ Customer messages never appear
- ❌ AI Steve never responds automatically
- ❌ AI pause logic doesn't work (no customer messages to trigger it)

## 📱 MacroDroid Configuration Required

### Current Setup (What's Working)
✅ **Outgoing Messages** - When you send SMS via MacroDroid:
- MacroDroid calls `/api/messages/send` 
- Message is saved to database
- Shows in UI as staff message

### Missing Setup (What's Broken)
❌ **Incoming Messages** - When customer sends you SMS:
- MacroDroid receives it
- MacroDroid does NOTHING with it
- Message never reaches your system
- AI never responds

## 🔧 How to Fix

### Step 1: Create MacroDroid Macro for Incoming SMS

1. Open MacroDroid
2. Create new macro: "Forward Incoming SMS to AI"
3. **Trigger:** SMS Received (Any Contact)
4. **Action:** HTTP Request
   - **URL:** `https://nfdrai.vercel.app/api/messages/incoming`
   - **Method:** POST
   - **Content Type:** application/json
   - **Body:**
     ```json
     {
       "from": "{smsf}",
       "message": "{smsm}",
       "channel": "sms"
     }
     ```
   - **Timeout:** 30 seconds

5. Save macro and enable it

### Step 2: Test It

1. Send yourself a test SMS from another phone
2. Check MacroDroid logs - should see HTTP Request action
3. Run: `node check-messages.js`
4. You should now see:
   - Your staff messages ✅
   - Customer message ✅
   - AI Steve's response ✅

## 🤖 How AI Pause Logic Works (Once Fixed)

### Scenario 1: You Reply, Customer Asks Complex Question
```
14:06 - You: "Total cost for MacBook LCD is £260"
14:07 - Customer: "How much do I owe you?"
        → AI detects: Staff replied 1 min ago
        → AI checks: Is this a simple query? NO (pricing needs context)
        → AI decision: PAUSE - wait for staff
        → Creates alert for you
        → NO AI RESPONSE SENT
```

### Scenario 2: You Reply, Customer Asks Simple Question
```
14:06 - You: "Total cost for MacBook LCD is £260"
14:07 - Customer: "When are you open?"
        → AI detects: Staff replied 1 min ago
        → AI checks: Is this a simple query? YES (business hours)
        → AI decision: RESPOND - simple factual question
        → AI sends: "We're open Mon-Fri 10am-5pm..."
```

### Scenario 3: Customer Replies After 30+ Minutes
```
14:06 - You: "Total cost for MacBook LCD is £260"
14:40 - Customer: "How much do I owe you?"
        → AI detects: Staff replied 34 min ago
        → AI decision: RESUME - 30 min pause expired
        → AI sends: "Based on John's message, the total is £260..."
```

### Scenario 4: Customer Just Says Thanks
```
14:06 - You: "Total cost for MacBook LCD is £260"
14:07 - Customer: "Thanks John"
        → AI detects: Pure acknowledgment
        → AI decision: SILENT - no response needed
        → NO AI RESPONSE SENT
```

## 🔍 Why AI Was Responding When It Shouldn't

**The Problem:**
AI pause logic checks: "Did staff reply in last 30 minutes?"

But if incoming customer messages never reach the system:
- Customer sends message → Never saved to database
- AI never triggered
- You manually reply → Saved as staff message
- Next customer message → Still never reaches system
- AI never knows you replied recently

**The Fix:**
Once MacroDroid forwards incoming messages:
- Customer sends message → Saved to database ✅
- AI triggered → Checks for recent staff messages ✅
- Finds your message from 5 min ago ✅
- Pauses appropriately ✅

## 📊 What You'll See After Fix

### In Database (run `node check-messages.js`)
```
1. [STAFF] 2:06 PM - Hi there. Total cost for MacBook...
2. [CUSTOMER] 2:07 PM - How much do I owe you?
3. [AI] 2:07 PM - Based on John's message, the total is £260...
4. [CUSTOMER] 2:08 PM - Thanks!
```

### In UI Dashboard
- Conversation list shows customer name
- Message count shows all messages (not just staff)
- Click conversation → See full history:
  - Your messages (blue, right side)
  - Customer messages (gray, left side)
  - AI messages (purple, right side)

### In Logs (when AI pauses)
```
[Staff Activity Check] Minutes since staff message: 5.2
[Staff Activity Check] Should AI respond? false
[Staff Activity Check] Reason: Staff replied 5 minutes ago - waiting for staff (25 min remaining)
```

## ✅ Verification Checklist

After setting up MacroDroid macro:

1. [ ] Send test SMS to yourself
2. [ ] Check MacroDroid logs - HTTP Request executed
3. [ ] Run `node check-messages.js` - see customer message
4. [ ] Check UI - customer message appears
5. [ ] AI responds automatically (if appropriate)
6. [ ] Reply manually
7. [ ] Send another test SMS within 30 min
8. [ ] AI should pause (unless simple query)

## 🆘 Troubleshooting

### MacroDroid HTTP Request Fails
- Check URL is correct: `https://nfdrai.vercel.app/api/messages/incoming`
- Check internet connection
- Check timeout is at least 30 seconds
- Check body format is valid JSON

### Messages Still Not Showing
- Check MacroDroid macro is enabled
- Check trigger is "SMS Received (Any Contact)"
- Check HTTP Request action comes AFTER trigger
- Check MacroDroid has internet permission
- Check logs in MacroDroid app

### AI Still Responding When It Shouldn't
- Verify customer messages are being saved (run `node check-messages.js`)
- Check conversation status is 'auto' (not 'manual' or 'blocked')
- Check logs for `[Staff Activity Check]` messages
- Verify your messages are saved with sender='staff'

## 📝 Summary

**Root Cause:** MacroDroid not forwarding incoming SMS to webhook

**Impact:** 
- No customer messages in database
- No AI responses
- No conversation history
- AI pause logic doesn't work

**Fix:** Configure MacroDroid to POST incoming SMS to `/api/messages/incoming`

**Result:** Full conversation history, automatic AI responses, proper pause logic
