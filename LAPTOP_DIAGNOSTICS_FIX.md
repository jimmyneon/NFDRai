# Laptop Diagnostics & Duplicate Messages Fix

## Problems

### 1. Unnecessary Model Request
```
Customer: "HP" then "Blue screen"
AI: "For your HP laptop with the blue screen issue, it would be helpful to 
know the specific model. You can usually find this on a sticker on the 
bottom of the laptop..."
```

**Problem:** For a blue screen diagnostic, knowing it's an **HP laptop** is enough! Specific model doesn't help with diagnosis.

### 2. Duplicate Messages
AI sent the same message twice (just rephrased):
- Message 1: "For your HP laptop... need the specific model..."
- Message 2: "I understand... need the specific model..." (same content!)

## Root Causes

### 1. Model Detection Too Aggressive
The "DEVICE MODEL DETECTION" guidance didn't distinguish between:
- **Repair/Diagnostic** - Brand + OS type is enough
- **Buyback** - Need specific model for pricing
- **Part ordering** - Need specific model

### 2. No Duplicate Prevention
No guidance to prevent sending the same information twice in separate messages.

### 3. Missing Laptop-Specific Guidance
Diagnostic module didn't have specific guidance for laptop issues like blue screens.

## Solution

### 1. Updated Diagnostic Module
Added laptop-specific guidance:
- Brand name (HP, Dell, Lenovo) is ENOUGH for diagnostics
- Only ask for specific model when ordering parts
- Ask if Windows/Mac/Chromebook if not clear
- Clear pricing: £40 for laptop diagnostics

### 2. Added Duplicate Prevention
Updated multiple message guidance:
- NEVER send same information twice
- Multiple messages should have DIFFERENT content
- Main answer + related tip = ✅
- Main answer + rephrased answer = ❌

### 3. Context-Aware Model Detection
Updated device model detection to consider context:
- **Repair/Diagnostic:** Brand + OS type = enough
- **Buyback/Selling:** Need specific model, storage, condition
- **Part ordering:** Need specific model

### 4. Chromebook Detection
Added guidance to ask if laptop is a Chromebook:
- Some brands (HP, Acer, Lenovo) make Chromebooks
- Chromebook repairs are more limited
- Ask: "Is that a Windows laptop or a Chromebook?"

## Expected Behavior After Fix

### Scenario 1: Laptop Blue Screen
```
Customer: "HP"
Customer: "Blue screen"
AI: "Blue screens are usually software or hardware related. Pop in with your 
HP laptop and we'll run a diagnostic for £40 - we can usually identify the 
issue within 15-30 minutes. Is it a Windows laptop or a Chromebook?"
```

### Scenario 2: Laptop Won't Turn On
```
Customer: "My Dell laptop won't turn on"
AI: "Let's get that sorted! Have you tried holding the power button for 30 
seconds to reset it? If that doesn't work, pop in and we'll run a free 
diagnostic to see what's going on."
```

### Scenario 3: Laptop Buyback (Model Needed)
```
Customer: "Do you buy laptops?"
AI: "Yes! We buy laptops at good rates. What model is it, what's the storage 
size, and what condition is it in? I'll get you a quote ASAP!"
```

### Scenario 4: MacBook Slow Performance
```
Customer: "My MacBook is running really slow"
AI: "That's frustrating! Could be software or hardware. Pop in with your 
MacBook and we'll run a diagnostic for £40. We can usually identify the 
cause within 15-30 minutes and let you know what needs fixing."
```

## Key Improvements

| Scenario | Old Behavior | New Behavior |
|----------|-------------|--------------|
| **HP + Blue Screen** | Asked for specific model | Brand + OS type is enough |
| **Laptop Diagnostic** | Vague guidance | Clear £40 pricing, 15-30 min turnaround |
| **Duplicate Messages** | Sent same info twice | Prevents duplicates |
| **Chromebook** | Not distinguished | Asks if Windows/Mac/Chromebook |
| **Context** | Always asked for model | Context-aware (repair vs buyback) |

## When Model IS Needed

✅ **Need specific model:**
- Buyback/selling (for pricing)
- Ordering replacement parts
- Screen replacement (different models have different screens)
- Battery replacement (different batteries)

❌ **Don't need specific model:**
- Diagnostics (blue screen, won't turn on, slow)
- Initial repair inquiry
- Software issues
- General troubleshooting

## Laptop Diagnostic Pricing

- **Diagnostic fee:** £40 for laptops/MacBooks
- **Turnaround:** 15-30 minutes depending on how busy
- **Free diagnostic:** Won't turn on issues (after suggesting restart)
- **Water damage:** Free diagnostic

## Chromebook Considerations

Some brands make both Windows laptops and Chromebooks:
- HP
- Acer
- Lenovo
- Dell
- Asus

**Important:** Chromebook repairs are more limited than Windows/Mac, so it's worth asking if not obvious.

## Changes Made

### File: `supabase/migrations/024_fix_laptop_diagnostics_and_duplicates.sql`

1. **Updated `diagnostic` module**
   - Added laptop-specific guidance
   - Clear pricing and turnaround
   - Chromebook detection
   - Examples for common issues

2. **Updated `common_scenarios` module**
   - Added laptop diagnostic guidance
   - Brand name is enough for diagnostics

3. **Updated multiple message guidance**
   - Added duplicate prevention rules
   - Clear examples of what NOT to do

4. **Updated device model detection**
   - Context-aware (repair vs buyback vs parts)
   - Laptop-specific guidance
   - When model is/isn't needed

## Deployment

```bash
psql $DATABASE_URL -f supabase/migrations/024_fix_laptop_diagnostics_and_duplicates.sql
```

## Testing

### Test Case 1: Laptop Blue Screen
```
Send: "HP"
Then: "Blue screen"
Expected: Diagnostic offer (£40), asks if Windows/Chromebook, NO model request
```

### Test Case 2: Laptop Won't Turn On
```
Send: "My Dell laptop won't turn on"
Expected: Suggests restart, then free diagnostic, NO model request
```

### Test Case 3: Laptop Buyback
```
Send: "Do you buy laptops?"
Expected: YES, asks for model, storage, condition (model needed for pricing)
```

### Test Case 4: Multiple Messages
```
Monitor: AI should NOT send duplicate content in separate messages
Expected: Each message has different information
```

## Impact

### Before Fix
❌ Asked for unnecessary model details
❌ Sent duplicate messages
❌ No laptop-specific guidance
❌ Didn't distinguish Windows/Chromebook
❌ Same approach for all contexts

### After Fix
✅ Brand name is enough for diagnostics
✅ Prevents duplicate messages
✅ Clear laptop diagnostic pricing
✅ Asks about Windows/Mac/Chromebook
✅ Context-aware model detection
✅ Better customer experience

## Related Issues

This fix also helps with:
- Faster diagnostic inquiries (less back-and-forth)
- Clearer pricing expectations
- Better Chromebook handling
- Reduced message spam
- More efficient conversations

## Notes

- Brand name (HP, Dell, Lenovo, etc.) is sufficient for most laptop repairs
- Specific model only needed for part orders or buyback pricing
- Chromebook distinction is important due to repair limitations
- Duplicate prevention improves conversation quality

---

**Created:** 8 Nov 2024
**Migration:** `024_fix_laptop_diagnostics_and_duplicates.sql`
**Priority:** Medium-High - Improves efficiency and prevents spam
**Status:** Ready to deploy
