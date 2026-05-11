# Fix 099: AI Not Responding - May 11, 2026

## Problem

After deploying migration 098 (comprehensive AI behavior fix), **AI stopped responding to most messages**.

### User Report:
- "It doesn't really reply to any message at all"
- "Somebody said 'I'll call in on Tuesday' - it should reply saying we're open, but it's not doing anything"
- "I don't think it's sent a message for quite a while"

---

## Root Cause

**Migration 098 was TOO aggressive.**

The staff message check (lines 1152-1167 in `incoming/route.ts`) was:
1. Looking for ANY staff message in last 10 messages
2. Finding staff messages from days/weeks ago
3. Applying the 5-minute "stay quiet" logic to OLD messages
4. Result: AI never responded because it always found an old staff message

### Example of the Bug:
```
Day 1: John sends message
Day 5: Customer: "I'll call in on Tuesday"
AI: [Finds John's message from Day 1]
AI: [Calculates: 5 days = 7200 minutes since staff message]
AI: [Applies shouldAIRespond() logic]
AI: [STAYS QUIET because it found a staff message]
```

The logic was checking `if (recentStaffMessage)` without checking **HOW RECENT** it was.

---

## Solution

### Fix 1: Add 30-Minute Time Limit

**File:** `app/api/messages/incoming/route.ts` (line 1167)

**Before:**
```typescript
if (recentStaffMessage && !justSwitchedToAuto) {
  const minutesSinceStaffMessage = ...
  const aiResponseDecision = shouldAIRespond(...)
```

**After:**
```typescript
// CRITICAL FIX: Only apply staff message check if staff message is RECENT (< 30 minutes)
// Otherwise AI will never respond because it finds old staff messages
let minutesSinceStaffMessage = Infinity;
if (recentStaffMessage) {
  minutesSinceStaffMessage = (Date.now() - new Date(recentStaffMessage.created_at).getTime()) / 1000 / 60;
}

if (recentStaffMessage && minutesSinceStaffMessage < 30 && !justSwitchedToAuto) {
  const aiResponseDecision = shouldAIRespond(...)
```

**Key Change:** Added `&& minutesSinceStaffMessage < 30` condition

**Result:**
- Staff message < 30 min old → Apply pause logic
- Staff message > 30 min old → AI responds normally
- No staff message → AI responds normally

---

### Fix 2: Increase Missed Call Cooldown

**File:** `app/api/messages/missed-call/route.ts` (line 72-74)

**Before:**
```typescript
windowMs: 2 * 60 * 1000, // 2 minutes
```

**After:**
```typescript
windowMs: 30 * 60 * 1000, // 30 minutes
```

**Why:** Prevents spam when someone repeatedly calls. 2 minutes was too short.

---

## Behavior After Fix

### Scenario 1: Old Staff Message (> 30 min)
```
John: [messaged 2 days ago]
Customer: "I'll call in on Tuesday"
✅ AI: "Great! We're open Tuesday 10am-5pm..."
```

### Scenario 2: Recent Staff Message (< 5 min)
```
John: "Would you like me to proceed?" [2 min ago]
Customer: "Yes please"
✅ AI: [STAYS QUIET - customer answering John]
```

### Scenario 3: Staff Message 10 Min Ago
```
John: "Your phone is ready" [10 min ago]
Customer: "When are you open tomorrow?"
✅ AI: "We're open 10am-5pm tomorrow..."
```

### Scenario 4: No Recent Staff Activity
```
[No staff messages in last 30 min]
Customer: "Do you fix Samsung phones?"
✅ AI: "Yes, we repair Samsung phones..."
```

---

## Files Changed

1. **app/api/messages/incoming/route.ts**
   - Added 30-minute time limit to staff message check
   - Only applies pause logic if staff message is recent

2. **app/api/messages/missed-call/route.ts**
   - Increased cooldown from 2 minutes to 30 minutes
   - Prevents missed call spam

3. **supabase/migrations/099_fix_ai_not_responding.sql**
   - Updated prompt documentation
   - Clarified 30-minute window behavior

---

## Testing

### Before Fix:
- AI: Silent on most messages ❌
- Logs: "Customer responding to John's message - staying quiet" (for old messages)

### After Fix:
- AI: Responds normally to new conversations ✅
- AI: Still stays quiet when customer talks to John ✅
- AI: Respects 30-minute pause window ✅

---

## Deployment

```bash
git add .
git commit -m "Fix: AI not responding (099) - limit staff check to 30min window"
git push
```

Migration 099 runs automatically on Vercel.

---

## Rollback

If issues occur:

```bash
git revert HEAD
```

Or manually:
```typescript
// Remove the 30-minute check
if (recentStaffMessage && !justSwitchedToAuto) {
  // Old behavior
}
```

---

## Summary

**Problem:** AI stopped responding after migration 098  
**Cause:** Staff message check found old messages and stayed quiet forever  
**Fix:** Only check staff messages < 30 minutes old  
**Result:** AI responds normally while still respecting recent staff activity

**Migration 098:** Too aggressive ❌  
**Migration 099:** Just right ✅
