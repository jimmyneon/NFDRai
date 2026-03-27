# Final Verification Checklist - AI Steve Complete System Check

## Current Status: Pre-Migration Verification

**Migrations pending:**
- 085_fix_ai_steve_critical_issues.sql
- 086_fix_stale_message_context.sql
- 087_add_turnaround_times.sql
- 088_fix_turnaround_and_existing_customer.sql

---

## Step 1: Apply All Migrations

```bash
cd /Users/johnhopwood/NFDRAIRESPONDER
supabase migration up
```

**Expected output:**
```
✅ 085_fix_ai_steve_critical_issues.sql applied
✅ 086_fix_stale_message_context.sql applied
✅ 087_add_turnaround_times.sql applied
✅ 088_fix_turnaround_and_existing_customer.sql applied
```

**Verify modules loaded:**
```sql
SELECT module_name, priority, active 
FROM prompts 
WHERE active = true 
ORDER BY priority DESC;
```

**Expected modules (priority order):**
- [ ] `existing_customer_awareness` (100)
- [ ] `timestamp_awareness` (100)
- [ ] `ready_for_collection_guardrails` (100)
- [ ] `greeting_policy` (99)
- [ ] `conversation_history_awareness` (99)
- [ ] `repair_status_api` (98)
- [ ] `quote_context_awareness` (98)
- [ ] `turnaround_times` (85)

---

## Step 2: Critical Test Scenarios

### Test 1: Greeting (No Shouty Names)
**Setup:** Customer name is "Edita"  
**Message:** "Hello, I need help"  
**Expected:** "Hi Edita!" or "Hi there, Edita!"  
**NOT:** "Edita!" (shouty)  
**Result:** [ ] PASS [ ] FAIL

---

### Test 2: Stale Message Awareness
**Setup:** 15-day-old message saying "Your device is ready for collection"  
**Message:** "Is my iPad ready?"  
**Expected:** "I don't see any active repairs" or checks API  
**NOT:** "It's ready for collection"  
**Result:** [ ] PASS [ ] FAIL

---

### Test 3: Existing Customer - Turnaround Time
**Setup:** John quoted £50 for BIOS repair, customer accepted  
**Message:** "How long will it take?"  
**Expected:** "Laptop software repairs typically done same day within a few hours"  
**NOT:** "I don't have exact timeline" or "/start" link  
**Result:** [ ] PASS [ ] FAIL

---

### Test 4: API Access (Not Claiming No Access)
**Setup:** Customer has active repair in system  
**Message:** "Is my Samsung S22 done?"  
**Expected:** Uses API data or provides status  
**NOT:** "I don't have access to repair statuses"  
**Result:** [ ] PASS [ ] FAIL

---

### Test 5: Pricing Policy (No Estimates)
**Message:** "How much for iPhone 13 screen?"  
**Expected:** Link to repair-request form  
**NOT:** Any £ amounts, "typically", "around", "usually"  
**Result:** [ ] PASS [ ] FAIL

---

### Test 6: No Walk-in Suggestions
**Message:** "I don't know what model my phone is"  
**Expected:** Link to repair-request form  
**NOT:** "pop in", "bring it in", "Settings > About"  
**Result:** [ ] PASS [ ] FAIL

---

### Test 7: Conversation History Awareness
**Setup:** John sent "£130 for OLED or £110 for LCD" today  
**Message:** "Can I get the cheaper option?"  
**Expected:** References "£110" and "LCD" from John's message  
**NOT:** "Get a quote here"  
**Result:** [ ] PASS [ ] FAIL

---

### Test 8: Dual-Voice Protection
**Setup:** John sent message 15 minutes ago  
**Message:** "How much for screen?" (complex query)  
**Expected:** No AI response (alert created for staff)  
**Result:** [ ] PASS [ ] FAIL

**Setup:** John sent message 15 minutes ago  
**Message:** "When are you open?" (simple query)  
**Expected:** AI responds with hours  
**Result:** [ ] PASS [ ] FAIL

---

### Test 9: Laptop Software vs Hardware Timeframes
**Message:** "How long for laptop BIOS repair?"  
**Expected:** "Same day within a few hours"  
**NOT:** "Within 3 days"  
**Result:** [ ] PASS [ ] FAIL

**Message:** "How long for laptop hardware repair?"  
**Expected:** "Within 3 days normally"  
**NOT:** Same day timeframe  
**Result:** [ ] PASS [ ] FAIL

---

### Test 10: No /start for Existing Customers
**Setup:** Customer in active conversation with John  
**Message:** "When will it be ready?"  
**Expected:** Uses turnaround guidance or checks API  
**NOT:** "Check here: https://www.newforestdevicerepairs.co.uk/start"  
**Result:** [ ] PASS [ ] FAIL

---

## Step 3: Verify Logging

**Check Vercel logs for these patterns:**

✅ **Good patterns (should see):**
```
[Conversation History] ✅ Added X staff message(s) to context (X recent, X stale)
[Repair Status] Customer asking about repair - FORCING API check...
[Repair Status] ✅ Found X job(s) - added to AI context
[Staff Activity Check] Should AI respond? false (during pause)
```

❌ **Bad patterns (should NOT see):**
```
[Response] "I don't have the exact timeline"
[Response] "check the status here: /start"
[Response] "I don't have access to repair statuses"
[Response] Starting with just name: "Edita!"
```

---

## Step 4: Known Limitations & Failure Points

### Limitation 1: AI Model Interpretation
**Issue:** Even with perfect prompts, AI may occasionally misinterpret  
**Mitigation:** Runtime validation catches forbidden content  
**Monitoring:** Check `[Routing Validator] ⚠️ Violations found`

### Limitation 2: 30-Minute Pause Window
**Issue:** AI resumes after 30 min even if you're still active  
**Mitigation:** Simple query detection allows only factual questions  
**Monitoring:** Check `[Staff Activity Check]` logs for interruptions  
**Potential fix:** Extend to 60 minutes if needed

### Limitation 3: Context Window Size
**Issue:** AI only sees last 15 messages  
**Mitigation:** Timestamp awareness prevents using old messages  
**Monitoring:** Check if AI references very old information  
**Potential fix:** Increase to 20-25 messages if needed

### Limitation 4: API Failures
**Issue:** Repair status API may fail or timeout  
**Mitigation:** Safe failure behavior (directs to contact)  
**Monitoring:** Check `[Repair Status] ❌ Failed to check status`

### Limitation 5: Race Conditions
**Issue:** Customer and you message at same time  
**Mitigation:** Timestamp checks, staff activity detection  
**Monitoring:** Check for dual responses in same conversation

---

## Step 5: Scaffolding to Prevent Future Issues

### Scaffold 1: Response Validation (Already Active)
**File:** `lib/ai/response-validator.ts`

**What it does:**
- Checks every AI response before sending
- Blocks forbidden content (pricing, John mentions, walk-ins)
- Logs violations for review

**How it prevents issues:**
- Catches AI saying things it shouldn't
- Provides corrected response
- Creates audit trail

### Scaffold 2: Timestamp Awareness (New - Migration 086)
**What it does:**
- Labels all staff messages with age
- Marks messages >7 days as STALE
- Warns AI not to use stale messages for current status

**How it prevents issues:**
- Prevents using 2-week-old "ready" messages
- Forces API check for current status
- Stops customers being sent on wasted trips

### Scaffold 3: Existing Customer Detection (New - Migration 088)
**What it does:**
- Checks conversation history for John's messages
- Identifies if customer is in active repair
- Prevents routing existing customers to /start

**How it prevents issues:**
- Stops nonsensical "check /start" responses
- Ensures existing customers get direct answers
- Uses turnaround guidance appropriately

### Scaffold 4: Module Priority System
**What it does:**
- Critical modules (100) override general modules (85)
- Ensures important rules take precedence
- Prevents lower-priority guidance from overriding critical rules

**How it prevents issues:**
- `existing_customer_awareness` (100) > `turnaround_times` (85)
- Critical rules always enforced first
- Consistent behavior across scenarios

### Scaffold 5: Explicit Negative Examples
**What it does:**
- Shows AI exactly what NOT to say
- Provides "WRONG" vs "RIGHT" examples
- Uses ❌ and ✅ markers for clarity

**How it prevents issues:**
- AI learns from anti-patterns
- Reduces ambiguity in instructions
- Makes rules crystal clear

---

## Step 6: Monitoring Strategy

### Daily Monitoring (5 minutes)
1. Check Vercel logs for validation warnings
2. Review any customer complaints
3. Spot-check 2-3 recent conversations

**Red flags:**
- Multiple `[Routing Validator] ⚠️ Violations`
- Customer complaints about wrong info
- AI responses with "/start" for existing customers

### Weekly Monitoring (30 minutes)
1. Run comprehensive test suite
2. Review all validation warnings from week
3. Check for new failure patterns
4. Update test scenarios if needed

**Actions:**
- Document new failure patterns
- Add test cases for new issues
- Adjust prompt priorities if needed

### Monthly Audit (2 hours)
1. Full system review
2. Analyze conversation logs
3. Calculate success metrics
4. Update documentation

**Metrics to track:**
- % of conversations with no issues
- % of validation warnings
- % of customer complaints
- Common failure patterns

---

## Step 7: What to Do When Issues Occur

### Issue: AI Says Something Wrong

**Immediate actions:**
1. Screenshot the conversation
2. Note exact message and response
3. Check Vercel logs for that conversation
4. Identify which rule was broken

**Investigation:**
1. Was it caught by validation? (check logs)
2. Which module should have prevented it?
3. Is the module active and correct priority?
4. Is the prompt text clear enough?

**Fix:**
1. Update relevant prompt module
2. Add explicit negative example
3. Increase priority if needed
4. Add test case to prevent recurrence
5. Create migration
6. Test fix

### Issue: AI Interrupting You

**Check:**
1. How many minutes since your last message?
2. Was customer message classified as simple or complex?
3. Should it have been classified differently?

**Fix:**
1. If simple query detection too permissive: Tighten patterns
2. If 30-min window too short: Extend to 45-60 minutes
3. If race condition: Add delay before AI responds

### Issue: AI Not Using Available Data

**Check:**
1. Is data being added to context? (check logs)
2. Is AI seeing the context markers?
3. Is prompt emphasizing to use the data?

**Fix:**
1. Make context markers more prominent
2. Add explicit rule to use available data
3. Increase module priority
4. Add negative examples of NOT using data

---

## Step 8: Success Criteria

**System is working correctly when:**

✅ **95%+ of conversations have no issues**
- No validation warnings
- No customer complaints
- Appropriate responses

✅ **Critical tests all pass**
- Greeting: No shouty names
- Stale messages: Not used for current status
- Existing customers: Not routed to /start
- API access: Used when available
- Pricing: No estimates given

✅ **Monitoring shows good patterns**
- Conversation history loaded with timestamps
- API checks forced for status inquiries
- Staff activity respected (30-min pause)
- Validation catching edge cases

✅ **Failures are caught and corrected**
- Validation warnings logged
- Corrected responses used
- Patterns identified and fixed

---

## Step 9: Emergency Rollback

**If AI Steve is completely broken:**

```bash
# Disable AI responses temporarily
# Update conversation mode to 'manual' for all active conversations
```

**Then:**
1. Review recent changes
2. Identify breaking change
3. Revert migration if needed
4. Fix issue
5. Test thoroughly
6. Re-enable

---

## Summary

**Current state:**
- ✅ 4 migrations ready to apply
- ✅ Comprehensive test suite created
- ✅ Monitoring strategy defined
- ✅ Scaffolding in place

**To complete:**
1. Run migrations: `supabase migration up`
2. Test 10 critical scenarios above
3. Monitor logs for 24 hours
4. Adjust if needed

**Scaffolding prevents issues by:**
1. Runtime validation (catches forbidden content)
2. Timestamp awareness (prevents stale data)
3. Existing customer detection (prevents wrong routing)
4. Module priority system (ensures critical rules win)
5. Explicit negative examples (shows what NOT to do)

**Success = 95%+ conversations with no issues**

If issues occur: Document → Investigate → Fix → Test → Deploy
