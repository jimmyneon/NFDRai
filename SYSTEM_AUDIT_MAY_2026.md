# AI Steve System Audit - May 2026

## Executive Summary

This audit examines whether AI Steve can actually access APIs and gather information in practice, and how close we are to the original goals.

## Original Goals

1. **Basic inquiries** - hours, location, directions, contact
2. **Basic troubleshooting** - screen damage, battery, charging, etc.
3. **Checking repair statuses** - look up jobs by phone number
4. **Booking flow** - if clear someone wants to book → send to booking link
5. **Handoff to John** - anything else → "I'll pass this on to John" (don't overuse)
6. **Staff awareness** - when John is talking → AI shouldn't interrupt
7. **Basic questions** - hours, open at lunch, etc. → AI always jumps in (John doesn't want to answer these)
8. **Dynamic response** - not just a cooldown period, but context-aware

## Audit Findings

### ✅ 1. Repair Status API

**Status:** IMPLEMENTED but needs verification in practice

**Code location:** `app/lib/repair-status-checker.ts`

**How it works:**
- API endpoint: `https://nfd-repairs-app.vercel.app/api/jobs/check-status?phone=...`
- Called in: `app/api/messages/incoming/route.ts` (line 1288)
- Recently changed: Now called for EVERY message (not just status inquiries)
- Adds `[REPAIR STATUS INFORMATION]` or `[NO REPAIR JOBS FOUND]` to AI context

**Concern:** User reports they've never seen it working - AI says "I don't have access" even when asked about status

**Possible issues:**
- API might be failing silently
- Phone number format mismatch
- AI not using the context even when provided
- The repair app API might not be returning data

**Recommendation:** Add test endpoint to verify API is actually working with real phone numbers

---

### ✅ 2. Quote API

**Status:** IMPLEMENTED

**Code location:** `app/lib/quote-acceptance-handler.ts`

**How it works:**
- Checks for active quotes by phone number
- Adds `[ACTIVE QUOTE FOR THIS CUSTOMER]` to AI context
- Handles quote acceptance workflows
- Distinguishes between repair quotes and buyback/sell quotes

**Concern:** Not clear if this is working in practice

---

### ✅ 3. Business Hours API

**Status:** IMPLEMENTED and working

**Code location:** `lib/business-hours.ts`

**How it works:**
- Reads from `business_info` table in database
- Checks custom closures (illness, sick days)
- Checks holiday mode
- Returns real-time status: open/closed, current time, today's hours, tomorrow's hours, next open
- Adds `[CURRENT BUSINESS HOURS STATUS]` to AI context

**Good:** This appears to be working correctly - it's dynamic and pulls from the database

---

### ⚠️ 4. Staff Message Detection

**Status:** IMPLEMENTED but may be too restrictive

**Code location:** 
- `app/lib/simple-query-detector.ts` - `shouldAIRespond()` function
- `app/api/messages/incoming/route.ts` - staff activity check (line 1152-1207)

**How it works:**
- Checks if staff (John) sent a message in the last 30 minutes
- If staff replied < 30 min ago:
  - AI ONLY responds to simple queries (hours, location, directions, contact)
  - AI stays silent for complex queries (pricing, status, repairs)
- If staff replied > 30 min ago:
  - AI responds normally

**Problem:** User says cooldown period won't work - needs to be more dynamic

**Current behavior:**
- Fixed 30-minute timeout
- Simple vs complex query distinction
- AI pauses after staff message

**What user wants:**
- AI should jump in for basic questions (hours, lunch, etc.) even if John is talking
- AI should NOT interrupt when John is actually having a conversation
- Needs to be smarter than just a timer

**Recommendation:** 
- Implement conversation state tracking (is customer responding to John's question?)
- If customer asks basic question while John is talking → AI can answer
- If customer is responding to John's specific question → AI stays silent
- Remove or extend the 30-minute hard limit

---

### ⚠️ 5. AI Response Logic

**Status:** COMPLEX - multiple systems overlap

**Systems involved:**
1. `unified-message-analyzer.ts` - Analyzes message for intent, sentiment, urgency
2. `simple-query-detector.ts` - Detects simple vs complex queries
3. `human-control-integration.ts` - Newer system for human control
4. `context-confidence-checker.ts` - Checks if message makes sense in context

**How it decides to respond:**
- `shouldAIRespond` from unified analyzer
- `isSimpleQuery` for basic questions
- Staff message check (30-minute pause)
- Context confidence check (stays silent if message doesn't make sense)

**Problem:** Too many overlapping systems - hard to debug
- Old `shouldAIRespond` in `simple-query-detector.ts`
- New `shouldAIRespondWithIntent` in `intent-classifier.ts`
- New `shouldAIRespondNew` in `human-control-integration.ts`
- `shouldAIRespond` in `unified-message-analyzer.ts`

**Recommendation:** Consolidate into single decision point

---

### ✅ 6. API Access in Practice

**Status:** Code looks correct, but needs runtime verification

**What should be in AI context for EVERY message:**
1. `[CURRENT BUSINESS HOURS STATUS]` - ✅ Should be there
2. `[REPAIR STATUS INFORMATION]` or `[NO REPAIR JOBS FOUND]` - ✅ Should be there (as of latest change)
3. `[ACTIVE QUOTE FOR THIS CUSTOMER]` - ✅ Should be there
4. `[RECENT STAFF MESSAGES]` - ✅ Should be there (with timestamps)

**What AI should do with this context:**
- Check repair status first before advising on bring-in times
- Use dynamic hours from context (not hard-coded)
- Check if quote exists before giving pricing
- Use staff messages to understand context but not compete

---

## Quick Wins

### 1. Verify Repair Status API is Actually Working
- Create a test script that calls the API with a known phone number
- Log the actual response
- Verify the data structure matches what AI expects

### 2. Add Better Logging for AI Context
- Log what context markers are actually being added
- Log whether AI is using them in responses
- Add `[DEBUG]` markers to see what AI sees

### 3. Simplify Staff Message Detection
- Remove 30-minute hard limit
- Implement conversation state: is customer responding to John?
- If customer asks basic question (hours, location) → AI answers
- If customer responds to John's question → AI silent

### 4. Consolidate AI Response Logic
- Merge all the different `shouldAIRespond` functions
- Single source of truth for when to respond
- Easier to debug and maintain

### 5. Test End-to-End with Real Scenarios
- Scenario 1: Customer asks "when can I bring it in?" with existing repair
- Scenario 2: Customer asks "when can I bring it in?" without repair
- Scenario 3: Customer asks "when are you open?" while John is talking
- Scenario 4: Customer asks "is my phone ready?" with repair in system
- Scenario 5: Customer says "thanks John" after John replied

---

## What's Working vs What's Not

### ✅ Working (in code, likely in practice):
- Business hours API - pulls from database dynamically
- Quote lookup - checks for active quotes
- Staff message detection - can detect when John sent messages
- Context confidence check - prevents annoying responses
- Basic query detection - can identify hours/location questions

### ⚠️ Partially Working (code looks right, needs verification):
- Repair status API - called for every message now, but need to verify it's returning data
- AI using context markers - need to verify AI actually uses the data
- Quote acceptance workflow - need to verify it's working in practice

### ❌ Not Working (user reported issues):
- AI says "I don't have access" to repair status when it should
- AI interrupts when John is talking (sometimes)
- AI doesn't jump in for basic questions when John is talking
- 30-minute cooldown is too rigid

---

## Recommendations

### Immediate (Quick Wins):
1. Add test script to verify repair status API is working
2. Add comprehensive logging to see what context AI receives
3. Remove 30-minute hard limit, implement conversation state

### Short-term:
1. Consolidate AI response logic into single decision point
2. Test end-to-end scenarios
3. Add monitoring/alerting when APIs fail

### Long-term:
1. Implement proper conversation state tracking
2. Add AI response quality monitoring
3. Create test suite for all scenarios

---

## Next Steps

1. Create test script for repair status API
2. Add context logging to incoming message handler
3. Simplify staff message detection logic
4. Test with real phone numbers and scenarios
