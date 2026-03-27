# AI Steve Scaffolding System - Preventing Future Issues

## The Problem

AI Steve keeps saying "stupid shit" - wrong responses that don't make sense. We need scaffolding to prevent this systematically, not just keep fixing individual issues.

---

## Current Scaffolding (Already Built)

### 1. **Runtime Response Validator** ✅
**File:** `lib/ai/response-validator.ts`

**What it catches:**
- Pricing information (£, "typically £X", "around £X")
- Mentions of "John" (except in sign-off)
- Walk-in alternatives ("pop in", "bring it in")
- Device identification help ("Settings > About")

**How it works:**
```typescript
const validation = validateAIResponse(response);
if (!validation.valid) {
  // Use corrected response or flag violation
  response = validation.correctedResponse;
}
```

**Logs:**
```
[Routing Validator] ⚠️ Violations found: pricing_mention
[Routing Validator] ⚠️ Using corrected response
```

**Limitation:** Only catches specific patterns we've defined. Can't catch everything.

---

### 2. **Timestamp Awareness** ✅
**Migration:** 086_fix_stale_message_context.sql

**What it prevents:**
- Using 15-day-old "ready for collection" messages
- Assuming old repairs apply to new repairs
- Making status claims from stale data

**How it works:**
```
[RECENT STAFF MESSAGES - CHECK TIMESTAMPS]
✅ RECENT (0 days ago): John said: "Parts arrived..."
⚠️ STALE (15 days ago): John said: "Your device is ready"
```

**Logs:**
```
[Conversation History] ✅ Added 5 staff message(s) to context (2 recent, 3 stale)
```

**Limitation:** Relies on AI reading and respecting the labels. AI might still ignore them.

---

### 3. **Existing Customer Detection** ✅
**Migration:** 088_fix_turnaround_and_existing_customer.sql

**What it prevents:**
- Directing existing customers to /start page
- Saying "I don't have exact timeline" when guidance exists
- Treating active repairs like new inquiries

**How it works:**
- Checks conversation history for John's messages
- Identifies if customer is in active repair
- Provides appropriate responses for existing customers

**Logs:**
```
[Existing Customer] Identified from conversation history
[Turnaround] Using guidance for laptop software repair
```

**Limitation:** Depends on conversation history being loaded correctly. May fail if history is incomplete.

---

### 4. **Module Priority System** ✅
**How it works:**
- Priority 100: Critical rules (existing customer, timestamps, ready for collection)
- Priority 99: Important rules (greeting, conversation history)
- Priority 98: High priority (API access, quotes)
- Priority 85: General info (turnaround times)

**What it prevents:**
- Lower priority modules overriding critical rules
- Inconsistent behavior across scenarios

**Limitation:** AI still interprets all modules together. Priority doesn't guarantee enforcement.

---

### 5. **Explicit Negative Examples** ✅
**What it does:**
Shows AI exactly what NOT to say:
```
❌ WRONG: "I don't have the exact timeline"
✅ RIGHT: "Laptop software repairs typically done same day"

❌ WRONG: "Check here: /start"
✅ RIGHT: "For the BIOS repair, it's normally done same day"
```

**Limitation:** AI might still generate wrong response if it misinterprets the situation.

---

### 6. **Dual-Voice Protection** ✅
**File:** `app/lib/simple-query-detector.ts`

**What it prevents:**
- AI responding within 30 minutes of your message (for complex queries)
- AI interrupting active conversations

**How it works:**
- Simple queries (hours, location): AI responds
- Complex queries (pricing, status): AI pauses

**Logs:**
```
[Staff Activity Check] Should AI respond? false
[Staff Activity Check] Reason: Staff replied 15 minutes ago - waiting for staff
```

**Limitation:** 30-minute window might be too short. Simple query detection might be too permissive.

---

## Missing Scaffolding (Should Add)

### 7. **Response Confidence Check** ❌ NOT BUILT
**What it would do:**
- AI rates its own confidence in response (0-100%)
- If confidence <70%, don't send response
- Create alert for manual handling instead

**Example:**
```typescript
const confidence = checkResponseConfidence(response, context);
if (confidence < 70) {
  // Don't send, alert staff instead
  createAlert("Low confidence response - needs manual attention");
  return;
}
```

**Would prevent:**
- AI guessing when unsure
- Sending wrong information with confidence
- Making up answers

**Implementation effort:** Medium (need AI to self-assess)

---

### 8. **Conversation Context Validator** ❌ NOT BUILT
**What it would do:**
- Verify AI has all required context before responding
- Check: Has conversation history? Has API data if needed? Has customer info?
- Block response if missing critical context

**Example:**
```typescript
const contextCheck = validateContext({
  hasConversationHistory: true,
  hasAPIDataIfNeeded: true,
  hasCustomerInfo: true
});

if (!contextCheck.valid) {
  // Missing context - don't respond
  createAlert(`Missing context: ${contextCheck.missing}`);
  return;
}
```

**Would prevent:**
- Responding without seeing John's messages
- Claiming no API access when API wasn't checked
- Making assumptions without data

**Implementation effort:** Medium

---

### 9. **Response Pattern Matching** ❌ NOT BUILT
**What it would do:**
- Check response against known bad patterns
- Block responses that match failure patterns
- Learn from past mistakes

**Example patterns to block:**
```typescript
const badPatterns = [
  /I don't have (the )?exact timeline/i,
  /check (the status|more details) here:.*\/start/i,
  /I don't have access to repair status/i,
  /^[A-Z][a-z]+!$/  // Just name with exclamation
];
```

**Would prevent:**
- Repeating known failure patterns
- Saying things we've explicitly fixed before

**Implementation effort:** Low (just regex checks)

---

### 10. **API Data Verification** ❌ NOT BUILT
**What it would do:**
- Verify API was actually called when customer asks about status
- Check if API data is in context before allowing status claims
- Force API check if customer asks "is my X ready?"

**Example:**
```typescript
if (isStatusInquiry(message)) {
  if (!hasAPIData(context)) {
    // Force API check
    const apiData = await checkRepairStatus(phone);
    addToContext(apiData);
  }
}
```

**Would prevent:**
- Saying "I don't have access" when API wasn't checked
- Making status claims without verification
- Guessing about repair status

**Implementation effort:** Low (already have API, just need to enforce)

---

### 11. **Turnaround Guidance Enforcer** ❌ NOT BUILT
**What it would do:**
- Detect "how long" questions
- Force use of turnaround guidance
- Block "I don't know" responses when guidance exists

**Example:**
```typescript
if (isTurnaroundQuestion(message)) {
  const guidance = getTurnaroundGuidance(repairType);
  if (guidance && !responseUsesGuidance(response, guidance)) {
    // Force use of guidance
    response = generateWithGuidance(message, guidance);
  }
}
```

**Would prevent:**
- "I don't have exact timeline" when guidance exists
- Directing to /start when we have timeframes
- Vague non-answers

**Implementation effort:** Low

---

### 12. **Existing Customer Enforcer** ❌ NOT BUILT
**What it would do:**
- Check if customer is in active conversation
- Block /start links for existing customers
- Force direct answers

**Example:**
```typescript
const isExisting = hasRecentStaffMessages(conversationHistory);
if (isExisting && response.includes('/start')) {
  // Block /start for existing customers
  response = removeStartLinks(response);
  response = useDirectAnswer(message, context);
}
```

**Would prevent:**
- Directing existing customers to /start
- Treating active repairs like new inquiries

**Implementation effort:** Low

---

## Recommended Scaffolding Priority

### Immediate (This Week)
1. **Response Pattern Matching** - Low effort, high impact
2. **API Data Verification** - Low effort, prevents major issue
3. **Turnaround Guidance Enforcer** - Low effort, fixes current issue
4. **Existing Customer Enforcer** - Low effort, fixes current issue

### Short-term (This Month)
5. **Conversation Context Validator** - Medium effort, prevents many issues
6. **Response Confidence Check** - Medium effort, catches uncertainty

### Long-term (Next Quarter)
7. **Machine Learning Pattern Detection** - Learn from failures automatically
8. **A/B Testing Framework** - Test changes before full deployment
9. **Automated Regression Testing** - Run test suite on every deploy

---

## How Scaffolding Works Together

**Example: Customer asks "How long will it take?"**

1. **Dual-Voice Protection** checks: Is John active? → No, proceed
2. **Existing Customer Detection** checks: Is this existing customer? → Yes
3. **Turnaround Guidance Enforcer** checks: Is this turnaround question? → Yes
4. **Turnaround Guidance Enforcer** forces: Use turnaround guidance
5. **Existing Customer Enforcer** blocks: No /start links
6. **Response Pattern Matching** checks: Against bad patterns → Clean
7. **Runtime Validator** checks: No pricing, no John mentions → Clean
8. **Send response:** "Laptop software repairs typically done same day within a few hours"

**Without scaffolding:**
- AI might say "I don't have exact timeline"
- AI might direct to /start page
- AI might make up timeframe
- No checks, no enforcement

---

## Implementation Plan

### Phase 1: Quick Wins (This Week)
```typescript
// Add to lib/ai/response-enforcer.ts

// 1. Response Pattern Matching
const badPatterns = [
  /I don't have (the )?exact timeline/i,
  /check.*here:.*\/start/i,
  /I don't have access to repair status/i,
];

function blockBadPatterns(response: string): string {
  for (const pattern of badPatterns) {
    if (pattern.test(response)) {
      console.warn(`[Pattern Block] Blocked bad pattern: ${pattern}`);
      return null; // Force regeneration
    }
  }
  return response;
}

// 2. Turnaround Guidance Enforcer
function enforceTurnaroundGuidance(message: string, response: string): string {
  if (isTurnaroundQuestion(message)) {
    if (response.includes("I don't have") || response.includes("/start")) {
      console.warn(`[Turnaround Enforcer] Forcing guidance use`);
      return generateWithGuidance(message);
    }
  }
  return response;
}

// 3. Existing Customer Enforcer
function enforceExistingCustomer(conversationHistory: any[], response: string): string {
  const isExisting = hasRecentStaffMessages(conversationHistory);
  if (isExisting && response.includes('/start')) {
    console.warn(`[Existing Customer Enforcer] Removing /start for existing customer`);
    return response.replace(/https:\/\/www\.newforestdevicerepairs\.co\.uk\/start/g, '');
  }
  return response;
}
```

### Phase 2: Context Validation (Next Week)
```typescript
// Add to lib/ai/context-validator.ts

function validateContext(params: {
  hasConversationHistory: boolean;
  hasAPIDataIfNeeded: boolean;
  hasCustomerInfo: boolean;
  isStatusInquiry: boolean;
}): { valid: boolean; missing: string[] } {
  const missing = [];
  
  if (!params.hasConversationHistory) {
    missing.push("conversation_history");
  }
  
  if (params.isStatusInquiry && !params.hasAPIDataIfNeeded) {
    missing.push("api_data");
  }
  
  return {
    valid: missing.length === 0,
    missing
  };
}
```

---

## Success Metrics

**Scaffolding is working when:**

✅ **Validation warnings decrease**
- Week 1: 20 warnings
- Week 2: 10 warnings
- Week 3: 5 warnings
- Target: <2 warnings per week

✅ **Customer complaints decrease**
- Before: 5-10 per week
- After: <2 per week

✅ **Test pass rate increases**
- Before: 70% passing
- Target: 95% passing

✅ **Known bad patterns eliminated**
- "I don't have exact timeline" → 0 occurrences
- "/start for existing customers" → 0 occurrences
- "I don't have access to repair status" → 0 occurrences

---

## Monitoring Scaffolding

**Daily checks:**
```bash
# Check for bad patterns in logs
vercel logs | grep "I don't have exact timeline"
vercel logs | grep "check.*here:.*start"
vercel logs | grep "I don't have access to repair"
```

**Weekly review:**
```sql
-- Count validation warnings
SELECT COUNT(*) 
FROM logs 
WHERE message LIKE '%[Routing Validator] ⚠️%'
AND created_at > NOW() - INTERVAL '7 days';

-- Count bad pattern blocks
SELECT COUNT(*) 
FROM logs 
WHERE message LIKE '%[Pattern Block]%'
AND created_at > NOW() - INTERVAL '7 days';
```

---

## Summary

**Current scaffolding (6 layers):**
1. ✅ Runtime response validator
2. ✅ Timestamp awareness
3. ✅ Existing customer detection
4. ✅ Module priority system
5. ✅ Explicit negative examples
6. ✅ Dual-voice protection

**Missing scaffolding (6 layers):**
7. ❌ Response confidence check
8. ❌ Conversation context validator
9. ❌ Response pattern matching
10. ❌ API data verification
11. ❌ Turnaround guidance enforcer
12. ❌ Existing customer enforcer

**Quick wins (implement this week):**
- Response pattern matching (blocks known bad patterns)
- API data verification (forces API check)
- Turnaround guidance enforcer (forces use of guidance)
- Existing customer enforcer (blocks /start for existing)

**These 4 additions would prevent most current issues.**

**Target: 95% of conversations with no issues**
