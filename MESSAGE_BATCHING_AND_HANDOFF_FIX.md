# Message Batching & Handoff Reduction Fix

## Issues Fixed

### 1. Rapid Message Problem
**Problem**: When customers send multiple short SMS messages quickly, the AI was responding individually to each one, creating a flood of responses.

**Solution**: Implemented message batching system that:
- Detects when a customer sends multiple messages within 3 seconds
- Waits for the batch window to complete
- Combines all messages into a single comprehensive context
- Generates ONE intelligent response addressing all messages together

### 2. Excessive "I'll Pass That to John" Responses
**Problem**: AI was passing too many routine queries to John unnecessarily.

**Solution**: Updated AI system prompt and response rules to:
- Make AI more confident in handling standard queries
- Clearly define WHEN to pass to John (only for: explicit owner requests, complex disputes, unusual custom work, business partnerships)
- Clearly define WHEN NOT to pass to John (standard repairs, pricing, hours, bookings, buybacks, sales, accessories, warranty)
- Provide alternative responses like "Pop in for details" or "Send me more info and I'll get back to you ASAP"

## Files Changed

### 1. `/app/lib/message-batcher.ts` (NEW)
- New utility for handling rapid message detection
- Implements 3-second batch window
- Combines messages from same customer/conversation
- Automatic cleanup of pending batches

### 2. `/app/api/messages/incoming/route.ts` (UPDATED)
- Integrated message batching into incoming webhook
- Batched messages are combined before AI processing
- More specific handoff detection patterns
- Logs when batching occurs for monitoring

### 3. `/lib/ai/response-generator.ts` (UPDATED)
- Enhanced prompt with clear handoff rules
- Emphasizes AI confidence in handling queries
- Provides specific guidance on when to escalate vs handle

### 4. `/update-system-prompt-reduce-handoffs.sql` (NEW)
- Updated system prompt for AI settings
- Comprehensive list of what AI can handle
- Clear examples of confident responses
- Reduced dependency on John for routine queries

## How It Works

### Message Batching Flow
1. Customer sends first message → Starts 3-second timer
2. Customer sends more messages within 3 seconds → Added to batch
3. Timer expires → All messages combined with newlines
4. AI generates ONE comprehensive response to all messages
5. Single response sent back to customer

### Handoff Decision Flow
```
Customer Query
    ↓
Is it explicitly asking for John/owner? → YES → Pass to John
    ↓ NO
Is it a complex dispute/complaint? → YES → Pass to John
    ↓ NO
Is it unusual custom work? → YES → Pass to John
    ↓ NO
Is it a business partnership inquiry? → YES → Pass to John
    ↓ NO
AI handles it confidently ✓
```

## Configuration

### Batch Settings (in message-batcher.ts)
```typescript
BATCH_WINDOW_MS = 3000 // Wait 3 seconds for more messages
MIN_MESSAGES_FOR_BATCH = 2 // Minimum messages to trigger batching
```

### To Apply New System Prompt
Run this SQL in Supabase:
```bash
# Apply the updated system prompt
psql -f update-system-prompt-reduce-handoffs.sql
```

Or run directly in Supabase SQL Editor:
```sql
-- Copy contents of update-system-prompt-reduce-handoffs.sql
```

## Testing

### Test Rapid Messages
1. Send 3-4 quick SMS messages to the system
2. Expected: Single comprehensive response after 3 seconds
3. Check logs for: `[Batching] Combined X rapid messages from...`

### Test Handoff Reduction
Send these queries and verify AI handles them WITHOUT passing to John:
- "How much for iPhone screen repair?" → AI quotes price
- "Do you buy phones?" → AI explains buyback process
- "What are your hours?" → AI checks real-time status
- "Got any cases?" → AI mentions accessories in stock
- "How long is warranty?" → AI says 90 days

Send these and verify AI DOES pass to John:
- "Can I speak to the owner?" → Pass to John
- "I want to complain about..." → Pass to John
- "Can you fix my custom gaming PC?" → Pass to John
- "I want to discuss wholesale partnership" → Pass to John

## Monitoring

### Check Batching Activity
Look for these log entries:
```
[Batching] Combined 3 rapid messages from +1234567890
```

### Check Handoff Patterns
Monitor the `alerts` table for:
- `type = 'manual_required'` - Should decrease for routine queries
- Check conversation status switches to 'manual'

### Verify Response Quality
- Responses should be more comprehensive when batching occurs
- Fewer "I'll pass that to John" responses for standard queries
- AI should sound more confident and helpful

## Benefits

1. **Better Customer Experience**
   - No message spam when customer sends multiple texts
   - More comprehensive, thoughtful responses
   - Faster resolution without unnecessary handoffs

2. **Reduced Manual Work**
   - Fewer routine queries passed to John
   - AI handles more independently
   - John only involved when truly needed

3. **Improved Efficiency**
   - Single response to multiple messages
   - Better use of AI capabilities
   - Clearer escalation criteria

## Rollback

If issues occur, you can:

1. **Disable Batching**: Comment out batching code in `route.ts`:
```typescript
// const batchResult = await checkMessageBatch(...)
const messageToProcess = message // Use original message
```

2. **Revert System Prompt**: Use previous version:
```sql
-- Run the previous update-system-prompt-full-services.sql
```

## Notes

- Batch window is 3 seconds - adjust if needed
- Handoff patterns can be tuned in `route.ts` lines 205-214
- System prompt can be updated via SQL or Settings page
- Monitor for first few days to ensure quality
