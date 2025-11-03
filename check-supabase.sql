-- ============================================
-- SUPABASE SETUP VERIFICATION
-- ============================================
-- Run these queries in Supabase SQL Editor to verify your setup

-- ============================================
-- 1. CHECK ALL TABLES EXIST
-- ============================================
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'customers',
    'conversations',
    'messages',
    'faqs',
    'docs',
    'prices',
    'ai_settings',
    'alerts',
    'staff_notes'
  )
ORDER BY table_name;

-- Expected: 9 tables
-- If you see less than 9, migrations are incomplete

-- ============================================
-- 2. CHECK CUSTOMERS TABLE STRUCTURE
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'customers'
ORDER BY ordinal_position;

-- Expected columns: id, name, phone, email, created_at, updated_at

-- ============================================
-- 3. CHECK AI_SETTINGS TABLE
-- ============================================
SELECT * FROM ai_settings;

-- Expected: At least 1 row with settings
-- If empty, you need to insert default settings

-- ============================================
-- 4. CHECK IF PRICE_CHECKING_ENABLED COLUMN EXISTS
-- ============================================
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'ai_settings'
  AND column_name = 'price_checking_enabled';

-- Expected: 1 row
-- If empty, migration 009 not run

-- ============================================
-- 5. CHECK PRICES TABLE HAS ACTIVE COLUMN
-- ============================================
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'prices'
  AND column_name = 'active';

-- Expected: 1 row
-- If empty, migration 007 or 008 not run

-- ============================================
-- 6. CHECK VIEWS EXIST
-- ============================================
SELECT 
  table_name as view_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN (
    'active_prices',
    'active_faqs',
    'active_docs',
    'price_checking_status'
  )
ORDER BY table_name;

-- Expected: 4 views
-- If less, migrations 008 and 009 not run

-- ============================================
-- 7. CHECK FUNCTIONS EXIST
-- ============================================
SELECT 
  routine_name as function_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'toggle_item_status',
    'bulk_toggle_items',
    'toggle_price_checking',
    'search_prices'
  )
ORDER BY routine_name;

-- Expected: 4 functions
-- If less, migrations incomplete

-- ============================================
-- 8. TEST INSERT INTO CUSTOMERS (This will fail if permissions wrong)
-- ============================================
-- Uncomment to test:
-- INSERT INTO customers (name, phone) 
-- VALUES ('Test Customer', '+447700900000')
-- RETURNING *;

-- If this fails, check RLS policies

-- ============================================
-- 9. CHECK RLS (Row Level Security) POLICIES
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- This shows all security policies
-- You should see policies for most tables

-- ============================================
-- 10. SUMMARY CHECK - RUN THIS FIRST
-- ============================================
SELECT 
  'Tables' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 9 THEN '✅ Good'
    ELSE '❌ Missing tables'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'customers', 'conversations', 'messages', 
    'faqs', 'docs', 'prices', 'ai_settings', 
    'alerts', 'staff_notes'
  )

UNION ALL

SELECT 
  'Views' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ Good'
    ELSE '❌ Missing views'
  END as status
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN (
    'active_prices', 'active_faqs', 
    'active_docs', 'price_checking_status'
  )

UNION ALL

SELECT 
  'Functions' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ Good'
    ELSE '❌ Missing functions'
  END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'toggle_item_status', 'bulk_toggle_items',
    'toggle_price_checking', 'search_prices'
  )

UNION ALL

SELECT 
  'AI Settings' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 1 THEN '✅ Good'
    ELSE '❌ No settings'
  END as status
FROM ai_settings;

-- ============================================
-- EXPECTED OUTPUT:
-- ============================================
-- check_type    | count | status
-- --------------|-------|------------------
-- Tables        | 9     | ✅ Good
-- Views         | 4     | ✅ Good
-- Functions     | 4     | ✅ Good
-- AI Settings   | 1     | ✅ Good
-- ============================================
