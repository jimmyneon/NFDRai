# AI Steve Improvements - April 2026

## Summary
Fixed AI Steve's over-promising behavior, improved staff coordination, and made responses more conservative and accurate.

## Problems Fixed

### 1. **Over-Promising on Appointments/Bookings**
**Problem:** AI was confirming appointments and times directly without John's approval
- ❌ "Great! You can drop by anytime after 12 tomorrow"
- ❌ "Perfect! Come in Monday and we'll get it sorted"
- ❌ "You can pop in during opening hours"

**Solution:** AI now defers to John for all appointment confirmations
- ✅ "John will confirm a time with you ASAP"
- ✅ "John will be in touch to arrange a convenient time"
- ✅ "I've noted Monday as your preference. John will confirm availability"

### 2. **Competing with John's Messages**
**Problem:** AI responded immediately after John sent a message, even when customer was clearly responding to John
- John: "Which day is convenient for you?"
- Customer: "Monday would be good"
- AI: ❌ "Great, Monday works! I'll let the team know..."

**Solution:** AI now detects when customer is responding to John and stays quiet
- Checks if John sent a message in last 5 minutes
- Detects direct answers like "Monday would be good", "Yes, that works", etc.
- Stays silent to let John handle the conversation
- ✅ AI stays quiet when customer is clearly responding to John

### 3. **Making Stuff Up / Affirming Without Data**
**Problem:** AI was too confident and affirmed things without checking
- ❌ "Yes, we can fix that! Pop in during opening hours"
- ❌ "We can definitely help with that!"
- ❌ "Sure, that's something we do!"

**Solution:** AI now checks data first or routes to website
- ✅ "You can get a quote here: [website link]"
- ✅ Only affirms high-level services: "Yes, we fix iPhones"
- ✅ Routes to website for specific capabilities
- ✅ Says "John will assess and confirm" when uncertain

### 4. **Name Usage Issues**
**Problem:** AI was still using names incorrectly despite previous fixes
- ❌ "Tracy!" (shouting names)
- ❌ Using names extracted from partner messages

**Solution:** Already fixed in migration 093 - AI never uses names
- ✅ Always uses "Hi!" or "Hi there!"
- ✅ No more name mistakes

## Changes Made

### Database Migration: `096_fix_overpromising_and_staff_handoff.sql`

Created 3 new high-priority prompt modules:

#### 1. `booking_appointment_protocol` (Priority 100)
- Never confirm appointments/bookings directly
- Always say "John will confirm"
- Provides clear examples of wrong vs right responses
- Special handling for quote acceptance (can mention bringing in + confirmation text)

#### 2. `staff_message_awareness` (Priority 100)
- Reads John's messages in conversation history
- Detects when customer is responding to John
- Stays quiet when customer is clearly talking to John
- Only responds to NEW questions, not responses to John

#### 3. `no_affirmation_without_data` (Priority 100)
- Never affirm capabilities without checking data
- Routes to website instead of over-promising
- Only affirms factual info (hours, location, high-level services)
- Default: "You can get a quote here: [link]"

### Code Changes: `simple-query-detector.ts`

Added new function `isRespondingToStaff()`:
- Detects direct answers to John's questions
- Patterns: "Monday would be good", "Yes, that works", "Today", "Tomorrow"
- Only triggers if John messaged in last 5 minutes
- Prevents AI from competing with John

Updated `shouldAIRespond()`:
- More conservative after staff messages
- Checks if customer is responding to John
- Stays quiet when appropriate
- Better logging for debugging

### Code Changes: `smart-response-generator.ts`

Updated CRITICAL RULES:
- Added Rule 8: Booking/Appointment Rule - always say "John will confirm"
- Added Rule 9: Staff Message Rule - read John's messages, stay quiet if customer responding

Updated STRICTLY FORBIDDEN:
- Never confirm appointments or booking times directly
- Never say "pop in during opening hours" (say "John will confirm a time")
- Never affirm capabilities without checking data first

## Examples of Improved Behavior

### Example 1: Booking Request
**Customer:** "Can I bring it in tomorrow?"

**Before:**
❌ "Yes! Pop in anytime after 10am tomorrow"

**After:**
✅ "John will confirm a time with you ASAP. We're open 10am-5pm tomorrow if that helps with planning."

---

### Example 2: Responding to John
**Conversation:**
- John: "Which day is convenient for you to pop it into us?"
- Customer: "Monday would be good"

**Before:**
❌ AI: "Great, Monday works for you. I'll make sure the team knows..."

**After:**
✅ AI stays quiet (customer is responding to John's question)

---

### Example 3: Capability Question
**Customer:** "Can you fix my Dell laptop keyboard?"

**Before:**
❌ "Yes, we can fix that! Pop in during opening hours"

**After:**
✅ "You can get a quote here: https://www.newforestdevicerepairs.co.uk/repair-request"

---

### Example 4: After John's Message
**Conversation:**
- John: "The part is now in and ready to go. Let me know a time that suits"
- Customer: "When are you open tomorrow?"

**Before:**
❌ "We're open 10am-5pm tomorrow. You can come by anytime!"

**After:**
✅ "We're open 10am-5pm tomorrow. John mentioned the part is ready, so you can come by anytime within those hours." (References John's context)

## Testing Recommendations

### Test Case 1: Booking Request
Send: "Can I book in for tomorrow?"
Expected: AI says "John will confirm a time with you ASAP"
Should NOT say: "Pop in anytime" or confirm specific times

### Test Case 2: Staff Message Response
1. John sends: "Which day works for you?"
2. Customer replies: "Monday would be good"
Expected: AI stays quiet
Should NOT: Respond with "Great, Monday works!"

### Test Case 3: Capability Question
Send: "Can you fix water damage?"
Expected: AI routes to website for quote
Should NOT say: "Yes, we can fix that! Bring it in"

### Test Case 4: Quote Acceptance
Send: "Yes please" (after receiving a quote)
Expected: AI can say "You can bring it in during opening hours. You'll get a confirmation text"
This is OK because quote is already confirmed

## Deployment

1. **Apply migration:**
   ```bash
   # Migration will auto-apply on next deploy
   git add supabase/migrations/096_fix_overpromising_and_staff_handoff.sql
   git commit -m "Fix AI Steve over-promising and staff coordination"
   git push
   ```

2. **Code changes already applied:**
   - `app/lib/simple-query-detector.ts` - Updated
   - `lib/ai/smart-response-generator.ts` - Updated

3. **Verify in production:**
   - Test booking requests
   - Test responses after John sends messages
   - Check logs for "Staff response check" messages

## Monitoring

Look for these log messages:

```
[AI Response Check] Acknowledgment check: { isAcknowledgment: true }
→ AI staying quiet (customer acknowledgment)

[AI Response Check] Staff response check: { isRespondingToStaff: true }
→ AI staying quiet (customer responding to John)

[AI Response Check] Staff response check: { isRespondingToStaff: false }
→ AI can respond (new question, not responding to John)
```

## Key Principles

1. **Conservative Approach:** When in doubt, defer to John
2. **No Over-Promising:** Never confirm appointments, times, or capabilities without data
3. **Respect Staff Context:** Read John's messages, don't compete with him
4. **Route to Website:** Better to route than to over-promise
5. **"John Will Confirm":** Default phrase for all booking/appointment requests

## Benefits

- ✅ No more wasted trips (customers won't show up expecting appointments AI confirmed)
- ✅ No more competing with John (AI stays quiet when appropriate)
- ✅ No more over-promising (AI routes to website instead of affirming blindly)
- ✅ Better customer experience (clear expectations, no confusion)
- ✅ Less manual cleanup (John doesn't have to correct AI's mistakes)

## Notes

- Name usage already disabled in migration 093 (AI never uses names)
- AI pause logic updated to be more conservative after staff messages
- All changes are backward compatible
- No breaking changes to existing functionality
