# Content Type → Prompt Module Mapping

## You're Absolutely Right!

There are **WAY more modules** than I initially listed. Here's the complete mapping from the database:

---

## All Existing Prompt Modules (From Database)

### Core Modules (Always Loaded)
1. **`core_identity`** - Who AI Steve is, limitations, response style
2. **`context_awareness`** - Understanding conversation context
3. **`duplicate_prevention`** - Avoid repeating messages
4. **`confidence_based_handoff`** - When to pass to John
5. **`handoff_rules`** - Specific handoff scenarios

### Repair & Service Modules
6. **`screen_repair`** - Screen replacement pricing and process
7. **`battery_replacement`** - Battery replacement pricing
8. **`diagnostic`** - Diagnostic services and pricing
9. **`services_comprehensive`** - Full service list
10. **`operational_policies`** - Payment, data backup, warranties
11. **`device_quick_reference`** - Device-specific troubleshooting

### Communication Modules
12. **`time_aware_responses`** - Business hours awareness
13. **`time_awareness`** - Time-based responses
14. **`topic_switch_handler`** - Handling topic changes
15. **`typo_tolerance`** - Understanding typos
16. **`efficient_questioning`** - Asking good questions
17. **`friendly_tone`** - Maintaining friendly communication

### Scenario Modules
18. **`common_scenarios`** - Water damage, diagnostics, buyback, etc.
19. **`ask_whats_wrong_first`** - Prioritize asking about the issue
20. **`proactive_troubleshooting`** - Help customer diagnose
21. **`status_check`** - Repair status inquiries
22. **`buyback`** - Device buyback inquiries

### Pricing Modules
23. **`pricing_flow`** - General pricing flow
24. **`pricing_flow_detailed`** - Drip-fed pricing information

---

## Proposed Content Type → Module Mapping

### Intent: `question` (General Inquiry)

#### ContentType: `pricing`
**Modules to load:**
- `core_identity` (always)
- `pricing_flow_detailed` (drip-fed pricing)
- `services_comprehensive` (what we do)
- `operational_policies` (payment, warranty)
- `time_aware_responses` (business hours)

**Example:** "How much for iPhone screen?"

---

#### ContentType: `business_hours`
**Modules to load:**
- `core_identity` (always)
- `time_aware_responses` (hours awareness)
- `time_awareness` (time-based responses)
- `operational_policies` (walk-in policy)

**Example:** "When are you open?"

---

#### ContentType: `location`
**Modules to load:**
- `core_identity` (always)
- `time_aware_responses` (hours + location)
- `operational_policies` (walk-in policy)

**Example:** "Where are you located?"

---

#### ContentType: `services`
**Modules to load:**
- `core_identity` (always)
- `services_comprehensive` (full service list)
- `operational_policies` (what we do/don't do)
- `device_quick_reference` (device-specific info)

**Example:** "Do you fix laptops?"

---

#### ContentType: `warranty`
**Modules to load:**
- `core_identity` (always)
- `operational_policies` (warranty info)
- `common_scenarios` (warranty claims)
- `services_comprehensive` (warranty periods)

**Example:** "What's your warranty?"

---

### Intent: `status_check` (Repair Status)

#### ContentType: `repair_status`
**Modules to load:**
- `core_identity` (always)
- `status_check` (status inquiry handling)
- `handoff_rules` (pass to John)
- `time_aware_responses` (collection hours)

**Example:** "Is my phone ready?"

---

### Intent: `complaint` (Customer Dissatisfaction)

#### ContentType: `dissatisfaction`
**Modules to load:**
- `core_identity` (always)
- `handoff_rules` (immediate handoff)
- `confidence_based_handoff` (escalation)
- `operational_policies` (our policies)

**Example:** "This is taking too long!"

**Action:** Switch to manual mode immediately

---

### Intent: `booking` (Appointment Request)

#### ContentType: `appointment`
**Modules to load:**
- `core_identity` (always)
- `time_aware_responses` (business hours)
- `operational_policies` (walk-in only policy)
- `services_comprehensive` (what we do)

**Example:** "Can I book in for tomorrow?"

---

### Intent: `greeting` (Customer Introduction)

#### ContentType: `introduction`
**Modules to load:**
- `core_identity` (always)
- `context_awareness` (new conversation)
- `efficient_questioning` (ask what they need)
- `ask_whats_wrong_first` (prioritize issue)

**Example:** "Hi, I'm Carol"

---

### Intent: `device_issue` (Technical Problem)

#### ContentType: `troubleshooting`
**Modules to load:**
- `core_identity` (always)
- `proactive_troubleshooting` (help diagnose)
- `device_quick_reference` (device-specific)
- `common_scenarios` (common issues)
- `diagnostic` (diagnostic services)
- `ask_whats_wrong_first` (get details)

**Example:** "My screen is cracked" or "Phone won't turn on"

---

#### ContentType: `water_damage`
**Modules to load:**
- `core_identity` (always)
- `common_scenarios` (water damage section)
- `diagnostic` (free diagnostic)
- `operational_policies` (warranty info)

**Example:** "I dropped my phone in water"

---

#### ContentType: `battery_issue`
**Modules to load:**
- `core_identity` (always)
- `battery_replacement` (battery pricing)
- `common_scenarios` (battery health check)
- `pricing_flow_detailed` (pricing flow)

**Example:** "My battery drains fast"

---

#### ContentType: `screen_damage`
**Modules to load:**
- `core_identity` (always)
- `screen_repair` (screen pricing)
- `pricing_flow_detailed` (drip-fed pricing)
- `operational_policies` (warranty)

**Example:** "My screen is cracked"

---

### Intent: `buyback` (Selling Device)

#### ContentType: `device_sale`
**Modules to load:**
- `core_identity` (always)
- `buyback` (buyback process)
- `common_scenarios` (buyback queries)
- `efficient_questioning` (get device details)

**Example:** "Do you buy old phones?"

---

### Intent: `purchase` (Buying Device)

#### ContentType: `device_purchase`
**Modules to load:**
- `core_identity` (always)
- `services_comprehensive` (refurbished devices)
- `common_scenarios` (device sales)
- `operational_policies` (warranty on refurb)

**Example:** "Do you sell iPhones?"

---

### Intent: `acknowledgment` (Simple Response)

#### ContentType: `acknowledgment`
**Modules to load:**
- `core_identity` (always)

**Example:** "Ok thanks"

**Action:** No AI response needed

---

### Intent: `unclear` (Can't Determine)

#### ContentType: `unclear`
**Modules to load:**
- `core_identity` (always)
- `context_awareness` (understand context)
- `efficient_questioning` (clarify)
- `handoff_rules` (may need John)

**Example:** "It's for the tall guy with beard"

**Action:** Usually don't respond, alert staff

---

## Complete Module Selection Logic

```typescript
function getModulesForAnalysis(analysis: UnifiedAnalysis): string[] {
  // Always load core modules
  const modules = [
    'core_identity',
    'context_awareness',
    'duplicate_prevention',
  ]
  
  // Add based on intent + content type
  const { intent, contentType } = analysis
  
  // PRICING QUESTIONS
  if (intent === 'question' && contentType === 'pricing') {
    modules.push(
      'pricing_flow_detailed',
      'services_comprehensive',
      'operational_policies',
      'time_aware_responses'
    )
  }
  
  // BUSINESS HOURS
  else if (intent === 'question' && contentType === 'business_hours') {
    modules.push(
      'time_aware_responses',
      'time_awareness',
      'operational_policies'
    )
  }
  
  // LOCATION
  else if (intent === 'question' && contentType === 'location') {
    modules.push(
      'time_aware_responses',
      'operational_policies'
    )
  }
  
  // GENERAL SERVICES
  else if (intent === 'question' && contentType === 'services') {
    modules.push(
      'services_comprehensive',
      'operational_policies',
      'device_quick_reference'
    )
  }
  
  // WARRANTY
  else if (intent === 'question' && contentType === 'warranty') {
    modules.push(
      'operational_policies',
      'common_scenarios',
      'services_comprehensive'
    )
  }
  
  // REPAIR STATUS
  else if (intent === 'status_check') {
    modules.push(
      'status_check',
      'handoff_rules',
      'time_aware_responses'
    )
  }
  
  // COMPLAINT
  else if (intent === 'complaint') {
    modules.push(
      'handoff_rules',
      'confidence_based_handoff',
      'operational_policies'
    )
  }
  
  // BOOKING
  else if (intent === 'booking') {
    modules.push(
      'time_aware_responses',
      'operational_policies',
      'services_comprehensive'
    )
  }
  
  // GREETING/INTRODUCTION
  else if (intent === 'greeting') {
    modules.push(
      'efficient_questioning',
      'ask_whats_wrong_first'
    )
  }
  
  // DEVICE ISSUES - TROUBLESHOOTING
  else if (intent === 'device_issue' && contentType === 'troubleshooting') {
    modules.push(
      'proactive_troubleshooting',
      'device_quick_reference',
      'common_scenarios',
      'diagnostic',
      'ask_whats_wrong_first'
    )
  }
  
  // DEVICE ISSUES - WATER DAMAGE
  else if (intent === 'device_issue' && contentType === 'water_damage') {
    modules.push(
      'common_scenarios',
      'diagnostic',
      'operational_policies'
    )
  }
  
  // DEVICE ISSUES - BATTERY
  else if (intent === 'device_issue' && contentType === 'battery_issue') {
    modules.push(
      'battery_replacement',
      'common_scenarios',
      'pricing_flow_detailed'
    )
  }
  
  // DEVICE ISSUES - SCREEN
  else if (intent === 'device_issue' && contentType === 'screen_damage') {
    modules.push(
      'screen_repair',
      'pricing_flow_detailed',
      'operational_policies'
    )
  }
  
  // BUYBACK
  else if (intent === 'buyback') {
    modules.push(
      'buyback',
      'common_scenarios',
      'efficient_questioning'
    )
  }
  
  // PURCHASE
  else if (intent === 'purchase') {
    modules.push(
      'services_comprehensive',
      'common_scenarios',
      'operational_policies'
    )
  }
  
  // UNCLEAR - minimal modules
  else if (intent === 'unclear') {
    modules.push(
      'efficient_questioning',
      'handoff_rules'
    )
  }
  
  // Add communication modules (always useful)
  modules.push(
    'friendly_tone',
    'typo_tolerance'
  )
  
  return modules
}
```

---

## Content Types to Detect

The unified analyzer should detect these content types:

### Questions
- `pricing` - "How much for iPhone screen?"
- `business_hours` - "When are you open?"
- `location` - "Where are you located?"
- `services` - "Do you fix laptops?"
- `warranty` - "What's your warranty?"

### Device Issues
- `troubleshooting` - "My phone won't turn on"
- `water_damage` - "I dropped it in water"
- `battery_issue` - "Battery drains fast"
- `screen_damage` - "Screen is cracked"
- `camera_issue` - "Camera not working"
- `charging_issue` - "Won't charge"
- `software_issue` - "Phone is slow"

### Transactions
- `device_sale` - "Do you buy old phones?" (buyback)
- `device_purchase` - "Do you sell iPhones?"
- `appointment` - "Can I book in?"
- `repair_status` - "Is my phone ready?"

### Communication
- `introduction` - "Hi, I'm Carol"
- `acknowledgment` - "Ok thanks"
- `dissatisfaction` - "This is taking too long"
- `unclear` - "It's for the tall guy"

---

## Updated Unified Analyzer

Need to add `contentType` detection to the unified analyzer:

```typescript
export interface UnifiedAnalysis {
  // Existing fields
  sentiment: 'positive' | 'neutral' | 'negative' | 'frustrated' | 'angry'
  urgency: 'low' | 'medium' | 'high' | 'critical'
  requiresStaffAttention: boolean
  sentimentKeywords: string[]
  intent: 'question' | 'complaint' | 'booking' | 'status_check' | 'greeting' | 
          'acknowledgment' | 'device_issue' | 'buyback' | 'purchase' | 'unclear'
  intentConfidence: number
  shouldAIRespond: boolean
  contextConfidence: number
  isDirectedAtAI: boolean
  reasoning: string
  customerName: string | null
  nameConfidence: number
  overallConfidence: number
  
  // NEW FIELD
  contentType: 'pricing' | 'business_hours' | 'location' | 'services' | 'warranty' |
               'troubleshooting' | 'water_damage' | 'battery_issue' | 'screen_damage' |
               'camera_issue' | 'charging_issue' | 'software_issue' |
               'device_sale' | 'device_purchase' | 'appointment' | 'repair_status' |
               'introduction' | 'acknowledgment' | 'dissatisfaction' | 'unclear'
}
```

---

## Summary

**You're 100% correct!** There are **24 prompt modules** in the database, not just the 10 I initially listed.

The unified analyzer should:
1. ✅ Detect `intent` (what customer wants to do)
2. ✅ Detect `contentType` (specific topic/issue)
3. ✅ Map to correct prompt modules
4. ✅ Load only relevant modules for each conversation

This makes the system:
- **More accurate** - Right context for each situation
- **Faster** - Only load needed modules
- **Cheaper** - Fewer tokens per request
- **Smarter** - Better responses for each scenario

Want me to update the unified analyzer to include `contentType` detection?
