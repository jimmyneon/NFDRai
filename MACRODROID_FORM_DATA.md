# 🔧 MacroDroid - Use Form Data (Not JSON)

## The Problem
JSON with line breaks is causing parse errors. The solution is to use **form-encoded data** instead of JSON.

---

## ✅ Solution: Use Form Data

### **1. Delivery Confirmation**

**URL:** `https://nfd-rai.vercel.app/api/messages/delivery-confirmation`  
**Method:** POST  
**Content Type:** `application/x-www-form-urlencoded`  
**Body:**
```
phone={lv=customer_phone}&message={lv=message_text}&status=delivered&timestamp={time}
```

---

### **2. Track Sent SMS**

**URL:** `https://nfd-rai.vercel.app/api/messages/send`  
**Method:** POST  
**Content Type:** `application/x-www-form-urlencoded`  
**Body:**
```
conversationId=lookup-by-phone&customerPhone={sms_number}&text={sms_body}&sender=staff&trackOnly=true
```

---

## 📱 MacroDroid Setup

### **Step 1: Open HTTP Request Action**

### **Step 2: Change Content Type**
- Find "Content Type" dropdown
- Change from `application/json` to `application/x-www-form-urlencoded`

### **Step 3: Update Body Format**
Instead of JSON format:
```json
{
  "phone": "{lv=customer_phone}"
}
```

Use URL-encoded format:
```
phone={lv=customer_phone}&message={lv=message_text}
```

---

## 🎯 Why This Works

**Form-encoded data automatically handles:**
- ✅ Line breaks
- ✅ Special characters
- ✅ Quotes
- ✅ All control characters

**No escaping needed!** MacroDroid handles it automatically.

---

## 📋 Complete Configurations

### **Delivery Confirmation (Full Setup)**

1. **Action:** HTTP Request
2. **Method:** POST
3. **URL:** `https://nfd-rai.vercel.app/api/messages/delivery-confirmation`
4. **Content Type:** `application/x-www-form-urlencoded`
5. **Body:**
```
phone={lv=customer_phone}&message={lv=message_text}&status=delivered&timestamp={time}
```

---

### **Track Sent SMS (Full Setup)**

1. **Action:** HTTP Request
2. **Method:** POST
3. **URL:** `https://nfd-rai.vercel.app/api/messages/send`
4. **Content Type:** `application/x-www-form-urlencoded`
5. **Body:**
```
conversationId=lookup-by-phone&customerPhone={sms_number}&text={sms_body}&sender=staff&trackOnly=true
```

---

## 🧪 Test It

After changing to form data, test by:
1. Sending a message with line breaks
2. Check Vercel logs - should see "Parsed form data"
3. No more 400 errors! ✅

---

## 💡 Key Points

- **Don't use JSON** - it can't handle line breaks from MacroDroid
- **Use form-encoded** - handles everything automatically
- **Change Content-Type** - this is the most important step
- **Use & to separate** - each field separated by `&`
- **Use = for values** - `field=value` format

**This will fix all the JSON parsing errors!** 🚀
