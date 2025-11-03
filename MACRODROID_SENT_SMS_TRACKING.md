# 📤 MacroDroid Sent SMS Tracking - Critical Feature!

**Purpose**: Track when YOU manually reply from your phone  
**Why**: So AI knows to pause and not interfere  
**Time**: 5 minutes to set up

---

## 🎯 The Problem This Solves

### Without Sent SMS Tracking:

```
Customer: "How much for screen?"
    ↓
AI: "£149.99 for iPhone 14"
    ↓
Customer: "Can I negotiate?"
    ↓
YOU reply from phone: "Let me check with manager..."
    ↓
❌ AI doesn't know you replied!
    ↓
Customer replies: "Thanks!"
    ↓
❌ AI responds again: "Our prices are firm..."
    ↓
🤯 Customer confused - got TWO responses!
```

### With Sent SMS Tracking:

```
Customer: "How much for screen?"
    ↓
AI: "£149.99 for iPhone 14"
    ↓
Customer: "Can I negotiate?"
    ↓
YOU reply from phone: "Let me check with manager..."
    ↓
✅ MacroDroid sends your message to dashboard
    ↓
✅ Dashboard marks it as "staff" message
    ↓
✅ Conversation switches to "manual" mode
    ↓
Customer replies: "Thanks!"
    ↓
✅ AI sees your recent message and PAUSES
    ↓
✅ Alert sent: "Manual response required"
    ↓
😊 Customer only gets YOUR responses!
```

---

## 📱 MacroDroid Setup (5 minutes)

### Step 1: Create Macro

1. Open **MacroDroid**
2. Tap **"+"** button
3. Tap **"Add Macro"**
4. Name: **"Track My SMS Replies"**

---

### Step 2: Add Trigger

1. Tap **"Add Trigger"**
2. Select **"SMS/MMS"**
3. Select **"SMS Sent"**
4. **Recipient**: Select **"Any Contact"** or **"Any Number"**
5. Tap **"OK"**

**This triggers whenever YOU send an SMS**

---

### Step 3: Send to Dashboard

1. Tap **"Add Action"**
2. Select **"Connectivity"**
3. Select **"HTTP Request"**

#### Configure:

**URL:**
```
For Local Testing:
http://YOUR_COMPUTER_IP:3000/api/messages/send

For Production:
https://your-app.vercel.app/api/messages/send
```

**Method:**
```
POST
```

**Content-Type:**
```
application/json
```

**Request Body:**
```json
{
  "conversationId": "lookup-by-phone",
  "text": "{sms_body}",
  "sender": "staff",
  "customerPhone": "{sms_number}"
}
```

**Explanation:**
- `conversationId: "lookup-by-phone"` - Dashboard will find conversation by phone
- `text: "{sms_body}"` - Your message text
- `sender: "staff"` - Marks it as YOUR message (not AI)
- `customerPhone: "{sms_number}"` - Who you sent it to

4. Tap **"OK"**
5. Save macro
6. **Enable the macro** (toggle switch)

---

## 🔧 Dashboard Code (Already Done!)

The dashboard API has been updated to handle this:

```typescript
// In /app/api/messages/send/route.ts

// Handle lookup by phone
if (conversationId === 'lookup-by-phone' && customerPhone) {
  // Find customer by phone
  const customer = await supabase
    .from('customers')
    .select('id')
    .eq('phone', customerPhone)
    .single()

  // Find their most recent conversation
  const conversation = await supabase
    .from('conversations')
    .select('id')
    .eq('customer_id', customer.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  // Use that conversation ID
  actualConversationId = conversation.id
}

// Save message with sender: 'staff'
await supabase.from('messages').insert({
  conversation_id: actualConversationId,
  sender: sender || 'staff', // Your message!
  text,
})

// Switch conversation to manual mode
await supabase.from('conversations').update({
  status: 'manual'
})
```

---

## 🔄 How It Works

### Complete Flow:

```
1. You send SMS from your phone
   "Let me check with manager..."
   
2. MacroDroid detects SMS Sent trigger
   
3. MacroDroid extracts:
   - Message text: "Let me check..."
   - Recipient: "+1234567890"
   
4. MacroDroid sends HTTP POST to dashboard:
   {
     "conversationId": "lookup-by-phone",
     "text": "Let me check...",
     "sender": "staff",
     "customerPhone": "+1234567890"
   }
   
5. Dashboard receives request
   
6. Dashboard looks up customer by phone
   
7. Dashboard finds their conversation
   
8. Dashboard saves message:
   - conversation_id: abc-123
   - sender: "staff" ← Important!
   - text: "Let me check..."
   
9. Dashboard switches conversation to "manual"
   
10. Next customer message arrives
   
11. AI checks last 5 messages
   
12. AI sees YOUR "staff" message
   
13. AI PAUSES - doesn't respond
   
14. Alert sent: "Manual response required"
```

---

## 🧪 Testing

### Test 1: Verify Tracking Works

1. **Send SMS from your phone** to any number
2. **Check MacroDroid logs:**
   - Open MacroDroid
   - Tap on "Track My SMS Replies" macro
   - Tap "View Log"
   - Should show ✅ Success
3. **Check dashboard:**
   - Go to Conversations
   - Find that conversation
   - Should see your message with "Staff" badge
   - Status should be "Manual"

---

### Test 2: Verify AI Pauses

1. **Customer sends SMS** to your phone
2. **AI responds** automatically
3. **Customer replies** again
4. **YOU reply from your phone** manually
5. **Customer replies** again
6. **Check**: AI should NOT respond
7. **Check dashboard**: Should show alert "Manual response required"

---

## ✅ Benefits

### For You:
- ✅ Reply from your phone anytime
- ✅ AI automatically detects and pauses
- ✅ No button clicking needed
- ✅ Natural workflow

### For AI:
- ✅ Knows when you've intervened
- ✅ Doesn't interfere with your conversations
- ✅ Switches to manual mode automatically
- ✅ Sends alerts when needed

### For Customers:
- ✅ No duplicate responses
- ✅ No confusion
- ✅ Consistent experience
- ✅ Professional service

---

## 🎯 Three Macros You Need

### Macro 1: Incoming SMS (Customer → AI)
```
Trigger: SMS Received
Action 1: HTTP POST to dashboard
Action 2: Send SMS (AI response)
```

### Macro 2: Track Sent SMS (You → Dashboard) ← THIS ONE!
```
Trigger: SMS Sent
Action: HTTP POST to dashboard (marks as staff)
```

### Macro 3: Dashboard Outgoing (Dashboard → Customer)
```
Trigger: Webhook URL
Action: Send SMS (from webhook data)
```

---

## 🔍 Troubleshooting

### Issue: "Conversation not found"

**Cause**: Customer doesn't exist in database yet

**Solution**: 
- They need to message you first
- Or create customer manually in dashboard
- Dashboard creates customer on first incoming message

---

### Issue: AI still responding after I reply

**Check:**
1. Is "Track My SMS Replies" macro enabled?
2. Check MacroDroid logs - did it run?
3. Check dashboard - does message show as "staff"?
4. Check conversation status - is it "manual"?
5. Check recent messages - is your message there?

---

### Issue: HTTP request fails

**Check:**
1. URL is correct (http:// for local, https:// for production)
2. Dashboard is running
3. Phone and computer on same WiFi (local testing)
4. Check terminal for errors

---

## 📊 Dashboard View

### What You'll See:

```
Conversation with John Smith
├── 📱 Customer: "How much for screen?" (2m ago)
├── 🤖 AI: "£149.99 for iPhone 14" (2m ago)
├── 📱 Customer: "Can I negotiate?" (1m ago)
├── 👤 Staff: "Let me check with manager..." (30s ago) ← Your message!
└── 📱 Customer: "Thanks!" (10s ago)

Status: 🟡 Manual (AI Paused)
Alert: ⚠️ Manual response required
```

---

## 💡 Pro Tips

### Tip 1: Test with yourself
- Send SMS to your own number (if carrier allows)
- Or use a friend's phone
- Verify tracking works before going live

### Tip 2: Check logs regularly
- MacroDroid logs show all executions
- Dashboard shows all messages
- Monitor for first few days

### Tip 3: Use constraints (optional)
- Only track business hours
- Only track certain contacts
- Filter by message content

---

## 🔒 Privacy Note

**What gets sent:**
- Your message text
- Recipient phone number
- Timestamp

**What doesn't get sent:**
- Your contacts list
- Other messages
- Personal data

**Stored where:**
- Your Supabase database
- You control the data
- Can delete anytime

---

## 🎉 Summary

**Setup Time**: 5 minutes  
**Complexity**: Easy  
**Automation**: 100%  
**Benefit**: AI never interferes with your manual replies

**Result**: You can reply from your phone naturally, and AI automatically knows to pause! 🚀

---

## 📞 Quick Reference

### MacroDroid Macro:
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

### Test Command:
```bash
# Test the API directly
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "lookup-by-phone",
    "text": "Test message",
    "sender": "staff",
    "customerPhone": "+1234567890"
  }'
```

---

**Last Updated**: November 3, 2025  
**Status**: Production Ready  
**Priority**: HIGH - Critical for AI takeover prevention! ⚠️
