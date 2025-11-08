# Context Loss & Duplicate Messages Fix

## Critical Issues Found

### Issue 1: Context Loss
**Problem**: AI doesn't track what question it just asked

```
AI: "What type of device is it?"
Customer: "It's blue"
AI: "It sounds like you have an iPhone" ❌ WRONG - they told you COLOR!
```

**Root Cause**: AI not checking its own last message before interpreting customer response

### Issue 2: Still Duplicate Messages
**Problem**: Despite previous fixes, still sending duplicates

```
Message 1: "Go to Settings > General > About to find your model"
Message 2: "If you've checked the model, let me know what it says"
[Two messages saying same thing]
```

**Root Cause**: Duplicate prevention not strong enough

### Issue 3: False Status Check Assumption
**Problem**: AI assumes status check with no context

```
Customer: "iPhone 15"
AI: "If it's about a repair status, I don't have access..." ❌ WRONG
[Customer just told you model, didn't mention repair status!]
```

**Root Cause**: Status check detection too broad

### Issue 4: Batching Not Catching Corrections
**Problem**: "It's blue" + "With an appl" should batch but didn't

```
Customer (15:32): "It's blue"
Customer (15:32): "With an appl"
[Should wait 2.5s and combine, but didn't detect as correction]
```

**Root Cause**: Incomplete words not detected as corrections

---

## Fixes Applied

### Fix 1: Strong Context Tracking

**Added to core_identity:**
```
BEFORE responding, CHECK:
1. What did I just ask in my LAST message?
2. What is the customer responding to?
3. Do I have enough context to understand their answer?
```

**Examples:**

**BAD - Lost Context:**
```
You: "What type of device is it?"
Customer: "It's blue"
You: "It sounds like you have an iPhone" ❌
```

**GOOD - Maintained Context:**
```
You: "What type of device is it?"
Customer: "It's blue"
You: "I meant what type - iPhone, Samsung, iPad? (The blue color is noted!)" ✅
```

---

### Fix 2: Stronger Duplicate Prevention

**Added checks:**
```
CHECK BEFORE SENDING:
- Did I JUST send a message asking for model?
- Am I about to repeat the same question?
- Is this message saying the same thing as my last one?

IF YES → DON'T SEND IT!
```

**Examples:**

**BAD - Duplicate:**
```
Message 1: "Go to Settings > General > About to find your model"
Message 2: "If you've checked the model, let me know what it says" ❌
```

**GOOD - Single Message:**
```
Message 1: "Go to Settings > General > About to find your model. What does it say?" ✅
```

---

### Fix 3: Specific Status Check Detection

**Updated rules:**
```
ONLY treat as status check if customer EXPLICITLY mentions:
- "Is it ready?"
- "Is it done?"
- "Can I pick it up?"
- "How's my repair?"

DO NOT treat as status check if:
- Customer just told you device type
- Customer just told you model number
- This is the START of a conversation
- No previous repair mentioned
```

**Examples:**

**CORRECT - Status Check:**
```
Customer: "Is my iPhone ready?"
You: "I don't have access to repair status, but I'll pass this to John..." ✅
```

**INCORRECT - NOT Status Check:**
```
Customer: "iPhone 15"
You: "If it's about repair status..." ❌ WRONG
```

**CORRECT - New Repair:**
```
Customer: "iPhone 15"
You: "Great! What's happening with your iPhone 15?" ✅
```

---

### Fix 4: Better Correction Detection

**Added to message-batcher.ts:**
```typescript
// Incomplete words that are clearly corrections (typos mid-typing)
const incompleteWords = /^(with an? |its? |the |my )/i
if (incompleteWords.test(second) && second.length < 20) {
  return true // Treat as correction = 2.5s wait
}

// Added "apple" and "appl" to device words
const deviceWords = ['iphone', 'samsung', 'ipad', 'macbook', 'laptop', 
                     'phone', 'tablet', 'apple', 'appl']
```

**Now catches:**
- "With an appl" → Correction detected
- "Its blue" → Correction detected
- "The screen" → Correction detected
- "My phone" → Correction detected

---

## Conversation Flow - Always Follow This Order

```
STEP 1: Identify the DEVICE TYPE
"What type of device - iPhone, Samsung, iPad, MacBook, laptop?"

STEP 2: Identify the SPECIFIC MODEL (with options)
"Great! What model - iPhone 12, 13, 14, 15, or 16?"

STEP 3: Identify the ISSUE
"What's happening with your iPhone 15? Screen, battery, or something else?"

STEP 4: Troubleshoot + Damage + Pricing
"Try force restart... any damage? If it's the screen, repairs are £X"

NEVER skip steps! NEVER assume!
```

---

## Expected Behavior After Fix

### Scenario: Customer Says "It's Blue"

**Before (WRONG):**
```
AI: "What type of device?"
Customer: "It's blue"
AI: "It sounds like you have an iPhone" ❌
```

**After (CORRECT):**
```
AI: "What type of device?"
Customer: "It's blue"
AI: "I meant what type - iPhone, Samsung, iPad, etc? (Blue is noted!)" ✅
```

---

### Scenario: Customer Says "iPhone 15"

**Before (WRONG):**
```
Customer: "iPhone 15"
AI: "If it's about a repair status, I don't have access to that..." ❌
```

**After (CORRECT):**
```
Customer: "iPhone 15"
AI: "Great! What's happening with your iPhone 15? Screen, battery, or something else?" ✅
```

---

### Scenario: Rapid Messages with Typo

**Before (WRONG):**
```
Customer (15:32): "It's blue"
AI (15:32): "It sounds like you have an iPhone"
Customer (15:32): "With an appl"
AI (15:32): "I'm not sure what you mean"
[Two separate responses, missed batching]
```

**After (CORRECT):**
```
Customer (15:32): "It's blue"
Customer (15:32): "With an appl"
[Batching detects correction, waits 2.5s]
AI (15:32): "I meant what type of device - iPhone, Samsung, iPad? 
(Blue with Apple logo noted!)" ✅
[One combined response]
```

---

### Scenario: Duplicate Messages

**Before (WRONG):**
```
AI: "Go to Settings > General > About to find your model"
AI: "If you've checked the model, let me know what it says"
[Duplicate messages]
```

**After (CORRECT):**
```
AI: "Go to Settings > General > About to find your model. What does it say?"
[Single message]
```

---

## Files Changed

### Database Migration
- `supabase/migrations/031_fix_context_loss_and_duplicates.sql`
  - Updated `core_identity` with context tracking
  - Updated `context_awareness` with stronger rules
  - Updated status check detection to be more specific

### Code Changes
- `app/lib/message-batcher.ts`
  - Added incomplete word detection
  - Added "apple" and "appl" to device words
  - Catches "With an appl" as correction

---

## Deployment

```bash
npx supabase db push
# Code changes are automatic
```

---

## Testing Checklist

### Context Tracking
- [ ] AI asks "What type of device?"
- [ ] Customer says "It's blue"
- [ ] AI clarifies: "I meant what type - iPhone, Samsung, iPad?"
- [ ] Does NOT assume device type from color

### Duplicate Prevention
- [ ] AI sends ONE message about finding model
- [ ] Does NOT send second similar message
- [ ] No duplicate greetings

### Status Check Detection
- [ ] Customer says "iPhone 15"
- [ ] AI asks "What's happening with your iPhone 15?"
- [ ] Does NOT assume status check

### Batching Corrections
- [ ] Customer sends "It's blue"
- [ ] Customer sends "With an appl" within 2 seconds
- [ ] AI waits 2.5s and combines both messages
- [ ] Responds to both together

### Conversation Flow
- [ ] Always asks device type first
- [ ] Then asks model with options
- [ ] Then asks what's wrong
- [ ] Never skips steps
- [ ] Never assumes

---

## Impact

### Speed
- **Fewer clarifications needed** - AI understands context better
- **No duplicate messages** - Saves time and confusion
- **Better batching** - Catches more corrections

### Quality
- **Accurate responses** - AI knows what question was asked
- **No false assumptions** - Doesn't jump to status checks
- **Clear flow** - Always follows device → model → issue → solution

### Customer Experience
- **Less frustration** - AI understands them correctly
- **Faster resolution** - No wasted back-and-forth
- **More professional** - No duplicate or confusing messages

---

## Related Fixes

This builds on previous migrations:
- Migration 028: Duplicate message prevention (initial)
- Migration 029: Adaptive batching
- Migration 030: Device flow audit
- **Migration 031: Context tracking + stronger duplicate prevention**

---

## Summary

**Root causes fixed:**
1. ✅ AI now checks what it just asked before interpreting answers
2. ✅ Stronger duplicate message prevention
3. ✅ Status check detection more specific
4. ✅ Batching catches incomplete words like "With an appl"

**Expected results:**
- No more "It's blue" → "Sounds like iPhone" confusion
- No more duplicate messages
- No more false status check assumptions
- Better batching of rapid corrections
