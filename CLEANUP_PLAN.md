# Database Cleanup Plan - Based on Actual Data

## Tables with Data - Analysis

### ✅ KEEP - Core Active Tables
1. **messages** (115 rows) - Core messaging
2. **customers** (12 rows) - Core customer data
3. **conversations** (12 rows) - Core conversations
4. **prompts** (15 rows) - NEW prompt system (ACTIVE)
5. **ai_analytics** (7 rows) - AI tracking (ACTIVE)
6. **business_info** (1 row) - Business hours/info
7. **users** (1 row) - Authentication

### ⚠️ DECISION NEEDED - Have Data But May Not Be Used

8. **api_logs** (824 rows) - API logging
   - **Used:** Not actively used in code
   - **Recommendation:** Keep for debugging, or archive old logs and delete
   - **Action:** Check if you need these logs, otherwise DELETE

9. **prices** (160 rows) - Pricing data
   - **Used:** Loaded by AI but may not be displayed
   - **Recommendation:** Check if AI actually uses this data
   - **Action:** Keep for now, verify AI uses it

10. **device_age_reference** (32 rows) - Device age data
    - **Used:** Not found in code
    - **Recommendation:** Probably unused
    - **Action:** DELETE (can recreate if needed)

11. **faqs** (29 rows) - FAQ data
    - **Used:** Not found in code
    - **Recommendation:** Probably unused
    - **Action:** DELETE or export first if you want to keep

12. **docs** (18 rows) - Documentation
    - **Used:** Not found in code
    - **Recommendation:** Probably unused
    - **Action:** DELETE or export first if you want to keep

13. **conversation_context** (7 rows) - Context tracking
    - **Used:** Code creates these but may not read them
    - **Recommendation:** Redundant with conversation state in messages
    - **Action:** DELETE (state tracked elsewhere)

14. **intent_classifications** (6 rows) - Intent tracking
    - **Used:** Not actively used
    - **Recommendation:** Analytics/learning feature not implemented
    - **Action:** DELETE

### ❌ DELETE - Empty Tables (Not Listed = 0 Rows)

All these have 0 rows and aren't used:
- ai_settings
- alerts
- customer_history
- learned_patterns
- learning_feedback
- prompt_performance
- staff_notes
- And all the views (they'll auto-delete)

---

## Recommended Actions

### PHASE 1: Safe Deletions (Empty Tables)

```sql
-- Delete empty unused tables
DROP TABLE IF EXISTS ai_settings CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS customer_history CASCADE;
DROP TABLE IF EXISTS learned_patterns CASCADE;
DROP TABLE IF EXISTS learning_feedback CASCADE;
DROP TABLE IF EXISTS prompt_performance CASCADE;
DROP TABLE IF EXISTS staff_notes CASCADE;

-- Verify they're gone
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

### PHASE 2: Export Then Delete (Have Data But Unused)

```sql
-- Export data first (optional)
COPY faqs TO '/tmp/faqs_backup.csv' CSV HEADER;
COPY docs TO '/tmp/docs_backup.csv' CSV HEADER;
COPY device_age_reference TO '/tmp/device_age_backup.csv' CSV HEADER;

-- Then delete
DROP TABLE IF EXISTS faqs CASCADE;
DROP TABLE IF EXISTS docs CASCADE;
DROP TABLE IF EXISTS device_age_reference CASCADE;
DROP TABLE IF EXISTS conversation_context CASCADE;
DROP TABLE IF EXISTS intent_classifications CASCADE;
```

### PHASE 3: Archive Old Logs (Keep Recent)

```sql
-- Keep only last 7 days of API logs
DELETE FROM api_logs 
WHERE created_at < NOW() - INTERVAL '7 days';

-- Or delete all if not needed
-- DROP TABLE IF EXISTS api_logs CASCADE;
```

### PHASE 4: Verify Prices Table Usage

```sql
-- Check what's in prices
SELECT device, repair_type, cost FROM prices LIMIT 10;

-- Check if AI actually loads prices
-- Look in Vercel logs for: "AVAILABLE PRICING"
-- If not used, consider deleting
```

---

## After Cleanup

**Before:** ~40 tables  
**After:** ~10 tables  

**Tables Remaining:**
1. customers
2. conversations
3. messages
4. business_info
5. prompts
6. ai_analytics
7. users
8. prices (if used)
9. api_logs (if kept)
10. Views (auto-generated)

**Space Saved:** Probably 50-75% of database size

---

## Quick Cleanup Script

```sql
-- Run this to clean up most unused tables
-- CAREFUL: This deletes data!

BEGIN;

-- Delete empty tables
DROP TABLE IF EXISTS ai_settings CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS customer_history CASCADE;
DROP TABLE IF EXISTS learned_patterns CASCADE;
DROP TABLE IF EXISTS learning_feedback CASCADE;
DROP TABLE IF EXISTS prompt_performance CASCADE;
DROP TABLE IF EXISTS staff_notes CASCADE;

-- Delete unused tables with data
DROP TABLE IF EXISTS faqs CASCADE;
DROP TABLE IF EXISTS docs CASCADE;
DROP TABLE IF EXISTS device_age_reference CASCADE;
DROP TABLE IF EXISTS conversation_context CASCADE;
DROP TABLE IF EXISTS intent_classifications CASCADE;

-- Clean up old API logs (keep last 7 days)
DELETE FROM api_logs WHERE created_at < NOW() - INTERVAL '7 days';

COMMIT;

-- Verify cleanup
SELECT tablename, n_live_tup 
FROM pg_stat_user_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

---

## Summary

**Safe to Delete Now:**
- 5 empty tables (ai_settings, alerts, customer_history, learned_patterns, learning_feedback, prompt_performance, staff_notes)
- 5 unused tables with data (faqs, docs, device_age_reference, conversation_context, intent_classifications)

**Check Before Deleting:**
- prices (160 rows) - Verify AI uses this
- api_logs (824 rows) - Archive or delete old logs

**Total Cleanup:** ~10 tables deleted, ~75% reduction
