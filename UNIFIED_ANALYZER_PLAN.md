# Unified Message Analyzer - Cost & Accuracy Improvement

## Problem: Multiple Separate AI Calls

### Current System (Inefficient)
```
Customer message arrives
    ↓
1. Sentiment Analysis (AI call #1) - $0.0001
   - Detects: frustrated, angry, urgency
   - Model: GPT-4o-mini, 150 tokens
    ↓
2. Context Confidence (AI call #2) - $0.0001
   - Detects: Should AI respond?
   - Model: GPT-4o-mini, 100 tokens
    ↓
3. Name Extraction (AI call #3) - $0.0001
   - Detects: Customer name if introducing
   - Model: GPT-4o-mini, 50 tokens
    ↓
Total: 3 AI calls, $0.0003, 300 tokens, ~600ms
```

**Issues:**
- ❌ 3 separate API calls (slow)
- ❌ Each AI call lacks full context from others
- ❌ Regex extraction is "very bad" (user's words)
- ❌ More expensive than needed
- ❌ Each call has separate error handling

---

## Solution: Unified AI Analyzer

### New System (Efficient)
```
Customer message arrives
    ↓
1. Quick Regex Check (free, instant)
   - VERY clear cases only:
     * Pure acknowledgments: "ok", "thanks"
     * Obvious frustration: "third time", "terrible"
     * Physical person: "for the tall guy"
     * Simple questions: "when are you open?"
   - Returns result if confidence ≥ 0.8
    ↓
2. Unified AI Analysis (ONE call) - $0.0002
   - Analyzes EVERYTHING at once:
     * Sentiment (frustrated, angry, etc.)
     * Intent (question, complaint, booking)
     * Context (should AI respond?)
     * Name extraction (if introducing)
     * Urgency level
   - Model: GPT-4o-mini, 300 tokens
   - Full conversation context
    ↓
Total: 1 AI call, $0.0002, 300 tokens, ~200ms
```

**Benefits:**
- ✅ 1 API call instead of 3 (3x faster)
- ✅ AI sees full context at once (better accuracy)
- ✅ 33% cheaper ($0.0002 vs $0.0003)
- ✅ Simpler code (one function instead of three)
- ✅ Better regex pre-filtering

---

## Cost Comparison

### Current System (3 Separate Calls)
```
Per message (if all 3 AI calls run):
- Sentiment analysis: $0.0001
- Context check: $0.0001
- Name extraction: $0.0001
Total: $0.0003

Monthly (1000 messages, 30% need AI):
- 300 messages × $0.0003 = $0.09
- 700 messages × $0 (regex) = $0
Total: $0.09/month
```

### New System (1 Unified Call)
```
Per message (if AI call runs):
- Unified analysis: $0.0002

Monthly (1000 messages, 30% need AI):
- 300 messages × $0.0002 = $0.06
- 700 messages × $0 (regex) = $0
Total: $0.06/month

SAVINGS: $0.03/month (33% cheaper)
```

### With Response Generation
```
Current total per message:
- Analysis (3 calls): $0.0003
- Response generation: $0.001
Total: $0.0013

New total per message:
- Analysis (1 call): $0.0002
- Response generation: $0.001
Total: $0.0012

SAVINGS: $0.0001 per message (8% cheaper overall)
```

---

## Accuracy Improvements

### 1. Better Context
**Before:** Each AI call sees only the message
**After:** AI sees message + recent conversation context

Example:
```
Context:
John: Your iPhone is ready, £149.99
Customer: Thanks John, how much do I owe you?

OLD SYSTEM:
- Sentiment AI: Sees only "Thanks John, how much do I owe you?"
- Context AI: Sees only "Thanks John, how much do I owe you?"
- Name AI: Sees only "Thanks John, how much do I owe you?"
Result: 3 separate analyses, no shared context

NEW SYSTEM:
- Unified AI: Sees BOTH messages
Result: Understands John already gave price, customer confused
```

### 2. Better Intent Detection
**Before:** No intent detection at all
**After:** Detects what customer wants

Intents:
- `question` - Asking for information
- `complaint` - Expressing dissatisfaction
- `booking` - Wants to book/schedule
- `status_check` - Checking on existing repair
- `greeting` - Introducing themselves
- `acknowledgment` - Simple "ok", "thanks"
- `unclear` - Can't determine

### 3. Better Name Extraction
**Before:** Regex patterns miss variations
**After:** AI understands context

Examples:
```
✅ "Hi, I'm Carol" → Carol (0.9 confidence)
✅ "This is Mike calling" → Mike (0.85 confidence)
✅ "Carol here" → Carol (0.8 confidence)
✅ "My name is Sarah" → Sarah (0.95 confidence)
❌ "Thanks John" → null (John is staff)
❌ "Tell John I'll be there" → null (not introducing)
```

### 4. Smarter Regex Pre-Filter
**Before:** Regex tried to handle everything
**After:** Regex only handles VERY clear cases

Clear cases (regex):
- Pure acknowledgments: "ok", "thanks", "got it"
- Obvious frustration: "third time", "terrible", "ai failure"
- Physical person: "for the tall guy with beard"
- Simple questions: "when are you open?"

Uncertain cases (AI):
- "Thanks John, but how much do I owe?" (acknowledgment + question)
- "I'm getting a bit frustrated" (subtle frustration)
- "Can you help?" (vague question)
- "This is Carol, is my phone ready?" (name + question)

---

## Implementation Plan

### Phase 1: Create Unified Analyzer ✅ DONE
- [x] Create `app/lib/unified-message-analyzer.ts`
- [x] Implement quick regex pre-filter
- [x] Implement unified AI analysis
- [x] Add comprehensive error handling

### Phase 2: Update Incoming Message Handler
**File:** `app/api/messages/incoming/route.ts`

**Changes:**
```typescript
// OLD (3 separate calls)
import { analyzeSentimentSmart } from '@/app/lib/sentiment-analyzer'
import { checkContextConfidence } from '@/app/lib/context-confidence-checker'
import { extractCustomerNameSmart } from '@/app/lib/ai-name-extractor'

// Line 438: Sentiment (async)
analyzeSentimentAsync(message, conversation.id, supabase)

// Line 774: Context check
const contextCheck = await checkContextConfidence(...)

// Line 872: Name extraction
const extractedName = await extractCustomerNameSmart(...)

// NEW (1 unified call)
import { analyzeMessage } from '@/app/lib/unified-message-analyzer'

// Line 438: Unified analysis (async)
const analysis = await analyzeMessage(
  message,
  recentMessages,
  aiSettings?.api_key
)

// Use analysis results:
- analysis.sentiment → Save to DB
- analysis.shouldAIRespond → Skip response if false
- analysis.customerName → Update customer name
- analysis.requiresStaffAttention → Create alert
- analysis.intent → Log for analytics
```

### Phase 3: Update Database Schema
**Add intent tracking:**
```sql
-- Add intent column to sentiment_analysis table
ALTER TABLE sentiment_analysis
ADD COLUMN intent TEXT,
ADD COLUMN intent_confidence NUMERIC(3,2);

-- Add index for intent queries
CREATE INDEX idx_sentiment_intent ON sentiment_analysis(intent);
```

### Phase 4: Testing
- [ ] Test with real messages
- [ ] Compare accuracy vs old system
- [ ] Verify cost savings
- [ ] Check response times

### Phase 5: Cleanup
- [ ] Remove old analyzer files (after verification)
- [ ] Update documentation
- [ ] Add monitoring

---

## Migration Strategy

### Step 1: Parallel Running (1 week)
- Run BOTH old and new systems
- Compare results
- Log differences
- Verify accuracy

### Step 2: Switch to New System
- Use unified analyzer
- Keep old system as fallback
- Monitor for issues

### Step 3: Remove Old System
- Delete old analyzer files
- Clean up imports
- Update tests

---

## Expected Results

### Speed
- **Before:** 3 API calls = ~600ms
- **After:** 1 API call = ~200ms
- **Improvement:** 3x faster

### Cost
- **Before:** $0.0003 per message (if all AI calls run)
- **After:** $0.0002 per message
- **Savings:** 33% cheaper

### Accuracy
- **Before:** Regex "very bad" (user's words)
- **After:** AI with full context
- **Improvement:** Much better intent detection, name extraction, context understanding

### Code Quality
- **Before:** 3 separate files, 3 imports, 3 error handlers
- **After:** 1 file, 1 import, 1 error handler
- **Improvement:** Simpler, cleaner, easier to maintain

---

## Example Outputs

### Example 1: Frustrated Customer
```
Message: "This is the third time I've asked!"

Regex Result (instant, free):
{
  sentiment: 'frustrated',
  urgency: 'high',
  requiresStaffAttention: true,
  intent: 'complaint',
  shouldAIRespond: false,
  reasoning: 'Customer is frustrated - needs staff attention',
  confidence: 0.8
}
```

### Example 2: Customer Introducing Themselves
```
Message: "Hi, I'm Carol. Is my iPhone ready?"

AI Result ($0.0002):
{
  sentiment: 'neutral',
  urgency: 'medium',
  requiresStaffAttention: false,
  intent: 'status_check',
  shouldAIRespond: true,
  customerName: 'Carol',
  nameConfidence: 0.9,
  reasoning: 'Customer introducing themselves and asking status',
  confidence: 0.85
}
```

### Example 3: Vague Message
```
Message: "Yes"

Regex Result (instant, free):
{
  sentiment: 'neutral',
  urgency: 'low',
  requiresStaffAttention: false,
  intent: 'acknowledgment',
  shouldAIRespond: false,
  reasoning: 'Pure acknowledgment - no response needed',
  confidence: 0.9
}
```

### Example 4: Complex Question
```
Message: "Thanks John, but how much do I owe you?"

AI Result ($0.0002):
{
  sentiment: 'neutral',
  urgency: 'medium',
  requiresStaffAttention: true,
  intent: 'question',
  shouldAIRespond: false,
  reasoning: 'Pricing question after staff reply - John should answer',
  confidence: 0.8
}
```

---

## Next Steps

1. **Review unified analyzer code** ✅ DONE
2. **Test with sample messages** (need to do)
3. **Update incoming message handler** (need to do)
4. **Deploy and monitor** (need to do)

Want me to proceed with updating the incoming message handler?
