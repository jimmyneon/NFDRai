# Sentiment Analysis - Detect Frustrated Customers

## Overview

Automatically detects frustrated, angry, or urgent customers using AI and regex pattern matching. Alerts you immediately when someone needs attention.

## What It Does

Analyzes every customer message for:
- **Sentiment**: positive, neutral, negative, frustrated, angry
- **Urgency**: low, medium, high, critical
- **Staff Attention**: Flags messages needing immediate response

## How It Works

### Two-Tier Strategy (Like Name Extraction)

**Tier 1: Regex (Fast, Free)**
- Detects common frustration/anger keywords
- Checks for multiple question marks/exclamation marks
- Detects ALL CAPS messages
- Confidence: 0.6-0.8

**Tier 2: AI (Accurate, Cheap)**
- Uses GPT-4o-mini for subtle cases
- Understands context and tone
- Handles sarcasm
- Cost: ~$0.0001 per analysis

### Decision Flow

```
Message: "This is the third time I've asked!"
    ↓
1. Regex checks keywords
   Found: "third time" → frustrated (0.7 confidence)
    ↓
2. Confidence >= 0.7? YES
   Use regex result (no AI call)
    ↓
3. Save to database
    ↓
4. Update conversation: requires_urgent_attention = true
    ↓
5. Send alert to staff
    ↓
6. Show red badge in UI
```

## Examples

### ✅ Positive (No Alert)
```
"Thanks so much! You've been really helpful"
→ Sentiment: positive
→ Urgency: low
→ Alert: No
```

### ✅ Neutral (No Alert)
```
"Hi, when will my phone be ready?"
→ Sentiment: neutral
→ Urgency: low
→ Alert: No
```

### 🚨 Frustrated (Alert!)
```
"This is the third time I've asked! Where is my phone?!"
→ Sentiment: frustrated
→ Urgency: medium
→ Alert: YES
→ Badge: 🔶 Frustrated
```

### 🚨 Angry (Urgent Alert!)
```
"Your service is terrible. I want my money back NOW!"
→ Sentiment: angry
→ Urgency: critical
→ Alert: YES (urgent)
→ Badge: 🔴 Angry
```

### 🚨 Urgent (Alert!)
```
"I need this urgently, can you help asap?"
→ Sentiment: neutral
→ Urgency: high
→ Alert: YES
→ Badge: 🔶 Frustrated
```

## Keywords Detected

### Frustration
- "third time", "second time", "again"
- "still waiting", "still no"
- "ridiculous", "unacceptable"
- "disappointed", "frustrated"

### Anger
- "terrible", "worst", "disgusting"
- "appalling", "pathetic"
- "never again", "money back"
- "refund", "complaint", "report"

### Urgency
- "urgent", "asap", "immediately"
- "now", "emergency", "critical"

### Positive
- "thanks", "thank you", "great"
- "excellent", "perfect", "brilliant"
- "helpful", "appreciate"

## UI Indicators

### Conversation List
Conversations with frustrated/angry customers show red badges:

```
┌─────────────────────────────────────┐
│ Carol Smith                         │
│ [auto] [🔴 Angry]                   │
│ Customer: This is terrible!         │
│ 2 mins ago                          │
└─────────────────────────────────────┘
```

### Badge Types
- 🔴 **Angry** - Customer is very upset (critical urgency)
- 🔶 **Frustrated** - Customer is impatient (high/medium urgency)

## Database Schema

### sentiment_analysis Table
```sql
CREATE TABLE sentiment_analysis (
  id UUID PRIMARY KEY,
  message_id UUID REFERENCES messages(id),
  conversation_id UUID REFERENCES conversations(id),
  
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'frustrated', 'angry')),
  urgency TEXT CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  confidence DECIMAL(3,2),
  reasoning TEXT,
  keywords TEXT[],
  requires_staff_attention BOOLEAN,
  
  analysis_method TEXT CHECK (analysis_method IN ('ai', 'regex', 'ai_verified')),
  analyzed_at TIMESTAMP
);
```

### conversations Table (Updated)
```sql
ALTER TABLE conversations ADD COLUMN
  last_sentiment TEXT,
  last_urgency TEXT,
  requires_urgent_attention BOOLEAN;
```

## Alerts

When a frustrated/angry customer is detected:

1. **Database Alert Created**
   ```sql
   INSERT INTO alerts (
     conversation_id,
     type,  -- 'urgent' for angry, 'manual_required' for frustrated
     notified_to,
     message
   )
   ```

2. **UI Badge Shows**
   - Red "Angry" or "Frustrated" badge
   - Conversation highlighted

3. **You Get Notified**
   - Alert appears in alerts table
   - Can be used for push notifications (future)

## Testing

All 12 test cases pass:

```bash
node test-sentiment-analysis.js
```

**Results:**
- ✅ 2 positive messages → No alert
- ✅ 2 neutral messages → No alert
- ✅ 3 frustrated messages → Alert
- ✅ 3 angry messages → Urgent alert
- ✅ 2 urgent messages → Alert

## Cost Analysis

### Regex-First Strategy

**Typical Distribution:**
- 70% of messages: Neutral/positive → Regex only (free)
- 20% of messages: High confidence frustration → Regex only (free)
- 10% of messages: Uncertain → AI verifies ($0.0001 each)

**Monthly Cost (100 messages/day):**
- 90 regex-only analyses: $0
- 10 AI analyses: $0.003
- **Total: ~$0.09/month**

Compare to AI-first: $0.30/month (70% savings!)

## Configuration

No configuration needed - works automatically!

Sentiment analysis runs on every customer message in the background.

## Monitoring

Check logs for sentiment detection:

```
[Sentiment Analysis] Analyzing message...
[Sentiment] ✅ Regex detected: frustrated (0.7)
[Sentiment Analysis] Result: {
  sentiment: 'frustrated',
  urgency: 'medium',
  confidence: 0.7,
  requiresAttention: true
}
[Sentiment Analysis] ✅ Saved successfully
[Sentiment Analysis] 🚨 Urgent attention required - sending alert
```

## Benefits

1. **Catch Problems Early** - Detect frustration before it escalates
2. **Prioritize Responses** - See which customers need immediate attention
3. **Better Customer Service** - Respond to upset customers faster
4. **Prevent Churn** - Save customers before they leave
5. **Low Cost** - ~$0.09/month for 100 messages/day

## Integration

### Automatic
- Runs on every incoming customer message
- Non-blocking (doesn't slow down responses)
- Updates conversation in real-time
- Shows in UI immediately

### Manual Queries

**Find all frustrated customers:**
```sql
SELECT * FROM urgent_conversations
WHERE last_sentiment IN ('frustrated', 'angry')
ORDER BY updated_at DESC;
```

**Get sentiment history for conversation:**
```sql
SELECT 
  sentiment,
  urgency,
  reasoning,
  keywords,
  analyzed_at
FROM sentiment_analysis
WHERE conversation_id = 'YOUR_CONVERSATION_ID'
ORDER BY analyzed_at DESC;
```

## Future Enhancements

Potential improvements:
- Push notifications for angry customers
- Sentiment trends over time
- Customer satisfaction scoring
- Automatic escalation rules
- Sentiment-based auto-responses

## Files

**Created:**
- `app/lib/sentiment-analyzer.ts` - Sentiment analysis utility
- `supabase/migrations/039_sentiment_analysis.sql` - Database schema
- `test-sentiment-analysis.js` - 12 test cases

**Modified:**
- `app/api/messages/incoming/route.ts` - Integrated sentiment analysis
- `components/conversations/conversation-list.tsx` - Added UI badges

## Summary

Sentiment analysis automatically detects frustrated and angry customers, alerts you immediately, and shows clear indicators in the UI. Uses regex-first strategy for 70% cost savings while maintaining accuracy. All 12 tests pass. Cost: ~$0.09/month for 100 messages/day.
