# Sender Detection Fix

## Problem

AI messages were showing up as staff messages (blue) in the conversation dialog because the sender type wasn't being properly detected when messages were tracked from MacroDroid.

### Symptoms
- AI messages signed "many thanks, AI Steve" displayed with blue staff styling
- Staff messages signed "many thanks, John" sometimes misidentified
- Delivery status not showing correctly for all messages

## Root Cause

The `/api/messages/send` route was using `sender: sender || 'staff'` without checking the message content to determine if it was actually from AI Steve or staff John.

## Solution

Created a comprehensive sender detection system that analyzes message content to identify the actual sender.

### Detection Logic

**High Confidence AI Detection:**
- Message contains "many thanks, AI Steve"
- Message contains "best regards, AI Steve"
- Message contains other AI Steve signatures
- Message mentions "John" as third person (e.g., "I'll pass this to John")

**High Confidence Staff Detection:**
- Message contains "many thanks, John"
- Message contains "many thenks, John" (handles typo)
- Message contains other John signatures

**Medium Confidence AI Detection:**
- Message contains AI-like language ("I'm here to help", etc.)

**Low Confidence (Default):**
- No clear signature → defaults to staff (safer default)

### Edge Cases Handled

1. **Customer named John**: If AI says "Hi John, your phone is ready" and signs "AI Steve", correctly identified as AI
2. **AI mentioning John**: "I'll pass this to John" correctly identified as AI message
3. **Typos**: "Many thenks, John" correctly identified as staff
4. **No signature**: Defaults to staff (safer for manual messages)

## Files Modified

### New Files
- `/app/lib/sender-detector.ts` - Sender detection utility

### Modified Files
- `/app/api/messages/send/route.ts` - Added sender detection before saving message

## Code Changes

### sender-detector.ts
```typescript
export function getCorrectSender(
  messageText: string, 
  defaultSender: 'ai' | 'staff' | 'system' = 'staff'
): 'ai' | 'staff' | 'system' {
  const result = detectSender(messageText)
  
  // Only override if we have high confidence
  if (result.confidence === 'high') {
    return result.sender
  }
  
  // For medium confidence AI detection, return AI
  if (result.sender === 'ai' && result.confidence === 'medium') {
    return 'ai'
  }
  
  // Otherwise use the default
  return defaultSender
}
```

### send/route.ts
```typescript
// Detect the correct sender based on message content
const detectedSender = getCorrectSender(text, sender || 'staff')

console.log('[Send Message] Sender detection:', {
  providedSender: sender,
  detectedSender,
  textPreview: text.substring(0, 50)
})

// Insert message with detected sender
await supabase.from('messages').insert({
  conversation_id: actualConversationId,
  sender: detectedSender,  // ← Now uses detected sender
  text,
})
```

## Testing

### Test Script
Created `test-sender-detection.js` with 9 test cases:

```bash
node test-sender-detection.js
```

**Test Cases:**
1. ✅ AI Steve signature - standard
2. ✅ AI Steve signature - with company
3. ✅ John signature - standard
4. ✅ John signature - with typo
5. ✅ AI mentioning John as third person
6. ✅ AI saying John will call back
7. ✅ Customer named John (should not be detected as staff)
8. ✅ Message without signature
9. ✅ AI-like language

**Result:** All 9 tests pass ✅

### Manual Testing

```bash
# Test AI message tracking
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{
    "conversationId": "lookup-by-phone",
    "customerPhone": "+447700900000",
    "text": "Your phone is ready. Many thanks, AI Steve",
    "sender": "staff",
    "trackOnly": true
  }'
```

**Expected:** Message saved with `sender: 'ai'` despite `sender: 'staff'` in request

```bash
# Test staff message tracking
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{
    "conversationId": "lookup-by-phone",
    "customerPhone": "+447700900000",
    "text": "Your phone is ready. Many thanks, John",
    "sender": "staff",
    "trackOnly": true
  }'
```

**Expected:** Message saved with `sender: 'staff'`

## Visual Changes

### Before
- AI messages: Blue background (staff styling) ❌
- Staff messages: Blue background ✓
- Delivery status: Not always shown

### After
- AI messages: Primary color background (AI styling) ✅
- Staff messages: Blue background ✅
- Delivery status: Shown for all sent messages ✅

## Delivery Status

The delivery confirmation API already searches for messages from 'ai', 'system', and 'staff' senders, so once sender detection is fixed, delivery status will work correctly for all message types.

### Delivery Flow
1. Message sent via MacroDroid
2. MacroDroid calls `/api/messages/send` to track
3. Sender detected from message content
4. Message saved with correct sender type
5. MacroDroid confirms delivery via `/api/messages/delivery-confirmation`
6. Delivery status updated on message
7. UI shows ✓✓ Delivered for confirmed messages

## Backward Compatibility

- ✅ Existing messages unchanged
- ✅ Works with MacroDroid tracking
- ✅ Works with manual API calls
- ✅ Defaults to staff if uncertain (safe)

## Monitoring

Check logs for sender detection:
```
[Send Message] Sender detection: {
  providedSender: 'staff',
  detectedSender: 'ai',
  textPreview: 'Your phone is ready. Many thanks, AI Steve'
}
```

## Future Improvements

1. Add machine learning for better detection
2. Support more signature variations
3. Add confidence threshold configuration
4. Track detection accuracy metrics
5. Add admin UI to correct misidentified messages

## Related Issues

This fix resolves:
- AI messages showing as staff (blue) in dialog
- Delivery status not showing for AI messages
- Confusion about message sender in analytics
- Incorrect sender counts in dashboard
