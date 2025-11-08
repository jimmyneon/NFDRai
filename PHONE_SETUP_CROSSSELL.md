# Phone Setup to Buyback Cross-Sell

## Opportunity

When customers ask about setting up a new phone, it's the perfect time to mention you buy used phones! They likely have an old phone they're replacing.

## Current Behavior

```
Customer: "Can you set up my new phone?"
AI: "Yes, we can help with that! We offer phone setup and data transfer services."
```

**Missed Opportunity:** Customer probably has an old phone to sell!

## New Behavior

```
Customer: "Can you set up my new phone?"
AI: "Yes, we can help with that! We do phone setup and data transfer. By the 
way, if you have your old phone, we buy used iPhones at good rates - could 
put that towards the setup cost. What model is your old phone?"
```

## Triggers

Mention buyback when customer asks about:
- "Can you set up my new phone?"
- "Help me transfer data to new phone"
- "Got a new iPhone, need help setting it up"
- "Can you help me switch phones?"
- "Need help moving everything to my new phone"

## Cross-Sell Approach

### Natural, Not Pushy
✅ "By the way, if you have your old phone..."
✅ "Could put that towards the setup cost"
✅ "We buy used iPhones at good rates"

❌ "You MUST sell us your old phone"
❌ "We need your old phone"
❌ Aggressive or pushy language

### Value Proposition
- **Trade towards setup cost** - reduces their out-of-pocket
- **Instant cash** - no waiting for online buyers
- **Convenient** - one stop for setup and selling
- **Fair rates** - better than online shops

## Examples

### Example 1: iPhone Setup
```
Customer: "Can you set up my new iPhone 15?"
AI: "Yes, we can help with that! We do phone setup and data transfer. By the 
way, if you have your old iPhone, we buy them at good rates - could put that 
towards the setup cost or just get instant cash for it. What model is your 
old phone?"

Customer: "iPhone 12"
AI: "Perfect! We're definitely interested in iPhone 12s. What's the storage 
size and condition? I'll get you a quote ASAP!"
```

### Example 2: Android Setup
```
Customer: "Help me transfer data to my new Samsung"
AI: "Yes, we can help with that! We do phone setup and data transfer. By the 
way, if you have your old phone, we buy used phones at good rates - could put 
that towards the setup cost. What model is your old one?"
```

### Example 3: Customer Already Sold It
```
Customer: "Can you set up my new phone?"
AI: "Yes, we can help! By the way, if you have your old phone, we buy them 
at good rates..."

Customer: "Already sold it"
AI: "No worries! When would you like to bring in your new phone for setup?"
```

## Benefits

### For Business
✅ **More buyback opportunities** - capture devices before they go elsewhere
✅ **Higher transaction value** - setup + buyback
✅ **Customer convenience** - one-stop shop
✅ **Competitive advantage** - instant cash vs waiting for online buyers

### For Customer
✅ **Convenient** - one trip for both services
✅ **Instant value** - trade towards setup cost
✅ **No hassle** - don't need to list online
✅ **Fair pricing** - better than online shops

## Implementation

### Changes Made

**File:** `supabase/migrations/027_add_setup_to_buyback_crosssell.sql`

1. **Updated `buyback` module**
   - Added "CROSS-SELL OPPORTUNITY - NEW PHONE SETUP" section
   - Clear trigger phrases
   - Natural mention template

2. **Updated `common_scenarios` module**
   - Added "PHONE SETUP REQUESTS" section
   - Examples of natural cross-sell
   - Not pushy approach

3. **Updated `core_identity` module**
   - Added phone setup to services list
   - Added "CROSS-SELLING" section
   - Natural, not pushy guidance

## Flow

```
Customer asks about phone setup
    ↓
Confirm setup service
    ↓
Mention buyback opportunity
    ↓
Ask about old phone model
    ↓
┌─────────────────┐
│ Customer has    │
│ old phone?      │
└─────────────────┘
    ↓           ↓
   YES         NO
    ↓           ↓
Get details   Continue
for quote     with setup
    ↓
Both services!
```

## Testing

### Test Case 1: iPhone Setup
```
Send: "Can you set up my new iPhone?"
Expected: 
  - Confirms setup service
  - Mentions buying old phones
  - Asks about old phone model
```

### Test Case 2: Data Transfer
```
Send: "Help me transfer data to new phone"
Expected:
  - Confirms data transfer service
  - Natural mention of buyback
  - "Could put that towards the setup cost"
```

### Test Case 3: Customer Has Old Phone
```
Send: "Can you set up my new phone?"
AI: (mentions buyback)
Send: "Yeah I have my old iPhone 11"
Expected:
  - Gets excited about iPhone 11
  - Asks for storage and condition
  - Offers quote
```

## Pricing Notes

- **Phone setup service:** (Add your pricing)
- **Data transfer:** (Add your pricing)
- **Trade-in:** Old phone value can go towards setup cost
- **Instant cash:** Or just cash payment for old phone

## Key Points

✅ **Always mention** when customer asks about setup
✅ **Natural approach** - "by the way..."
✅ **Value proposition** - trade towards cost or instant cash
✅ **Not pushy** - if they don't have it, move on
✅ **Convenient** - one stop for both services

## Related Services

This cross-sell works with:
- Phone setup
- Data transfer
- SIM card help
- iCloud setup
- App installation
- Contact transfer

All are opportunities to mention buyback!

---

**Created:** 8 Nov 2024
**Migration:** `027_add_setup_to_buyback_crosssell.sql`
**Priority:** Medium - Revenue opportunity
**Status:** Ready to deploy
