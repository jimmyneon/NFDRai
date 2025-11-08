# Intent Classifier Context Fix

## Problem

Intent classifier was making wrong decisions because it had **NO conversation context**.

### What Was Happening

```typescript
// OLD CODE - Line 75
intentClassification = await classifyIntent({
  customerMessage: params.customerMessage,
  conversationHistory: [], // ❌ EMPTY ARRAY!
  apiKey: settings.api_key
})
```

**Result**: Classifier only saw current message with zero context!

### Real Example

```
AI: "What type of device?"
Customer: "iPhone 15"
AI: "What's happening with it?"
Customer: "It's broken"

Intent Classifier sees ONLY: "It's broken"
No context that:
- Customer just told you device
- This is a NEW conversation
- No previous repair mentioned

Classifier thinks: "status_check" ❌ WRONG!
Should be: "diagnostic" ✅
```

## Root Cause

**Code fetched conversation history AFTER intent classification:**

```
Line 68-77: Classify intent (no context)
Line 94-102: Fetch conversation history (too late!)
```

This is backwards! Classifier needs context to make good decisions.

## Fixes Applied

### Fix 1: Fetch History BEFORE Classification

**File**: `lib/ai/smart-response-generator.ts`

```typescript
// NEW CODE - Fetch history FIRST
const { data: messagesDesc } = await supabase
  .from('messages')
  .select('*')
  .eq('conversation_id', params.conversationId)
  .order('created_at', { ascending: false })
  .limit(10)

const messages = messagesDesc?.reverse() || []

// THEN classify with context
intentClassification = await classifyIntent({
  customerMessage: params.customerMessage,
  conversationHistory: messages.slice(-5).map(m => ({ // ✅ Last 5 messages
    sender: m.sender,
    text: m.text
  })),
  apiKey: settings.api_key
})
```

**Impact**: Classifier now sees last 5 messages for context!

### Fix 2: Improve Classifier Prompt

**File**: `lib/ai/intent-classifier.ts`

**Added critical rules:**

```
CRITICAL RULES FOR STATUS_CHECK:
- ONLY use status_check if customer EXPLICITLY asks about existing repair status
- Phrases like "Is it ready?", "Is it done?", "Can I pick it up?" = status_check
- Phrases like "It's broken", "I want it repaired", "Can you fix it?" = diagnostic (NEW repair!)
- When in doubt → Choose new repair (diagnostic)

CONTEXT MATTERS:
- If conversation just started → Likely NEW repair
- If customer just told you device model → Likely NEW repair
- If no previous repair mentioned in history → Definitely NEW repair
```

**Impact**: Classifier now understands context and defaults to new repair when uncertain!

## Expected Behavior After Fix

### Scenario 1: "It's Broken" with Context

**Before (NO CONTEXT):**
```
Classifier sees: "It's broken"
Thinks: "Maybe status check?" 
Result: status_check ❌
```

**After (WITH CONTEXT):**
```
Classifier sees:
AI: "What type of device?"
Customer: "iPhone 15"
AI: "What's happening with it?"
Customer: "It's broken"

Thinks: "Customer just told me device, this is NEW repair"
Result: diagnostic ✅
```

### Scenario 2: Actual Status Check

**Before and After (BOTH CORRECT):**
```
Classifier sees:
Customer: "Is my iPhone ready?"

Thinks: "Explicit status check question"
Result: status_check ✅
```

### Scenario 3: Ambiguous Case

**Before (NO CONTEXT):**
```
Classifier sees: "How's it going?"
Thinks: "Could be status check?"
Result: status_check ❌
```

**After (WITH CONTEXT):**
```
Classifier sees:
AI: "What can I help with?"
Customer: "How's it going?"

Thinks: "No previous repair mentioned, likely greeting"
Result: general_info ✅
```

## Impact on System

### Before Fix
- ❌ Classifier blind to context
- ❌ Misclassified "It's broken" as status_check
- ❌ No pricing loaded (status_check doesn't need pricing)
- ❌ AI couldn't help customers

### After Fix
- ✅ Classifier sees last 5 messages
- ✅ Correctly identifies NEW repairs
- ✅ Pricing loads for repair intents
- ✅ AI can help customers properly

## Why This Matters

**Intent classification drives everything:**

```
Intent Classification
    ↓
Determines which prompt modules to load
    ↓
Determines what data to fetch (pricing, FAQs, etc.)
    ↓
Determines how AI responds
```

**Wrong intent = Wrong everything!**

## Performance Impact

**Minimal** - We were already fetching conversation history, just in the wrong order:

- Before: Fetch after classification (wasted)
- After: Fetch before classification (used)
- No additional database queries
- Same data, better order

## Testing

Test these scenarios:

1. **New Repair**
   ```
   Customer: "iPhone 15"
   Customer: "It's broken"
   Expected: diagnostic intent ✅
   ```

2. **Status Check**
   ```
   Customer: "Is my iPhone ready?"
   Expected: status_check intent ✅
   ```

3. **Ambiguous with Context**
   ```
   AI: "What type of device?"
   Customer: "iPhone"
   AI: "What model?"
   Customer: "15"
   Expected: NOT status_check ✅
   ```

## Related Fixes

This builds on:
- Migration 031: Context loss fixes
- Migration 032: Pricing data loading fixes
- **This fix**: Intent classifier context (code only, no migration needed)

## Files Changed

- `lib/ai/smart-response-generator.ts`
  - Moved history fetch before classification
  - Pass last 5 messages to classifier
  
- `lib/ai/intent-classifier.ts`
  - Improved prompt with context rules
  - Emphasized status_check specificity
  - Default to new repair when uncertain

## Deployment

```bash
# No migration needed - code changes only
# Just restart app if needed
git pull
# Restart
```

## Summary

**Problem**: Intent classifier had zero context, made wrong decisions

**Solution**: 
1. Fetch conversation history BEFORE classification
2. Pass last 5 messages to classifier
3. Improve classifier prompt to use context
4. Default to new repair when uncertain

**Result**: Classifier now makes informed decisions based on conversation context!
