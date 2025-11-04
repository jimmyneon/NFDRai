# 📊 API Logging & Message Tracking

## ✅ What's Implemented

### 1. **Message Type Tracking**

Messages are now categorized by type:
- `normal` - Regular customer messages
- `missed_call` - AI responses to missed calls
- `auto_reply` - AI auto-responses
- `manual_reply` - Your manual replies
- `system` - System messages

**In Conversations:**
- Customer messages show as "Customer"
- AI responses show as "AI" with provider/model
- Your replies show as "Staff"
- Missed call responses show as "AI" with `missed-call-template` model

---

### 2. **API Logs Table**

New database table tracks all API calls:
- Endpoint called
- HTTP method
- Status code
- Request body
- Response body
- Errors
- IP address
- User agent
- Duration (ms)
- Timestamp

---

### 3. **API Logs Dashboard Page**

New page at `/dashboard/api-logs` shows:
- ✅ All API calls in real-time
- ✅ Filter by endpoint (Incoming, Send, Missed Call)
- ✅ Status codes with color coding
- ✅ Request/response bodies
- ✅ Error messages
- ✅ Performance metrics (duration)

---

## 🎯 How to Use

### View API Logs

1. Go to dashboard
2. Click **"API Logs"** in sidebar
3. See all API calls

### Filter Logs

- **All** - Show everything
- **Incoming** - Only incoming SMS
- **Send** - Only sent messages
- **Missed Calls** - Only missed call responses

### Check Message Types

In conversations, you can see:
- 📱 Customer messages
- 🤖 AI responses (with model name)
- 👤 Staff messages (your manual replies)
- 📞 Missed call responses (marked as `missed-call-template`)

---

## 🗄️ Database Migration

Run this migration in Supabase SQL Editor:

```sql
-- File: supabase/migrations/011_api_logs.sql
-- Creates api_logs table and adds message_type column
```

**What it does:**
1. Creates `api_logs` table
2. Adds `message_type` column to `messages` table
3. Updates existing messages with correct types
4. Sets up RLS policies
5. Creates cleanup function (keeps last 30 days)

---

## 🔧 How It Works

### Automatic Logging

The API logger automatically tracks:
- Every incoming SMS
- Every sent message
- Every missed call
- Request/response data
- Errors and failures
- Performance metrics

### Message Categorization

When messages are saved:
```typescript
// Missed call
sender: 'ai'
ai_model: 'missed-call-template'
message_type: 'missed_call'

// Manual reply
sender: 'staff'
message_type: 'manual_reply'

// AI response
sender: 'ai'
message_type: 'auto_reply'

// Customer message
sender: 'customer'
message_type: 'normal'
```

---

## 📊 What You Can See

### In Conversations:
```
[Customer] How much for screen?
[AI - gpt-4o-mini] iPhone 14 screen is £149.99...
[Staff] I can do it for £140 today
[AI - missed-call-template] Hi! Sorry I missed your call...
```

### In API Logs:
```
POST /api/messages/incoming
Status: 200 OK
Duration: 245ms
Request: {"from": "07410381247", "message": "test"}
Response: {"success": true, "delivered": true}
```

---

## 🎨 Visual Indicators

### Status Colors:
- 🟢 **Green** - Success (200-299)
- 🟡 **Yellow** - Client error (400-499)
- 🔴 **Red** - Server error (500+)

### Message Badges:
- **Customer** - Blue badge
- **AI** - Purple badge (with model name)
- **Staff** - Green badge
- **System** - Gray badge

---

## 🔍 Debugging with API Logs

### Check if webhook was called:
1. Go to API Logs
2. Filter by "Incoming" or "Missed Calls"
3. Check response body for `delivered: true`
4. Check `deliveryProvider: "macrodroid"`

### Check for errors:
1. Look for red status codes (500+)
2. Check error message in log
3. See full request/response

### Check performance:
1. Look at duration_ms
2. Slow requests (>1000ms) might indicate issues

---

## 📋 Quick Reference

| Feature | Location | What It Shows |
|---------|----------|---------------|
| Message Types | Conversations | Customer, AI, Staff, System |
| API Logs | /dashboard/api-logs | All API calls |
| Request Data | API Logs → Request | What was sent |
| Response Data | API Logs → Response | What was returned |
| Errors | API Logs → Error | What went wrong |
| Performance | API Logs → Duration | How long it took |

---

## 🧪 Testing

### Test API Logging:

```bash
# Make an API call
curl -X POST "https://nfd-rai.vercel.app/api/messages/missed-call" \
  -H "Content-Type: application/json" \
  -d '{"from": "07410381247", "channel": "sms"}'

# Then check:
# 1. Go to /dashboard/api-logs
# 2. Should see the call logged
# 3. Check request/response bodies
# 4. Verify status code 200
```

---

## 🚀 Next Steps

1. **Run migration** - Execute `011_api_logs.sql` in Supabase
2. **Deploy** - Push changes to production
3. **Test** - Make some API calls
4. **Monitor** - Check API logs page

---

## 💡 Pro Tips

### Clean Old Logs:
```sql
SELECT clean_old_api_logs();
```
Removes logs older than 30 days

### Query Logs Directly:
```sql
SELECT * FROM api_logs
WHERE endpoint = '/api/messages/missed-call'
ORDER BY created_at DESC
LIMIT 10;
```

### Check Message Types:
```sql
SELECT 
  message_type,
  COUNT(*) as count
FROM messages
GROUP BY message_type;
```

---

**Last Updated**: November 4, 2025  
**Status**: Ready to deploy  
**Priority**: HIGH - Essential for debugging 🔍
