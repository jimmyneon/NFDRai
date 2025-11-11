# Implementation Progress - Unified Analyzer System

## Phase 1: ✅ COMPLETE - Add ContentType Detection

**Files Modified:**
- ✅ `app/lib/unified-message-analyzer.ts` - Added contentType field
- ✅ `app/lib/module-selector.ts` - Created module selection utility

**Changes:**
- ✅ Added contentType to UnifiedAnalysis interface (20+ types)
- ✅ Updated quickAnalysis() to detect contentType from regex
- ✅ Updated AI prompt to analyze contentType
- ✅ Added contentType to all fallback returns
- ✅ Created module selector with intent + contentType mapping

---

## Phase 2: 🔄 IN PROGRESS - Integrate into Incoming Handler

**File to Modify:**
- `app/api/messages/incoming/route.ts`

**Changes Needed:**

### 1. Replace Separate AI Calls with Unified Analyzer

**Current (Lines ~438, ~774, ~872):**
```typescript
// Line 438: Sentiment analysis (async)
analyzeSentimentAsync(message, conversation.id, supabase)

// Line 774: Context check
const contextCheck = await checkContextConfidence(...)

// Line 872: Name extraction
const extractedName = await extractCustomerNameSmart(...)
```

**New:**
```typescript
// Single unified analysis
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
- analysis.intent + analysis.contentType → Select modules
```

### 2. Add Mode Decision Logic

**After analysis, before response:**
```typescript
// Check if requires staff attention
if (analysis.requiresStaffAttention) {
  // Switch to manual mode
  await supabase
    .from('conversations')
    .update({ status: 'manual' })
    .eq('id', conversation.id)
  
  // Create alert
  await supabase.from('alerts').insert({
    conversation_id: conversation.id,
    type: analysis.urgency === 'critical' ? 'urgent' : 'manual_required',
    message: analysis.reasoning
  })
  
  return NextResponse.json({
    success: true,
    mode: 'manual',
    message: analysis.reasoning
  })
}

// Check if should respond
if (!analysis.shouldAIRespond) {
  return NextResponse.json({
    success: true,
    mode: 'no_response',
    message: analysis.reasoning
  })
}
```

### 3. Add Module Selection

**Before generating response:**
```typescript
import { getModulesForAnalysis, logModuleSelection } from '@/app/lib/module-selector'

// Select modules based on analysis
const modulesToLoad = getModulesForAnalysis(analysis)
logModuleSelection(analysis, modulesToLoad)

// Pass to response generator
const aiResult = await generateSmartResponse({
  customerMessage: messageToProcess,
  conversationId: conversation.id,
  customerPhone: from,
  modules: modulesToLoad  // NEW!
})
```

### 4. Save Analysis to Database

**After analysis:**
```typescript
// Save sentiment analysis
await supabase.from('sentiment_analysis').insert({
  message_id: messageData.id,
  conversation_id: conversation.id,
  sentiment: analysis.sentiment,
  urgency: analysis.urgency,
  confidence: analysis.overallConfidence,
  reasoning: analysis.reasoning,
  keywords: analysis.sentimentKeywords,
  requires_staff_attention: analysis.requiresStaffAttention,
  intent: analysis.intent,  // NEW!
  content_type: analysis.contentType,  // NEW!
  intent_confidence: analysis.intentConfidence,  // NEW!
  analysis_method: analysis.overallConfidence >= 0.7 ? 'regex' : 'ai'
})

// Update customer name if found
if (analysis.customerName && isLikelyValidName(analysis.customerName)) {
  await supabase.from('customers').update({ 
    name: analysis.customerName 
  }).eq('id', customer.id)
}
```

### 5. Remove Old Imports

**Delete:**
```typescript
import { analyzeSentimentSmart } from '@/app/lib/sentiment-analyzer'
import { checkContextConfidence } from '@/app/lib/context-confidence-checker'
import { extractCustomerNameSmart } from '@/app/lib/ai-name-extractor'
```

**Add:**
```typescript
import { analyzeMessage } from '@/app/lib/unified-message-analyzer'
import { getModulesForAnalysis, logModuleSelection } from '@/app/lib/module-selector'
```

---

## Phase 3: ⏳ PENDING - Update Response Generator

**File to Modify:**
- `app/lib/ai/smart-response-generator.ts`

**Changes Needed:**

### 1. Add Module Parameter

```typescript
export async function generateSmartResponse({
  customerMessage,
  conversationId,
  customerPhone,
  modules,  // NEW!
}: {
  customerMessage: string
  conversationId: string
  customerPhone: string
  modules?: string[]  // NEW!
}): Promise<{
  responses: string[]
  confidence: number
}>
```

### 2. Load Specific Modules

**Current:** Loads all modules or based on keywords

**New:** Load only specified modules
```typescript
// If modules specified, load only those
const modulesToLoad = modules || await getDefaultModules()

const { data: promptModules } = await supabase
  .from('prompts')
  .select('module_name, prompt_text, priority')
  .in('module_name', modulesToLoad)
  .eq('active', true)
  .order('priority', { ascending: false })
```

---

## Phase 4: ⏳ PENDING - Database Schema Update

**File to Create:**
- `supabase/migrations/047_add_intent_to_sentiment_analysis.sql`

**Changes:**
```sql
-- Add intent and content_type columns
ALTER TABLE sentiment_analysis
ADD COLUMN intent TEXT,
ADD COLUMN content_type TEXT,
ADD COLUMN intent_confidence NUMERIC(3,2);

-- Add indexes
CREATE INDEX idx_sentiment_intent ON sentiment_analysis(intent);
CREATE INDEX idx_sentiment_content_type ON sentiment_analysis(content_type);

-- Add comment
COMMENT ON COLUMN sentiment_analysis.intent IS 'Customer intent: question, complaint, booking, status_check, greeting, acknowledgment, device_issue, buyback, purchase, unclear';
COMMENT ON COLUMN sentiment_analysis.content_type IS 'Specific topic: pricing, business_hours, location, services, warranty, troubleshooting, water_damage, battery_issue, screen_damage, camera_issue, charging_issue, software_issue, device_sale, device_purchase, appointment, repair_status, introduction, acknowledgment, dissatisfaction, unclear';
```

---

## Phase 5: ⏳ PENDING - Testing

**Test Cases:**

1. **Pricing Question**
   - Message: "How much for iPhone screen?"
   - Expected: intent='question', contentType='pricing'
   - Modules: pricing_flow_detailed, services_comprehensive, operational_policies

2. **Water Damage**
   - Message: "I dropped my phone in water"
   - Expected: intent='device_issue', contentType='water_damage'
   - Modules: common_scenarios, diagnostic, operational_policies

3. **Frustrated Customer**
   - Message: "This is the third time I've asked!"
   - Expected: intent='complaint', contentType='dissatisfaction', requiresStaffAttention=true
   - Action: Switch to manual mode, create alert

4. **Business Hours**
   - Message: "When are you open?"
   - Expected: intent='question', contentType='business_hours'
   - Modules: time_aware_responses, time_awareness, operational_policies

5. **Acknowledgment**
   - Message: "Ok thanks"
   - Expected: intent='acknowledgment', shouldAIRespond=false
   - Action: No response

---

## Phase 6: ⏳ PENDING - Cleanup

**Files to Remove (after verification):**
- `app/lib/sentiment-analyzer.ts` (replaced by unified analyzer)
- `app/lib/context-confidence-checker.ts` (replaced by unified analyzer)
- `app/lib/ai-name-extractor.ts` (replaced by unified analyzer)

**Files to Keep:**
- `app/lib/customer-name-extractor.ts` (still used for basic extraction)
- `app/lib/staff-message-extractor.ts` (staff messages separate)
- `app/lib/sender-detector.ts` (still needed)
- `app/lib/simple-query-detector.ts` (still used for 30-min pause)
- `app/lib/conversation-mode-analyzer.ts` (may still be used as fallback)

---

## Current Status

✅ **Phase 1 Complete** - ContentType detection added
🔄 **Phase 2 In Progress** - Integrating into incoming handler
⏳ **Phase 3 Pending** - Update response generator
⏳ **Phase 4 Pending** - Database schema update
⏳ **Phase 5 Pending** - Testing
⏳ **Phase 6 Pending** - Cleanup

---

## Next Steps

1. Implement Phase 2 changes to incoming handler
2. Test with sample messages
3. Deploy and monitor
4. Continue with remaining phases
