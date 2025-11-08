# 🚨 URGENT: Apply Migration 033 - "Ask What's Wrong First" Missing!

## Current Problem

```
Customer: "Hi there. Can you fix my phone? iPhone"
AI: "What model is your iPhone?"  ❌ DOESN'T ASK WHAT'S WRONG!
```

## Why This Is Happening

**Migration 033 is NOT applied to the database yet!**

The code changes are deployed, but the database still has the old prompts that don't ask "what's wrong?" first.

---

## Apply Migration 033 NOW

### File Location:
```
supabase/migrations/033_fix_duplicate_messages_and_missing_question.sql
```

### Quick Steps:
1. Open **Supabase Dashboard** → SQL Editor
2. Copy **ALL contents** of migration 033
3. Paste into SQL Editor
4. Click **Run**
5. Done! ✅

---

## What Migration 033 Fixes

### 1. ✅ Asks "What's Wrong?" First
**Before (Current):**
```
Customer: "My iPhone is broken"
AI: "What model is your iPhone?"  ❌
```

**After (With Migration 033):**
```
Customer: "My iPhone is broken"
AI: "What's happening with it, and what model - iPhone 12, 13, 14, 15, or 16?"  ✅
```

### 2. ✅ Asks Multiple Questions at Once
**Before:**
```
"What's wrong?" → wait → "What device?" → wait → "What model?" → wait
```

**After:**
```
"What's happening with it, and what device/model is it?"  (One question!)
```

### 3. ✅ Proactive Troubleshooting
**Before:**
```
Customer: "Black screen"
AI: "Bring it in for diagnosis"
```

**After:**
```
Customer: "Black screen"
AI: "Let's try a force restart first: [instructions]
     While you're trying that, any visible damage?
     If that doesn't help, screen replacements are £X..."
```

### 4. ✅ Smart Duplicate Prevention
- Never ignores real answers
- Only waits for vague responses
- Processes "iPhone 15" immediately

---

## What Migration 033 Adds

### New Modules:
1. **`duplicate_prevention`** (Priority 99)
   - Check if customer already answered
   - Don't ignore real answers
   - Process immediately vs wait

2. **`ask_whats_wrong_first`** (Priority 97)
   - Always ask issue before model
   - Can ask without knowing device
   - Ask multiple questions at once

3. **`proactive_troubleshooting`** (Priority 96)
   - Force restart instructions
   - Battery health check
   - Damage assessment

### Updated Modules:
1. **`core_identity`** (Priority 100)
   - Ask what's wrong FIRST
   - Ask multiple questions at once
   - Better formatting with line breaks

2. **`context_awareness`** (Priority 98)
   - Check if customer already answered
   - Efficient questioning

---

## Test After Applying

### Test 1: Ask What's Wrong First
**Send:** "My iPhone is broken"

**Expected:**
```
"What's happening with it, and what model - iPhone 12, 13, 14, 15, or 16?"
```

**NOT:**
```
"What model is your iPhone?"  ❌
```

### Test 2: Black Screen Troubleshooting
**Send:** "iPhone 13 black screen"

**Expected:**
```
"Let's try a force restart first:
1. Press Volume Up (quick tap)
2. Press Volume Down (quick tap)
3. Hold Side button until Apple logo appears

While you're trying that, any visible damage?

If that doesn't help, screen replacements for iPhone 13 are £110..."
```

### Test 3: No Duplicates
**Send:** "Hello"

**Expected:** ONE response only

---

## Why You Need This

Without migration 033:
- ❌ AI asks "What model?" without asking what's wrong
- ❌ AI asks one question at a time (slow)
- ❌ No troubleshooting help
- ❌ Might send duplicate messages

With migration 033:
- ✅ AI asks "What's wrong?" FIRST
- ✅ AI asks multiple questions at once (fast)
- ✅ Provides troubleshooting help
- ✅ Smart duplicate prevention

---

## Verification After Applying

Run this in SQL Editor:

```sql
SELECT module_name, priority, active, updated_at 
FROM prompts 
WHERE module_name IN (
  'duplicate_prevention',
  'ask_whats_wrong_first',
  'proactive_troubleshooting'
)
ORDER BY priority DESC;
```

Should return 3 rows with recent timestamps.

---

## Summary

**Current Issue:** AI not asking "what's wrong?" first
**Root Cause:** Migration 033 not applied to database
**Solution:** Apply migration 033 via Supabase SQL Editor
**Time:** 2 minutes

**Apply migration 033 NOW to fix this!** 🚀

---

## All Migrations Status

- ⏳ **Migration 033:** NOT APPLIED - Need to apply!
- ✅ **Migration 034:** APPLIED - Genuine battery £90, separator |||
- ⏳ **Migration 035:** NOT APPLIED - Popup warnings (apply after 033)

Apply in order: 033 → 035
