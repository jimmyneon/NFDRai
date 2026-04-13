# Buyback/Sell Quote Handling Fix

## Problem

The quote system wasn't distinguishing between **repair quotes** and **buyback/sell quotes**:

1. ❌ **Dashboard** - Sell quotes showed up mixed with repair quotes (though they were separated)
2. ❌ **AI Context** - AI Steve didn't know if customer wanted to sell or repair their device
3. ❌ **AI Responses** - AI treated all quotes the same way (repair workflow)
4. ❌ **Conversation Flow** - No different handling for customers selling vs repairing

## What Was Already Working

The database and API were already set up correctly:
- ✅ `quote_requests` table has `type` column (`'repair'` or `'sell'`)
- ✅ Public API (`/api/public/start-repair`) accepts `type` parameter
- ✅ Dashboard separates "Sell-to-us Enquiries" from repair quotes
- ✅ Quote form shows "Sell" badge for sell quotes
- ✅ Different SMS templates for sell vs repair quotes

## What Was Missing

AI Steve wasn't aware of the quote type:
- Quote context sent to AI didn't include the `type` field
- AI treated all quotes as repair quotes
- No different workflow for buyback acceptance

## Solution

### 1. Updated Quote Formatting (`app/lib/quote-lookup.ts`)

Added quote type to AI context:

**Before:**
```
Device: Apple iPhone 12 Pro | Issue: Good condition | Quote: £250 | Expires in 6 days
```

**After (Repair Quote):**
```
Type: REPAIR | Device: Apple iPhone 14 Pro | Issue: Cracked screen | Description: Front glass shattered | Quote: £149.99 | Expires in 5 days
```

**After (Sell Quote):**
```
Type: BUYBACK/SELL | Device: Apple iPhone 12 Pro | Condition/Notes: Good condition, minor scratches | Details: 128GB, Space Gray | Quote: £250 | Expires in 6 days
```

Key changes:
- Added `Type: REPAIR` or `Type: BUYBACK/SELL` at the start
- For repair quotes: Shows `Issue` and `Description`
- For sell quotes: Shows `Condition/Notes` and `Details` instead
- Filters out default "Device sell enquiry" text

### 2. Updated AI Quote Acceptance Workflow (`supabase/migrations/095_add_buyback_quote_handling.sql`)

Added separate handling for sell vs repair quotes:

#### Repair Quote Acceptance
Customer: "Yes please"  
AI: "Perfect! You can drop your iPhone 14 in during opening hours and we'll get it sorted for £149. You'll receive a confirmation text shortly."

#### Sell Quote Acceptance
Customer: "Yes please"  
AI: "Great! You can pop in with your iPhone 12 Pro during opening hours. We'll check the condition and confirm the £250 offer, then sort payment straight away."

Key differences:
- **Repair**: "drop off" → automatic repair app booking → confirmation SMS
- **Sell**: "pop in" → check condition → confirm price → payment
- Different language to match the workflow

## Testing

Created comprehensive test suite: `test-buyback-quote-formatting.js`

Tests 4 scenarios:
- ✅ Repair quote - basic
- ✅ Sell quote - detailed
- ✅ Sell quote - minimal (default issue text filtered out)
- ✅ Repair quote - with additional issues

All 4/4 tests pass.

Run tests:
```bash
node test-buyback-quote-formatting.js
```

## Examples

### Sell Quote Flow

**1. Customer submits sell enquiry via website:**
```json
{
  "type": "sell",
  "device_make": "Apple",
  "device_model": "iPhone 12 Pro",
  "issue": "Good condition, minor scratches",
  "description": "128GB, Space Gray, battery health 87%"
}
```

**2. John sends quote:**
"Hi Sarah, based on what you've said, we'd be able to offer £250 for your iPhone 12 Pro..."

**3. Customer accepts:**
"Yes please"

**4. AI Steve responds:**
"Great! You can pop in with your iPhone 12 Pro during opening hours. We'll check the condition and confirm the £250 offer, then sort payment straight away. We're open Monday-Friday 10am-5pm, Saturday 10am-3pm."

**5. Customer brings device in:**
- John checks condition
- Confirms price (or adjusts if needed)
- Pays customer

### Repair Quote Flow (unchanged)

**1. Customer submits repair request:**
```json
{
  "type": "repair",
  "device_make": "Apple",
  "device_model": "iPhone 14 Pro",
  "issue": "Cracked screen"
}
```

**2. John sends quote:**
"Hi Mike, your quote for the iPhone 14 Pro (Cracked screen) is £149.99..."

**3. Customer accepts:**
"Yes please"

**4. AI Steve responds:**
"Perfect! You can drop your iPhone 14 in during opening hours and we'll get it sorted for £149.99. You'll receive a confirmation text shortly."

**5. Automatic handoff:**
- System marks quote as accepted
- Sends to repair app API
- Repair app creates job
- Customer gets confirmation SMS

## What Changed

### Files Modified

1. **`app/lib/quote-lookup.ts`**
   - Updated `formatQuoteForAI()` function
   - Adds `Type: REPAIR` or `Type: BUYBACK/SELL`
   - Different formatting for sell vs repair quotes

2. **`supabase/migrations/095_add_buyback_quote_handling.sql`**
   - Updated `quote_acceptance_workflow` prompt module
   - Added separate workflows for REPAIR vs BUYBACK/SELL quotes
   - Different language and expectations for each type

### Files Created

1. **`test-buyback-quote-formatting.js`** - Test suite (4 tests)
2. **`BUYBACK_QUOTE_FIX.md`** - This documentation

## Dashboard Display

The dashboard already separates quotes correctly:

**Sell-to-us Enquiries** (shown first):
- Shows "Sell" badge (amber color)
- Different quote template when sending

**Repair Quote Requests** (shown second):
- No special badge
- Standard repair quote template

## AI Behavior

### Before Fix

Customer with sell quote: "Yes please"  
AI: "Perfect! You can drop your iPhone 12 in during opening hours and we'll get it sorted for £250. You'll receive a confirmation text shortly."  
❌ WRONG - Customer wants to sell, not repair!

### After Fix

Customer with sell quote: "Yes please"  
AI: "Great! You can pop in with your iPhone 12 Pro during opening hours. We'll check the condition and confirm the £250 offer, then sort payment straight away."  
✅ CORRECT - Acknowledges it's a buyback, mentions condition check and payment

## Benefits

1. **Clear Communication** - AI uses correct language for selling vs repairing
2. **Correct Workflow** - Different processes for buyback vs repair
3. **Better UX** - Customers know what to expect
4. **No Confusion** - AI doesn't promise confirmation SMS for buyback quotes
5. **Proper Expectations** - Mentions condition check and price confirmation for buybacks

## Deployment

1. Review changes: `git diff`
2. Run tests: `node test-buyback-quote-formatting.js` (4/4 should pass)
3. Apply migration: Migration 095 will run automatically on deploy
4. Commit: `git add . && git commit -m "Fix: Add buyback/sell quote handling to AI Steve"`
5. Push: `git push`
6. Vercel will auto-deploy

## Monitoring

After deployment, check that:
- Sell quotes show `Type: BUYBACK/SELL` in AI context
- Repair quotes show `Type: REPAIR` in AI context
- AI uses different language for sell vs repair acceptances
- No confusion between the two workflows

Look for in logs:
```
[ACTIVE QUOTE FOR THIS CUSTOMER]
Type: BUYBACK/SELL | Device: Apple iPhone 12 Pro | ...
```

or

```
[ACTIVE QUOTE FOR THIS CUSTOMER]
Type: REPAIR | Device: Apple iPhone 14 Pro | Issue: Cracked screen | ...
```

## Future Enhancements

Consider:
- Add "Buyback" badge to conversation list when customer has active sell quote
- Track buyback acceptance separately in analytics
- Different notification for John when customer accepts buyback quote
