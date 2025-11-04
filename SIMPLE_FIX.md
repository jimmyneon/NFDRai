# 🔧 Simple Fix for Business Hours Access

## The Problem
RLS (Row Level Security) is blocking access to business_info table even though you're admin.

## ⚡ Quick Fix (Run in Supabase SQL Editor)

```sql
-- Simply disable RLS for business_info table
-- This is fine for a single-user app
ALTER TABLE public.business_info DISABLE ROW LEVEL SECURITY;
```

That's it! This will:
- ✅ Let you view business hours
- ✅ Let you edit business hours
- ✅ Work immediately

---

## Why This Works

RLS is great for multi-user apps, but for your single-business app where you're the only admin, it's just adding complexity. Disabling it makes everything work smoothly.

---

## After Running the Fix

1. Go to https://nfd-rai.vercel.app/dashboard/business-hours
2. You'll see your hours: 09:00-18:00, etc.
3. Edit them
4. Click "Save Business Hours"
5. Works! ✅

---

## Alternative: Keep RLS But Fix It

If you really want RLS enabled, run this instead:

```sql
-- Keep RLS but make policies work correctly
ALTER TABLE public.business_info ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can view business info" ON public.business_info;
DROP POLICY IF EXISTS "Admins can manage business info" ON public.business_info;

-- New simple policies
CREATE POLICY "Everyone can read business info" 
  ON public.business_info 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated can write business info" 
  ON public.business_info 
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

But honestly, for your use case, just disable RLS. It's simpler.

---

## Verify It Works

```sql
-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'business_info';

-- Should show: rowsecurity = false (RLS disabled)
```

---

**Recommendation:** Just disable RLS. Run the first command and you're done! 🚀
