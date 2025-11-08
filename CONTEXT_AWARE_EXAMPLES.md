# Context-Aware Module Loading Examples

## How It Works Now (TRUE Context-Aware)

The system now **selectively loads only relevant modules** based on conversation content.

---

## Example 1: Business Hours Query

**Customer Message:**
```
"What are your opening hours?"
```

**Modules Loaded:**
- ✅ `friendly_tone` (always - ensures consistency)
- ✅ `context_awareness` (always - remembers conversation)
- ✅ `services_comprehensive` (general inquiry - no specific intent)

**Total:** ~3 modules, ~2,500 characters

**NOT Loaded:**
- ❌ `pricing_flow_detailed` (not relevant)
- ❌ `screen_diagnosis_flow` (not relevant)
- ❌ `handoff_rules` (customer not asking for John)
- ❌ `operational_policies` (not needed for hours)
- ❌ `common_scenarios` (not needed for hours)

**Expected Response:**
Only mentions business hours, nothing about repairs or pricing.

---

## Example 2: Screen Repair Query

**Customer Message:**
```
"How much for iPhone 12 screen?"
```

**Modules Loaded:**
- ✅ `friendly_tone` (always)
- ✅ `context_awareness` (always)
- ✅ `pricing_flow_detailed` (screen repair detected)
- ✅ `screen_diagnosis_flow` (screen repair detected)
- ✅ `warranty_mention` (pricing query - always mention warranty)

**Total:** ~5 modules, ~4,000 characters

**NOT Loaded:**
- ❌ `services_comprehensive` (has specific intent)
- ❌ `handoff_rules` (not asking for John)
- ❌ `operational_policies` (not needed yet)
- ❌ `common_scenarios` (not water damage/buyback/etc)
- ❌ `business_hours_awareness` (not asking about hours)

**Expected Response:**
OLED vs genuine options, pricing, warranty - nothing about hours or other services.

---

## Example 3: Water Damage Query

**Customer Message:**
```
"My phone got wet in the sea"
```

**Modules Loaded:**
- ✅ `friendly_tone` (always)
- ✅ `context_awareness` (always)
- ✅ `common_scenarios` (water damage scenario)

**Total:** ~3 modules, ~3,000 characters

**NOT Loaded:**
- ❌ `pricing_flow_detailed` (not asking for pricing)
- ❌ `screen_diagnosis_flow` (not screen issue)
- ❌ `services_comprehensive` (has specific issue)
- ❌ `handoff_rules` (not asking for John)

**Expected Response:**
Water damage guidance, free diagnostic, urgency advice - nothing about screen pricing.

---

## Example 4: Asking for Owner

**Customer Message:**
```
"Can I speak to John?"
```

**Modules Loaded:**
- ✅ `friendly_tone` (always)
- ✅ `context_awareness` (always)
- ✅ `handoff_rules` (mentions 'john')
- ✅ `services_comprehensive` (general inquiry)

**Total:** ~4 modules, ~3,500 characters

**NOT Loaded:**
- ❌ `pricing_flow_detailed` (not asking for pricing)
- ❌ `screen_diagnosis_flow` (not screen issue)
- ❌ `common_scenarios` (not specific scenario)

**Expected Response:**
Polite handoff to John with context about what customer needs.

---

## Example 5: Device Model Unknown

**Customer Message:**
```
"I have a broken phone but don't know the model"
```

**Modules Loaded:**
- ✅ `friendly_tone` (always)
- ✅ `context_awareness` (always)
- ✅ `services_comprehensive` (general inquiry - no specific intent yet)

**Total:** ~3 modules, ~2,500 characters

**Core Prompt Includes:**
- Device model detection guidance (Settings > General > About)

**NOT Loaded:**
- ❌ `pricing_flow_detailed` (no model yet, can't price)
- ❌ `screen_diagnosis_flow` (don't know issue yet)
- ❌ `common_scenarios` (no specific scenario yet)

**Expected Response:**
Helps customer find model via Settings, friendly guidance.

---

## Comparison: Old vs New

### Old System (Before Fix)
**Every Query Loaded:**
- core_identity
- services_comprehensive
- operational_policies
- handoff_rules
- common_scenarios
- friendly_tone
- context_awareness
- + any context-specific modules

**Total:** 7-10 modules, **10,000-15,000 characters**

**Cost:** ~$0.010-0.015 per message

---

### New System (Context-Aware)
**Business Hours Query:**
- friendly_tone
- context_awareness
- services_comprehensive

**Total:** 3 modules, **~2,500 characters**

**Screen Repair Query:**
- friendly_tone
- context_awareness
- pricing_flow_detailed
- screen_diagnosis_flow
- warranty_mention

**Total:** 5 modules, **~4,000 characters**

**Cost:** ~$0.003-0.005 per message

---

## Console Log Examples

### Business Hours Query
```
[Prompt Builder] Database modules available: ['core_identity', 'services_comprehensive', 'operational_policies', 'handoff_rules', 'common_scenarios', 'pricing_flow_detailed', 'friendly_tone', 'context_awareness', ...]
[Prompt Builder] Context-aware modules used: ['friendly_tone', 'context_awareness', 'services_comprehensive']
[Smart AI] Prompt size: 2,547 characters
[Smart AI] Cost: $0.0028
```

### Screen Repair Query
```
[Prompt Builder] Database modules available: ['core_identity', 'services_comprehensive', 'operational_policies', 'handoff_rules', 'common_scenarios', 'pricing_flow_detailed', 'screen_diagnosis_flow', 'friendly_tone', 'context_awareness', 'warranty_mention', ...]
[Prompt Builder] Context-aware modules used: ['pricing_flow_detailed', 'screen_diagnosis_flow', 'friendly_tone', 'context_awareness', 'warranty_mention']
[Smart AI] Prompt size: 3,847 characters
[Smart AI] Cost: $0.0042
```

### Water Damage Query
```
[Prompt Builder] Database modules available: ['core_identity', 'services_comprehensive', 'operational_policies', 'handoff_rules', 'common_scenarios', 'pricing_flow_detailed', 'friendly_tone', 'context_awareness', ...]
[Prompt Builder] Context-aware modules used: ['common_scenarios', 'friendly_tone', 'context_awareness']
[Smart AI] Prompt size: 2,947 characters
[Smart AI] Cost: $0.0032
```

---

## Benefits

### Cost Savings
- **75% reduction** in prompt tokens
- **70% reduction** in cost per message
- Old: $0.010-0.015 per message
- New: $0.003-0.005 per message

### Response Quality
- ✅ More focused responses
- ✅ Only relevant information
- ✅ Faster AI processing
- ✅ Less overwhelming for customer
- ✅ Better context retention

### Scalability
- Can add more modules without increasing base cost
- Each module only loaded when needed
- Easy to maintain and update specific scenarios

---

## Module Loading Rules

### Always Loaded (Small, Essential)
- `friendly_tone` - Ensures consistent warm tone
- `context_awareness` - Remembers conversation

### Context-Specific (Loaded When Relevant)
- `pricing_flow_detailed` - When screen/battery pricing mentioned
- `screen_diagnosis_flow` - When screen issues mentioned
- `warranty_mention` - When pricing discussed
- `common_scenarios` - When water damage/buyback/diagnostics mentioned
- `handoff_rules` - When customer mentions 'john', 'owner', 'manager'
- `services_comprehensive` - When general inquiry (no specific intent)

### Never Loaded Unnecessarily
- `operational_policies` - Only if specifically needed (not implemented yet)
- Large scenario modules - Only when that scenario is active

---

## Testing Context-Awareness

### Test 1: Hours Query Should NOT Mention Repairs
```
Send: "What are your hours?"
Expected modules: friendly_tone, context_awareness, services_comprehensive
Expected response: Only hours, NO pricing or repair details
```

### Test 2: Screen Query Should NOT Mention Hours
```
Send: "How much for iPhone 12 screen?"
Expected modules: pricing_flow_detailed, screen_diagnosis_flow, warranty_mention, friendly_tone, context_awareness
Expected response: Pricing and warranty, NO business hours
```

### Test 3: Water Damage Should NOT Mention Screen Pricing
```
Send: "My phone got wet"
Expected modules: common_scenarios, friendly_tone, context_awareness
Expected response: Water damage guidance, NO screen pricing
```

---

## Success Criteria

✅ **Prompt size varies by query type** (not always the same)
✅ **Console shows different modules for different queries**
✅ **Responses are focused and relevant**
✅ **Cost per message is low** ($0.003-0.005)
✅ **No irrelevant information in responses**

---

## Monitoring

Watch console logs for:
```
[Prompt Builder] Context-aware modules used: [...]
```

This should show **different modules for different queries**, not the same list every time!
