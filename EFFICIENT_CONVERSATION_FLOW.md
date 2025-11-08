# Efficient Conversation Flow - Ask Multiple Things at Once

## Key Principle
**Ask "What's wrong?" WITHOUT needing to know the device first, and ask multiple questions at once to speed up the conversation.**

## Old Flow (Too Slow)
```
Customer: "My phone is broken"
AI: "What's wrong with it?"
[wait for response]
Customer: "Screen is cracked"
AI: "What device?"
[wait for response]
Customer: "iPhone"
AI: "What model?"
[wait for response]
Customer: "15"
AI: "Screen repairs are £120"
```
**Total: 4 back-and-forth exchanges**

## New Flow (Efficient)
```
Customer: "My phone is broken"
AI: "I'm sorry to hear that. What's happening with it, and what device/model is it - iPhone 15, Samsung S23, etc?"
[wait for response]
Customer: "Screen is cracked, iPhone 15"
AI: "Screen replacements for iPhone 15 are £120 with 12-month warranty..."
```
**Total: 1 back-and-forth exchange** ✅

## Why This Works

### 1. "What's Wrong?" Doesn't Need Device Info
You can ask "What's happening with it?" without knowing if it's an iPhone, Samsung, or iPad. The issue (screen, battery, won't turn on) is independent of the device type.

### 2. Multiple Questions in One Message
Customers can answer multiple questions at once:
- "Screen is cracked, iPhone 15" ✅
- "Battery dies fast, Samsung S23" ✅
- "Won't turn on, iPad Pro" ✅

### 3. Flexible - Works Step-by-Step Too
If customer only answers one question, AI can follow up:
```
Customer: "Screen is cracked"
AI: "What device and model - iPhone 15, Samsung S23, iPad Pro, etc?"
```

## Examples

### Example 1: Customer Provides Everything
```
Customer: "Hello my phone is broken"
AI: "What's happening with it, and what device/model is it?"
Customer: "Screen cracked, iPhone 15"
AI: "Screen replacements for iPhone 15 are £120..."
```

### Example 2: Customer Provides Issue Only
```
Customer: "My phone is broken"
AI: "What's happening with it, and what device/model is it?"
Customer: "Screen is cracked"
AI: "What device and model - iPhone 15, Samsung S23, etc?"
Customer: "iPhone 15"
AI: "Screen replacements for iPhone 15 are £120..."
```

### Example 3: Customer Says Device in First Message
```
Customer: "My iPhone is broken"
AI: "What's happening with it, and what model - iPhone 12, 13, 14, 15, or 16?"
Customer: "Screen cracked, 15"
AI: "Screen replacements for iPhone 15 are £120..."
```

### Example 4: Vague Initial Message
```
Customer: "Can you help me?"
AI: "Of course! What's happening with your device, and what type is it - iPhone, Samsung, iPad, laptop?"
Customer: "Battery dies fast, iPhone 14"
AI: "Battery replacements for iPhone 14 are £65..."
```

## Implementation in Migration 033

### Core Identity Module
```sql
STEP 1: What's Wrong? (ALWAYS FIRST - Don't need device yet!)
Customer: "Hello my phone is broken"
You: "I'm sorry to hear that. What's happening with it - screen, battery, won't turn on, or something else?"

STEP 2: Get Device + Model Together (Ask both at once!)
Customer: "Screen is cracked"
You: "What type of device and model - iPhone 15, Samsung S23, iPad Pro, etc?"
```

### Ask What's Wrong First Module
```sql
YOUR FIRST QUESTION MUST BE:
"I'm sorry to hear that. What's happening with it - screen, battery, won't turn on, or something else?"

YOU DON'T NEED TO KNOW THE DEVICE TO ASK THIS!
```

### Context Awareness Module
```sql
EFFICIENT ORDER:
1. What's wrong? (Can ask WITHOUT knowing device!)
2. Device + Model (Ask BOTH at once if possible!)
3. Solution + Pricing

EXAMPLES:
✅ "What's happening with it, and what device/model is it?"
✅ "What device and model - iPhone 15, Samsung S23, etc?"
❌ "What's wrong?" → wait → "What device?" → wait → "What model?" (too slow!)
```

## Benefits

1. **Faster Resolution** - Get to pricing in 1-2 exchanges instead of 4-5
2. **Better Customer Experience** - Less back-and-forth, more efficient
3. **Shows Empathy First** - "What's wrong?" before asking for details
4. **Flexible** - Works whether customer provides all info or step-by-step
5. **Natural** - Mimics how humans actually talk

## Testing

Test these scenarios:
```
1. "My phone is broken"
   → Should ask "What's happening with it, and what device/model?"

2. "Screen is cracked"
   → Should ask "What device and model - iPhone 15, Samsung S23, etc?"

3. "My iPhone 15 is broken"
   → Should ask "What's happening with it - screen, battery, or something else?"

4. "Screen cracked, iPhone 15"
   → Should provide pricing immediately
```

## Key Takeaway
**Ask "what's wrong?" first (doesn't need device info), then ask device+model together. This cuts conversation length in half while maintaining empathy and clarity.**
