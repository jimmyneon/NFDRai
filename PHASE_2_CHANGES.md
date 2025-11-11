# Phase 2: Detailed Changes for incoming/route.ts

## Overview

Replace 3 separate AI calls with 1 unified analyzer call.
File is 1096 lines, so implementing carefully in stages.

---

## Change 1: Run Unified Analyzer Early (After Message Insert)

**Location:** Line ~437 (after message insert)

**Current:**
```typescript
// Analyze sentiment of customer message (async, don't wait)
analyzeSentimentAsync(message, conversation.id, supabase)
  .catch((err: unknown) => console.error('[Sentiment Analysis] Error:', err))
```

**New:**
```typescript
// Run unified analysis (sentiment + intent + context + name extraction)
console.log('[Unified Analysis] Analyzing customer message...')

// Get recent messages for context
const { data: recentMessages } = await supabase
  .from('messages')
  .select('sender, text')
  .eq('conversation_id', conversation.id)
  .order('created_at', { ascending: false })
  .limit(5)

// Get API key
const { data: aiSettings } = await supabase
  .from('ai_settings')
  .select('api_key')
  .eq('active', true)
  .single()

// Run unified analysis
const analysis = await analyzeMessage(
  messageToProcess,
  recentMessages || [],
  aiSettings?.api_key
)

console.log('[Unified Analysis] Result:', {
  sentiment: analysis.sentiment,
  intent: analysis.intent,
  contentType: analysis.contentType,
  shouldRespond: analysis.shouldAIRespond,
  requiresAttention: analysis.requiresStaffAttention,
  confidence: analysis.overallConfidence
})

// Save analysis to database (async, don't wait)
saveAnalysisAsync(analysis, messageData.id, conversation.id, supabase)
  .catch((err: unknown) => console.error('[Analysis Save] Error:', err))

// Check if requires staff attention IMMEDIATELY
if (analysis.requiresStaffAttention) {
  console.log('[Mode Decision] Customer requires staff attention - switching to manual')
  
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
    message: analysis.reasoning,
    analysis: {
      sentiment: analysis.sentiment,
      urgency: analysis.urgency,
      intent: analysis.intent
    }
  }, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
}

// Check if should NOT respond
if (!analysis.shouldAIRespond) {
  console.log('[Mode Decision] Should not respond:', analysis.reasoning)
  
  return NextResponse.json({
    success: true,
    mode: 'no_response',
    message: analysis.reasoning
  }, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
}

// Update customer name if found
if (analysis.customerName && isLikelyValidName(analysis.customerName)) {
  console.log('[Name Extraction] Found customer name:', analysis.customerName)
  await supabase.from('customers').update({ 
    name: analysis.customerName 
  }).eq('id', customer.id)
}
```

---

## Change 2: Remove Context Check (Line ~774)

**Current:**
```typescript
const contextCheck = await checkContextConfidence(
  messageToProcess,
  contextMessages || [],
  aiSettings?.api_key
)

if (!contextCheck.shouldRespond) {
  console.log('[Context Check] ❌ Should NOT respond:', contextCheck.reasoning)
  // ... create alert and return
}
```

**New:**
```typescript
// Context check already done in unified analysis
// Skip this section - handled earlier
```

**Action:** Delete lines 754-807 (context check section)

---

## Change 3: Add Module Selection Before Response Generation (Line ~810)

**Current:**
```typescript
const aiResult = await generateSmartResponse({
  customerMessage: messageToProcess,
  conversationId: conversation.id,
  customerPhone: from,
})
```

**New:**
```typescript
// Select modules based on analysis
const modulesToLoad = getModulesForAnalysis(analysis)
logModuleSelection(analysis, modulesToLoad)

const aiResult = await generateSmartResponse({
  customerMessage: messageToProcess,
  conversationId: conversation.id,
  customerPhone: from,
  modules: modulesToLoad,  // NEW!
})
```

---

## Change 4: Remove Name Extraction After Response (Line ~872)

**Current:**
```typescript
// Extract customer name from AI's first response
if (uniqueResponses.length > 0 && (!customer.name || customer.name === 'Unknown Customer')) {
  const { data: aiSettings } = await supabase
    .from('ai_settings')
    .select('api_key')
    .eq('active', true)
    .single()
  
  const extractedName = await extractCustomerNameSmart(uniqueResponses[0], aiSettings?.api_key)
  
  if (extractedName.name && isLikelyValidName(extractedName.name)) {
    console.log('[AI Name Extraction] Found customer name in AI response:', extractedName.name)
    await supabase.from('customers').update({ name: extractedName.name }).eq('id', customer.id)
  }
}
```

**New:**
```typescript
// Name already extracted in unified analysis
// Skip this section - handled earlier
```

**Action:** Delete lines 868-882 (name extraction section)

---

## Change 5: Replace analyzeSentimentAsync Function (Line ~1015)

**Current:**
```typescript
async function analyzeSentimentAsync(
  message: string,
  conversationId: string,
  supabase: any
): Promise<void> {
  // ... 80 lines of code
}
```

**New:**
```typescript
async function saveAnalysisAsync(
  analysis: any,
  messageId: string,
  conversationId: string,
  supabase: any
): Promise<void> {
  try {
    console.log('[Analysis Save] Saving to database...')
    
    // Save sentiment analysis with intent and contentType
    const { error: insertError } = await supabase
      .from('sentiment_analysis')
      .insert({
        message_id: messageId,
        conversation_id: conversationId,
        sentiment: analysis.sentiment,
        urgency: analysis.urgency,
        confidence: analysis.overallConfidence,
        reasoning: analysis.reasoning,
        keywords: analysis.sentimentKeywords || [],
        requires_staff_attention: analysis.requiresStaffAttention,
        intent: analysis.intent,  // NEW!
        content_type: analysis.contentType,  // NEW!
        intent_confidence: analysis.intentConfidence,  // NEW!
        analysis_method: analysis.overallConfidence >= 0.7 ? 'regex' : 'ai'
      })
    
    if (insertError) {
      console.error('[Analysis Save] Failed:', insertError)
      return
    }
    
    console.log('[Analysis Save] ✅ Saved successfully')
  } catch (error) {
    console.error('[Analysis Save] Error:', error)
  }
}
```

---

## Summary of Changes

1. ✅ **Line ~437:** Run unified analyzer early, check requiresStaffAttention, check shouldAIRespond, extract name
2. ✅ **Line ~754-807:** DELETE context check section (handled by unified analyzer)
3. ✅ **Line ~810:** Add module selection before response generation
4. ✅ **Line ~868-882:** DELETE name extraction section (handled by unified analyzer)
5. ✅ **Line ~1015-1095:** REPLACE analyzeSentimentAsync with saveAnalysisAsync

---

## Testing Checklist

After implementation, test:

1. ✅ Frustrated customer → Switches to manual mode immediately
2. ✅ Acknowledgment → No response
3. ✅ Pricing question → Loads pricing modules, generates response
4. ✅ Water damage → Loads water damage modules
5. ✅ Customer name extraction → Updates customer table
6. ✅ Sentiment saved to database with intent + contentType
7. ✅ No duplicate AI calls
8. ✅ Performance improvement (1 call vs 3)

---

## Next Steps

1. Implement Change 1 (unified analyzer early)
2. Implement Change 2 (remove context check)
3. Implement Change 3 (module selection)
4. Implement Change 4 (remove name extraction)
5. Implement Change 5 (replace sentiment function)
6. Test thoroughly
7. Deploy

---

## Rollback Plan

If issues occur:
1. Revert to commit before Phase 2
2. Old analyzers still exist in codebase
3. Can switch back imports easily
4. No database schema changes yet (Phase 4)
