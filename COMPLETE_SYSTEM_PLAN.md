# Complete System Architecture Plan

## Overview: What the Unified Analyzer Does

The unified analyzer is **ONE comprehensive analysis** that feeds into **ALL decision points** in the system.

---

## 1. Message Flow & Decision Points

### Current Flow (What Happens Now)
```
Message arrives → Check if blocked → Check mode → Check staff activity → 
Check context → Generate response → Extract name → Analyze sentiment
```

### Proposed Flow (With Unified Analyzer)
```
Message arrives
    ↓
┌─────────────────────────────────────────────────────┐
│ UNIFIED ANALYZER (One AI call or regex)            │
│                                                     │
│ Analyzes:                                           │
│ 1. Sentiment (frustrated, angry, etc.)              │
│ 2. Intent (question, complaint, booking, etc.)      │
│ 3. Context (is this for AI or for John?)           │
│ 4. Customer name (if introducing)                   │
│ 5. Urgency level                                    │
│ 6. Content type (for prompt modules) ← NEW!        │
│                                                     │
│ Returns comprehensive analysis object               │
└─────────────────────────────────────────────────────┘
    ↓
Use analysis results for ALL decisions:
    ↓
1. Should AI respond? (analysis.shouldAIRespond)
2. Which mode? (analysis.intent + analysis.requiresStaffAttention)
3. Which prompt modules? (analysis.intent + analysis.contentType)
4. Update customer name? (analysis.customerName)
5. Create alert? (analysis.requiresStaffAttention)
6. Save sentiment? (analysis.sentiment)
```

---

## 2. Your Questions Answered

### Q1: "Will message analyzer check for content so we can call the correct prompt modules from the database?"

**YES! ✅** This is exactly what `intent` and new `contentType` field will do.

**How it works:**
```typescript
// Unified analyzer detects intent + content type
const analysis = await analyzeMessage(message, context, apiKey)

// Map intent to prompt modules
const modulesToLoad = getModulesForIntent(analysis.intent, analysis.contentType)

// Examples:
analysis.intent = 'question'
analysis.contentType = 'pricing'
→ Load modules: ['pricing_guide', 'device_pricing', 'common_repairs']

analysis.intent = 'status_check'
analysis.contentType = 'repair_status'
→ Load modules: ['repair_status', 'collection_info', 'time_aware_responses']

analysis.intent = 'booking'
analysis.contentType = 'appointment'
→ Load modules: ['booking_system', 'business_hours', 'time_aware_responses']

analysis.intent = 'complaint'
analysis.contentType = 'dissatisfaction'
→ Load modules: ['complaint_handling', 'escalation_protocol']
→ Switch to manual mode immediately
```

**Content types we'll detect:**
- `pricing` - "How much for iPhone screen?"
- `repair_status` - "Is my phone ready?"
- `booking` - "Can I book in tomorrow?"
- `business_hours` - "When are you open?"
- `location` - "Where are you located?"
- `device_issue` - "My screen is cracked"
- `buyback` - "Do you buy old phones?"
- `general_inquiry` - "Do you fix laptops?"
- `complaint` - "This is taking too long"
- `greeting` - "Hi, I'm Carol"

**This replaces the current system** where we load modules based on keywords in the message.

---

### Q2: "Will it check if it's a clear message for John that doesn't need answering (context)?"

**YES! ✅** This is the `shouldAIRespond` field.

**Examples:**

```typescript
// Message: "Thanks John, see you tomorrow"
analysis = {
  intent: 'acknowledgment',
  shouldAIRespond: false, ← AI stays silent
  isDirectedAtAI: false,
  reasoning: 'Customer acknowledging staff message, no response needed'
}
→ AI does NOT respond
→ No alert created (not urgent)
```

```typescript
// Message: "It's for the tall guy with the beard"
analysis = {
  intent: 'unclear',
  shouldAIRespond: false, ← AI stays silent
  isDirectedAtAI: false,
  reasoning: 'Message directed at physical person, not AI'
}
→ AI does NOT respond
→ Alert created (needs manual attention)
```

```typescript
// Message: "Thanks John, but how much do I owe you?"
// Context: John just said "Your iPhone is ready, £149.99"
analysis = {
  intent: 'question',
  contentType: 'pricing',
  shouldAIRespond: false, ← AI stays silent
  isDirectedAtAI: true,
  reasoning: 'Pricing question after staff reply - John already gave price, customer confused'
}
→ AI does NOT respond
→ Alert created (customer confused, needs clarification)
```

**This replaces** the current `checkContextConfidence()` function.

---

### Q3: "Will it help deal with the auto AI or manual mode?"

**YES! ✅** This is the key improvement.

**Current system:**
```typescript
// Uses regex patterns in conversation-mode-analyzer.ts
if (message.includes('ai failure')) → manual mode
if (message.includes('?')) → auto mode
```

**New system:**
```typescript
// Uses unified analysis
const analysis = await analyzeMessage(message, context, apiKey)

// Decision logic:
if (analysis.requiresStaffAttention) {
  // Switch to manual mode
  mode = 'manual'
  createAlert(analysis.reasoning)
}
else if (analysis.shouldAIRespond) {
  // Can stay in auto mode
  mode = 'auto'
  generateResponse(analysis.intent, analysis.contentType)
}
else {
  // Stay in current mode, no response
  // (e.g., acknowledgment, message for John)
}
```

**Triggers for manual mode:**
- `analysis.sentiment = 'frustrated'` or `'angry'`
- `analysis.urgency = 'critical'`
- `analysis.requiresStaffAttention = true`
- `analysis.intent = 'complaint'`
- `analysis.shouldAIRespond = false` AND `analysis.isDirectedAtAI = false`

**Triggers for auto mode:**
- `analysis.sentiment = 'positive'` or `'neutral'`
- `analysis.urgency = 'low'` or `'medium'`
- `analysis.shouldAIRespond = true`
- `analysis.intent = 'question'` or `'booking'` or `'status_check'`

**This is SMARTER than current regex patterns** because AI understands context.

---

### Q4: "Do staff messages need to be checked as well? They come via send API with 'many thanks, John' in the ending so should be clear?"

**GOOD QUESTION!** Let me think about this...

**Staff messages (from John):**
```
Message: "Hi Carol, your iPhone is ready. £149.99. Many thanks, John"
Sender: 'staff' (detected by signature)
```

**Should we analyze staff messages?**

**NO for sentiment/context** (waste of AI calls)
**YES for extraction** (get customer name, device info, pricing)

**Current system already does this:**
```typescript
// In app/api/messages/send/route.ts line 428
if (detectedSender === 'staff' && shouldExtractFromMessage(text)) {
  const extractedInfo = await extractStaffMessageInfo(text, apiKey)
  // Extracts: name, device, price, status
}
```

**Keep this separate!** Staff message extraction is different from customer message analysis.

**Proposed approach:**
```
Customer message → Unified analyzer (sentiment, intent, context, etc.)
Staff message → Staff extractor (name, device, price, status) ← Keep existing
```

**Why keep separate?**
1. Different purposes (analysis vs extraction)
2. Staff messages don't need sentiment analysis
3. Staff messages don't need context checking
4. Staff extraction already works well

**Answer: NO, don't run unified analyzer on staff messages. Keep existing staff extractor.**

---

## 3. Complete System Architecture

### Message Processing Flow

```
┌─────────────────────────────────────────────────────┐
│ INCOMING MESSAGE                                    │
└─────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────┐
│ 1. DETECT SENDER                                    │
│    - Check signature: "many thanks, John" → staff   │
│    - Check signature: "AI Steve" → ai               │
│    - Default → customer                             │
└─────────────────────────────────────────────────────┘
    ↓
    ├─── If STAFF message ──────────────────────────┐
    │                                                │
    │   ┌────────────────────────────────────────┐  │
    │   │ STAFF MESSAGE EXTRACTOR                │  │
    │   │ (Keep existing system)                 │  │
    │   │                                        │  │
    │   │ Extracts:                              │  │
    │   │ - Customer name                        │  │
    │   │ - Device info                          │  │
    │   │ - Pricing                              │  │
    │   │ - Repair status                        │  │
    │   └────────────────────────────────────────┘  │
    │                                                │
    │   → Save to staff_message_extractions          │
    │   → Update customer name if found              │
    │   → Trigger 30-min AI pause                    │
    │   → END (no AI response)                       │
    │                                                │
    └────────────────────────────────────────────────┘
    
    ├─── If CUSTOMER message ───────────────────────┐
    │                                                │
    │   ┌────────────────────────────────────────┐  │
    │   │ STEP 1: BLOCKED CHECK                  │  │
    │   │ - Simple status check                  │  │
    │   │ - If blocked → END                     │  │
    │   └────────────────────────────────────────┘  │
    │                ↓                               │
    │   ┌────────────────────────────────────────┐  │
    │   │ STEP 2: UNIFIED ANALYZER ⭐ NEW!       │  │
    │   │                                        │  │
    │   │ Analyzes:                              │  │
    │   │ 1. Sentiment (frustrated, angry, etc.) │  │
    │   │ 2. Intent (question, complaint, etc.)  │  │
    │   │ 3. Content type (pricing, status, etc.)│  │
    │   │ 4. Context (should AI respond?)        │  │
    │   │ 5. Customer name (if introducing)      │  │
    │   │ 6. Urgency level                       │  │
    │   │                                        │  │
    │   │ Returns: analysis object               │  │
    │   └────────────────────────────────────────┘  │
    │                ↓                               │
    │   ┌────────────────────────────────────────┐  │
    │   │ STEP 3: SAVE ANALYSIS                  │  │
    │   │ - Save sentiment to DB                 │  │
    │   │ - Update customer name if found        │  │
    │   │ - Create alert if needed               │  │
    │   └────────────────────────────────────────┘  │
    │                ↓                               │
    │   ┌────────────────────────────────────────┐  │
    │   │ STEP 4: MODE DECISION                  │  │
    │   │                                        │  │
    │   │ If requiresStaffAttention:             │  │
    │   │   → Switch to manual mode              │  │
    │   │   → Create alert                       │  │
    │   │   → END (no AI response)               │  │
    │   │                                        │  │
    │   │ If NOT shouldAIRespond:                │  │
    │   │   → Stay in current mode               │  │
    │   │   → END (no AI response)               │  │
    │   │                                        │  │
    │   │ Else:                                  │  │
    │   │   → Continue to AI response            │  │
    │   └────────────────────────────────────────┘  │
    │                ↓                               │
    │   ┌────────────────────────────────────────┐  │
    │   │ STEP 5: STAFF ACTIVITY CHECK           │  │
    │   │ - Check if staff replied recently      │  │
    │   │ - If yes + not simple query → END      │  │
    │   │ - Else → Continue                      │  │
    │   └────────────────────────────────────────┘  │
    │                ↓                               │
    │   ┌────────────────────────────────────────┐  │
    │   │ STEP 6: GENERATE AI RESPONSE           │  │
    │   │                                        │  │
    │   │ Load prompt modules based on:          │  │
    │   │ - analysis.intent                      │  │
    │   │ - analysis.contentType                 │  │
    │   │                                        │  │
    │   │ Generate response with context         │  │
    │   └────────────────────────────────────────┘  │
    │                ↓                               │
    │   ┌────────────────────────────────────────┐  │
    │   │ STEP 7: SEND RESPONSE                  │  │
    │   │ - Save to messages table               │  │
    │   │ - Send via MacroDroid webhook          │  │
    │   └────────────────────────────────────────┘  │
    │                                                │
    └────────────────────────────────────────────────┘
```

---

## 4. What Needs to Change

### Files to Modify

#### 1. **app/lib/unified-message-analyzer.ts** ✅ CREATED
**Add `contentType` field:**
```typescript
export interface UnifiedAnalysis {
  // ... existing fields ...
  contentType: 'pricing' | 'repair_status' | 'booking' | 'business_hours' | 
               'location' | 'device_issue' | 'buyback' | 'general_inquiry' | 
               'complaint' | 'greeting' | 'acknowledgment' | 'unclear'
}
```

#### 2. **app/api/messages/incoming/route.ts** (Main changes)
**Replace:**
- Line 438: `analyzeSentimentAsync()` → Use unified analyzer
- Line 774: `checkContextConfidence()` → Use unified analyzer
- Line 872: `extractCustomerNameSmart()` → Use unified analyzer

**Add:**
- Mode decision based on `analysis.requiresStaffAttention`
- Prompt module selection based on `analysis.intent` + `analysis.contentType`

#### 3. **app/lib/ai/smart-response-generator.ts**
**Add module selection logic:**
```typescript
function getModulesForAnalysis(analysis: UnifiedAnalysis): string[] {
  const modules = ['core_identity'] // Always load
  
  // Add based on intent
  if (analysis.intent === 'question' && analysis.contentType === 'pricing') {
    modules.push('pricing_guide', 'device_pricing', 'common_repairs')
  }
  else if (analysis.intent === 'status_check') {
    modules.push('repair_status', 'collection_info', 'time_aware_responses')
  }
  else if (analysis.intent === 'booking') {
    modules.push('booking_system', 'business_hours', 'time_aware_responses')
  }
  // ... etc
  
  return modules
}
```

#### 4. **Database Schema** (Optional but recommended)
```sql
-- Add intent tracking to sentiment_analysis table
ALTER TABLE sentiment_analysis
ADD COLUMN intent TEXT,
ADD COLUMN content_type TEXT,
ADD COLUMN intent_confidence NUMERIC(3,2);

-- Add index
CREATE INDEX idx_sentiment_intent ON sentiment_analysis(intent);
CREATE INDEX idx_sentiment_content_type ON sentiment_analysis(content_type);
```

---

## 5. What Stays the Same

### Keep These Systems (They Work Well)

1. **Staff Message Extraction** ✅
   - File: `app/lib/staff-message-extractor.ts`
   - Extracts: name, device, price, status
   - Triggered by: "many thanks, John" signature
   - **Don't change this!**

2. **Sender Detection** ✅
   - File: `app/lib/sender-detector.ts`
   - Detects: staff vs AI vs customer
   - Based on: message signature
   - **Don't change this!**

3. **AI Response Generation** ✅
   - File: `app/lib/ai/smart-response-generator.ts`
   - Generates: AI responses with context
   - **Just add module selection logic**

4. **30-Minute AI Pause** ✅
   - File: `app/lib/simple-query-detector.ts`
   - Pauses AI after staff reply
   - **Don't change this!**

5. **Cron Job** ✅
   - File: `app/api/cron/reset-stale-conversations/route.ts`
   - Resets stale manual conversations
   - **Don't change this!**

---

## 6. Additional Improvements to Consider

### A. Consolidate Database Queries ⭐ HIGH PRIORITY
**Problem:** 3-4 separate queries per message
**Solution:** One query with all data

```typescript
// Instead of:
const { data: conversation } = await supabase.from('conversations')...
const { data: messages } = await supabase.from('messages')...
const { data: customer } = await supabase.from('customers')...

// Do:
const { data } = await supabase
  .from('conversations')
  .select(`
    *,
    messages(sender, text, created_at),
    customer:customers(*)
  `)
  .eq('id', conversationId)
  .single()
```

**Impact:** 30-40ms faster per message

### B. Add Caching Layer
**Use:** Vercel KV or simple in-memory cache
**Cache:**
- AI settings (1 hour TTL)
- Business hours (1 day TTL)
- Prompt modules (1 day TTL)

**Impact:** 20-30ms faster per message

### C. Add Intent-Based Analytics
**Track:**
- Most common intents
- Intent → response success rate
- Intent → customer satisfaction
- Time to resolve by intent

**Use for:**
- Improving prompt modules
- Identifying problem areas
- Training AI better

### D. Add Confidence Thresholds
**Current:** Binary decision (respond or don't)
**Proposed:** Confidence levels

```typescript
if (analysis.overallConfidence < 0.5) {
  // Very uncertain - manual mode
  switchToManualMode()
}
else if (analysis.overallConfidence < 0.7) {
  // Somewhat uncertain - respond with caveat
  response = "I want to make sure I understand correctly. " + response
}
else {
  // High confidence - respond normally
  response = generateResponse()
}
```

---

## 7. Implementation Plan

### Phase 1: Enhance Unified Analyzer (1-2 hours)
- [ ] Add `contentType` detection
- [ ] Improve intent detection
- [ ] Add confidence thresholds
- [ ] Test with sample messages

### Phase 2: Update Incoming Handler (2-3 hours)
- [ ] Replace sentiment analysis call
- [ ] Replace context check call
- [ ] Replace name extraction call
- [ ] Add mode decision logic
- [ ] Add module selection logic
- [ ] Consolidate database queries

### Phase 3: Update Response Generator (1 hour)
- [ ] Add module selection function
- [ ] Map intent → modules
- [ ] Test with different intents

### Phase 4: Database Updates (30 min)
- [ ] Add intent columns
- [ ] Add indexes
- [ ] Update schema

### Phase 5: Testing (2-3 hours)
- [ ] Test with real messages
- [ ] Compare accuracy vs old system
- [ ] Verify cost savings
- [ ] Check response times
- [ ] Monitor for issues

### Phase 6: Cleanup (1 hour)
- [ ] Remove old analyzer files
- [ ] Update documentation
- [ ] Add monitoring

**Total time: 8-12 hours**

---

## 8. Summary

### What Unified Analyzer Does

✅ **Sentiment analysis** - Detects frustrated/angry customers
✅ **Intent detection** - Knows what customer wants (NEW!)
✅ **Content type** - Knows topic for prompt modules (NEW!)
✅ **Context checking** - Knows if message is for AI or John
✅ **Name extraction** - Extracts customer name if introducing
✅ **Urgency level** - Prioritizes critical issues
✅ **Mode decision** - Helps decide auto vs manual (IMPROVED!)

### What It Doesn't Do

❌ **Staff message extraction** - Keep existing system
❌ **Sender detection** - Keep existing system
❌ **Response generation** - Keep existing system (just add module selection)
❌ **30-min pause logic** - Keep existing system

### Key Benefits

1. **3x faster** - 1 AI call instead of 3
2. **33% cheaper** - $0.0002 vs $0.0003 per AI call
3. **Better accuracy** - AI sees full context
4. **Intent detection** - NEW feature for module selection
5. **Smarter mode switching** - Based on comprehensive analysis
6. **Simpler code** - 1 function instead of 3

---

## Next Steps

**Before I change anything, please confirm:**

1. ✅ Unified analyzer checks content for prompt modules? **YES**
2. ✅ Checks if message is for John (context)? **YES**
3. ✅ Helps with auto/manual mode decision? **YES**
4. ✅ Don't analyze staff messages (keep existing extractor)? **YES**

**Additional improvements:**
- Consolidate database queries? **Recommended**
- Add caching layer? **Recommended**
- Add intent-based analytics? **Optional**
- Add confidence thresholds? **Optional**

**What would you like me to do first?**
