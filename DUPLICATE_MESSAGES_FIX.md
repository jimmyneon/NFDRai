# Duplicate Messages & Black Screen Troubleshooting Fix

## Problems Fixed

### 1. **Duplicate Opening Messages**
**Issue**: AI sent two nearly identical greeting messages back-to-back
```
Message 1: "Hi! I'm AI Steve, your automated assistant..."
Message 2: "Hi! I'm AI Steve, your automated assistant..." 
```

**Root Cause**: AI wasn't checking conversation history before introducing itself again

**Fix**: 
- Updated `core_identity` module with explicit instructions to check previous messages
- Only introduce once per new conversation
- Skip introduction if already done in recent messages

### 2. **Black Screen Not Triggering Troubleshooting**
**Issue**: Customer said "Screen black" but AI didn't suggest force restart or ask about damage

**Root Cause**: Screen diagnosis flow wasn't being triggered properly for "black screen" keyword

**Fix**:
- Updated `common_scenarios` module to ALWAYS trigger force restart for black screens
- Combined troubleshooting + damage check in ONE message (faster)
- Made force restart the FIRST step for any black screen issue

### 3. **Not Asking About Visible Damage**
**Issue**: AI suggested bringing device in without asking about cracks/drops/water damage

**Root Cause**: Damage check was a separate step, often skipped

**Fix**:
- Combined damage check WITH force restart troubleshooting
- Ask both in same message: "Try this... also, any visible damage?"
- More efficient and thorough

### 4. **Vague Responses & Slow Questioning**
**Issue**: AI asked one question at a time, making diagnosis painfully slow
```
AI: "What model?"
Customer: "iPhone 14"
AI: "What's wrong?"
Customer: "Screen black"
AI: "Any damage?"
```

**Root Cause**: No guidance on asking multiple related questions together

**Fix**:
- Created new `efficient_questioning` module
- Ask 2-4 related questions in ONE message
- Examples:
  - "What type of phone, and what's happening with it?"
  - "Try force restart... also, any visible damage?"
  - "Can you see anything? Does touch work? Any cracks?"

### 5. **Message Batching Too Short**
**Issue**: Customer sent "Can you fix my ohone" then "iPhone" 1 second later, AI responded to each separately

**Root Cause**: Batch window was only 3 seconds

**Fix**:
- Increased batch window from 3 to 5 seconds
- Catches customers who type fast or send corrections
- AI waits 5 seconds, then responds to ALL messages together

## Changes Made

### Database Migration: `028_fix_duplicate_messages_and_black_screen.sql`

1. **Updated `core_identity` module**
   - Added duplicate detection logic
   - Check conversation history before introducing
   - Only introduce once per new conversation

2. **Updated `common_scenarios` module**
   - Black screen = force restart FIRST
   - Combined troubleshooting + damage check
   - Ask multiple diagnostic questions at once

3. **Created `efficient_questioning` module**
   - Guidelines for asking multiple questions together
   - Examples of good vs bad questioning
   - Balance between efficiency and not overwhelming

4. **Updated `context_awareness` module**
   - Stronger emphasis on checking previous messages
   - Don't repeat questions already answered
   - Reference previous parts of conversation

### Code Changes: `app/lib/message-batcher.ts`

- Increased `BATCH_WINDOW_MS` from 3000 to 5000 (5 seconds)
- Better catches rapid customer messages
- Prevents duplicate AI responses

## Expected Behavior After Fix

### Black Screen Flow (NEW):
```
Customer: "Screen black"

AI: "A black screen can be frustrating! Let's try a quick fix first:

Try a force restart - hold the power and volume down buttons together 
for about 10 seconds until you see the Apple logo.

While you're checking that, is there any visible damage to the screen - 
any cracks, drops, or water damage?"

[ONE message, combines troubleshooting + damage check]
```

### Vague Customer Flow (NEW):
```
Customer: "Phone broken"

AI: "I can help! What type of phone is it, and what's happening with it? 
Is it the screen, battery, or something else?"

[ONE message, gets device + issue together]
```

### No More Duplicate Greetings:
```
Message 1: "Hi! I'm AI Steve, your automated assistant. What can I help with?"
Message 2: "Great! Could you let me know the specific model?"
[No re-introduction ✓]
```

### Rapid Messages Handled:
```
Customer (15:06): "Can you fix my ohone"
Customer (15:06): "iPhone"
[AI waits 5 seconds to see if more messages coming]
AI (15:06): "I can help! What model iPhone is it, and what needs fixing?"
[ONE response to BOTH messages ✓]
```

## Deployment

```bash
# Apply database migration
npm run supabase:migration:up

# Or manually:
psql $DATABASE_URL -f supabase/migrations/028_fix_duplicate_messages_and_black_screen.sql

# Code changes are automatic (message-batcher.ts)
# Just restart the app if needed
```

## Testing Checklist

- [ ] Black screen triggers force restart + damage check in ONE message
- [ ] No duplicate AI introductions in same conversation
- [ ] Multiple rapid customer messages get ONE combined response
- [ ] Vague customers get multiple questions at once
- [ ] AI references previous messages (no repeated questions)
- [ ] Force restart is ALWAYS suggested for black screens
- [ ] Damage check is ALWAYS asked with black screen issues

## Impact

- **Faster diagnosis**: Multiple questions at once = less back-and-forth
- **Better troubleshooting**: Force restart always suggested for black screens
- **Less waste**: No duplicate messages = lower costs + better UX
- **More professional**: Feels like natural conversation, not a form
- **Higher success rate**: Proper troubleshooting before suggesting visit

## Related Files

- `/supabase/migrations/028_fix_duplicate_messages_and_black_screen.sql`
- `/app/lib/message-batcher.ts`
- `/lib/ai/smart-response-generator.ts` (uses updated prompts)
- `/app/api/messages/incoming/route.ts` (message batching logic)
