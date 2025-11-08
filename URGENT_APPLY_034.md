# 🚨 URGENT: Apply Migration 034 Now!

## Current Issues (Because Migration 034 Not Applied)

### ❌ Issue 1: Wrong Genuine Battery Price
**Current:** "For a genuine Apple battery, the price would be £50"
**Should be:** "Genuine Apple batteries cost around £90 in total"

### ❌ Issue 2: Messages Sent Together (Using `---`)
**Current:** 
```
"Perfect! So that's an iPhone 14 screen... --- By the way, if your battery's not holding charge..."
```
(Sent as ONE message with `---` visible)

**Should be:** TWO separate messages using `|||` separator

---

## ⚡ Apply Migration 034 RIGHT NOW

### Quick Steps:
1. **Open Supabase Dashboard** → SQL Editor
2. **Copy** `supabase/migrations/034_fix_genuine_battery_and_separator.sql`
3. **Paste** and click **Run**
4. **Done!** ✅

---

## What Migration 034 Fixes

### 1. Genuine Battery Price: £90 (Not £50)
```sql
GENUINE APPLE BATTERIES (~£90 total):
- AVAILABLE - Can be ordered
- Takes a bit longer to get in
- Genuine Apple parts
```

### 2. Message Separator: `|||` (Not `---`)
```sql
MESSAGE 2 (Battery upsell - use ||| separator):
"|||By the way, if your battery's not holding charge as well..."
```

### 3. Stock Status Clarity
- **OLED screens:** IN STOCK, same day
- **Standard batteries:** IN STOCK, same day  
- **Genuine screens:** NEED TO ORDER, next day
- **Genuine batteries:** CAN BE ORDERED, ~£90

---

## After Applying - Expected Behavior

### Test 1: Genuine Battery Question
**Customer:** "How about genuine battery"

**Before (Wrong):**
```
"For a genuine Apple battery, the price would be £50"
```

**After (Correct):**
```
"Yes! We can get genuine Apple batteries - they cost around £90 in total and take a bit longer to get in. Or we have high-quality batteries in stock at £50 (£30 with screen) with 6-month warranty. Which would you prefer?"
```

### Test 2: Screen Choice - Two Separate Messages
**Customer:** "After market is fine"

**Before (Wrong - One message with `---`):**
```
"Perfect! So that's an iPhone 14 screen replacement with high-quality OLED at £100. We stock OLED screens, so we can do that same day, usually within an hour. Just pop in whenever suits you! --- By the way, if your battery's not holding charge as well, we do £20 off battery replacements when done with a screen - so it'd be £30 instead of £50. Just a heads-up!"
```

**After (Correct - Two separate messages):**

Message 1:
```
"Perfect! So that's an iPhone 14 screen replacement with high-quality OLED at £100. We stock OLED screens, so we can do that same day, usually within an hour. Just pop in whenever suits you!"
```

Message 2 (sent separately):
```
"By the way, if your battery's not holding charge as well, we do £20 off battery replacements when done with a screen - so it'd be £30 instead of £50. Just a heads-up!"
```

---

## Why This Matters

### Genuine Battery Price
- ❌ **£50 is WRONG** - Customers will expect that price
- ✅ **£90 is CORRECT** - Sets proper expectations

### Message Separator
- ❌ **`---` doesn't work** - Sends as one long message with `---` visible
- ✅ **`|||` works** - System splits into separate messages

---

## Pricing Summary (After Migration)

### Batteries
| Type | Price | Stock | Warranty |
|------|-------|-------|----------|
| Standard | £50 (£30 with screen) | ✅ IN STOCK | 6 months |
| Genuine Apple | £90 total | ⏳ CAN ORDER | Genuine |

### Screens (iPhone 14)
| Type | Price | Stock | Warranty |
|------|-------|-------|----------|
| OLED | £100 | ✅ IN STOCK | 12 months |
| Genuine Apple | £150 | ⏳ NEED TO ORDER | 12 months |

---

## File Location

```
/Users/johnhopwood/NFDRAIRESPONDER/supabase/migrations/034_fix_genuine_battery_and_separator.sql
```

---

## Verification After Applying

Run this in SQL Editor:

```sql
SELECT module_name, priority, updated_at 
FROM prompts 
WHERE module_name IN (
  'core_identity',
  'pricing_flow',
  'battery_genuine_option'
)
ORDER BY priority DESC;
```

All three should show recent `updated_at` timestamps.

---

## Summary

**Current Problems:**
1. ❌ Genuine battery showing £50 (should be £90)
2. ❌ Two messages sent together with `---` visible

**Solution:**
✅ Apply migration 034 to Supabase database

**Takes:** 2 minutes

**Apply now!** 🚀
