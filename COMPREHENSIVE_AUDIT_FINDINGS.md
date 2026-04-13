# Comprehensive AI Steve System Audit - April 13, 2026

## Executive Summary

After analyzing the entire system, I found **CRITICAL INCONSISTENCIES** between what we're trying to fix and what the database prompts are actually telling AI Steve to do.

## 🚨 MAJOR PROBLEM: Conflicting Instructions

### The Core Issue:
We just created migration 096 telling AI to **NEVER** say "pop in" or "bring it in" and to **ALWAYS** say "John will confirm"...

**BUT** migrations 094 and 095 (which run BEFORE 096) are telling AI to **DO EXACTLY THAT**!

---

## Detailed Findings

### 1. **Quote Acceptance Workflow (Migration 095) - CONFLICTS WITH FIX**

**Location:** `095_add_buyback_quote_handling.sql` lines 101-104

**What it says:**
```sql
ALWAYS SAY:
✅ "Perfect! You can drop your [device] in during opening hours"
✅ "Great! You can bring your [device] in anytime during opening hours"
✅ "Brilliant! Drop your [device] off during opening hours and we'll get it sorted"
```

**Problem:** This directly contradicts our fix! AI is being told to confirm drop-off times.

**What happens:** Customer accepts quote → AI says "bring it in anytime" → Customer shows up → You're not ready/available → Customer frustrated

---

### 2. **Repair Flow Handler - Multiple "Bring It In" References**

**Location:** `app/lib/repair-flow/handler.ts`

**Line 259:** "We can confirm the exact model and price when you **pop in**"
**Line 293:** "We can confirm the exact price when you **bring it in**"
**Line 2664:** "just **bring it in** and John will take a look!"
**Line 4570:** "The best thing is to **bring it in** for a free diagnostic"
**Line 4576:** "The best thing is to **bring it in** for a free diagnostic"
**Line 4582:** "The best thing is to **bring it in** for a free diagnostic"
**Line 5435:** "**Bring it in** and we'll identify the exact model"

**Problem:** Repair flow (used for webchat) is telling customers to bring devices in without John confirming times.

---

### 3. **Unable to Quote SMS Template**

**Location:** `app/api/quotes/unable/route.ts` line 145

**What it says:**
```
"You're welcome to bring the device in during opening hours and we'll take a look."
```

**Problem:** This is an automated SMS from John saying "bring it in" - this one is actually OK because it's from John himself, not AI Steve.

---

### 4. **Name Usage - Already Fixed But Worth Noting**

**Status:** ✅ Fixed in migration 093
- AI never uses names
- Always uses "Hi!" or "Hi there!"

**Your comment:** "I don't always confirm my name as well"

**Analysis:** This is correct - AI should NEVER use names unless 100% certain. Current fix is good.

---

## The Real Problem: Quote Acceptance Flow

### Current Behavior (WRONG):
1. Customer gets quote from you: "£149 for iPhone screen"
2. Customer replies: "Yes please"
3. AI says: "Perfect! You can drop your iPhone in during opening hours and we'll get it sorted for £149"
4. Customer shows up at 2pm
5. You're busy/not available/need to order parts
6. Customer: "But AI Steve said I could drop it off anytime!"

### What Should Happen (RIGHT):
1. Customer gets quote from you: "£149 for iPhone screen"
2. Customer replies: "Yes please"
3. AI says: "Great! I've marked that as accepted. **John will confirm a convenient time for drop-off and send you a booking confirmation.**"
4. You send booking confirmation with specific time
5. Customer shows up at agreed time
6. Everyone happy!

---

## Why This Matters

### Real Example from Your Conversations:

**Alison (iPad Pro 10.5):**
- Got quote, said "we'd like to proceed"
- AI probably said "bring it in during opening hours"
- Later asked: "Please can you let me know when the screen will be ordered"
- Had to ask again: "Please can you let me know the issue with the battery and confirm total cost"
- **Result:** Confusion, multiple messages, frustration

**What should have happened:**
- Customer accepts quote
- AI: "John will confirm when to bring it in and send you a booking confirmation"
- You send proper booking with timeline
- Customer knows exactly what to expect

---

## Solutions Required

### 1. **Fix Quote Acceptance Workflow (URGENT)**

**Current (Wrong):**
```
"Perfect! You can drop your [device] in during opening hours"
```

**Should Be:**
```
"Great! I've marked that as accepted. John will confirm a convenient time for drop-off and send you a booking confirmation shortly."
```

### 2. **Fix Repair Flow Handler**

**Current (Wrong):**
```
"Bring it in and we'll identify the exact model"
```

**Should Be:**
```
"You can get a quote here: [website link]" 
OR
"John will confirm when you can bring it in for assessment"
```

### 3. **Create New Migration to Override 095**

Migration 096 runs AFTER 095, so it should override... but the quote_acceptance_workflow module needs to be completely rewritten to remove all "bring it in" language.

---

## Recommended Fix Strategy

### Option A: Nuclear Fix (Recommended)
1. Create migration 097 that completely rewrites quote_acceptance_workflow
2. Remove ALL "bring it in" / "pop in" / "drop it off" language
3. Replace with "John will confirm" for everything except:
   - Opening hours (factual)
   - Quote acceptance acknowledgment
   - Tracking links

### Option B: Surgical Fix
1. Update only the specific lines in quote_acceptance_workflow
2. Keep the structure but change the language
3. Risk: Might miss some edge cases

---

## What Needs to Change

### Quote Acceptance - REPAIR Quotes:

**Before:**
```
"Perfect! You can drop your [device] in during opening hours and we'll get it sorted for £[price]. You'll receive a confirmation text shortly."
```

**After:**
```
"Great! I've marked that as accepted. John will send you a booking confirmation with drop-off details shortly. The repair is £[price]."
```

### Quote Acceptance - BUYBACK/SELL Quotes:

**Before:**
```
"Great! You can pop in with your [device] during opening hours. We'll check the condition and confirm the £[price] offer, then sort payment straight away."
```

**After:**
```
"Great! I've marked that as accepted. John will confirm when you can bring your [device] in for condition check and payment. The offer is £[price]."
```

### Repair Flow (Webchat):

**Before:**
```
"Bring it in and we'll identify the exact model"
```

**After:**
```
"You can get a quote here: https://www.newforestdevicerepairs.co.uk/repair-request"
```

---

## Testing Checklist

After fixes applied, test these scenarios:

### Test 1: Quote Acceptance (Repair)
1. Send customer a repair quote
2. Customer replies: "Yes please"
3. **Expected:** AI says "John will send booking confirmation"
4. **Should NOT say:** "Drop it off during opening hours"

### Test 2: Quote Acceptance (Buyback)
1. Send customer a buyback quote
2. Customer replies: "Yes please"
3. **Expected:** AI says "John will confirm when to bring it in"
4. **Should NOT say:** "Pop in during opening hours"

### Test 3: Webchat - Unknown Model
1. Customer: "I need iPhone screen fixed but don't know model"
2. **Expected:** AI routes to website
3. **Should NOT say:** "Bring it in and we'll identify it"

### Test 4: Booking Request
1. Customer: "Can I book in for tomorrow?"
2. **Expected:** AI says "John will confirm a time"
3. **Should NOT say:** "Pop in anytime"

---

## Priority Ranking

1. **🔴 CRITICAL:** Quote acceptance workflow (affects every quote)
2. **🟠 HIGH:** Repair flow handler (affects webchat)
3. **🟢 MEDIUM:** General "bring it in" language cleanup

---

## Next Steps

1. Create migration 097 to fix quote_acceptance_workflow
2. Update repair flow handler code
3. Test with real quote acceptance scenarios
4. Monitor for any remaining "bring it in" language
5. Document the fix

---

## Key Principle

**"John confirms times, AI confirms acceptance"**

- AI can acknowledge quote acceptance: ✅ "Great! I've marked that as accepted"
- AI can share factual info: ✅ "We're open 10am-5pm"
- AI CANNOT confirm when to bring device: ❌ "Drop it off anytime"
- AI MUST defer to you: ✅ "John will confirm when to bring it in"

---

## Bottom Line

The system is telling AI Steve to do TWO OPPOSITE THINGS:
1. Migration 096: "Never say bring it in, always say John will confirm"
2. Migration 095: "Always say bring it in during opening hours"

**Result:** Confusion, inconsistency, and the exact problem you're experiencing.

**Solution:** Rewrite migration 095's quote_acceptance_workflow to align with the conservative approach.
