# End-to-End Test Scenarios

## Scenario 1: Customer asks "when can I bring it in?" with existing repair
**Test:** Send message from phone with active repair
**Expected:** AI shows repair status, says "come in whenever ready"
**Logs to check:** `[Repair Status] ✅ Found job(s)`, `[AI Context Audit] Repair status marker: HAS_REPAIR`

## Scenario 2: Customer asks "when can I bring it in?" without repair
**Test:** Send message from phone with NO repair
**Expected:** AI routes to booking form, says "get a quote"
**Logs to check:** `[Repair Status] ⚠️ No jobs found`, `[AI Context Audit] Repair status marker: NO_REPAIR`

## Scenario 3: Customer asks "when are you open?" while John is talking
**Test:** John sends message, wait 2min, customer asks hours
**Expected:** AI responds (simple query exception)
**Logs to check:** `[AI Response Check] Simple query (hours) - AI can answer even if John is talking`

## Scenario 4: Customer asks "is my phone ready?" with repair
**Test:** Send message from phone with active repair
**Expected:** AI shows actual status from API
**Logs to check:** `[Repair Status] ✅ Found job(s)`, AI shows real status

## Scenario 5: Customer says "thanks John" after John replied
**Test:** John sends message, customer acknowledges
**Expected:** AI stays silent (acknowledgment)
**Logs to check:** `[AI Response Check] isAcknowledgment: true`

## How to Test
Use SMS (MacroDroid) or webchat with real phone numbers. Monitor Vercel logs.
