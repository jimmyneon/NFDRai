# AI System Testing Plan

## Quick Tests (5 minutes)

### Test 1: Context-Aware Prompting
**Goal:** Verify AI only includes relevant information

**Test Messages:**
1. "Hi, what are your opening hours?" 
   - ✓ Should include business hours module
   - ✗ Should NOT include pricing or repair info

2. "How much for iPhone 12 screen?"
   - ✓ Should include pricing module
   - ✓ Should include screen repair flow
   - ✗ Should NOT include business hours (unless asked)

3. "My phone got wet"
   - ✓ Should include water damage scenario
   - ✓ Should include diagnostic info
   - ✗ Should NOT include screen pricing

**How to Check:**
- Look at console logs for prompt size (~2000-3000 chars for focused, not 50,000)
- Verify AI response is relevant and doesn't mention unrelated topics

---

### Test 2: Conversation Memory
**Goal:** Verify AI remembers previous messages (15 message window)

**Test Conversation:**
1. "Hi, I'm Sarah and I have an iPhone 12"
2. "The screen is cracked"
3. "How much to fix it?"
4. "Do you have the OLED option?"
5. "Yes please, when can I bring it in?"

**Expected:**
- ✓ AI should use "Sarah" in responses
- ✓ AI should remember it's iPhone 12
- ✓ AI should remember screen is cracked
- ✓ Should not ask for device model again

---

### Test 3: Multi-Message Splitting
**Goal:** Verify `|||` delimiter creates separate messages with delays

**Test Message:**
"How much for iPhone 12 screen replacement?"

**Expected Response Pattern:**
- Message 1: Screen options (OLED vs genuine)
- *2 second delay*
- Message 2: Battery upsell offer

**How to Check:**
- Watch conversation UI for two separate message bubbles
- Time the delay between messages (~2 seconds)

---

### Test 4: Forced Sign-off
**Goal:** Verify every AI message has proper sign-off

**Test Any Message**

**Expected Sign-off Format:**
```
Many Thanks,
AI Steve,
New Forest Device Repairs
```

**Check:**
- ✓ Blank line before sign-off
- ✓ Each part on new line
- ✓ Appears on EVERY message

---

### Test 5: Turnaround Strategy
**Goal:** Verify turnaround only mentioned when asked

**Test Messages:**
1. "How much for iPhone 12 screen?"
   - ✗ Should NOT mention turnaround time

2. "How long will it take?"
   - ✓ Should mention turnaround time
   - ✓ Should mention most repairs are quicker

3. "I need it urgently"
   - ✓ Should offer express service (£30 for MacBooks/laptops)
   - ✓ Should say we try to accommodate anyway

---

### Test 6: Friendly Tone & Diagnosis
**Goal:** Verify warm, human tone and diagnostic flow

**Test Message:**
"My iPhone screen is black but I can hear sounds"

**Expected Flow:**
1. AI suggests force restart (helpful troubleshooting)
2. If that doesn't work, AI asks about physical damage
3. If damage mentioned, AI diagnoses likely screen issue
4. AI offers solutions with empathy and warmth

**Tone Check:**
- ✓ Sounds human and friendly
- ✓ Uses paragraphs (not chunked together)
- ✓ Shows empathy ("I understand that's frustrating")
- ✗ NOT robotic or harsh

---

## Deep Tests (15 minutes)

### Test 7: Context Decay
**Goal:** Verify conversation resets after 4 hours

**Test:**
1. Send message, wait 4+ hours (or modify timestamp in DB)
2. Send generic greeting "Hi"
3. AI should treat as new conversation, not remember old context

---

### Test 8: Device Detection
**Goal:** Verify AI asks for specific device model

**Test Messages:**
1. "My phone is broken"
   - ✓ Should ask: "What make and model is it?"

2. "My laptop won't turn on"
   - ✓ Should ask: "Is it a MacBook or Windows laptop? What model?"

3. "My tablet screen cracked"
   - ✓ Should ask: "Is it an iPad or Android tablet? What model?"

---

### Test 9: Handoff Rules
**Goal:** Verify AI only passes to John when appropriate

**Should NOT Pass to John:**
- "How much for iPhone screen?" → AI handles
- "What are your hours?" → AI handles
- "Do you buy phones?" → AI handles

**Should Pass to John:**
- "I want to speak to the owner"
- "I have 3 things wrong with my device"
- "This is a complaint about my repair"

---

### Test 10: Cost Monitoring
**Goal:** Verify prompt size and cost reduction

**Check Console Logs:**
```
Prompt size: ~2000-3000 chars (context-aware)
vs
Old system: ~50,000 chars (full prompt)
```

**Expected Savings:**
- ~75% reduction in input tokens
- Cost per message: ~$0.002-0.005 (vs $0.015-0.020 old)

---

## How to Run Tests

### Option 1: Manual Testing (Recommended)
1. Open your messaging interface (SMS/WhatsApp)
2. Send test messages from your phone
3. Watch responses and check console logs
4. Verify each test criteria

### Option 2: Use Test Script
Run: `node test-ai-system.js`
(I can create this if you want automated testing)

### Option 3: Dashboard Monitoring
1. Open Supabase Dashboard
2. Go to AI Analytics table
3. Watch for:
   - Validation failures
   - Prompt sizes
   - Cost per message
   - Response times

---

## Success Criteria

✅ **All tests pass:**
- Context-aware prompting works
- Conversation memory intact (15 messages)
- Multi-message splitting works
- Sign-off always present and formatted
- Turnaround only when asked
- Friendly, human tone
- Device detection works
- Handoff rules followed
- Cost reduced by ~75%

✅ **No errors in console**
✅ **Customer experience improved**
✅ **Cost per message reduced**

---

## If Tests Fail

1. Check console logs for errors
2. Verify migrations applied (run check_migrations.sql)
3. Check `smart-response-generator.ts` for correct logic
4. Review prompt modules in database
5. Test with simple message first, then complex

---

## Quick Smoke Test (1 minute)

Send this message: **"How much for iPhone 12 screen?"**

Expected:
- AI presents OLED vs genuine options
- Mentions 12-month warranty
- Does NOT mention turnaround time
- Has proper sign-off
- ~2 seconds later: Battery upsell message

If this works → System is good! 🚀
If not → Check console logs and let me know the error
