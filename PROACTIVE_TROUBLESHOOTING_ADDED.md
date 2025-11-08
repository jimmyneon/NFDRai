# Proactive Troubleshooting - Help Customer First!

## Problem
AI was just saying "bring it in" without trying to help troubleshoot first:

```
Customer: "iPhone 13 black screen"
AI: "Unfortunately, we're currently closed, but you can bring it in on Monday when we open at 10:00 AM."
```

❌ No troubleshooting attempt
❌ No force restart instructions
❌ No pricing context
❌ Customer feels helpless

## Solution
AI now provides proactive troubleshooting BEFORE suggesting to bring it in:

```
Customer: "iPhone 13 black screen"
AI: "Let's try a force restart first:
1. Press Volume Up (quick tap)
2. Press Volume Down (quick tap)
3. Hold Side button until Apple logo appears (10-15 seconds)

While you're trying that, is there any visible damage - cracks, drops, or water?

If the force restart doesn't help, it's likely the screen. Screen replacements for iPhone 13 are £110 with 12-month warranty.

Unfortunately we're closed right now, but we're open Monday at 10:00 AM if you need to bring it in."
```

✅ Troubleshooting steps provided
✅ Asks about damage while they try
✅ Pricing context given
✅ Customer can potentially fix it themselves
✅ Clear next steps if troubleshooting doesn't work

## Changes Made

### 1. New Proactive Troubleshooting Module
**File:** `supabase/migrations/033_fix_duplicate_messages_and_missing_question.sql`

Added comprehensive troubleshooting module (priority 96) that covers:

#### Black Screen / Won't Turn On
- iPhone 8+: Volume Up → Volume Down → Hold Side button
- iPhone 7: Volume Down + Power (10 seconds)
- iPhone 6s-: Home + Power (10 seconds)
- Android: Hold Power (15-20 seconds)

#### Battery Issues
- Check battery health: Settings > Battery > Battery Health & Charging
- 85% or below = needs replacement
- Trust customer's experience even if percentage looks OK

#### Screen Issues
- Ask if physically cracked or just not responding
- Try force restart if not responding
- Provide pricing context

### 2. Smart Module Loading
**File:** `lib/ai/smart-response-generator.ts`

Added detection for when troubleshooting is needed:
```typescript
const needsTroubleshooting = conversationText.includes('black screen') || 
  conversationText.includes('won\'t turn on') || 
  conversationText.includes('not working') || 
  conversationText.includes('dead') || 
  conversationText.includes('broken') ||
  conversationText.includes('not responding') || 
  conversationText.includes('display') || 
  context.intent === 'diagnostic'
```

Loads `proactive_troubleshooting` module when any of these conditions are met.

## Examples

### Example 1: Black Screen (iPhone 13)
**Before:**
```
Customer: "iPhone 13 black screen"
AI: "Bring it in for diagnosis. We're open Monday at 10am."
```

**After:**
```
Customer: "iPhone 13 black screen"
AI: "Let's try a force restart first:
1. Press Volume Up (quick tap)
2. Press Volume Down (quick tap)
3. Hold Side button until Apple logo appears (10-15 seconds)

While you're trying that, is there any visible damage - cracks, drops, or water?

If the force restart doesn't help, it's likely the screen. Screen replacements for iPhone 13 are £110 with 12-month warranty."
```

### Example 2: Battery Draining Fast
**Before:**
```
Customer: "Battery dies really fast"
AI: "Bring it in and we can check it. We're open Monday at 10am."
```

**After:**
```
Customer: "Battery dies really fast"
AI: "You can check your battery health yourself:

Go to Settings > Battery > Battery Health & Charging

If it shows 85% or below, it definitely needs replacing. Or if you feel it's not performing well, trust your experience.

Battery replacements for iPhone 14 are £65 with 12-month warranty. Want to book an appointment?"
```

### Example 3: Follow-up After Troubleshooting
**Customer tries force restart and it works:**
```
Customer: "It worked! Thanks!"
AI: "Brilliant! Sounds like it was just a software glitch. If it happens again, let me know and we can take a deeper look."
```

**Customer tries force restart and it doesn't work:**
```
Customer: "Tried it, didn't work. No visible damage."
AI: "Could be the screen or something internal. Best to bring it in for a free diagnostic. If it is the screen, it's £110 as mentioned. We're open Monday-Friday 10am-5pm. Want to pop in?"
```

## Key Principles

1. **Help First** - Always try troubleshooting before suggesting "bring it in"
2. **Clear Instructions** - Step-by-step, easy to follow
3. **Ask While They Try** - "While you're trying that, any visible damage?"
4. **Provide Context** - Give pricing so they know what to expect
5. **Empower Customer** - Give them tools to self-diagnose
6. **Follow Up** - Respond appropriately based on troubleshooting results

## Benefits

### For Customers
- ✅ Might fix issue themselves (saves time and money)
- ✅ Feels helped and supported
- ✅ Knows pricing upfront
- ✅ Clear next steps
- ✅ Better experience

### For Business
- ✅ Reduces unnecessary visits for simple software issues
- ✅ Shows expertise and care
- ✅ Sets pricing expectations early
- ✅ Builds trust
- ✅ Professional image

## Coverage

The troubleshooting module covers:

### Issues
- Black screen
- Won't turn on
- Screen not responding
- Battery draining fast
- Display issues
- Touch not working
- Dead screen

### Devices
- iPhone (all models with specific instructions)
- Android phones
- iPads
- Tablets

### Troubleshooting Steps
- Force restart (device-specific)
- Battery health check
- Damage assessment
- Software vs hardware diagnosis

## Deployment

✅ **Already pushed to GitHub!**

The changes will automatically deploy via Vercel when you:
1. Apply migration 033 to database
2. Vercel detects the push and redeploys

To apply migration:
```bash
# Via Supabase Dashboard SQL Editor
# Copy and run: supabase/migrations/033_fix_duplicate_messages_and_missing_question.sql
```

## Testing

Test these scenarios:
```
1. "My iPhone 13 has a black screen"
   → Should provide force restart instructions + pricing

2. "Battery dies fast"
   → Should provide battery health check instructions

3. "Screen not responding"
   → Should ask if cracked + provide force restart

4. Customer: "Tried force restart, worked!"
   → Should celebrate and offer follow-up support

5. Customer: "Tried force restart, didn't work"
   → Should suggest bringing it in with pricing context
```

## Summary

The AI now acts like a helpful technician who:
1. Tries to help troubleshoot remotely first
2. Provides clear, step-by-step instructions
3. Gives pricing context upfront
4. Empowers customers to self-diagnose
5. Only suggests "bring it in" after troubleshooting

This creates a better customer experience and shows the business cares about helping, not just getting people through the door.
