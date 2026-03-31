# Deploy All AI Steve Fixes - Complete Guide

**Date:** March 31, 2026  
**Migrations:** 089, 090, 091, 092, 093, 094  
**Status:** Ready to deploy

---

## Summary of All Fixes

Based on real customer conversations, we've identified and fixed 6 critical issues:

### **Migration 089** - Name Usage & Confident Messaging ✅
- **Issue:** AI using names without 100% confidence
- **Issue:** AI saying "I don't have access to..."
- **Fix:** Only use names with 100% confidence, always check API/history

### **Migration 090** - Payment, Expedite, Collection Times ✅
- **Issue:** Payment inquiries deferred → 3 phone calls
- **Issue:** Expedited repairs not recognized
- **Issue:** Collection time "4:00" unclear (AM/PM?)
- **Fix:** Provide payment methods immediately, handle expedited repairs, clarify hours

### **Migration 091** - Expedited Repairs Webchat Fix ✅
- **Issue:** Webchat expedite requests said "I'll pass to John" (you won't see webchat)
- **Fix:** Webchat directs to SMS, mentions £20 starting fee

### **Migration 092** - Quote Acceptance Priority ✅
- **Issue:** Customer said "book for repair" after quote → AI looked for repair jobs
- **Fix:** Quote acceptance highest priority, recognizes "book for repair" as acceptance

### **Migration 093** - Disable Name Usage Entirely ✅
- **Issue:** AI still shouting names like "Tracy!"
- **Fix:** Disabled name usage completely - always use "Hi!" or "Hi there!"

### **Migration 094** - Quote Acceptance Confirmation ✅
- **Issue:** AI saying "I'll pass to team" instead of confirming acceptance
- **Fix:** AI says "I've marked that as accepted" (acceptance already processed)

---

## Real Conversations Fixed

### **Lewis Wilson - Samsung S23 Ultra**
**Before:**
```
Customer: "Can I pay by card?"
AI: "Please contact us during opening hours"
Customer: [Calls 3 times]
```

**After:**
```
Customer: "Can I pay by card?"
AI: "Yes! We accept all cards including American Express, Apple Pay, Google Wallet, and cash."
```

---

### **Carly - iPad 10th Gen**
**Before:**
```
Customer: "Hi yes can I book please for repair"
AI: "I can't find any repair jobs under this phone number"
```

**After:**
```
Customer: "Hi yes can I book please for repair"
AI: "Brilliant! I've marked that as accepted. You can drop your iPad in during opening hours..."
```

---

### **Tracy - iPhone 11 Battery**
**Before:**
```
Customer: "Yes, please to replace battery for iPhone 11"
AI: "Tracy! Great, I'll pass that on to the team..."
```

**After:**
```
Customer: "Yes, please to replace battery for iPhone 11"
AI: "Great! I've marked that as accepted. You can drop your iPhone 11 in during opening hours..."
```

---

## How to Deploy

### **Step 1: Backup Database**
```bash
# Create backup before applying migrations
pg_dump -h "$SUPABASE_DB_HOST" -U postgres -d postgres > backup_$(date +%Y%m%d_%H%M%S).sql
```

### **Step 2: Apply Migrations in Order**

**Migration 089 - Name Usage & Confident Messaging:**
```bash
cat supabase/migrations/089_fix_name_usage_and_confident_messaging.sql | \
  PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h "$SUPABASE_DB_HOST" -U postgres -d postgres
```

**Migration 090 - Payment, Expedite, Collection:**
```bash
cat supabase/migrations/090_fix_payment_expedite_collection.sql | \
  PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h "$SUPABASE_DB_HOST" -U postgres -d postgres
```

**Migration 091 - Expedited Repairs Webchat:**
```bash
cat supabase/migrations/091_fix_expedite_webchat_and_fee.sql | \
  PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h "$SUPABASE_DB_HOST" -U postgres -d postgres
```

**Migration 092 - Quote Acceptance Priority:**
```bash
cat supabase/migrations/092_fix_quote_acceptance_priority.sql | \
  PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h "$SUPABASE_DB_HOST" -U postgres -d postgres
```

**Migration 093 - Disable Name Usage:**
```bash
cat supabase/migrations/093_disable_name_usage_entirely.sql | \
  PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h "$SUPABASE_DB_HOST" -U postgres -d postgres
```

**Migration 094 - Quote Acceptance Confirmation:**
```bash
cat supabase/migrations/094_fix_quote_acceptance_confirmation.sql | \
  PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h "$SUPABASE_DB_HOST" -U postgres -d postgres
```

### **Step 3: Verify Deployment**

Check that all migrations applied successfully:
```bash
psql -h "$SUPABASE_DB_HOST" -U postgres -d postgres -c "
SELECT module_name, priority, version, updated_at 
FROM prompts 
WHERE module_name IN (
  'name_usage_policy',
  'confident_messaging',
  'payment_methods',
  'expedited_repairs',
  'collection_time_confirmation',
  'quote_acceptance_workflow'
)
ORDER BY priority DESC;"
```

Expected output:
```
module_name                  | priority | version | updated_at
-----------------------------+----------+---------+------------------
payment_methods              | 100      | 2+      | 2026-03-31...
expedited_repairs            | 100      | 3+      | 2026-03-31...
quote_acceptance_workflow    | 100      | 4+      | 2026-03-31...
name_usage_policy            | 100      | 2+      | 2026-03-31...
confident_messaging          | 98       | 2+      | 2026-03-31...
collection_time_confirmation | 95       | 1+      | 2026-03-31...
```

### **Step 4: Deploy Code Changes**

The code changes are already pushed to GitHub and will auto-deploy via Vercel:

**Files modified:**
- `lib/ai/conversation-state.ts` - Updated follow_up state guidance
- `lib/ai/smart-response-generator.ts` - Disabled name usage in greeting rule

**Vercel will automatically:**
1. Detect the push to main branch
2. Build the updated code
3. Deploy to production
4. Usually takes 1-2 minutes

Check deployment status: https://vercel.com/your-project/deployments

---

## Testing After Deployment

### **Test 1: Payment Inquiry**
```
Customer: "Can I pay by card?"
Expected: "Yes! We accept all cards including American Express, Apple Pay, Google Wallet, and cash."
```

### **Test 2: Expedited Repair (SMS)**
```
Customer: "Can I rush this?"
Expected: "Yes, we can expedite your repair starting from £20. I'll pass this to John who can arrange priority service..."
```

### **Test 3: Expedited Repair (Webchat)**
```
Customer (webchat): "Can I rush this?"
Expected: "Yes, we can expedite repairs starting from £20. To arrange this, please text us or visit: https://www.newforestdevicerepairs.co.uk/start"
```

### **Test 4: Quote Acceptance**
```
Customer: "Yes please" (after receiving quote)
Expected: "Great! I've marked that as accepted. You can drop your [device] in during opening hours..."
```

### **Test 5: Quote Acceptance with "Repair"**
```
Customer: "Can I book for repair" (after receiving quote)
Expected: "Brilliant! I've marked that as accepted. You can drop your [device] in during opening hours..."
NOT: "I can't find any repair jobs"
```

### **Test 6: Name Usage**
```
Customer: "Yes please" (customer name is Tracy)
Expected: "Great! I've marked that as accepted..."
NOT: "Tracy! Great, I'll pass that on..."
```

### **Test 7: Collection Time**
```
Customer: "I'll collect at 4:00"
Expected: "Just to confirm - we're open 10am-5pm. Did you mean 4:00 PM? That works perfectly!"
```

---

## Expected Behavior Changes

### **Payment Inquiries**
- **Before:** "Please contact us during opening hours"
- **After:** Immediate payment method details

### **Expedited Repairs**
- **Before:** Not recognized or unclear
- **After:** Confirmed with £20 starting fee, channel-aware

### **Quote Acceptance**
- **Before:** "I can't find repair jobs" or "I'll pass to team"
- **After:** "I've marked that as accepted" with drop-off instructions

### **Name Usage**
- **Before:** "Tracy!" or "Hi Tracy!"
- **After:** "Hi!" or "Hi there!" (no names)

### **Collection Times**
- **Before:** Accepts "4:00" without clarification
- **After:** Confirms opening hours and clarifies AM/PM

---

## Success Metrics

Monitor these after deployment:

1. **Payment inquiry resolution** - Should increase (no deferrals)
2. **Quote acceptance rate** - Should increase (proper recognition)
3. **Customer confusion** - Should decrease (no wrong names, clear times)
4. **Repeated calls** - Should decrease (immediate answers)
5. **Manual interventions** - Should decrease (AI handles more)

---

## Rollback Plan

If issues occur, rollback migrations in reverse order:

```bash
# Rollback 094
psql -h "$SUPABASE_DB_HOST" -U postgres -d postgres -c "
UPDATE prompts SET 
  prompt_text = (SELECT prompt_text FROM prompts WHERE module_name = 'quote_acceptance_workflow' AND version = (SELECT MAX(version) - 1 FROM prompts WHERE module_name = 'quote_acceptance_workflow')),
  version = version - 1
WHERE module_name = 'quote_acceptance_workflow';"

# Rollback 093
psql -h "$SUPABASE_DB_HOST" -U postgres -d postgres -c "
UPDATE prompts SET 
  prompt_text = (SELECT prompt_text FROM prompts WHERE module_name = 'name_usage_policy' AND version = (SELECT MAX(version) - 1 FROM prompts WHERE module_name = 'name_usage_policy')),
  version = version - 1
WHERE module_name = 'name_usage_policy';"

# Continue for 092, 091, 090, 089 if needed
```

Or restore from backup:
```bash
psql -h "$SUPABASE_DB_HOST" -U postgres -d postgres < backup_YYYYMMDD_HHMMSS.sql
```

---

## Documentation Files

- `AI_STEVE_NAME_AND_MESSAGING_FIX.md` - Migration 089 details
- `AI_STEVE_PAYMENT_EXPEDITE_COLLECTION_FIX.md` - Migration 090 details
- `MIGRATION_091_EXPEDITE_FIX.md` - Migration 091 details
- `MIGRATION_092_QUOTE_ACCEPTANCE_PRIORITY_FIX.md` - Migration 092 details

---

## Summary

**6 migrations** ready to deploy:
- ✅ 089 - Name usage & confident messaging
- ✅ 090 - Payment, expedite, collection times
- ✅ 091 - Expedited repairs webchat fix
- ✅ 092 - Quote acceptance priority
- ✅ 093 - Disable name usage entirely
- ✅ 094 - Quote acceptance confirmation

**All based on real customer conversations** that caused confusion or required manual intervention.

**Apply in order** using the commands above, then test to verify all fixes are working correctly.
