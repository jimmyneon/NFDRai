# 📱 MacroDroid Webhook - cURL Commands to Import

## 1️⃣ Delivery Confirmation Webhook

**Use this AFTER sending SMS to confirm delivery**

### cURL Command:
```bash
curl -X POST https://nfd-rai.vercel.app/api/messages/delivery-confirmation \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "{lv=customer_phone}",
    "message": "{lv=message_text}",
    "status": "delivered",
    "timestamp": "{time}"
  }'
```

### MacroDroid Setup:
1. Open "Outgoing SMS (Webhook)" macro
2. After "Send SMS" action, add:
   - **Action:** HTTP Request
   - **Method:** POST
   - **URL:** `https://nfd-rai.vercel.app/api/messages/delivery-confirmation`
   - **Content Type:** application/json
   - **Body:**
     ```json
     {
       "phone": "{lv=customer_phone}",
       "message": "{lv=message_text}",
       "status": "delivered",
       "timestamp": "{time}"
     }
     ```

---

## 2️⃣ Track Sent SMS Webhook (Manual Messages)

**Use this to track messages YOU manually send from your phone**

### cURL Command:
```bash
curl -X POST https://nfd-rai.vercel.app/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "lookup-by-phone",
    "customerPhone": "{sms_number}",
    "text": "{sms_body}",
    "sender": "staff",
    "trackOnly": true
  }'
```

### MacroDroid Setup:
1. Open "Track Sent SMS" macro
2. **Trigger:** SMS Sent
3. **Action:** HTTP Request
   - **Method:** POST
   - **URL:** `https://nfd-rai.vercel.app/api/messages/send`
   - **Content Type:** application/json
   - **Body:**
     ```json
     {
       "conversationId": "lookup-by-phone",
       "customerPhone": "{sms_number}",
       "text": "{sms_body}",
       "sender": "staff",
       "trackOnly": true
     }
     ```

---

## 🔧 Import to MacroDroid

### Method 1: Copy/Paste Body
1. Open MacroDroid macro
2. Add HTTP Request action
3. Set Method: POST
4. Set URL (from above)
5. Set Content Type: application/json
6. Copy/paste the JSON body

### Method 2: Use cURL Import (if supported)
Some versions of MacroDroid support importing cURL commands directly.

---

## 📋 Quick Reference

### Delivery Confirmation
- **When:** After SMS is sent
- **Purpose:** Confirm delivery
- **URL:** `/api/messages/delivery-confirmation`
- **Variables:** `{lv=customer_phone}`, `{lv=message_text}`, `{time}`

### Track Sent SMS
- **When:** SMS Sent trigger
- **Purpose:** Track manual messages
- **URL:** `/api/messages/send`
- **Variables:** `{sms_number}`, `{sms_body}`
- **Extra:** `"trackOnly": true` prevents re-sending

---

## 🧪 Test Commands

### Test Delivery Confirmation:
```bash
curl -X POST https://nfd-rai.vercel.app/api/messages/delivery-confirmation \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "07410381247",
    "message": "Test message",
    "status": "delivered",
    "timestamp": "2024-11-04 20:00:00"
  }'
```

### Test Track Sent SMS:
```bash
curl -X POST https://nfd-rai.vercel.app/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "lookup-by-phone",
    "customerPhone": "07410381247",
    "text": "Test manual message",
    "sender": "staff",
    "trackOnly": true
  }'
```

---

## ⚠️ About the 500 Error

The 500 error on delivery confirmation is likely because:

1. **Message not found** - Looking for exact text match within 5 minutes
2. **Phone number mismatch** - Make sure `{lv=customer_phone}` is set correctly
3. **Text mismatch** - Message text must match exactly

### Debug:
- Check MacroDroid variables are set correctly
- Verify the message was sent within last 5 minutes
- Check the exact text matches (including line breaks)

---

## 💡 Pro Tip

**For Delivery Confirmation:**
- Only add this to "Outgoing SMS (Webhook)" macro
- Don't add to "Track Sent SMS" macro
- This confirms AI/dashboard messages were delivered

**For Track Sent SMS:**
- Only use for YOUR manual replies
- AI messages are already tracked
- Duplicate detection prevents double-tracking

---

**Copy these into MacroDroid and you're good to go!** 🚀
