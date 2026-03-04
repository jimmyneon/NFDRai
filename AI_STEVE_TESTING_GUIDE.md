# AI Steve Testing & Validation Guide

## The Problem

AI Steve keeps doing "daft stuff" - using old messages, claiming no API access, shouty greetings, etc. We need a systematic way to test and prevent these issues.

## The Solution: Multi-Layer Testing Approach

### 1. **Automated Test Suite** (Run First)
**File:** `test-ai-steve-comprehensive.js`

**What it does:**
- Defines 60+ test scenarios covering all critical behaviors
- Provides structured test cases with expected inputs/outputs
- Categorizes by severity (CRITICAL, HIGH, MEDIUM)

**How to use:**
```bash
node test-ai-steve-comprehensive.js > test-results.txt
```

This outputs a comprehensive test plan you can work through manually.

---

### 2. **Database Validation** (Before Testing)

**Run migrations:**
```bash
cd /Users/johnhopwood/NFDRAIRESPONDER
supabase migration up
```

**Verify modules loaded:**
```sql
SELECT module_name, priority, active 
FROM prompts 
WHERE active = true 
ORDER BY priority DESC;
```

**Expected modules:**
- `greeting_policy` (priority 99)
- `timestamp_awareness` (priority 100)
- `ready_for_collection_guardrails` (priority 100)
- `repair_status_api` (priority 98)
- `conversation_history_awareness` (priority 99)
- `quote_context_awareness` (priority 98)

---

### 3. **Manual Testing Workflow**

#### Step 1: Test Critical Scenarios First

**Priority: CRITICAL (Must Pass)**

1. **Greeting Test**
   - Send: "Hello, I need help" (with customer name "Edita")
   - Expected: "Hi Edita!" or "Hi there, Edita!"
   - NOT: "Edita!" (shouty)

2. **Stale Message Test**
   - Setup: Old message from 15 days ago saying "ready for collection"
   - Send: "Is my iPad ready?"
   - Expected: "I don't see any active repairs" or "check current status"
   - NOT: "It's ready for collection"

3. **API Access Test**
   - Send: "Is my Samsung S22 done?"
   - Expected: Uses API data or directs to contact
   - NOT: "I don't have access to repair statuses"

4. **Pricing Policy Test**
   - Send: "How much for iPhone 13 screen?"
   - Expected: Link to repair-request form
   - NOT: Any £ amounts, "typically", "around", "usually"

5. **Walk-in Prevention Test**
   - Send: "I don't know what model my phone is"
   - Expected: Link to repair-request form
   - NOT: "pop in", "bring it in", "Settings > About"

#### Step 2: Test High Priority Scenarios

6. **Conversation History Test**
   - Setup: John sent "£130 for OLED or £110 for LCD" today
   - Send: "Can I get the cheaper option?"
   - Expected: References "£110" and "LCD" from John's message
   - NOT: "Get a quote here"

7. **Dual-Voice Protection Test**
   - Setup: John sent message 15 minutes ago
   - Send: "How much for screen?" (complex query)
   - Expected: No AI response (alert created for staff)
   - Send: "When are you open?" (simple query)
   - Expected: AI responds with hours

8. **Ready for Collection Guardrails**
   - Setup: API shows "In progress"
   - Old message: "Your device is ready" (5 days ago)
   - Send: "Is my phone ready?"
   - Expected: "In progress" (from API)
   - NOT: "Ready for collection" (from old message)

---

### 4. **Monitoring & Logging**

**Check Vercel logs for these patterns:**

✅ **Good patterns:**
```
[Conversation History] ✅ Added 5 staff message(s) to context (2 recent, 3 stale)
[Repair Status] Customer asking about repair - FORCING API check...
[Repair Status] ✅ Found 1 job(s) - added to AI context
[UK Number] ✅ Verified UK number - processing allowed
```

⚠️ **Warning patterns:**
```
[Routing Validator] ⚠️ Violations found
[Routing Validator] ⚠️ Using corrected response
[Staff Activity Check] Should AI respond? false
```

❌ **Problem patterns:**
```
[Repair Status] ❌ Failed to check status
[International Block] ❌ (should be rare)
```

---

### 5. **Response Validation Checklist**

For every AI response, check:

- [ ] **Greeting:** Includes "Hi" or "Hi there" before name
- [ ] **Timestamp:** Doesn't use messages >7 days old for status
- [ ] **API:** Uses API data when available
- [ ] **Pricing:** No £ amounts, no estimates
- [ ] **Walk-in:** No "pop in" suggestions
- [ ] **John:** No "John will" or "I'll ask John"
- [ ] **Links:** Includes repair-request link when appropriate
- [ ] **Sign-off:** "Many Thanks, AI Steve, New Forest Device Repairs"

---

### 6. **Common "Daft Stuff" to Watch For

| Daft Behavior | What to Check | Fix |
|---------------|---------------|-----|
| "Edita!" (shouty) | Greeting starts with name only | greeting_policy module |
| "Ready for collection" from old message | Using 15-day-old message | timestamp_awareness module |
| "I don't have access to repair statuses" | Claims no API when it exists | repair_status_api module |
| Gives pricing estimates | Says "typically £X" | Pricing policy enforcement |
| "Pop in to identify device" | Suggests walk-in | Walk-in prevention |
| Responds when John just replied | Dual-voice issue | 30-min pause check |
| Ignores John's quote | Doesn't see conversation history | conversation_history_awareness |

---

### 7. **Testing Frequency**

**After every change:**
- Run CRITICAL tests (5-10 minutes)
- Check Vercel logs for warnings

**Weekly:**
- Run full test suite (30-60 minutes)
- Review any customer complaints
- Check for new patterns

**Monthly:**
- Full system audit
- Update test scenarios based on new issues
- Review and refine prompt modules

---

### 8. **Automated Monitoring (Future Enhancement)

**What we could build:**

1. **Response Logger**
   - Log all AI responses to database
   - Flag responses containing forbidden phrases
   - Alert on violations

2. **Automated Test Runner**
   - Send test messages via API
   - Validate responses automatically
   - Generate pass/fail report

3. **Dashboard**
   - Show violation rate
   - Track common issues
   - Monitor API usage

**For now:** Manual testing + Vercel log monitoring

---

### 9. **Quick Test Commands**

**Test greeting:**
```bash
curl -X POST https://your-app.vercel.app/api/messages/incoming \
  -H "Content-Type: application/json" \
  -d '{"from": "+447123456789", "message": "Hello", "channel": "sms", "customerName": "Edita"}'
```

**Check database modules:**
```bash
supabase db remote --project-ref YOUR_PROJECT_REF \
  --sql "SELECT module_name, priority FROM prompts WHERE active = true ORDER BY priority DESC"
```

**View recent logs:**
```bash
vercel logs --follow
```

---

### 10. **When AI Does "Daft Stuff"

**Immediate actions:**

1. **Document it:**
   - Screenshot the conversation
   - Note the exact message and response
   - Check what the correct response should be

2. **Check the logs:**
   - Search Vercel logs for the conversation
   - Look for validation warnings
   - Check if API was called

3. **Identify the root cause:**
   - Stale message? → timestamp_awareness issue
   - Wrong greeting? → greeting_policy issue
   - No API check? → repair_status_api issue
   - Gave pricing? → Pricing policy issue

4. **Fix it:**
   - Update relevant prompt module
   - Add to test suite
   - Create migration if needed
   - Test the fix

5. **Prevent recurrence:**
   - Add test case to comprehensive suite
   - Update monitoring patterns
   - Document in this guide

---

## Test Results Tracking

**Create a simple spreadsheet:**

| Date | Test Category | Scenario | Result | Notes |
|------|--------------|----------|--------|-------|
| 2026-03-04 | Greeting | "Hi Edita!" test | ✅ PASS | Working correctly |
| 2026-03-04 | Timestamp | Stale message test | ❌ FAIL | Used 15-day-old message |
| 2026-03-04 | Timestamp | Stale message test (after fix) | ✅ PASS | Now checks timestamps |

---

## Summary

**Testing approach:**
1. ✅ Run migrations first
2. ✅ Use comprehensive test suite for structured testing
3. ✅ Test CRITICAL scenarios first
4. ✅ Monitor Vercel logs for patterns
5. ✅ Document failures and fixes
6. ✅ Add new test cases as issues arise
7. ✅ Iterate and refine

**This prevents "daft stuff" by:**
- Systematic testing of all critical behaviors
- Early detection of issues
- Clear validation criteria
- Monitoring and alerting
- Continuous improvement

**Files:**
- `test-ai-steve-comprehensive.js` - Test suite
- `AI_STEVE_TESTING_GUIDE.md` - This guide
- `supabase/migrations/085_*.sql` - Greeting, API, history fixes
- `supabase/migrations/086_*.sql` - Timestamp awareness fix
