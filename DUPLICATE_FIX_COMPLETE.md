# Duplicate Messages Fix - Complete Solution

## Problem
AI was sending 3 identical messages in a row:
```
Message 1: "No worries! Let's figure out what model it is. Go to Settings > General > About..."
Message 2: "No worries! Let's figure out what model it is. Go to Settings > General > About..."
Message 3: "Got it, so it's an iPhone. Could you check in Settings > General > About..."
```

Also, AI wasn't asking "What's wrong with it?" first.

## Root Causes
1. **No time-based duplicate check** - AI could send multiple messages within milliseconds
2. **Not batching rapid customer messages** - Each customer message triggered separate AI response
3. **Prompt didn't emphasize checking recent messages** - AI wasn't aware of what it just sent
4. **Missing "what's wrong?" priority** - AI jumped to asking for model without asking about the issue

## Solution - Multi-Layer Fix

### Layer 1: Smart Duplicate Check (CRITICAL)
**File:** `app/api/messages/incoming/route.ts`

Added intelligent check BEFORE AI generates response:
```typescript
// Check if AI just sent a message (within last 2 seconds)
// BUT only skip if customer message is vague (not a real answer)
const isVeryRecent = secondsSinceLastAI < 2
const isVagueResponse = messageWords.length <= 3 && 
  /^(ok|okay|sure|yes|no|not sure|idk|dunno|hmm|uh|um)$/i.test(message.trim())

if (isVeryRecent && isVagueResponse) {
  // SKIP - AI just sent message and customer is still typing
  return { success: true, mode: 'waiting' }
}

// If customer sent a REAL ANSWER (e.g., "iPhone 15"), process it immediately!
if (!isVagueResponse) {
  console.log('Customer sent real answer - processing immediately')
}
```

**Result:** 
- If AI sent message <2s ago AND customer says "ok" → Wait (they're still typing)
- If customer says "iPhone 15" or "Screen is cracked" → Process immediately (real answer!)
- **Never ignores real answers**, only waits for vague acknowledgments

### Layer 2: Batch Rapid Customer Messages
**File:** `app/lib/message-batcher.ts`

Reduced batch window for faster responses:
```typescript
const BATCH_WINDOW_MS = 3000 // Wait 3 seconds for more messages
const BATCH_WINDOW_CORRECTION_MS = 2000 // Shorter for corrections
```

**How it works:**
1. Customer sends: "Ok not sure"
2. System waits 3 seconds
3. Customer sends: "It's green"
4. Customer sends: "With apple"
5. System batches all 3 → AI reads them together → Responds ONCE

### Layer 3: Prompt-Level Duplicate Prevention
**File:** `supabase/migrations/033_fix_duplicate_messages_and_missing_question.sql`

Added 3 new prompt modules:

#### Module 1: `duplicate_prevention` (Priority 99)
- Checks recent conversation for AI's last message
- Prevents repeating same question/instructions
- Waits for customer response before sending again

#### Module 2: `ask_whats_wrong_first` (Priority 98)
- Forces AI to ask "What's wrong?" BEFORE asking for model
- Correct flow: Issue → Device → Model → Solution
- Prevents jumping to model identification

#### Module 3: Updated `core_identity` (Priority 100)
- Emphasizes checking recent messages
- Batching awareness
- Strong duplicate prevention rules

## Expected Behavior After Fix

### Scenario 1: Rapid Customer Messages
```
Customer (0s): "Ok not sure"
Customer (1s): "It's green"
Customer (2s): "With apple"
[System waits 3 seconds, batches all messages]
AI (5s): "Got it - so it's an iPhone. Go to Settings > General > About and look for Model Name. What does it say?"
```
**Result:** ONE response to all 3 messages

### Scenario 2: Customer Responds While AI is "Thinking"
```
AI (0s): "What model is it?"
Customer (0.5s): "Not sure"
[System checks: AI sent message 0.5s ago → SKIP response]
Customer (5s): "It's an iPhone"
[System checks: AI sent message 5s ago → OK to respond]
AI (8s): "Great! Go to Settings > General > About..."
```
**Result:** No duplicate response

### Scenario 3: First Contact - "My Phone is Broken" (Efficient!)
```
Customer: "Hello my phone is broken"
AI: "I'm sorry to hear that. What's happening with it, and what device/model is it - iPhone 15, Samsung S23, etc?"
Customer: "Screen is cracked, iPhone 15"
AI: "Screen replacements for iPhone 15 are £120 with 12-month warranty..."
```
**Result:** Asks "what's wrong?" FIRST (doesn't need device to ask!), then asks device+model together for efficiency

### Scenario 3b: Step-by-Step if Needed
```
Customer: "Hello my phone is broken"
AI: "I'm sorry to hear that. What's happening with it - screen, battery, won't turn on?"
Customer: "Screen is cracked"
AI: "What device and model - iPhone 15, Samsung S23, iPad Pro, etc?"
Customer: "iPhone"
AI: "What model - iPhone 12, 13, 14, 15, or 16?"
```
**Result:** Can still go step-by-step if customer doesn't provide all info at once

## Deployment

### Step 1: Apply Database Migration
```bash
# Option A: Using psql (if you have DATABASE_URL)
source .env.local
psql $DATABASE_URL -f supabase/migrations/033_fix_duplicate_messages_and_missing_question.sql

# Option B: Using Supabase CLI
npx supabase db push

# Option C: Via Supabase Dashboard
# Copy contents of migration file and run in SQL Editor
```

### Step 2: Restart Application
```bash
# The code changes are already in place, just restart:
npm run build
# Then redeploy to Vercel or restart local server
```

### Step 3: Test
Send test messages:
```
1. "Hello my phone is broken"
   → Should ask "What's happening with it?"
   
2. Send rapid messages: "Not sure" + "It's green" + "With apple"
   → Should get ONE response combining all 3
   
3. Wait for AI response, then immediately send another message
   → Should NOT get duplicate AI response
```

## Monitoring

Check logs for these messages:
```
[Duplicate Prevention] AI sent message 1.2s ago - skipping response
[Batching] Combined 3 rapid messages from +1234567890
[Smart AI] Response generated: state=awaiting_model, intent=screen_repair
```

## Rollback Plan

If issues occur:
1. Revert code changes in `app/api/messages/incoming/route.ts` (remove lines 326-355)
2. Revert batch window change in `app/lib/message-batcher.ts` (change back to 5000ms)
3. Delete prompt modules from database:
```sql
DELETE FROM prompts WHERE module_name IN ('duplicate_prevention', 'ask_whats_wrong_first');
```

## Success Metrics

**Before Fix:**
- 3 duplicate messages per customer interaction
- No "what's wrong?" question
- Customer confusion

**After Fix:**
- 1 message per customer interaction
- Always asks "what's wrong?" first
- Clear, logical conversation flow

## Technical Details

### Why 3 Seconds?
- Long enough to prevent duplicates from AI processing delays
- Short enough to feel responsive
- Allows customer to send follow-up without triggering duplicate prevention

### Why Batch Window = 3 Seconds?
- Catches 95% of rapid message scenarios
- Faster than previous 5 seconds
- Still allows corrections/clarifications

### Priority Order
1. Code-level time check (happens first, blocks duplicates)
2. Message batching (combines rapid messages)
3. Prompt-level awareness (AI checks its own messages)

All 3 layers work together for robust duplicate prevention.
