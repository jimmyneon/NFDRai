# Buyback Detection & Guidance Fix

## Problem

AI was incorrectly saying **"We don't buy old tech"** when customers asked about selling devices.

### Example of the Issue
```
Customer: "I've got some old tech laying about too any good? Do you buy stuff"
AI: "We don't typically buy old tech, but we can certainly help you recycle 
it responsibly."

Customer: "How about laptop"
AI: "If you're asking about recycling or selling your laptop, we don't buy 
old tech, but we can help you recycle it responsibly."
```

**This is completely wrong!** The business DOES buy devices under 6 years old and is always looking for phones, laptops, consoles, etc.

## Root Causes

### 1. Buyback Detection Not Triggered
**File:** `lib/ai/smart-response-generator.ts` line 424

**Problem:**
```typescript
const needsBuybackInfo = conversationText.includes('sell') || conversationText.includes('trade')
```

Customer said **"Do you buy stuff"** which contains "buy", not "sell" or "trade", so buyback module wasn't loaded!

**Fix:**
```typescript
const needsBuybackInfo = context.intent === 'buyback' || 
  conversationText.includes('sell') || 
  conversationText.includes('trade') || 
  conversationText.includes('buy') || 
  conversationText.includes('old tech')
```

### 2. Wrong Module Loaded
**File:** `lib/ai/smart-response-generator.ts` line 502

**Problem:**
```typescript
if (needsBuybackInfo && moduleName.includes('common_scenarios')) {
  shouldInclude = true
}
```

Only loaded `common_scenarios` module, NOT the dedicated `buyback` module with proper guidance!

**Fix:**
```typescript
if (needsBuybackInfo && (moduleName.includes('buyback') || moduleName.includes('common_scenarios'))) {
  shouldInclude = true
}
```

### 3. Missing Age Guidance
**File:** `supabase/migrations/013_prompt_modules.sql` - buyback module

**Problem:** Module didn't specify:
- Devices **under 6 years old** are actively bought
- Devices **over 6 years old** are typically recycling only
- Business is **always looking** for phones, laptops, consoles, etc.

**Fix:** Updated module with clear age guidance and enthusiastic buyback messaging.

## Changes Made

### 1. Code Fix: `lib/ai/smart-response-generator.ts`
- Added "buy" and "old tech" to buyback detection keywords
- Added `context.intent === 'buyback'` check
- Changed module loading to include dedicated `buyback` module

### 2. Database Fix: `supabase/migrations/022_fix_buyback_guidance.sql`
- Updated `buyback` module with clear age guidance (under 6 years)
- Added "NEVER SAY 'WE DON'T BUY OLD TECH'" instruction
- Updated `common_scenarios` module buyback section
- Added enthusiastic examples

## Expected Behavior After Fix

### Scenario 1: General Buyback Question
```
Customer: "Do you buy stuff?"
AI: "Absolutely! We buy iPhones, iPads, MacBooks, laptops, and consoles at 
good rates. What devices do you have? Send me the details and I'll get you 
a quote ASAP!"
```

### Scenario 2: "Old Tech" Mention
```
Customer: "I've got some old tech laying about"
AI: "We're always looking for phones, laptops, consoles, etc. - especially 
devices under 6 years old. What have you got? Send me the models and I'll 
let you know what we can offer!"
```

### Scenario 3: Specific Device
```
Customer: "How about laptop"
AI: "Yes! We buy laptops at good rates. What model is it, what's the storage 
size, and what condition is it in? I'll get you a quote ASAP, or pop in for 
an instant appraisal!"
```

### Scenario 4: Very Old Device
```
Customer: "I have a 2015 MacBook"
AI: "That's about 10 years old, so it's a bit older than what we typically 
buy. But bring it in and we can take a look - we can at least help with 
responsible recycling!"
```

## Buyback Guidelines

### What We Buy
✅ **Actively buying (under 6 years old):**
- iPhones
- iPads  
- MacBooks
- Laptops
- Consoles
- Other tech devices

⚠️ **Recycling only (over 6 years old):**
- Can still help with responsible disposal
- May offer small amount or free recycling

### Information Needed
1. Device model (exact model)
2. Storage size (64GB, 128GB, 256GB, etc.)
3. Condition (excellent, good, fair, poor)
4. Any issues? (screen cracks, battery health, etc.)
5. Box/accessories?
6. Age/year of device

### Response Template
```
"Yes! We buy [device type] at good rates. What have you got? Send me the 
model, storage size, and condition and I'll get you a quote ASAP, or pop 
in for an instant appraisal. We don't mess you about like the online shops!"
```

## Deployment

### 1. Apply Code Changes
The code changes in `lib/ai/smart-response-generator.ts` are already made and need to be deployed.

### 2. Apply Database Migration
```bash
psql $DATABASE_URL -f supabase/migrations/022_fix_buyback_guidance.sql
```

### 3. Restart Application
If using a server that needs restart:
```bash
# Restart your Next.js application
npm run build
# or restart your deployment
```

## Testing

### Test Case 1: "Do you buy" Question
```
Send: "Do you buy phones?"
Expected: "Yes! We buy iPhones, iPads, MacBooks, and laptops at good rates..."
```

### Test Case 2: "Old tech" Mention
```
Send: "I've got some old tech"
Expected: "We're always looking for phones, laptops, consoles, etc. - especially 
devices under 6 years old..."
```

### Test Case 3: Specific Device
```
Send: "Do you buy laptops?"
Expected: "Yes! We buy laptops at good rates. What model is it..."
```

### Test Case 4: General "Buy stuff"
```
Send: "Do you buy stuff?"
Expected: "Absolutely! We buy iPhones, iPads, MacBooks, laptops, and consoles..."
```

## Impact

### Before Fix
❌ Lost sales opportunities
❌ Customers thought business doesn't buy devices
❌ Incorrect information about services
❌ Missed buyback revenue

### After Fix
✅ Correct information about buyback services
✅ Enthusiastic response to buyback inquiries
✅ Clear age guidance (under 6 years)
✅ Captures all buyback-related keywords
✅ Loads proper buyback module with detailed guidance

## Related Files

- **Code:** `lib/ai/smart-response-generator.ts`
- **Migration:** `supabase/migrations/022_fix_buyback_guidance.sql`
- **Original Module:** `supabase/migrations/013_prompt_modules.sql`
- **Comprehensive Services:** `supabase/migrations/019_comprehensive_service_modules.sql`

## Notes

- The AI now detects buyback intent from "buy", "sell", "trade", "old tech" keywords
- Dedicated buyback module is now loaded when needed
- Clear guidance on age limits (under 6 years actively buying)
- Enthusiastic, positive messaging about buyback services
- Never says "we don't buy old tech" anymore

---

**Created:** 8 Nov 2024
**Priority:** Critical - Was losing sales opportunities
**Status:** Fixed - Ready to deploy
