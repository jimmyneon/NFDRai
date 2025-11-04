# ❓ Your Questions Answered

**Your questions from the chat, answered clearly**

---

## Q1: "In webhook I need identifier so that's send-sms yeah?"

### ✅ Answer: YES!

**Webhook URL format:**
```
https://trigger.macrodroid.com/YOUR_UNIQUE_ID/send-sms
                                              ↑
                                    This is your identifier
```

**You choose the identifier:**
- `send-sms` ← Good choice!
- `outgoing-sms` ← Also good
- `send-message` ← Also fine
- `webhook1` ← Not descriptive

**Recommendation:** Use `send-sms` - it's clear and descriptive!

---

## Q2: "All webhooks have a different identifier, do we use the same one for from AI or if I sent via the dashboard?"

### ✅ Answer: Use the SAME webhook for both!

**One webhook handles all outgoing SMS:**

```
AI Response:
Dashboard → Webhook (send-sms) → MacroDroid → Send SMS ✅

Manual Send:
Dashboard → Webhook (send-sms) → MacroDroid → Send SMS ✅
                    ↑
              SAME WEBHOOK!
```

**Why?**
- Same action (send SMS)
- Same phone (your Android)
- Simpler to manage
- Less confusion

**The webhook receives:**
```json
{
  "phone": "+1234567890",
  "message": "Text to send"
}
```

**It doesn't care if the message is from:**
- AI response
- Manual dashboard send
- Scheduled message
- Any other source

**MacroDroid just sends it!**

---

## Q3: "If I send a SMS then a HTTP is sent to messages/send"

### ✅ Answer: YES, that's correct!

**Flow when YOU send SMS from your phone:**

```
1. You send SMS from your phone
   ↓
2. MacroDroid detects "SMS Sent" trigger
   ↓
3. MacroDroid sends HTTP POST to /api/messages/send
   Body: {
     "conversationId": "lookup-by-phone",
     "text": "Your message",
     "sender": "staff",
     "customerPhone": "+1234567890"
   }
   ↓
4. Dashboard logs it as "staff" message
   ↓
5. AI pauses (knows you took over)
```

**This is Macro 3: Track Sent SMS**

**Purpose:**
- Dashboard knows you manually replied
- AI won't interfere
- Conversation switches to "manual" mode
- You stay in control

---

## Q4: "Missed call to incoming - maybe AI can respond to that instead of a standard reply in MacroDroid"

### ✅ Answer: GREAT IDEA! I've implemented this!

**Old way (generic):**
```
Missed call → MacroDroid sends:
"Sorry I missed your call. Please text me."
```

**New way (AI-powered):**
```
Missed call → MacroDroid → API → AI generates personalized response:

"Hi John! This is NFD Repairs 📱 Sorry I missed your call!

I see you have an active repair with us. I'll check on the status!

I can also help with:
• Screen repairs & quotes
• Opening hours (Mon-Sat 9am-6pm)
• Any questions

Just text me what you need and I'll respond right away!

- NFD Repairs Team"
```

**Each response is unique!**

---

## Q5: "So it's a different reply each time"

### ✅ Answer: YES! AI generates contextual responses!

**The API checks:**
- ✅ Is this an existing customer? (personalize with name)
- ✅ Do they have an active repair? (mention it)
- ✅ What time is it? (business hours or closed?)
- ✅ Have they texted before? (reference previous conversation)

**Example responses:**

### New Customer, Business Hours:
```
Hi! This is NFD Repairs 📱 Sorry I missed your call!

I can help you with:
• Screen repairs & quotes (iPhone, Samsung, all brands)
• Check repair status
• Opening hours: Mon-Sat 9am-6pm
• Any phone/tablet repair questions

Just text me what you need and I'll respond right away! 
Or call back - we're open until 6pm.

- NFD Repairs Team
```

### Existing Customer, After Hours:
```
Hi Sarah! Sorry I missed your call 📱

We're currently closed (open Mon-Sat 9am-6pm).

I can still help via text:
• Your Samsung repair status
• New repair quotes
• Any questions

Just text me what you need and I'll respond right away!

- NFD Repairs
```

### Customer with Active Repair:
```
Hi Mike! Sorry I missed your call 📱

Your iPhone 14 screen repair is ready for pickup! 
We're open until 6pm today.

Need something else? Just text me:
• Questions about warranty
• New repair quote
• Anything else!

Or call back anytime during business hours.

- NFD Repairs
```

**Every response is personalized and contextual!**

---

## Q6: "Should say who we are and how it can help with opening hours or checking status, or quotes or anything else"

### ✅ Answer: YES! Already included!

**Every missed call response includes:**

1. **Who you are:**
   ```
   "This is NFD Repairs 📱"
   ```

2. **Apology:**
   ```
   "Sorry I missed your call!"
   ```

3. **What you can help with:**
   ```
   I can help you with:
   • Screen repairs & quotes (iPhone, Samsung, all brands)
   • Check your repair status
   • Opening hours & location
   • Any phone/tablet repair questions
   ```

4. **Opening hours:**
   ```
   Opening hours: Mon-Sat 9am-6pm
   ```
   (Pulled from database - updates automatically!)

5. **Call to action:**
   ```
   Just text me what you need and I'll respond right away!
   Or call back during business hours.
   ```

6. **Professional signature:**
   ```
   - NFD Repairs Team
   ```

---

## 📋 Complete Setup Summary

### Macro 1: Incoming SMS
```
Trigger: SMS Received
Action: HTTP POST to /api/messages/incoming
Purpose: Notify dashboard of customer messages
```

### Macro 2: Outgoing SMS (WEBHOOK)
```
Trigger: Webhook URL (send-sms)
Action: Send SMS
Purpose: Send messages from dashboard (AI or manual)
Used by: BOTH AI responses AND manual sends
```

### Macro 3: Track Sent SMS
```
Trigger: SMS Sent
Action: HTTP POST to /api/messages/send
Purpose: Tell dashboard when you manually reply
```

### Macro 4: Missed Call Response (NEW!)
```
Trigger: Missed Call
Action 1: HTTP POST to /api/messages/missed-call
Action 2: Send SMS with AI-generated response
Purpose: Professional, personalized missed call responses
```

---

## 🎯 Key Points

### 1. One Webhook for All Outgoing
```
Webhook: send-sms
Used by: AI responses + Manual sends
Same webhook for both!
```

### 2. Missed Calls Get AI Responses
```
Missed call → API generates personalized response
Different every time based on:
- Customer history
- Time of day
- Active repairs
- Previous conversations
```

### 3. Dashboard Knows Everything
```
When you send SMS → Dashboard logs it
When customer calls → Dashboard generates response
When AI responds → Dashboard controls routing
```

---

## ✅ What You Need to Do

### 1. Update Macro 1 (Incoming SMS)
- Remove "Send SMS" action if it exists
- Keep only HTTP POST

### 2. Create Macro 2 (Webhook)
- Trigger: Webhook URL
- Identifier: `send-sms`
- Action: Send SMS to `{webhook_phone}`
- Copy webhook URL

### 3. Keep Macro 3 (Track Sent)
- Already working
- No changes needed

### 4. Create Macro 4 (Missed Call) - NEW!
- Trigger: Missed Call
- Action 1: Wait 5-10 seconds
- Action 2: HTTP POST to `/api/messages/missed-call`
- Action 3: Send SMS with response

### 5. Update .env.local
```env
MACRODROID_WEBHOOK_URL=https://trigger.macrodroid.com/YOUR_ID/send-sms
```

### 6. Restart Dashboard
```bash
npm run dev
```

---

## 📚 Documentation Files

**Quick Start:**
- `QUICK_FIX_GUIDE.md` - 5-minute fix

**Complete Guides:**
- `MACRODROID_UPDATED_SETUP.md` - Full setup
- `MACRODROID_MISSED_CALL_SETUP.md` - Missed call feature
- `WEBHOOK_GUIDE.md` - All about webhooks
- `MACRODROID_FLOW_DIAGRAM.md` - Visual flows

**Troubleshooting:**
- `MACRODROID_TROUBLESHOOTING.md` - Fix issues
- `SUMMARY_OF_CHANGES.md` - What changed

---

## 🎉 Result

After setup, you'll have:

✅ **Correct message routing** (no wrong numbers)  
✅ **One webhook for all outgoing** (AI + manual)  
✅ **AI-powered missed call responses** (personalized every time)  
✅ **Automatic reply tracking** (AI pauses when you reply)  
✅ **Professional customer service** (even when busy)  
✅ **Complete audit trail** (everything logged)

---

## 🆘 Still Have Questions?

### Check these files:
1. **WEBHOOK_GUIDE.md** - Everything about webhooks
2. **MACRODROID_FLOW_DIAGRAM.md** - Visual explanation
3. **MACRODROID_MISSED_CALL_SETUP.md** - Missed call details

### Or test it:
```bash
# Test webhook
curl -X POST "https://trigger.macrodroid.com/YOUR_ID/send-sms" \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1234567890","message":"test"}'

# Should receive SMS immediately!
```

---

**Last Updated**: November 4, 2025  
**Status**: All your questions answered! ✅  
**Next Step**: Follow QUICK_FIX_GUIDE.md to implement 🚀
