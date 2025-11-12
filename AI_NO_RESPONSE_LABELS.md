# AI No-Response Labels

## Overview

When the AI decides NOT to respond to a customer message, the conversation list now shows a **visual badge** explaining why. This helps you understand the AI's decision-making at a glance.

## Visual Badges

### 📞 Callback Request
**When shown:** Customer is asking John to call them back

**Examples:**
- "Can you phone me when you start work?"
- "If you can call me that would be great"
- "Ring me when you're free"

**AI Behavior:**
- ✅ Stays silent (doesn't respond)
- ✅ Creates alert for staff
- ✅ Sets urgency to "medium"
- ✅ Reasoning: "Customer requesting callback from staff"

### 👤 For Staff
**When shown:** Message is directed at a physical person, not the AI

**Examples:**
- "It's for the tall gentleman with the beard"
- "Tell John I'll be there soon"
- "Give it to the guy with glasses"

**AI Behavior:**
- ✅ Stays silent
- ✅ Creates alert for staff
- ✅ Reasoning: "Message directed at physical person, not AI"

### ✓ Acknowledged
**When shown:** Customer sent a pure acknowledgment (no question)

**Examples:**
- "Thanks John"
- "Ok"
- "See you soon"
- "On my way"

**AI Behavior:**
- ✅ Stays silent (conversation naturally ending)
- ❌ No alert (not urgent)
- ✅ Reasoning: "Customer acknowledgment - no AI response needed"

## How It Works

### 1. Message Analysis
When a customer message arrives, the unified analyzer checks:
1. Is this a callback request?
2. Is this directed at a physical person?
3. Is this just an acknowledgment?
4. Is customer frustrated/angry?

### 2. Reasoning Saved
The reasoning is saved to the database:
```sql
sentiment_analysis.reasoning = "Customer requesting callback from staff"
conversations.last_analysis_reasoning = "Customer requesting callback from staff"
```

### 3. UI Badge Displayed
The conversation list shows the appropriate badge based on the reasoning:
- Contains "callback" → 📞 Callback Request
- Contains "directed at" → 👤 For Staff  
- Contains "acknowledgment" → ✓ Acknowledged

## Benefits

### Before (No Labels)
❌ "Why didn't AI respond?"
❌ "Is the AI broken?"
❌ "Did I miss something?"

### After (With Labels)
✅ "Oh, customer wants a callback - I'll call them"
✅ "Message is for me, not AI - makes sense"
✅ "Customer acknowledged, conversation ended naturally"

## Technical Details

### Database Schema
```sql
-- Migration 049: Add intent and reasoning to sentiment_analysis
ALTER TABLE sentiment_analysis 
ADD COLUMN intent TEXT,
ADD COLUMN content_type TEXT,
ADD COLUMN intent_confidence DECIMAL(3,2);

ALTER TABLE conversations 
ADD COLUMN last_analysis_reasoning TEXT;
```

### Detection Patterns
```typescript
// Callback requests
/(phone|call|ring)\s+(me|us)\s+(when|once|after)/i
/(can|could|would)\s+you\s+(phone|call|ring)\s+(me|us)/i
/if\s+you\s+(can|could)\s+(phone|call|ring)/i

// Physical person references
/for (the )?(tall|short|big|small|young|old)?\s*(guy|man|gentleman|person|bloke|lad|chap)/i
/with (the )?(beard|glasses|tattoo|hat)/i
/tell (him|her|them|john)/i

// Acknowledgments
/^(ok|okay|thanks|thank you|cheers)[\s.!]*$/i
/^(yes|yeah|yep|no|nope)[\s.!]*$/i
/^(bye|see you|speak soon)[\s.!]*$/i
```

## Files Modified

### Migration
- `supabase/migrations/049_add_intent_to_sentiment_analysis.sql`

### Backend
- `app/lib/unified-message-analyzer.ts` - Added callback detection patterns

### Frontend
- `components/conversations/conversation-list.tsx` - Added visual badges

### Testing
- `test-maurice-analysis.js` - Test callback detection

## Example: Maurice's Case

**Message:** "Good morning John. If you can phone me when you start work it would quicker and easier for me to check the login with you. Regards, Maurice."

**Analysis:**
- ✅ Matched: `/(phone|call|ring)\s+(me|us)\s+(when|once|after)/i`
- ✅ Matched: `/if\s+you\s+(can|could)\s+(phone|call|ring)/i`

**Result:**
- AI stays silent ✓
- Alert created ✓
- Urgency: medium ✓
- Reasoning: "Customer requesting callback from staff" ✓
- UI Badge: 📞 Callback Request ✓

**What You See:**
```
Maurice                    [auto] 📞 Callback Request
📱 +44...
Customer: Good morning John. If you can phone me...
```

## Future Enhancements

Potential additional badges:
- 🔧 **Complex Repair** - Needs staff expertise
- 💰 **Pricing Question** - After staff quoted
- ⏰ **After Hours** - Outside business hours
- 🤔 **Unclear Context** - Message too vague

## Deployment

1. Run migration: `supabase migration up`
2. Deploy frontend changes
3. Test with existing conversations
4. Monitor badge accuracy

## Monitoring

Check if badges are showing correctly:
```sql
SELECT 
  c.id,
  cu.name,
  c.last_analysis_reasoning,
  sa.reasoning,
  sa.intent,
  sa.content_type
FROM conversations c
JOIN customers cu ON c.customer_id = cu.id
LEFT JOIN sentiment_analysis sa ON sa.conversation_id = c.id
WHERE c.last_analysis_reasoning IS NOT NULL
ORDER BY c.updated_at DESC
LIMIT 10;
```

## Support

If badges aren't showing:
1. Check migration applied: `SELECT * FROM sentiment_analysis LIMIT 1;`
2. Check reasoning saved: `SELECT last_analysis_reasoning FROM conversations WHERE id = 'xxx';`
3. Check browser console for errors
4. Refresh conversation list
