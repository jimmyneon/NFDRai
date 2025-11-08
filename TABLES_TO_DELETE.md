# Database Tables Analysis - What to Keep/Delete

## ✅ KEEP - Actively Used (7 tables)

1. **customers** - Core table, used heavily
2. **conversations** - Core table, used heavily
3. **messages** - Core table, used heavily
4. **business_info** - Used for hours/location
5. **prompts** - NEW system, actively used
6. **ai_analytics** - Tracking AI performance
7. **users** - Supabase auth (needed)

---

## ⚠️ CHECK - May Have Data (3 tables)

8. **prices** - May have pricing data, check if used
9. **docs** - Documentation system, check if used
10. **faqs** - FAQ system, check if used

---

## ❌ DELETE - Unused/Duplicate/Views (30+ tables!)

### Duplicate/Old Systems
- **ai_settings** - Duplicate of global_settings (DELETE)
- **global_settings** - Not in list but exists (KEEP if used, otherwise merge with ai_settings)
- **customer_history** - Duplicate of customers table (DELETE)
- **conversation_context** - Not used, state tracked elsewhere (DELETE)

### Views (Not Real Tables)
- **active_docs** - View of docs table (AUTO-DELETED if docs deleted)
- **active_faqs** - View of faqs table (AUTO-DELETED if faqs deleted)
- **active_prices** - View of prices table (AUTO-DELETED if prices deleted)
- **active_prompts_by_intent** - View of prompts table (KEEP - useful)
- **prices_search** - View of prices table (AUTO-DELETED if prices deleted)
- **ai_performance_summary** - View of ai_analytics (KEEP - useful)
- **intent_accuracy** - View of intent_classifications (DELETE if not used)
- **price_checking_status** - View (DELETE)

### Analytics/Learning Tables (Probably Empty)
- **intent_classifications** - Intent tracking (DELETE if empty)
- **learned_patterns** - ML patterns (DELETE if empty)
- **learning_feedback** - Feedback system (DELETE if empty)
- **prompt_performance** - Prompt tracking (DELETE if empty)

### Unused Feature Tables
- **alerts** - Alert system (DELETE if not used)
- **api_logs** - API logging (DELETE if not used)
- **device_age_reference** - Device age data (DELETE if empty)
- **staff_notes** - Notes system (DELETE if not used)

---

## SQL to Check Row Counts

```sql
-- Check which tables have data
SELECT 
  schemaname,
  relname as tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND n_live_tup > 0
ORDER BY n_live_tup DESC;
```

---

## Recommended Cleanup SQL

```sql
-- STEP 1: Check what has data (run first!)
SELECT relname, n_live_tup FROM pg_stat_user_tables 
WHERE schemaname = 'public' AND n_live_tup > 0 
ORDER BY n_live_tup DESC;

-- STEP 2: Drop unused tables (CAREFUL - check first!)
-- Only run these if the tables have 0 rows and aren't used in code

-- Drop duplicate/old systems
DROP TABLE IF EXISTS ai_settings CASCADE;
DROP TABLE IF EXISTS customer_history CASCADE;
DROP TABLE IF EXISTS conversation_context CASCADE;

-- Drop unused analytics tables (if empty)
DROP TABLE IF EXISTS intent_classifications CASCADE;
DROP TABLE IF EXISTS learned_patterns CASCADE;
DROP TABLE IF EXISTS learning_feedback CASCADE;
DROP TABLE IF EXISTS prompt_performance CASCADE;

-- Drop unused feature tables (if empty)
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS api_logs CASCADE;
DROP TABLE IF EXISTS device_age_reference CASCADE;
DROP TABLE IF EXISTS staff_notes CASCADE;

-- Drop docs/faqs if not used (check first!)
-- DROP TABLE IF EXISTS docs CASCADE;
-- DROP TABLE IF EXISTS faqs CASCADE;

-- Note: Views will be auto-dropped when their base tables are dropped
```

---

## Summary

**Current:** ~40 tables  
**Actually Used:** ~7 tables  
**Can Delete:** ~25-30 tables  

**Recommendation:**
1. Run row count query first
2. Delete tables with 0 rows that aren't in the "KEEP" list
3. This will clean up ~75% of your database tables!

---

## Before Deleting

Check these tables have data you want to keep:
- prices
- docs  
- faqs

If they're empty or unused, delete them too.
