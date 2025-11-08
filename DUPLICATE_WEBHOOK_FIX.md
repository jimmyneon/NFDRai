# Duplicate Webhook Detection Fix

## Problem
AI was sending duplicate messages because MacroDroid was calling the webhook endpoint twice with the same message:

```
Customer: "I've got an iPhone needs fixing"
[MacroDroid calls webhook]
AI: "Hi! I'm AI Steve... What model is your iPhone?..."
[MacroDroid calls webhook AGAIN with same message]
AI: "Hi! I'm AI Steve... What model is your iPhone?..." (DUPLICATE!)
```

## Root Cause
MacroDroid was triggering the webhook multiple times for the same incoming SMS, causing the entire flow to run twice:
1. First webhook call → AI processes → Sends response
2. Second webhook call (duplicate) → AI processes AGAIN → Sends duplicate response

## Solution
Added duplicate webhook detection at the very beginning of the message processing flow.

### Implementation
**File:** `app/api/messages/incoming/route.ts`

Before inserting the customer message, check if the exact same message was already received recently:

```typescript
// CRITICAL: Check if this exact message was already received recently (within 5 seconds)
// This prevents duplicate processing if MacroDroid sends the webhook twice
const { data: recentCustomerMessages } = await supabase
  .from('messages')
  .select('created_at, text')
  .eq('conversation_id', conversation.id)
  .eq('sender', 'customer')
  .order('created_at', { ascending: false })
  .limit(1)

if (recentCustomerMessages && recentCustomerMessages.length > 0) {
  const lastMessage = recentCustomerMessages[0]
  const timeSinceLastMessage = (Date.now() - new Date(lastMessage.created_at).getTime()) / 1000
  
  // If same message text within 5 seconds, it's a duplicate webhook call
  if (lastMessage.text === message && timeSinceLastMessage < 5) {
    console.log(`[Duplicate Webhook] Same message "${message}" received ${timeSinceLastMessage.toFixed(1)}s ago - ignoring`)
    return NextResponse.json({
      success: true,
      mode: 'duplicate_ignored',
      message: 'Duplicate webhook call detected - message already processed',
    })
  }
}
```

### How It Works

1. **Customer sends message** → MacroDroid receives it
2. **First webhook call** → 
   - Check: No recent message with same text → Process normally
   - Insert customer message
   - Generate AI response
   - Send response
3. **Second webhook call (duplicate)** →
   - Check: Same message "I've got an iPhone needs fixing" received 0.5s ago
   - **STOP** - Return success but don't process
   - No duplicate AI response sent!

### Detection Logic

**Duplicate if BOTH conditions are true:**
1. Message text is **exactly the same** as last customer message
2. Time since last message is **less than 5 seconds**

**Not a duplicate if:**
- Message text is different (customer sent new message)
- More than 5 seconds have passed (legitimate follow-up)

## Examples

### Example 1: Duplicate Webhook (BLOCKED)
```
16:35:00 - Customer: "I've got an iPhone needs fixing"
16:35:00 - Webhook call #1 → Processes → AI responds
16:35:01 - Webhook call #2 (duplicate) → BLOCKED
Log: "[Duplicate Webhook] Same message 'I've got an iPhone needs fixing' received 1.0s ago - ignoring"
```

### Example 2: Legitimate Follow-up (ALLOWED)
```
16:35:00 - Customer: "I've got an iPhone needs fixing"
16:35:00 - Webhook call → Processes → AI responds
16:35:10 - Customer: "I've got an iPhone needs fixing" (sent again)
16:35:10 - Webhook call → Processes (10 seconds passed, not a duplicate)
```

### Example 3: Different Message (ALLOWED)
```
16:35:00 - Customer: "I've got an iPhone needs fixing"
16:35:00 - Webhook call → Processes → AI responds
16:35:02 - Customer: "iPhone 13"
16:35:02 - Webhook call → Processes (different message, not a duplicate)
```

## Additional Logging

Added detailed logging to track AI response generation:

```typescript
console.log(`[AI Response] Generated ${aiResult.responses.length} message(s)`)
console.log(`[AI Response] Messages:`, aiResult.responses.map((r, i) => `${i + 1}. ${r.substring(0, 50)}...`))
console.log(`[AI Response] Sending message ${i + 1}/${aiResult.responses.length}`)
```

This helps debug if the issue is:
- Duplicate webhook calls (fixed by this change)
- AI generating multiple responses in array (would show in logs)
- Message splitting logic creating duplicates (would show in logs)

## Benefits

1. **Prevents duplicate AI responses** - Even if MacroDroid calls webhook twice
2. **No wasted API calls** - Doesn't process duplicate webhooks
3. **Better customer experience** - No confusing duplicate messages
4. **Efficient** - Early return before any processing
5. **Safe** - Only blocks true duplicates, allows legitimate messages

## Testing

### Test 1: Duplicate Webhook
1. Send message via MacroDroid
2. Manually trigger webhook again with same message within 5 seconds
3. Expected: Second call returns `duplicate_ignored`, no duplicate AI response

### Test 2: Rapid Different Messages
1. Send "Hello"
2. Immediately send "iPhone 13"
3. Expected: Both messages processed (different text)

### Test 3: Same Message After Delay
1. Send "Hello"
2. Wait 10 seconds
3. Send "Hello" again
4. Expected: Both processed (more than 5 seconds apart)

## Deployment

✅ **Already pushed to GitHub!**

Changes will auto-deploy via Vercel.

## Monitoring

Watch for these logs:
- `[Duplicate Webhook] Same message "..." received X.Xs ago - ignoring` → Duplicate blocked ✅
- `[AI Response] Generated 1 message(s)` → Normal single response ✅
- `[AI Response] Generated 2 message(s)` → Multiple responses (investigate if unexpected) ⚠️

## Summary

This fix prevents duplicate AI responses by detecting and blocking duplicate webhook calls from MacroDroid. If the exact same message is received within 5 seconds, the second call is ignored, preventing duplicate processing and duplicate AI responses.

The fix is placed at the very beginning of the message processing flow, before any database inserts or AI processing, making it highly efficient and effective.
