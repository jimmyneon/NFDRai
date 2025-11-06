# Quick Test Guide - UTF-8 Encoding Fixes

## Quick Test Commands

### 1. Test Pound Sign (£)
```bash
curl -X POST http://localhost:3000/api/messages/incoming \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{"from":"+447700900000","message":"The repair costs £50","channel":"sms"}'
```

### 2. Test German Umlauts
```bash
curl -X POST http://localhost:3000/api/messages/incoming \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{"from":"+447700900001","message":"Grüße aus München","channel":"sms"}'
```

### 3. Test Multi-Paragraph Message
```bash
curl -X POST http://localhost:3000/api/messages/incoming \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{"from":"+447700900002","message":"Hi John,\n\nI have a question.\n\nThanks!","channel":"sms"}'
```

### 4. Test Emoji
```bash
curl -X POST http://localhost:3000/api/messages/incoming \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{"from":"+447700900003","message":"Your phone is ready! 📱✨","channel":"sms"}'
```

## Expected Response

All responses should include:
```
Content-Type: application/json; charset=utf-8
```

And return JSON like:
```json
{
  "success": true,
  "mode": "auto",
  "message": "AI response generated"
}
```

## Run Full Test Suite

```bash
# Make sure dev server is running
npm run dev

# In another terminal
node test-encoding.js
```

## Check Response Headers

```bash
curl -i http://localhost:3000/api/messages/incoming \
  -X POST \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{"from":"+447700900000","message":"Test","channel":"sms"}' \
  | grep -i content-type
```

Should output:
```
Content-Type: application/json; charset=utf-8
```

## Test in Browser Console

```javascript
// Test incoming message
fetch('/api/messages/incoming', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
  body: JSON.stringify({
    from: '+447700900000',
    message: 'Test £50 with German ä ö ü',
    channel: 'sms'
  })
})
.then(r => {
  console.log('Content-Type:', r.headers.get('content-type'))
  return r.json()
})
.then(data => console.log('Response:', data))
```

## Common Issues & Solutions

### Issue: Characters still display incorrectly
**Solution:** Clear browser cache and restart dev server

### Issue: 500 error on multi-line messages
**Solution:** Check that `request.text()` is used instead of `request.json()`

### Issue: Missing charset in response
**Solution:** Verify `next.config.js` headers configuration is loaded

### Issue: MacroDroid receives garbled text
**Solution:** Check `/app/lib/messaging/provider.ts` has UTF-8 charset

## Verify Database Encoding

```sql
-- Check database encoding (should be UTF8)
SHOW SERVER_ENCODING;

-- Test storing special characters
INSERT INTO messages (conversation_id, sender, text)
VALUES ('test-id', 'test', 'Test £50 ä ö ü 📱');

-- Retrieve and verify
SELECT text FROM messages WHERE sender = 'test';
```

## Production Testing

Replace `localhost:3000` with your production URL:

```bash
curl -X POST https://your-domain.com/api/messages/incoming \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{"from":"+447700900000","message":"Test £50","channel":"sms"}'
```

## Success Criteria

✅ All curl commands return 200 status
✅ Response headers include `charset=utf-8`
✅ Special characters display correctly in responses
✅ Multi-line messages don't cause errors
✅ Test script shows all tests passing
✅ Database stores and retrieves UTF-8 correctly
