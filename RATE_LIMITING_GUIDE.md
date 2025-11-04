# 🛡️ Rate Limiting & Spam Prevention

## Problem Solved

**Issue**: Missed call API getting called twice, sending duplicate SMS  
**Solution**: Server-side rate limiting + MacroDroid debouncing

---

## ✅ Server-Side Rate Limiting (Already Implemented)

### Missed Call Responses:
- **Limit**: 1 response per 2 minutes per phone number
- **Why**: Prevents duplicate SMS if macro triggers multiple times
- **Result**: Even if MacroDroid calls API twice, only first one sends SMS

### Incoming Messages:
- **Limit**: 10 messages per minute per phone number
- **Why**: Prevents spam attacks
- **Result**: Legitimate customers can text normally, spammers get blocked

---

## 🔧 How It Works

### Rate Limiter:
```typescript
// Tracks requests by phone number + endpoint
checkRateLimit(phoneNumber, 'missed-call', {
  windowMs: 2 * 60 * 1000,  // 2 minute window
  maxRequests: 1             // Max 1 request
})
```

### When Rate Limited:
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "retryAfter": 120  // seconds
}
```

**No SMS sent** - API returns 429 status

---

## 📱 MacroDroid Debouncing (Recommended)

### Add Constraint to Missed Call Macro:

**Option 1: Time-Based Constraint**
1. Edit "Missed Call AI Response" macro
2. Tap "Add Constraint"
3. Select "Time/Date" → "Time Since Last Run"
4. Set to **2 minutes**
5. Save

**Result**: Macro won't run again for 2 minutes after last execution

---

**Option 2: Variable-Based Debounce**
1. Create global variable: `last_missed_call_time`
2. Add condition at start of macro:
   ```
   IF {lv=last_missed_call_time} < 120 seconds ago
     THEN Exit macro
   ```
3. At end of macro, update variable:
   ```
   Set variable last_missed_call_time = {current_time}
   ```

---

## 🎯 Recommended Setup

### Macro 4: Missed Call (Updated)
```
Trigger: Missed Call (Any)

Constraint: Time Since Last Run > 2 minutes  ← ADD THIS

Action 1: Wait 5-10 seconds
Action 2: HTTP POST to /api/messages/missed-call
```

**Why wait 5-10 seconds?**
- Gives caller time to leave voicemail
- Prevents immediate response if they're calling back

**Why 2 minute constraint?**
- Prevents duplicate calls if phone glitches
- Matches server-side rate limit
- Still responsive for legitimate missed calls

---

## 📊 Rate Limit Summary

| Endpoint | Limit | Window | Why |
|----------|-------|--------|-----|
| Missed Call | 1 request | 2 minutes | Prevent duplicate SMS |
| Incoming SMS | 10 requests | 1 minute | Prevent spam |
| Send SMS | No limit | - | Staff-initiated |

---

## 🧪 Testing

### Test Rate Limiting:

**Test 1: Missed Call (Should be rate limited)**
```bash
# First call - should work
curl -X POST "https://nfd-rai.vercel.app/api/messages/missed-call" \
  -H "Content-Type: application/json" \
  -d '{"from": "07410381247", "channel": "sms"}'

# Immediate second call - should be blocked
curl -X POST "https://nfd-rai.vercel.app/api/messages/missed-call" \
  -H "Content-Type: application/json" \
  -d '{"from": "07410381247", "channel": "sms"}'

# Response: 429 Rate limit exceeded
```

**Test 2: After 2 Minutes (Should work again)**
```bash
# Wait 2 minutes, then try again
curl -X POST "https://nfd-rai.vercel.app/api/messages/missed-call" \
  -H "Content-Type: application/json" \
  -d '{"from": "07410381247", "channel": "sms"}'

# Should work ✅
```

---

## 🔍 Monitoring

### Check API Logs:
```
[Missed Call] Rate limited: 07410381247 (retry after 120s)
```

### Check MacroDroid Logs:
- If constraint blocks: Shows "Skipped" (yellow)
- If runs: Shows "Success" (green)

---

## 💡 Pro Tips

### Adjust Rate Limits:

**More Strict (1 per 5 minutes):**
```typescript
windowMs: 5 * 60 * 1000,
maxRequests: 1
```

**More Lenient (2 per 2 minutes):**
```typescript
windowMs: 2 * 60 * 1000,
maxRequests: 2
```

### Different Limits by Customer:

Could add VIP customers with higher limits:
```typescript
const isVIP = await checkVIPStatus(phoneNumber)
const maxRequests = isVIP ? 5 : 1
```

---

## 🚨 What Happens When Rate Limited?

### Customer Experience:
- **First missed call**: Gets AI response ✅
- **Second missed call (within 2 min)**: No SMS sent
- **After 2 minutes**: Gets AI response again ✅

### Your Experience:
- See in API logs: "Rate limited"
- No duplicate SMS sent
- No extra costs
- Professional appearance

---

## 🎉 Benefits

### Prevents:
- ✅ Duplicate SMS from macro glitches
- ✅ Spam attacks
- ✅ Accidental loops
- ✅ SMS costs from duplicates
- ✅ Customer annoyance

### Allows:
- ✅ Legitimate missed calls
- ✅ Normal conversation flow
- ✅ Multiple customers simultaneously
- ✅ Staff manual sends (no limit)

---

## 🔧 Configuration

Rate limits are in the code:
- `/app/api/messages/missed-call/route.ts` - Line 30
- `/app/api/messages/incoming/route.ts` - Line 31

To change, edit the `windowMs` and `maxRequests` values.

---

## ✅ Verification Checklist

- [ ] Server-side rate limiting deployed
- [ ] MacroDroid constraint added (2 minutes)
- [ ] Tested: First call works
- [ ] Tested: Second call blocked
- [ ] Tested: Works again after 2 minutes
- [ ] API logs show rate limiting
- [ ] No duplicate SMS received

---

**Last Updated**: November 4, 2025  
**Status**: Implemented and ready  
**Priority**: HIGH - Prevents spam and duplicates 🛡️
