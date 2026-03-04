# AI Steve Testing Workflow - Quick Reference

## The Better Way to Test AI Steve

Instead of constantly modifying based on random responses, use this systematic approach:

---

## 🎯 Quick Start (5 Minutes)

### 1. Run Migrations
```bash
cd /Users/johnhopwood/NFDRAIRESPONDER
supabase migration up
```

### 2. Run Test Suite
```bash
node test-ai-steve-comprehensive.js > test-results.txt
```

### 3. Test Top 5 Critical Scenarios

Send these messages and check responses:

1. **"Hello, I need help"** (with name "Edita")
   - ✅ Must say: "Hi Edita!" or "Hi there, Edita!"
   - ❌ Must NOT say: "Edita!" (shouty)

2. **"Is my iPad ready?"** (with 15-day-old "ready" message in history)
   - ✅ Must check API or say "don't see active repairs"
   - ❌ Must NOT say: "It's ready for collection"

3. **"How much for iPhone screen?"**
   - ✅ Must include: repair-request link
   - ❌ Must NOT include: £ amounts, "typically", "around"

4. **"I don't know what model my phone is"**
   - ✅ Must include: repair-request link
   - ❌ Must NOT include: "pop in", "Settings > About"

5. **"Is my Samsung S22 done?"**
   - ✅ Must use API data or direct to contact
   - ❌ Must NOT say: "I don't have access to repair statuses"

---

## 📊 Daily Testing Routine (10 Minutes)

**Morning check:**
1. Check Vercel logs for overnight violations
2. Review any customer complaints
3. Test 1-2 critical scenarios

**After any code change:**
1. Test affected scenario
2. Check logs for warnings
3. Verify no regressions

---

## 🔍 When You See "Daft Stuff"

**Don't just modify randomly!**

Follow this process:

### Step 1: Document (1 minute)
- Screenshot the conversation
- Note exact message and response
- What should it have said?

### Step 2: Identify Root Cause (2 minutes)
- Check Vercel logs for that conversation
- Look for validation warnings
- Identify which rule was broken

### Step 3: Check Test Suite (1 minute)
- Is there a test for this scenario?
- If not, add it to `test-ai-steve-comprehensive.js`

### Step 4: Fix (5-10 minutes)
- Update relevant prompt module
- Create migration if needed
- Test the specific scenario

### Step 5: Verify (2 minutes)
- Run related test scenarios
- Check logs for warnings
- Confirm fix works

---

## 🎨 Common Issues & Quick Fixes

| Issue | Root Cause | Fix Location | Test |
|-------|-----------|--------------|------|
| "Edita!" (shouty) | Greeting policy | `085_*.sql` greeting_policy | Test 1 |
| Uses old "ready" message | No timestamp check | `086_*.sql` timestamp_awareness | Test 2 |
| "I don't have access" | API awareness | `085_*.sql` repair_status_api | Test 5 |
| Gives pricing | Pricing policy | Runtime validator | Test 3 |
| "Pop in to identify" | Walk-in alternatives | `084_*.sql` routing rules | Test 4 |
| Responds over John | Dual-voice | 30-min pause logic | Check pause |

---

## 📈 Monitoring Dashboard (Check Daily)

**Vercel Logs - Search for:**

✅ **Good:**
- `[Conversation History] ✅ Added X staff message(s)`
- `[Repair Status] ✅ Found X job(s)`
- `[UK Number] ✅ Verified`

⚠️ **Warning:**
- `[Routing Validator] ⚠️ Violations found`
- `[Staff Activity Check] Should AI respond? false`

❌ **Error:**
- `[Repair Status] ❌ Failed to check status`
- `[Routing Validator] ❌ Critical violation`

---

## 🧪 Test Coverage

**Current test scenarios: 60+**

**Categories:**
1. Greeting (2 tests)
2. Timestamp Awareness (3 tests)
3. API Access (3 tests)
4. Conversation History (3 tests)
5. Pricing Policy (3 tests)
6. Walk-in Alternatives (2 tests)
7. Dual-Voice Protection (3 tests)
8. Device Identification (2 tests)
9. Acknowledgments (3 tests)
10. Sign-off (2 tests)
11. Ready for Collection (2 tests)

**Priority breakdown:**
- CRITICAL: 15 tests (must pass)
- HIGH: 35 tests (should pass)
- MEDIUM: 10 tests (nice to have)

---

## 🚀 Continuous Improvement

**Weekly:**
1. Review test results
2. Add new scenarios based on issues
3. Update prompt modules
4. Run full test suite

**Monthly:**
1. Full system audit
2. Review customer feedback
3. Optimize prompt priorities
4. Update documentation

---

## 💡 Pro Tips

**DO:**
- ✅ Test systematically using the test suite
- ✅ Document every issue with screenshots
- ✅ Check logs before making changes
- ✅ Add test cases for new issues
- ✅ Focus on CRITICAL tests first

**DON'T:**
- ❌ Modify prompts randomly
- ❌ Skip testing after changes
- ❌ Ignore validation warnings
- ❌ Assume fixes work without testing
- ❌ Test only one scenario

---

## 📝 Quick Commands

**Run test suite:**
```bash
node test-ai-steve-comprehensive.js
```

**Check migrations:**
```bash
supabase migration list
```

**View logs:**
```bash
vercel logs --follow
```

**Check active modules:**
```sql
SELECT module_name, priority, active 
FROM prompts 
WHERE active = true 
ORDER BY priority DESC;
```

---

## 🎯 Success Metrics

**Target:**
- 95% of CRITICAL tests passing
- 90% of HIGH tests passing
- <5 validation warnings per day
- <2 customer complaints per week

**Track:**
- Test pass rate
- Validation warnings
- Customer feedback
- Common failure patterns

---

## 📞 When to Escalate

**If you see:**
- Same test failing repeatedly after fixes
- Multiple CRITICAL tests failing
- High volume of validation warnings
- Consistent customer complaints

**Then:**
- Review system architecture
- Consider prompt restructuring
- Add more guardrails
- Increase monitoring

---

## Summary

**The systematic approach:**
1. Run migrations
2. Use test suite
3. Test critical scenarios
4. Monitor logs
5. Document issues
6. Fix root cause
7. Verify fix
8. Add test case
9. Iterate

**This is better than random modifications because:**
- Catches issues before customers see them
- Prevents regressions
- Builds confidence in changes
- Creates documentation
- Enables continuous improvement

**Files you need:**
- `test-ai-steve-comprehensive.js` - Test suite
- `AI_STEVE_TESTING_GUIDE.md` - Full guide
- `TESTING_WORKFLOW.md` - This quick reference
