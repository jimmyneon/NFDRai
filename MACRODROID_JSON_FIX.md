# 🔧 MacroDroid JSON Formatting Fix

## The Problem
MacroDroid variables like `{sms_body}` and `{lv=message_text}` contain line breaks (`\n`) which break JSON parsing.

**Error in logs:**
```
Bad control character in string literal in JSON at position 221
```

---

## ✅ Solution: Use URL Encoding

MacroDroid has a function to encode text for JSON/URLs.

### **Option 1: Use [encode_url] Function**

Instead of:
```json
{
  "text": "{sms_body}"
}
```

Use:
```json
{
  "text": "[encode_url]{sms_body}[/encode_url]"
}
```

---

## 📱 Updated MacroDroid Configurations

### **1. Delivery Confirmation** (Fixed)

**URL:** `https://nfd-rai.vercel.app/api/messages/delivery-confirmation`  
**Method:** POST  
**Content Type:** application/json  
**Body:**
```json
{
  "phone": "{lv=customer_phone}",
  "message": "[encode_url]{lv=message_text}[/encode_url]",
  "status": "delivered",
  "timestamp": "{time}"
}
```

---

### **2. Track Sent SMS** (Fixed)

**URL:** `https://nfd-rai.vercel.app/api/messages/send`  
**Method:** POST  
**Content Type:** application/json  
**Body:**
```json
{
  "conversationId": "lookup-by-phone",
  "customerPhone": "{sms_number}",
  "text": "[encode_url]{sms_body}[/encode_url]",
  "sender": "staff",
  "trackOnly": true
}
```

---

## 🔄 Alternative: Use Form Data Instead of JSON

If encoding doesn't work, you can use form data:

**Content Type:** `application/x-www-form-urlencoded`  
**Body:**
```
phone={lv=customer_phone}&message={lv=message_text}&status=delivered&timestamp={time}
```

But the API would need to be updated to accept form data.

---

## 🧪 Test Without Line Breaks

To test if this fixes it, try sending a simple message without line breaks:

**Test Body:**
```json
{
  "phone": "07410381247",
  "message": "Test message without line breaks",
  "status": "delivered",
  "timestamp": "2024-11-04 20:00:00"
}
```

If this works, the issue is definitely the line breaks in `{lv=message_text}`.

---

## 💡 Why This Happens

SMS messages often contain:
- Line breaks (`\n`)
- Quotes (`"`)
- Special characters

These need to be escaped in JSON:
- `\n` → `\\n`
- `"` → `\"`
- `\` → `\\`

MacroDroid's `[encode_url]` function handles this automatically.

---

## ✅ Quick Fix Steps

1. Open MacroDroid
2. Find "Outgoing SMS (Webhook)" macro
3. Edit the HTTP Request body
4. Wrap message variables with `[encode_url]...[/encode_url]`
5. Save and test

**This should fix the 500 errors!** 🚀
