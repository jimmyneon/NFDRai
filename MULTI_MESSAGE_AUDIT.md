# Multi-Message (|||) Usage Audit

## Current Implementation

The AI can send multiple messages by using `|||` as a separator. The system automatically:
1. Splits the response by `|||`
2. Sends each message separately
3. Adds 2-second delay between messages
4. Each message gets its own signature

**Code Location:** `/lib/ai/smart-response-generator.ts` (lines 340-342)

```typescript
const responses = finalResponse.includes('|||')
  ? finalResponse.split('|||').map((msg: string) => msg.trim())
  : [finalResponse]
```

## Problem Identified

**CRITICAL ISSUE:** First AI disclosure is being appended to the first response, not sent as a separate message.

**Current Behavior:**
```
Message 1: "Hi! I'm AI Steve, your automated assistant for New Forest Device Repairs.

I can help with pricing, bookings, and questions.

For an iPhone 12 screen repair, we have genuine Apple screens from £150..."
```

**Desired Behavior:**
```
Message 1: "Hi! I'm AI Steve, your automated assistant for New Forest Device Repairs.

I can help with pricing, bookings, and questions.

Many Thanks,
AI Steve,
New Forest Device Repairs"

[2 second delay]

Message 2: "For an iPhone 12 screen repair, we have genuine Apple screens from £150..."
```

## Where ||| Is Currently Used

### 1. System Prompt Guidance
**File:** `/lib/ai/smart-response-generator.ts` (lines 584-588)
```
MULTIPLE MESSAGES:
- If response has multiple parts, BREAK INTO SEPARATE MESSAGES with |||
- Example: "Main answer|||By the way, battery combo is £20 off!"
- Each message needs its own signature
- Feels more natural and conversational
```

### 2. Pricing Flow Module
**File:** `/supabase/migrations/019_comprehensive_service_modules.sql` (lines 78-101)

**Current Guidance:**
- First message: Present options only
- Second message: Main confirmation
- Third message: Battery upsell

**BUT:** Doesn't explicitly mention using `|||` separator!

### 3. Update System Prompt
**File:** `/update-system-prompt-final.sql` (lines 80-91)

Good guidance on when to split:
- Main quote/answer → THEN battery upsell
- Confirmation → THEN next steps
- Answer → THEN additional helpful info

## Opportunities to Use ||| More

### HIGH PRIORITY - Always Use |||

#### 1. **First AI Disclosure (CRITICAL)**
**When:** First message to any customer
**Current:** Appended to first response
**Should Be:** Separate message

**Example:**
```
"Hi! I'm AI Steve, your automated assistant for New Forest Device Repairs.

I can help with pricing, bookings, and questions.

Many Thanks,
AI Steve,
New Forest Device Repairs|||For an iPhone 12 screen repair, we have genuine Apple screens from £150, or our high-quality OLED option at £100. Which option interests you?"
```

#### 2. **Screen Repair Pricing Flow**
**When:** Customer asks for screen price
**Current:** Sometimes used, not consistent
**Should Be:** Always use 3 messages

**Example:**
```
Message 1: "We have genuine Apple screens from £150, or our high-quality OLED option at £100 - very similar quality, most people don't see a difference, and comes with a 12-month warranty. Which option interests you?"

Message 2: "Perfect! So that's an iPhone 12 screen replacement with high-quality OLED at £100. We stock OLED screens so we can do that same day, usually within an hour. John will check over the quote and stock when you come in and confirm everything. Just pop in whenever suits you!"

Message 3: "By the way, if your battery's not holding charge as well, we do £20 off battery replacements when done with a screen - so it'd be £30 instead of £50. Just a heads-up!"
```

#### 3. **Battery Upsells**
**When:** After confirming any repair
**Current:** Sometimes mentioned in same message
**Should Be:** Always separate message

**Example:**
```
"Perfect! So that's an iPhone 12 screen replacement at £100. We can do that same day.

Many Thanks,
AI Steve,
New Forest Device Repairs|||By the way, if your battery's not holding charge as well, we do £20 off battery replacements when done with a screen - so it'd be £30 instead of £50. Just a heads-up!

Many Thanks,
AI Steve,
New Forest Device Repairs"
```

#### 4. **Holiday Mode Notices**
**When:** Business is closed for holiday
**Current:** All in one message
**Should Be:** Separate messages

**Example:**
```
"🎄 HOLIDAY NOTICE: Closed Dec 25-26 for Christmas
We'll be back December 27th.

Many Thanks,
AI Steve,
New Forest Device Repairs|||For iPhone screen repair, typically £80-120.

However, John will confirm the exact quote when he returns.

In the meantime, I can help with estimates and information!

Many Thanks,
AI Steve,
New Forest Device Repairs"
```

### MEDIUM PRIORITY - Consider Using |||

#### 5. **Warranty Information**
**When:** After confirming repair price
**Current:** Often in same message
**Should Consider:** Separate message

**Example:**
```
"For an iPhone 12 screen replacement, it's typically around £100.

Many Thanks,
AI Steve,
New Forest Device Repairs|||Just so you know, all our screen replacements come with a 12-month warranty!

Many Thanks,
AI Steve,
New Forest Device Repairs"
```

#### 6. **Business Hours + Answer**
**When:** Customer asks question outside hours
**Current:** All in one message
**Should Consider:** Separate messages

**Example:**
```
"We're currently closed - we open tomorrow at 10:00 AM.

Many Thanks,
AI Steve,
New Forest Device Repairs|||For an iPhone screen repair, it's typically around £80-120. John will confirm the exact price when you come in.

Many Thanks,
AI Steve,
New Forest Device Repairs"
```

#### 7. **Diagnostic + Next Steps**
**When:** Customer describes issue
**Current:** All in one message
**Should Consider:** Separate messages

**Example:**
```
"That sounds like it could be a screen issue or a motherboard problem. We offer free diagnostics to check what's wrong.

Many Thanks,
AI Steve,
New Forest Device Repairs|||Just pop in whenever suits you - diagnostics usually take 15-30 minutes depending on how busy we are.

Many Thanks,
AI Steve,
New Forest Device Repairs"
```

#### 8. **Multiple Repair Discount**
**When:** Customer asks about multiple repairs
**Current:** All in one message
**Should Consider:** Separate messages

**Example:**
```
"For an iPhone screen and battery, that would typically be around £130-170.

Many Thanks,
AI Steve,
New Forest Device Repairs|||We often make it cheaper if you get multiple things done at the same time - John will give you a custom quote when you come in!

Many Thanks,
AI Steve,
New Forest Device Repairs"
```

### LOW PRIORITY - Optional Use

#### 9. **Buyback Inquiries**
**When:** Customer wants to sell device
**Current:** All in one message
**Could Use:** Separate messages for details request

#### 10. **Troubleshooting Steps**
**When:** Customer has issue that might be fixable
**Current:** All in one message
**Could Use:** Separate messages for each step

## Benefits of Using ||| More

### User Experience
1. **Less Overwhelming** - Shorter messages easier to read on phone
2. **More Natural** - Feels like real conversation, not a wall of text
3. **Better Pacing** - 2-second delay gives time to absorb info
4. **Clearer Structure** - Each message has one clear purpose

### Business Benefits
1. **Higher Engagement** - Multiple messages = more touchpoints
2. **Better Upsells** - Separate battery message after commitment
3. **Professional** - Shows attention to detail
4. **Memorable** - Stands out from competitors

### Technical Benefits
1. **SMS Compatibility** - Shorter messages less likely to split badly
2. **Better Tracking** - Each message tracked separately
3. **Easier Debugging** - Can see which message failed
4. **More Flexible** - Can adjust timing between messages

## Current Limitations

### 1. No Signature Auto-Addition Per Message
**Issue:** AI must manually add signature to each message
**Risk:** AI might forget signature on some messages
**Solution:** Could auto-add signature to each split message

### 2. Fixed 2-Second Delay
**Issue:** Same delay for all messages
**Opportunity:** Could vary delay based on message length/importance

### 3. No Duplicate Prevention Between Messages
**Issue:** AI could send similar info in multiple messages
**Current:** Duplicate prevention only checks within same message set
**Risk:** Low - AI usually generates distinct messages

## Recommendations

### IMMEDIATE (Critical)
1. ✅ **Fix first AI disclosure to always send separately**
   - Modify `/lib/ai/smart-response-generator.ts`
   - Use `|||` to split disclosure from first response
   - Ensures disclosure is always its own message

### HIGH PRIORITY
2. ✅ **Update pricing flow module to explicitly use |||**
   - Modify `/supabase/migrations/019_comprehensive_service_modules.sql`
   - Add explicit `|||` examples
   - Make it clear AI should split messages

3. ✅ **Add multi-message examples to core identity**
   - Show AI exactly how to format multi-message responses
   - Include signature on each message

### MEDIUM PRIORITY
4. **Create multi-message best practices module**
   - When to split messages
   - How to structure each message
   - Examples for common scenarios

5. **Add logging for multi-message usage**
   - Track how often AI uses `|||`
   - Monitor if messages are being split effectively
   - Identify opportunities for improvement

### LOW PRIORITY
6. **Auto-add signatures to split messages**
   - System automatically adds signature to each message
   - Reduces risk of missing signatures
   - Less prompt tokens needed

7. **Variable delays between messages**
   - Longer messages = longer delay
   - Important messages = shorter delay
   - More natural pacing

## Testing Plan

### Test Cases
1. First message to new customer → Should be 2 messages (disclosure + response)
2. Screen repair quote → Should be 2-3 messages (options, confirmation, upsell)
3. Holiday mode response → Should be 2 messages (notice + answer)
4. Battery upsell → Should be separate message
5. Warranty info → Should be separate message (optional)

### Success Criteria
- ✅ First AI disclosure ALWAYS sent separately
- ✅ Screen pricing flow uses 2-3 messages
- ✅ Battery upsells sent separately
- ✅ Each message has proper signature
- ✅ 2-second delay between messages
- ✅ No duplicate content between messages

## Files to Modify

1. `/lib/ai/smart-response-generator.ts` - Fix first AI disclosure
2. `/supabase/migrations/019_comprehensive_service_modules.sql` - Update pricing flow
3. `/supabase/migrations/NEW_multi_message_improvements.sql` - New module
4. `MULTI_MESSAGE_AUDIT.md` - This document
5. `DEPLOY_MULTI_MESSAGE_FIX.sh` - Deployment script

## Cost Impact

**No additional cost** - Same AI calls, just better formatting of responses.

## Timeline

- **Immediate:** Fix first AI disclosure (30 min)
- **Today:** Update pricing flow module (1 hour)
- **This Week:** Add multi-message best practices (2 hours)
- **Next Week:** Testing and refinement (ongoing)
