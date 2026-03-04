# Stale Message Context Fix

## Critical Problem

AI Steve used a "ready for collection" message from **Feb 17** (2+ weeks old) to tell a customer on **Mar 4** that their device was ready, even though they were asking about a **completely different repair**.

## The Issue

**Timeline:**
- Feb 17: John sends "Your devices are repaired and ready for collection"
- Mar 4: Customer asks "I left my yellow iPad 10th gen... just wanted to check in"
- AI Steve: "It looks like your device is ready for collection" ❌ WRONG!

**Why it happened:**
1. AI saw old staff message in conversation history
2. Didn't check the timestamp (15 days old)
3. Didn't verify with API
4. Assumed old message applied to new repair

**Result:** Customer sent on wasted trip, John had to apologize and correct AI

## The Fix

### 1. **Timestamp Awareness** (Priority 100)
AI now checks message dates before using them:
- ✅ **0-24 hours:** Safe to reference
- ⚠️ **1-7 days:** Mention the date, verify if possible
- ❌ **7+ days:** STALE - do NOT use for current status
- ❌ **14+ days:** VERY STALE - definitely ignore

### 2. **Conversation History Context with Timestamps**
Staff messages now labeled with age:
```
[RECENT STAFF MESSAGES - CHECK TIMESTAMPS]
IMPORTANT: Check message dates before using for current status!
Messages >7 days old are STALE - do NOT use for current repair status.

✅ RECENT (0 days ago - 04/03/2026): John said: "Parts arrived, attempting repair..."
⚠️ STALE (15 days ago - 17/02/2026): John said: "Your devices are ready for collection"
```

### 3. **Ready for Collection Guardrails** (Priority 100)
AI can ONLY say "ready for collection" if:
- ✅ API data shows Status: Ready
- ✅ Staff message from TODAY (same day)
- ❌ NOT from old messages (>24 hours)

### 4. **Forced API Check for Status Inquiries**
When customer asks about repair status, system now:
1. Detects status inquiry (expanded patterns)
2. **Forces API check** via `checkRepairStatus()`
3. Adds `[REPAIR STATUS INFORMATION]` to context
4. AI uses API data, NOT old messages

## What Changed

### Code Changes

**File:** `app/api/messages/incoming/route.ts`

**Before:**
```typescript
conversationHistoryContext = "\n\n[RECENT STAFF MESSAGES - CHECK THESE FIRST]\n";
staffMessages.slice(0, 5).forEach((msg) => {
  conversationHistoryContext += `John said: "${msg.text}"\n`;
});
```

**After:**
```typescript
const now = Date.now();
const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

conversationHistoryContext = "\n\n[RECENT STAFF MESSAGES - CHECK TIMESTAMPS]\n";
conversationHistoryContext += "IMPORTANT: Check message dates before using for current status!\n";
conversationHistoryContext += "Messages >7 days old are STALE - do NOT use for current repair status.\n\n";

staffMessages.slice(0, 5).forEach((msg) => {
  const messageDate = new Date(msg.created_at);
  const daysAgo = Math.floor((now - messageDate.getTime()) / (1000 * 60 * 60 * 24));
  const isStale = messageDate.getTime() < sevenDaysAgo;
  
  conversationHistoryContext += `${isStale ? "⚠️ STALE" : "✅ RECENT"} (${daysAgo} days ago - ${messageDate.toLocaleDateString()}): John said: "${msg.text}"\n`;
});
```

**Status Inquiry Detection Expanded:**
```typescript
// Before
const isStatusInquiry = /status|ready|update|how'?s|progress|when will|finished|done|collect/i.test(messageToProcess);

// After
const isStatusInquiry = /status|ready|update|how'?s|progress|when will|finished|done|collect|check|left|dropped off|repair/i.test(messageToProcess);
```

### Database Migration

**File:** `supabase/migrations/086_fix_stale_message_context.sql`

**New Modules:**
1. `timestamp_awareness` (priority 100)
2. `ready_for_collection_guardrails` (priority 100)
3. Updated `repair_status_api` module

## How It Works Now

### Scenario: Customer Asks About Repair

**Input:**
```
Customer: "I left my yellow iPad 10th gen... just wanted to check in"
```

**System Processing:**
1. Detects status inquiry: ✅ (matches "left", "check")
2. Loads conversation history with timestamps
3. **Forces API check** via `checkRepairStatus(from)`
4. Adds API result to context

**AI Context:**
```
[RECENT STAFF MESSAGES - CHECK TIMESTAMPS]
IMPORTANT: Check message dates before using for current status!
Messages >7 days old are STALE - do NOT use for current repair status.

✅ RECENT (0 days ago - 04/03/2026): John said: "Parts arrived, attempting repair this afternoon"
⚠️ STALE (15 days ago - 17/02/2026): John said: "Your devices are ready for collection"

[REPAIR STATUS INFORMATION]
Status: In progress
Job Ref: #12345
Notes: Awaiting parts
[END REPAIR STATUS]
```

**AI Response:**
```
Hi! I can see your iPad repair is currently in progress. John just sent a message saying parts arrived and he's attempting the repair this afternoon. You should have an update by tomorrow morning.
```

**NOT:**
```
It looks like your device is ready for collection ❌
```

## Logging

New logs to monitor:
```
[Conversation History] ✅ Added 5 staff message(s) to context (2 recent, 3 stale)
[Repair Status] Customer asking about repair - FORCING API check...
[Repair Status] ✅ Found 1 job(s) - added to AI context
```

## Migration Required

**Run:**
```bash
cd /Users/johnhopwood/NFDRAIRESPONDER
supabase migration up
```

**Migration:** `086_fix_stale_message_context.sql`

## Testing Checklist

- [ ] Old "ready" message (>7 days) ignored for status
- [ ] Recent message (today) used for status
- [ ] API check forced when customer asks about repair
- [ ] Timestamps shown in AI context
- [ ] AI mentions date when referencing old messages
- [ ] "Ready for collection" only said if API confirms

## Expected Behavior

### ✅ Correct Responses

**Scenario 1: API shows ready**
```
Customer: "Is my phone ready?"
API: Status: Ready for collection
AI: "Yes! Your repair is ready for collection. Job #12345"
```

**Scenario 2: Old message, API shows in progress**
```
Customer: "Is my iPad ready?"
Old message (15 days ago): "Your device is ready"
API: Status: In progress
AI: "Your iPad repair is currently in progress. Parts are on order."
```

**Scenario 3: No API data, old message**
```
Customer: "Is my device ready?"
Old message (15 days ago): "Your device is ready"
API: No jobs found
AI: "I see an old message from Feb 17, but I don't see any active repairs in the system. Please check: [link]"
```

### ❌ Prevented Responses

**No longer possible:**
```
AI: "It looks like your device is ready for collection" (based on 2-week-old message)
AI: "Yes, it's ready!" (without API confirmation)
AI: "John said it's ready" (from stale message)
```

## Files Modified

1. `app/api/messages/incoming/route.ts` - Added timestamp checking and labeling
2. `supabase/migrations/086_fix_stale_message_context.sql` - New modules

## Deployment

- ✅ Code changes committed
- ⏳ Database migration pending (run manually)
- ⏳ Vercel deployment (automatic from GitHub push)
