# Dual-Voice Interruption Issue

## Problem

AI Steve is still interrupting John sometimes, even though there's a 30-minute pause timer in place.

## Current Protection

**File:** `app/api/messages/incoming/route.ts` (lines 1145-1212)

**How it works:**
1. When customer message arrives, check for recent staff messages
2. If staff replied within last 30 minutes, check message type
3. Simple queries (hours, location, etc.) → AI responds
4. Complex queries (pricing, repairs, etc.) → AI pauses, creates alert

**Simple queries allowed during pause:**
- Hours: "When are you open?"
- Location: "Where are you located?"
- Directions: "How do I get there?"
- Contact: "What's your phone number?"
- **NEW:** Turnaround times: "How long does it take?"

**Complex queries blocked during pause:**
- Pricing: "How much for screen?"
- Status: "Is my phone ready?"
- Repairs: "Can you fix my laptop?"

## Why Interruptions Still Happen

**Possible causes:**

1. **Simple query detection too permissive**
   - Some queries classified as "simple" when they need context
   - Example: "When will it be ready?" could be simple (general) or complex (specific repair)

2. **30-minute window too short**
   - John may still be actively handling conversation after 30 minutes
   - Customer may respond slowly, extending conversation

3. **Acknowledgment detection issues**
   - AI might respond to acknowledgments when it shouldn't
   - Example: "Ok thanks" should not trigger AI response

4. **Race conditions**
   - Customer and John both send messages at similar times
   - AI processes customer message before seeing John's latest reply

## Monitoring

**Check Vercel logs for:**

```
[Staff Activity Check] Minutes since staff message: X.X
[Staff Activity Check] Should AI respond? false
[Staff Activity Check] Reason: Staff replied X minutes ago - waiting for staff
```

If you see interruptions, check:
- What was the customer's message?
- How many minutes since John's last message?
- Was it classified as simple or complex?
- Did AI respond when it shouldn't have?

## Potential Fixes

### Option 1: Extend Pause Window
Change from 30 minutes to 60 minutes for complex queries.

**File:** `app/lib/simple-query-detector.ts`
```typescript
const PAUSE_DURATION_MINUTES = 60; // Increased from 30
```

### Option 2: Stricter Simple Query Detection
Only allow truly factual queries during pause:
- Hours
- Location
- Directions
- Contact info

Remove from simple queries:
- Turnaround times (can be context-dependent)
- Any query with "my" in it

### Option 3: Manual Mode Lock
When John sends a message, lock conversation in manual mode until:
- John explicitly switches back to auto
- OR 24 hours pass with no activity

### Option 4: Smart Detection
Use AI to classify if message needs John's attention:
- Check conversation context
- Detect if customer is responding to John
- Only allow AI if clearly independent question

## Recommended Approach

**Short-term (immediate):**
1. Monitor logs to identify interruption patterns
2. Document specific cases where AI interrupted
3. Identify which queries are being misclassified

**Medium-term (this week):**
1. Tighten simple query detection
2. Consider extending pause window to 45-60 minutes
3. Add more specific patterns for complex queries

**Long-term (next month):**
1. Implement manual mode lock option
2. Add AI-based context detection
3. Create dashboard to track interruption rate

## Testing

**Test these scenarios:**

1. **John replies, customer asks general question 15 min later**
   - Message: "When are you open?"
   - Expected: AI responds (simple query)

2. **John replies, customer asks about their repair 15 min later**
   - Message: "Is my phone ready?"
   - Expected: AI pauses (complex query)

3. **John replies, customer acknowledges 5 min later**
   - Message: "Ok thanks"
   - Expected: AI pauses (acknowledgment)

4. **John replies, customer asks turnaround time 20 min later**
   - Message: "How long will it take?"
   - Expected: AI responds (simple query) - **NEW**

5. **John replies, customer asks about specific repair 20 min later**
   - Message: "When will my phone be ready?"
   - Expected: AI pauses (contains "my" = specific)

## Current Status

**Changes made:**
- ✅ Added turnaround time guidance module
- ✅ Added turnaround time to simple query detection
- ✅ Excludes queries with "my" from simple classification

**Still needed:**
- Monitor for interruption patterns
- Adjust pause window if needed
- Tighten simple query detection based on real cases

## Logs to Monitor

**Good behavior:**
```
[Staff Activity Check] Minutes since staff message: 15.2
[Staff Activity Check] Should AI respond? false
[Staff Activity Check] Reason: Staff replied 15 minutes ago - waiting for staff
```

**Interruption (bad):**
```
[Staff Activity Check] Minutes since staff message: 10.5
[Staff Activity Check] Should AI respond? true
[Staff Activity Check] Reason: Simple query exception
[Smart AI] Generating response...
```

If you see the second pattern frequently, we need to tighten the simple query detection.
