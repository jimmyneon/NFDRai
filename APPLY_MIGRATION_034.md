# Apply Migration 034 - Fix Genuine Battery & Message Separator

## What This Fixes

### 1. ✅ Genuine Batteries ARE Available
**Before:** "We don't stock genuine Apple batteries"
**After:** "We can get genuine Apple batteries for around £90"

### 2. ✅ Genuine Screens Need Ordering
**Before:** Didn't mention stock status
**After:** "Genuine Apple screens need to be ordered in - usually arrive next day"

### 3. ✅ Message Separator Fixed
**Before:** Using `---` (doesn't work)
**After:** Using `|||` (correct separator)

### 4. ✅ Stock Status Clear
- **OLED screens:** IN STOCK, same day
- **Standard batteries:** IN STOCK, same day
- **Genuine screens:** NEED TO ORDER, next day usually
- **Genuine batteries:** CAN BE ORDERED, ~£90 total

---

## Quick Apply

### Copy this file to Supabase SQL Editor:
```
supabase/migrations/034_fix_genuine_battery_and_separator.sql
```

### Steps:
1. Go to Supabase Dashboard → SQL Editor
2. Copy ALL contents of migration 034
3. Paste and click **Run**
4. Done! ✅

---

## What Changes

### Battery Responses

**When customer asks "Can you get genuine battery?"**

**OLD (Wrong):**
```
"We don't specifically stock genuine Apple batteries. However, our batteries are reliable..."
```

**NEW (Correct):**
```
"Yes! We can get genuine Apple batteries - they cost around £90 in total and take a bit longer to get in. Or we have high-quality batteries in stock at £50 (£30 with screen) with 6-month warranty. Which would you prefer?"
```

### Screen Responses with Stock Status

**When customer chooses OLED:**
```
"Perfect! So that's an iPhone 13 screen replacement with high-quality OLED at £100. We stock OLED screens, so we can do that same day, usually within an hour. Just pop in whenever suits you!

|||By the way, if your battery's not holding charge as well, we do £20 off battery replacements when done with a screen - so it'd be £30 instead of £50. Just a heads-up!"
```
↑ Note the `|||` separator - this sends as TWO separate messages

**When customer chooses Genuine:**
```
"Perfect! So that's an iPhone 13 genuine Apple screen replacement at £150. Genuine Apple screens need to be ordered in - usually arrive next day Monday-Thursday. Small deposit required when ordering. Just pop in to get that sorted!

|||By the way, if your battery's not holding charge as well, we do £20 off battery replacements when done with a screen - so it'd be £30 instead of £50. Just a heads-up!"
```

---

## Pricing Summary

### Batteries
| Type | Price | Stock | Warranty |
|------|-------|-------|----------|
| Standard | £50 (£30 with screen) | IN STOCK | 6 months |
| Genuine Apple | ~£90 total | CAN ORDER | Genuine |

### Screens (iPhone 13)
| Type | Price | Stock | Warranty |
|------|-------|-------|----------|
| OLED | £100 | IN STOCK | 12 months |
| Genuine Apple | £150 | NEED TO ORDER | 12 months |

---

## Test After Applying

### Test 1: Genuine Battery Question
**Send:** "Can you get genuine battery?"

**Expected:**
```
"Yes! We can get genuine Apple batteries - they cost around £90 in total and take a bit longer to get in. Or we have high-quality batteries in stock at £50 (£30 with screen) with 6-month warranty. Which would you prefer?"
```

### Test 2: Choose OLED Screen
**Send:** "I'll take the £100 screen"

**Expected:** TWO separate messages:
1. Main confirmation with stock status
2. Battery upsell (separate message)

### Test 3: Choose Genuine Screen
**Send:** "I want the genuine screen"

**Expected:**
```
"Perfect! So that's an iPhone [MODEL] genuine Apple screen replacement at £150. Genuine Apple screens need to be ordered in - usually arrive next day Monday-Thursday. Small deposit required when ordering. Just pop in to get that sorted!"
```

---

## Key Points

✅ **NEVER say:** "We don't stock genuine batteries"
✅ **ALWAYS say:** "We can get genuine Apple batteries for around £90"

✅ **OLED screens:** IN STOCK, same day
✅ **Genuine screens:** NEED TO ORDER, next day

✅ **Use `|||` separator** for multiple messages
✅ **NOT `---` or any other separator**

---

## Verify Migration Applied

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

Should show all three modules with recent `updated_at` timestamps.

---

## Summary

This migration ensures:
1. ✅ Customers know genuine batteries ARE available (~£90)
2. ✅ Customers know genuine screens need ordering (not in stock)
3. ✅ OLED screens and standard batteries are in stock (same day)
4. ✅ Battery upsell sends as separate message (using `|||`)
5. ✅ Clear stock status for all options

Apply now to fix these issues! 🚀
