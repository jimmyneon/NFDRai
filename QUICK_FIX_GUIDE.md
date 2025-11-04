# ⚡ Quick Fix Guide - 5 Minutes to Fix Message Routing

**Problem**: Messages going to wrong numbers or old messages being sent  
**Solution**: 5 simple steps  
**Time**: 5 minutes

---

## 🚀 Step 1: Update MacroDroid Macro 1 (2 min)

1. Open **MacroDroid**
2. Find **"SMS to AI Dashboard"** macro
3. Tap to edit
4. **DELETE** the "Send SMS" action (if it exists)
5. Keep only the "HTTP Request" action
6. Save

**Result**: Macro now only notifies dashboard, doesn't send SMS

---

## 🚀 Step 2: Create MacroDroid Macro 2 (2 min)

1. In MacroDroid, tap **"+"**
2. Name: **"Dashboard to SMS"**
3. **Trigger**: MacroDroid Specific → Webhook (URL)
4. **Copy the webhook URL** that appears
5. **Action**: Phone → Send SMS
   - Recipient: `{webhook_phone}`
   - Message: `{webhook_message}`
6. Save and enable

**Result**: Dashboard can now send SMS with exact phone numbers

---

## 🚀 Step 3: Update Dashboard Config (1 min)

1. Open `.env.local` file
2. Add this line:
```env
MACRODROID_WEBHOOK_URL=https://trigger.macrodroid.com/YOUR_ID/send-sms
```
3. Replace `YOUR_ID` with the webhook URL from Step 2
4. Save

**Result**: Dashboard knows how to reach MacroDroid

---

## 🚀 Step 4: Restart Dashboard (30 sec)

```bash
# Stop dashboard (Ctrl+C)
# Restart:
npm run dev
```

**Result**: Environment variable loaded

---

## 🚀 Step 5: Test (30 sec)

1. Send SMS to your phone: "Test"
2. Wait for response
3. Send another SMS: "Test 2"
4. Verify responses go to correct number

**Result**: ✅ Fixed!

---

## ✅ That's It!

Your message routing is now fixed:
- ✅ Correct phone numbers
- ✅ No stale messages
- ✅ Works with multiple customers

---

## 🆘 Still Not Working?

### Check:
1. Macro 1 has NO "Send SMS" action
2. Macro 2 is enabled
3. Webhook URL in .env.local is correct
4. Dashboard was restarted

### Test webhook directly:
```bash
curl -X POST "https://trigger.macrodroid.com/YOUR_ID/send-sms" \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1234567890","message":"test"}'
```

Should receive SMS immediately!

---

## 📚 More Info

- **Full Setup**: See `MACRODROID_UPDATED_SETUP.md`
- **Troubleshooting**: See `MACRODROID_TROUBLESHOOTING.md`
- **Summary**: See `SUMMARY_OF_CHANGES.md`

---

**Last Updated**: November 4, 2025  
**Time Required**: 5 minutes  
**Difficulty**: Easy 🚀
