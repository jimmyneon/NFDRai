# AI Analysis Badges in Conversation Dialog

## Overview

Every customer message now shows visual badges indicating:
1. **Was it analyzed by AI?** (🤖 AI Analyzed)
2. **Why didn't AI respond?** (📞 Callback, 👤 For Staff, ✓ Ack, ⏸️ No Response)

## Visual Indicators

### For Customer Messages

**🤖 AI Analyzed Badge**
- Shows on ALL customer messages that were analyzed
- Confirms the unified analyzer processed the message
- Indicates AI looked at sentiment, intent, context, and name

**Reason Badges** (when AI didn't respond):
- **📞 Callback** - Customer requesting phone call
- **👤 For Staff** - Message directed at physical person
- **✓ Ack** - Pure acknowledgment (no response needed)
- **⏸️ No Response** - Other reasons (context unclear, etc.)

## Examples

### Message With Analysis
```
Customer: "Good morning John. If you can phone me when you start work..."
🕐 2 hours ago • 🤖 AI Analyzed • 📞 Callback
```

### Message With Response
```
Customer: "When are you open?"
🕐 1 hour ago • 🤖 AI Analyzed
[AI responded with hours]
```

### Acknowledgment
```
Customer: "Thanks John"
🕐 30 mins ago • 🤖 AI Analyzed • ✓ Ack
```

### Directed at Staff
```
Customer: "It's for the tall gentleman with the beard"
🕐 15 mins ago • 🤖 AI Analyzed • 👤 For Staff
```

## Database Schema

### New Column: `should_ai_respond`
```sql
ALTER TABLE sentiment_analysis 
ADD COLUMN should_ai_respond BOOLEAN DEFAULT true;
```

This tracks whether the AI decided to respond or stay silent.

### Data Saved
For each customer message:
```json
{
  "sentiment": "neutral",
  "intent": "unclear",
  "reasoning": "Customer requesting callback from staff",
  "should_ai_respond": false,
  "requires_staff_attention": true,
  "analysis_method": "regex"
}
```

## How It Works

### 1. Message Arrives
Customer sends: "Good morning John. If you can phone me when you start work..."

### 2. Unified Analyzer Runs
Single AI call analyzes:
- Sentiment: neutral
- Intent: unclear
- Context: Callback request detected
- Name: "Maurice" (from signature)
- **Decision: should_ai_respond = false**

### 3. Data Saved
```sql
INSERT INTO sentiment_analysis (
  message_id,
  sentiment,
  intent,
  reasoning,
  should_ai_respond,
  ...
) VALUES (
  'msg-123',
  'neutral',
  'unclear',
  'Customer requesting callback from staff',
  false,
  ...
);
```

### 4. UI Shows Badges
```
Maurice: "Good morning John. If you can phone me..."
🕐 2 hours ago • 🤖 AI Analyzed • 📞 Callback
```

## Benefits

### For You (Staff)
✅ **Instant visibility** - See which messages were analyzed
✅ **Understand decisions** - Know why AI didn't respond
✅ **Confidence** - Trust AI is working correctly
✅ **Debugging** - Spot issues quickly

### For System
✅ **Transparency** - Clear AI decision-making
✅ **Accountability** - Track all analysis
✅ **Debugging** - Easy to see what went wrong
✅ **Metrics** - Measure analysis coverage

## Badge Logic

```typescript
// Show "AI Analyzed" if analysis exists
{message.sentiment_analysis && message.sentiment_analysis.length > 0 && (
  <Badge>🤖 AI Analyzed</Badge>
)}

// Show reason if AI didn't respond
{!message.sentiment_analysis[0].should_ai_respond && (
  <Badge>
    {reasoning.includes('callback') ? '📞 Callback' :
     reasoning.includes('directed at') ? '👤 For Staff' :
     reasoning.includes('acknowledgment') ? '✓ Ack' :
     '⏸️ No Response'}
  </Badge>
)}
```

## Query Changes

### Before
```typescript
messages(id, text, sender, created_at)
```

### After
```typescript
messages(
  id, text, sender, created_at,
  ai_provider, ai_confidence,
  delivered, delivered_at,
  sentiment_analysis(
    sentiment,
    intent,
    reasoning,
    requires_staff_attention,
    should_ai_respond,  // NEW!
    analysis_method
  )
)
```

## Migration Required

Run `apply-reasoning-labels.sql` to add:
1. `sentiment_analysis.should_ai_respond` column
2. `sentiment_analysis.intent` column
3. `sentiment_analysis.content_type` column
4. `conversations.last_analysis_reasoning` column

## Testing

### Check Analysis Coverage
```sql
-- See which messages have analysis
SELECT 
  m.text,
  m.sender,
  sa.should_ai_respond,
  sa.reasoning,
  m.created_at
FROM messages m
LEFT JOIN sentiment_analysis sa ON sa.message_id = m.id
WHERE m.sender = 'customer'
ORDER BY m.created_at DESC
LIMIT 20;
```

### Check Badge Display
1. Open any conversation
2. Look at customer messages
3. Should see "🤖 AI Analyzed" badge
4. If AI didn't respond, should see reason badge

## Future Enhancements

### Potential Additions
- **Hover tooltip** - Show full reasoning on hover
- **Sentiment badge** - Show 😊/😐/😢 for sentiment
- **Intent badge** - Show question/complaint/booking
- **Confidence score** - Show analysis confidence %

### Already Implemented
✅ AI Analyzed badge  
✅ Reason badges (callback, for staff, ack)  
✅ Database tracking  
✅ Real-time display

## Files Modified

### Frontend
- `components/conversations/conversation-dialog.tsx` - Added badges
- `app/dashboard/conversations/page.tsx` - Updated query

### Backend
- `app/api/messages/incoming/route.ts` - Save should_ai_respond
- `app/lib/unified-message-analyzer.ts` - Enhanced signature detection

### Database
- `supabase/migrations/049_add_intent_to_sentiment_analysis.sql` - Added columns

### Documentation
- `AI_ANALYSIS_BADGES.md` - This file
- `apply-reasoning-labels.sql` - Migration script

## Summary

**Before:**
- ❌ No visibility into AI analysis
- ❌ Don't know why AI didn't respond
- ❌ Hard to debug issues

**After:**
- ✅ Every message shows "🤖 AI Analyzed"
- ✅ Reason badges explain decisions
- ✅ Easy to spot issues
- ✅ Full transparency

Maurice's message will now show:
```
Maurice: "Good morning John. If you can phone me..."
🕐 2 hours ago • 🤖 AI Analyzed • 📞 Callback
```

You'll instantly see it was analyzed and why AI stayed silent!
