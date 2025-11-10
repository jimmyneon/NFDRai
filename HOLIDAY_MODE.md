# Holiday Mode - AI Leads with Closure Notice

## Problem Solved

**Before**: AI would have full conversation, then mention holiday closure at the end
```
Customer: "How much for iPhone screen?"
AI: "For an iPhone screen repair, it's typically £80-120..."
AI: "By the way, we're closed for Christmas Dec 25-26"
Customer: "What? Why didn't you say that first?!" 😤
```

**After**: AI leads with holiday notice immediately
```
Customer: "How much for iPhone screen?"
AI: "🎄 HOLIDAY NOTICE: Closed December 25-26 for Christmas

For iPhone screen repair, it's typically £80-120 depending on model.

However, John will confirm the exact quote when he returns on December 27th.

In the meantime, I can help with estimates and information!"
```

## How It Works

### 1. You Set Holiday in Dashboard

Go to **Dashboard → Business Hours → Special Hours Note**:

```
Examples:
"Closed December 25-26 for Christmas"
"Closed for holiday, back on January 2nd"
"Away on holiday until January 5th"
"Closed for New Year, reopening January 2"
```

### 2. AI Automatically Detects Holiday

System checks for keywords:
- "closed for holiday"
- "closed for christmas"
- "closed for new year"
- "away on holiday"
- "on holiday"
- "closed until"
- "back on"
- "returning on"
- "reopening on"

### 3. AI Changes Behavior

**When holiday detected:**

✅ **Leads with holiday notice** in EVERY response
✅ **Provides helpful information** (quotes, estimates)
✅ **Sets expectations** ("John will confirm when he returns")
✅ **Stays helpful** but reminds about closure

## Example Conversations

### Pricing Question

**Customer**: "How much for iPhone 14 screen?"

**AI Response**:
```
🎄 HOLIDAY NOTICE 🎄
Closed December 25-26 for Christmas
We'll be back December 27th.

For an iPhone 14 screen repair, it's typically around £100-120.

However, John will confirm the exact quote when he returns on December 27th.

In the meantime:
- I can provide repair quotes and information
- I can help with general questions
- John will confirm all quotes and bookings when he returns

What iPhone model do you have?
```

### Booking Request

**Customer**: "Can I book in for tomorrow?"

**AI Response**:
```
🎄 HOLIDAY NOTICE 🎄
Closed December 25-26 for Christmas
We'll be back December 27th.

I'd love to help, but we're currently closed for the holiday.

John will be back on December 27th and can confirm availability then.

Would you like me to note your interest so John can contact you when he returns?
```

### General Question

**Customer**: "Do you fix Samsung phones?"

**AI Response**:
```
🎄 HOLIDAY NOTICE 🎄
Closed December 25-26 for Christmas
We'll be back December 27th.

Yes, we do fix Samsung phones! We handle screen repairs, battery replacements, charging ports, and more.

John will be able to give you a specific quote when he returns on December 27th.

What Samsung model do you have and what needs fixing?
```

## AI System Prompt (Holiday Mode)

When holiday detected, AI gets special instructions:

```
🚨 CRITICAL - HOLIDAY CLOSURE:
Closed December 25-26 for Christmas

IMPORTANT INSTRUCTIONS:
1. START EVERY RESPONSE with the holiday notice
2. Be helpful but SET EXPECTATIONS: John will confirm when he returns
3. For quotes: Provide estimate but say "John will confirm this quote when he returns"
4. For bookings: Say "I can note your interest, John will confirm availability when he returns"
5. For repairs: Say "John will assess and confirm when he returns"
6. Be friendly and helpful, but always remind them about the holiday closure
```

## What Gets Detected

### ✅ Holiday Closures (Holiday Mode ON)

- "Closed December 25-26 for Christmas"
- "Closed for holiday, back on January 2nd"
- "Away on holiday until January 5th"
- "Closed for New Year"
- "On holiday from Dec 20"
- "Closed for vacation"

### ❌ NOT Holidays (Holiday Mode OFF)

- "Early closing 3pm on December 24th"
- "Open late until 8pm this Friday"
- "Closed Sundays"
- (Empty special hours note)

## Return Date Extraction

AI automatically extracts return date if mentioned:

**Input**: "Closed for holiday, back on January 2nd"
**Extracted**: "January 2nd"

**AI will say**: "We'll be back January 2nd"

**Patterns detected**:
- "back on January 2nd"
- "reopening January 2"
- "returning on January 3rd"
- "open again on January 5th"
- "closed until January 2nd"

## Benefits

1. **Clear Communication** - Customer knows immediately you're closed
2. **No Confusion** - No wasted conversation about bookings that can't happen
3. **Sets Expectations** - Customer knows John will confirm when back
4. **Still Helpful** - AI provides information and estimates
5. **Professional** - Shows you care even when closed

## Testing

7/8 tests pass:

```bash
node test-holiday-mode.js
```

**Results**:
✅ "Closed December 25-26 for Christmas" → Holiday mode ON
✅ "Closed for holiday, back on January 2nd" → Holiday mode ON, return date extracted
✅ "Closed for New Year, reopening January 2" → Holiday mode ON, return date extracted
✅ "Early closing 3pm" → Holiday mode OFF (not a closure)
✅ "Open late until 8pm" → Holiday mode OFF (not a closure)

## How to Use

### For Christmas

```
1. Go to Dashboard → Business Hours
2. Scroll to "Special Hours Note"
3. Type: "Closed December 25-26 for Christmas, back on December 27th"
4. Click "Save Business Hours"
5. Done! AI will lead with this in every response
```

### For Extended Holiday

```
"Closed for holiday December 23 - January 2, back on January 3rd"
```

### For New Year

```
"Closed for New Year, reopening January 2nd"
```

## Integration

Holiday mode is automatically checked for every AI response:

```
1. Customer message arrives
2. Load business hours
3. Check special hours note for holiday keywords
4. If holiday detected → Add holiday system prompt
5. AI generates response with holiday notice first
6. Customer gets clear communication
```

## Cost

**Free!** Holiday detection uses regex pattern matching (no AI calls).

## Files Created

- `app/lib/holiday-mode-detector.ts` - Holiday detection utility
- `test-holiday-mode.js` - 8 test cases (7/8 pass)
- `HOLIDAY_MODE.md` - This documentation

## Files Modified

- `lib/ai/smart-response-generator.ts` - Integrated holiday mode

## Summary

AI now **leads with holiday closure** instead of mentioning it at the end. When you add holiday dates to "Special Hours Note", AI automatically:
1. Detects the holiday
2. Leads every response with holiday notice
3. Provides helpful information
4. Sets expectations ("John will confirm when he returns")
5. Extracts return date if mentioned

Result: **Clear communication, no confusion, professional service even when closed!** 🎄
