-- ============================================
-- FIX RLS POLICIES FOR API ACCESS
-- ============================================
-- The API uses service_role_key which should bypass RLS,
-- but let's make sure policies allow inserts

-- ============================================
-- 1. CHECK CURRENT RLS STATUS
-- ============================================
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('customers', 'conversations', 'messages')
ORDER BY tablename;

-- ============================================
-- 2. DISABLE RLS FOR API TABLES (Temporary fix)
-- ============================================
-- This allows the service_role_key to write without restrictions

ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. OR ENABLE RLS WITH PERMISSIVE POLICIES
-- ============================================
-- If you want RLS enabled, use these policies instead:

-- Enable RLS
-- ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything
-- CREATE POLICY "Service role can do everything on customers"
--   ON public.customers
--   FOR ALL
--   TO service_role
--   USING (true)
--   WITH CHECK (true);

-- CREATE POLICY "Service role can do everything on conversations"
--   ON public.conversations
--   FOR ALL
--   TO service_role
--   USING (true)
--   WITH CHECK (true);

-- CREATE POLICY "Service role can do everything on messages"
--   ON public.messages
--   FOR ALL
--   TO service_role
--   USING (true)
--   WITH CHECK (true);

-- ============================================
-- 4. TEST INSERT
-- ============================================
-- Try inserting a test customer
INSERT INTO public.customers (name, phone)
VALUES ('Test Customer', '+447700900123')
RETURNING *;

-- If this works, the API should work too!

-- ============================================
-- 5. CLEAN UP TEST DATA
-- ============================================
-- DELETE FROM public.customers WHERE phone = '+447700900123';
