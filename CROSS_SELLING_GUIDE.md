# Cross-Selling Opportunities Guide

## Overview

Natural, helpful cross-selling opportunities that make financial sense for customers and increase revenue.

## Implemented Cross-Sells

### 1. 🔧 Screen Repair → Battery Check

**Trigger:** Customer books screen repair on older device (3+ years)

**Cross-sell:** "While we have it open for the screen, we can check your battery health too. If it's below 85%, we offer a combo discount on screen + battery replacement!"

**Why it works:**
- Device is already open
- Save customer a second trip
- Combo discount incentive
- Battery often degrades with age

**Example:**
```
Customer: "My iPhone 11 screen is cracked"
AI: "We can fix that for £X. While we have it open, we can check your 
battery health too. If it's below 85%, we offer a combo discount on 
screen + battery replacement!"
```

---

### 2. 🛡️ Screen Replacement → Screen Protector

**Trigger:** Customer books screen replacement

**Cross-sell:** "We also have tempered glass screen protectors for £X - would you like us to fit one when we replace your screen?"

**Why it works:**
- Natural time to add protection
- Prevents future screen damage
- We fit it for them
- Low-cost add-on

**Example:**
```
Customer: "Can you replace my screen?"
AI: "Yes! £X for screen replacement. We also have tempered glass screen 
protectors for £Y - would you like us to fit one when we replace your 
screen? Helps protect your new screen."
```

---

### 3. 🔋 Battery Replacement → Screen Protector

**Trigger:** Customer books battery replacement

**Cross-sell:** "Fresh battery will make it feel like new! By the way, we also have tempered glass screen protectors for £X if you want to keep your screen protected."

**Why it works:**
- Device feels "new" with fresh battery
- Natural time to add protection
- Low-cost add-on

**Example:**
```
Customer: "I need a new battery"
AI: "We can do that for £X. Fresh battery will make it feel like new! 
By the way, we also have tempered glass screen protectors for £Y if you 
want to keep your screen protected. We can fit it for you."
```

---

### 4. 📱 Old Device Repair → Upgrade Suggestion

**Trigger:** Device is very old (6+ years) AND repair cost is high (£80+)

**Cross-sell:** "That's quite an old [device] - the repair would be around £X. Just so you know, we also buy phones and have refurbished [newer models] available. Might be worth considering an upgrade instead?"

**Why it works:**
- Customer may not realize repair cost vs upgrade cost
- You get trade-in device for parts
- Sell refurb inventory
- Customer gets better device

**Example:**
```
Customer: "Can you fix my iPhone 7?"
AI: "We can, but that's quite an old model - the repair would be around 
£90. Just so you know, we also have refurbished iPhone 11s for £150. 
Might be worth considering an upgrade instead? We'd give you trade-in 
value for your iPhone 7."
```

**Important:** Only suggest if repair cost is significant (£80+)

---

### 5. 💰 Multiple Repairs → Upgrade Instead

**Trigger:** Customer needs multiple expensive repairs (total £150+)

**Cross-sell:** "That would be £X for screen + £Y for battery = £Z total. Just so you know, we also have refurbished [same model] for around £A. Might be better value?"

**Why it works:**
- Math makes sense for customer
- You get broken device for parts
- Sell refurb inventory
- Customer gets "like new" device

**Example:**
```
Customer: "I need screen and battery replaced"
AI: "That would be £80 for screen + £70 for battery = £150 total. Just 
so you know, we also have refurbished iPhone 12s for around £200. Might 
be better value? Plus we'd buy your broken one for parts."
```

**Important:** Only mention if total is £150+

---

### 6. 💼 Business Customer → Bulk Discount

**Trigger:** Customer mentions multiple devices or business

**Cross-sell:** "Are these for a business? We offer bulk repair discounts and can set up a business account for faster service."

**Why it works:**
- Recurring business
- Higher volume
- Professional relationship
- Priority service

**Example:**
```
Customer: "I have 5 iPhones that need screens"
AI: "Are these for a business? We offer bulk repair discounts and can 
set up a business account for faster service. Let me get you a quote 
for all 5!"
```

---

### 7. 📱 Phone Setup → Buyback (Already Implemented)

**Trigger:** Customer asks about setting up new phone

**Cross-sell:** "By the way, if you have your old phone, we buy used iPhones at good rates - could put that towards the setup cost."

---

## Cross-Sell Rules

### ✅ DO:
- Be natural and helpful
- Only suggest when it makes financial sense
- Show the math clearly
- Let customer decide
- Mention benefits (save money, save time, better value)

### ❌ DON'T:
- Be pushy or aggressive
- Suggest upgrades for minor repairs
- Make customer feel bad about their device
- Push if they say no
- Suggest if numbers don't make sense

## Pricing Thresholds

**When to suggest upgrade:**
- Single repair: £80+ on device 6+ years old
- Multiple repairs: £150+ total
- Always show the math

**When NOT to suggest upgrade:**
- Repair is cheap (under £80)
- Device is newer (under 6 years)
- Customer specifically wants repair

## Examples by Scenario

### Scenario 1: Old iPhone, Expensive Repair
```
Customer: "My iPhone 7 screen is broken"
AI: "We can fix that for £90. Just so you know, that's quite an old model 
and we also have refurbished iPhone 11s for £150. Might be worth upgrading? 
We'd give you trade-in value for your iPhone 7. But we're happy to repair 
it if you prefer!"
```

### Scenario 2: Multiple Issues
```
Customer: "My iPhone 12 needs screen and battery"
AI: "That would be £80 for screen + £70 for battery = £150 total. We can 
definitely do that. Just so you know, we also have refurbished iPhone 12s 
for around £200 - might be better value? Plus we'd buy your broken one for 
parts. What would you prefer?"
```

### Scenario 3: Screen Replacement
```
Customer: "Replace my screen please"
AI: "We can do that for £80. We also have tempered glass screen protectors 
for £10 - would you like us to fit one when we replace your screen? Helps 
protect your new screen."
```

### Scenario 4: Business Customer
```
Customer: "I need 3 iPhone screens fixed"
AI: "We can do that! Are these for a business? We offer bulk repair 
discounts and can set up a business account for faster service. Let me 
get you a quote for all 3."
```

## Revenue Impact

### Potential Increases:
- **Screen protector upsell:** +£10-15 per screen repair
- **Battery combo:** +£60-70 per screen repair (when needed)
- **Upgrade instead of repair:** +£50-100 margin + parts device
- **Business accounts:** Recurring revenue, higher volume

### Customer Benefits:
- Save money (combo discounts, better value upgrades)
- Save time (one trip instead of two)
- Better device (upgrades)
- Protected investment (screen protectors)

## Implementation

**File:** `supabase/migrations/028_add_cross_selling_opportunities.sql`

**Updated Modules:**
- `screen_repair` - Battery check, screen protector
- `battery_replacement` - Screen protector
- `diagnostic` - Old device upgrade suggestion
- `buyback` - Multiple repairs upgrade
- `common_scenarios` - All cross-sell opportunities
- `core_identity` - Cross-selling rules

## Testing

### Test Case 1: Screen Repair on Old Device
```
Send: "My iPhone 8 screen is cracked"
Expected: Repair quote + battery check offer
```

### Test Case 2: Screen Replacement
```
Send: "Replace my screen"
Expected: Quote + screen protector offer
```

### Test Case 3: Multiple Repairs
```
Send: "I need screen and battery replaced"
Expected: Total cost + upgrade suggestion if £150+
```

### Test Case 4: Business Customer
```
Send: "I have 5 phones that need repairs"
Expected: Bulk discount mention
```

## Notes

- All cross-sells are natural and helpful, not pushy
- Customer always makes the final decision
- Show clear math and benefits
- Only suggest when it makes financial sense
- Screen protectors are upsold WITH screen replacements (not separately)

---

**Created:** 8 Nov 2024
**Migration:** `028_add_cross_selling_opportunities.sql`
**Priority:** Medium-High - Revenue opportunity
**Status:** Ready to deploy
