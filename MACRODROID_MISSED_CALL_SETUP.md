# 📞 MacroDroid Missed Call Auto-Response Setup

**Purpose**: Send AI-generated response to missed calls  
**Benefit**: Professional, personalized replies instead of generic message  
**Time**: 5 minutes

---

## 🎯 How It Works

### Current (Generic):
```
Missed call → MacroDroid sends:
"Sorry I missed your call. Please text me or call back later."
```

### New (AI-Powered):
```
Missed call → MacroDroid notifies API → AI generates personalized response:
"Hi! This is NFD Repairs. Sorry I missed your call! 📱 I can help with:
• Screen repairs & quotes
• Check repair status
• Opening hours (Mon-Sat 9am-6pm)
• Any questions about phone/tablet repairs

Just text me what you need and I'll respond right away! Or call back during business hours."
```

**Each response is unique and contextual!**

---

## 📱 MacroDroid Setup

### Step 1: Create Missed Call Macro

1. Open **MacroDroid**
2. Tap **"+"** button
3. Name: **"Missed Call AI Response"**

---

### Step 2: Configure Missed Call Trigger

1. Tap **"Add Trigger"**
2. Select **"Phone"**
3. Select **"Missed Call"**
4. **Caller**: Select **"Any Contact"** or **"Any Number"**
   - Or filter to only known contacts
   - Or only unknown numbers
5. Tap **"OK"**

---

### Step 3: Add HTTP Request Action

1. Tap **"Add Action"**
2. Select **"Connectivity"**
3. Select **"HTTP Request"**

**URL:**
```
For Local Testing:
http://YOUR_COMPUTER_IP:3000/api/messages/missed-call

For Production:
https://your-app.vercel.app/api/messages/missed-call
```

**Method:** `POST`

**Content Type:** `application/json`

**Request Body:**
```json
{
  "from": "{call_number}",
  "channel": "sms"
}
```

**Save HTTP Response in String Variable:**
- Create variable: `missed_call_response`
- This stores the AI-generated message

4. Tap **"OK"**

---

### Step 4: Add SMS Reply Action

1. Tap **"Add Action"**
2. Select **"Phone"**
3. Select **"Send SMS"**

**Recipient:**
```
{call_number}
```

**Message:**
```
{lv=missed_call_response}
```

4. Tap **"OK"**

---

### Step 5: Add Delay (Optional but Recommended)

1. Before the SMS action, tap **"Add Action"**
2. Select **"Delay"**
3. Set to **5-10 seconds**
4. Tap **"OK"**

**Why?** Gives caller time to leave voicemail or realize they missed you

---

### Step 6: Save and Enable

1. Tap **"✓"** to save
2. **Enable the macro** (toggle switch)
3. Test it!

---

## 🔧 API Endpoint (I'll Create This)

I'll create `/api/messages/missed-call` that:
- Receives missed call notification
- Generates AI response with business info
- Returns personalized message
- Logs in database for tracking

---

## 🎨 AI Response Examples

### Example 1: First-time caller
```
Hi! This is NFD Repairs 📱 Sorry I missed your call!

I can help you with:
• Screen repairs & quotes (iPhone, Samsung, all brands)
• Check your repair status
• Opening hours: Mon-Sat 9am-6pm
• Any phone/tablet repair questions

Just text me what you need and I'll respond right away! Or call back during business hours.

- NFD Repairs Team
```

### Example 2: Existing customer
```
Hi John! Sorry I missed your call 📱

Your iPhone 14 screen repair is ready for pickup! We're open until 6pm today.

Need something else? Just text me:
• New repair quote
• Questions about warranty
• Anything else!

Or call back anytime during business hours (Mon-Sat 9am-6pm).

- NFD Repairs
```

### Example 3: After hours
```
Hi! This is NFD Repairs 📱

We're currently closed (open Mon-Sat 9am-6pm).

I can still help via text:
• Get repair quotes
• Check repair status  
• Answer questions
• Book appointments

Just text me what you need and I'll respond right away!

- NFD Repairs Team
```

---

## 🔄 Complete Flow

```
1. Customer calls your phone
   ↓
2. You miss the call
   ↓
3. MacroDroid detects missed call
   ↓
4. Wait 5-10 seconds (optional delay)
   ↓
5. MacroDroid sends HTTP POST to /api/messages/missed-call
   Body: {"from": "+1234567890", "channel": "sms"}
   ↓
6. API processes:
   - Find/create customer
   - Check if existing customer (personalize!)
   - Check time of day (business hours?)
   - Check if they have active repair
   - Generate contextual AI response
   ↓
7. API returns personalized message
   ↓
8. MacroDroid sends SMS to caller
   ↓
9. Customer receives helpful, personalized message ✅
```

---

## 💡 Smart Features

### 1. Personalization
- Uses customer name if known
- Mentions active repairs if any
- References previous conversations

### 2. Time-Aware
- Different message during business hours vs after hours
- Mentions current opening status

### 3. Context-Aware
- If customer recently asked about quote → mentions quotes
- If repair in progress → mentions status
- If new customer → full introduction

### 4. Professional
- Includes business name
- Lists services
- Provides opening hours
- Encourages text response

---

## 🎯 Benefits

### For You:
- ✅ Professional image
- ✅ No manual responses needed
- ✅ Captures leads even when busy
- ✅ Personalized without effort

### For Customers:
- ✅ Immediate response
- ✅ Helpful information
- ✅ Clear next steps
- ✅ Can text instead of calling back

### For Business:
- ✅ Better customer service
- ✅ More conversions
- ✅ Tracked in dashboard
- ✅ Analytics on missed calls

---

## 🧪 Testing

### Test 1: Call yourself
1. Call your phone from another phone
2. Don't answer (let it go to voicemail or reject)
3. Wait 10 seconds
4. Check if you receive AI-generated SMS

### Test 2: Check personalization
1. Have someone who's texted before call
2. Miss the call
3. Verify response mentions their name or previous interaction

### Test 3: After hours
1. Test during closed hours
2. Verify message mentions you're closed
3. Verify still offers text help

---

## ⚙️ Advanced Options

### Filter by Contact Status

**Only respond to unknown numbers:**
```
Trigger: Missed Call
Constraint: Caller NOT in Contacts
```

**Only respond to known customers:**
```
Trigger: Missed Call  
Constraint: Caller in Contacts
```

### Business Hours Only

```
Trigger: Missed Call
Constraint: Time Period
  Monday-Saturday, 9am-6pm
```

### Different Messages by Time

```
If: Time is 9am-6pm
  → Send business hours message
Else:
  → Send after hours message
```

---

## 📊 Dashboard Tracking

The API will log missed calls in the database:
- Track missed call volume
- See which customers called
- View AI responses sent
- Analyze patterns

**New dashboard widget:**
```
Missed Calls Today: 12
Response Rate: 100%
Converted to Text: 8 (67%)
```

---

## 🔧 Configuration Options

### Environment Variables (Optional)
```env
# Business info for missed call responses
BUSINESS_NAME="NFD Repairs"
BUSINESS_HOURS="Mon-Sat 9am-6pm"
BUSINESS_PHONE="+441234567890"

# Missed call response style
MISSED_CALL_TONE="friendly"  # or "professional", "casual"
MISSED_CALL_EMOJI=true
```

---

## 📋 Quick Reference

### MacroDroid Macro:
```
Name: Missed Call AI Response
Trigger: Missed Call (Any)
Action 1: Wait 5-10 seconds
Action 2: HTTP POST to /api/messages/missed-call
  Body: {"from": "{call_number}", "channel": "sms"}
Action 3: Send SMS
  To: {call_number}
  Message: {lv=missed_call_response}
```

### API Endpoint:
```
POST /api/messages/missed-call
Body: {
  "from": "+1234567890",
  "channel": "sms"
}
Response: {
  "success": true,
  "message": "AI-generated response text"
}
```

---

## 🆘 Troubleshooting

### Issue: No SMS sent after missed call

**Check:**
1. Macro is enabled
2. Trigger is set to "Any" caller
3. HTTP request URL is correct
4. Variable name matches in SMS action

### Issue: Generic response instead of personalized

**Check:**
1. API endpoint is working
2. Customer exists in database
3. AI settings are configured
4. Check dashboard logs

### Issue: Delay too short/long

**Adjust:**
- 5 seconds: Quick response
- 10 seconds: Give time for voicemail
- 30 seconds: Only if they don't call back

---

## 🎉 Result

Professional, personalized missed call responses that:
- ✅ Never miss a lead
- ✅ Provide helpful information
- ✅ Encourage text conversation
- ✅ Build professional image
- ✅ Track all interactions

---

**Last Updated**: November 4, 2025  
**Status**: Ready to implement  
**Priority**: HIGH - Great customer service feature! 📞
