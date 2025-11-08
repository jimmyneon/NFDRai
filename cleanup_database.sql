-- Database Cleanup Script
-- Removes unused tables to reduce clutter

-- PHASE 1: Delete empty unused tables (SAFE)
BEGIN;

DROP TABLE IF EXISTS ai_settings CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS customer_history CASCADE;
DROP TABLE IF EXISTS learned_patterns CASCADE;
DROP TABLE IF EXISTS learning_feedback CASCADE;
DROP TABLE IF EXISTS prompt_performance CASCADE;
DROP TABLE IF EXISTS staff_notes CASCADE;

COMMIT;

-- PHASE 2: Delete unused tables with data (REVIEW FIRST!)
-- Uncomment if you're sure you don't need these:

/*
BEGIN;

DROP TABLE IF EXISTS faqs CASCADE;
DROP TABLE IF EXISTS docs CASCADE;
DROP TABLE IF EXISTS device_age_reference CASCADE;
DROP TABLE IF EXISTS conversation_context CASCADE;
DROP TABLE IF EXISTS intent_classifications CASCADE;

COMMIT;
*/

-- PHASE 3: Clean up old API logs (keep last 7 days)
-- Uncomment to run:

/*
DELETE FROM api_logs WHERE created_at < NOW() - INTERVAL '7 days';
*/

-- Verify cleanup
SELECT 
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
