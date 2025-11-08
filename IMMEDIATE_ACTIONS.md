# IMMEDIATE ACTIONS REQUIRED

## Current Status
- ✅ Code deployed (commit cac636a)
- ❌ Database RLS policy NOT fixed yet
- ❌ AI will NOT work until RLS is fixed

## What Changed
**Removed all fallback prompts** - system will now FAIL if database modules don't load.

This is INTENTIONAL to force us to fix the RLS issue properly.

---

## Step 1: Delete Test Messages (30 seconds)

Run in Supabase SQL Editor:
```sql
-- File: delete_test_NOW.sql
-- All DELETE statements are uncommented and ready
```

This will delete all messages for +447910381247

---

## Step 2: Fix RLS Policy (1 minute) - CRITICAL!

Run in Supabase SQL Editor:
```sql
-- File: fix_rls_policy.sql
-- Run sections 4-6:

DROP POLICY IF EXISTS "Allow service role to read prompts" ON prompts;

CREATE POLICY "Allow service role to read prompts"
ON prompts FOR SELECT
TO service_role
USING (true);

DROP POLICY IF EXISTS "Allow authenticated to read prompts" ON prompts;

CREATE POLICY "Allow authenticated to read prompts"
ON prompts FOR SELECT
TO authenticated
USING (true);
```

---

## Step 3: Verify RLS Fix (30 seconds)

Run in Supabase:
```sql
-- Should return 15 modules
SELECT COUNT(*) FROM prompts WHERE active = true;

-- Should return 2 policies
SELECT policyname, roles FROM pg_policies WHERE tablename = 'prompts';
```

Expected:
- Count: 15
- Policies: "Allow service role to read prompts", "Allow authenticated to read prompts"

---

## Step 4: Test the System (2 minutes)

### What Will Happen

**BEFORE RLS Fix:**
```
Send message → AI throws error
Console: "Failed to load prompt modules from database"
Response: Error 500
```

**AFTER RLS Fix:**
```
Send message → AI works perfectly
Console: "[Prompt Modules] Loaded from database: ['core_identity', ...]"
Console: "[Prompt Builder] Context-aware modules used: [...]"
Response: Helpful, guides to Settings > General > About
```

### Test Message
```
"I have a broken phone but don't know the model"
```

### Expected Response (after RLS fix)
```
No worries! On your iPhone, go to Settings > General > About 
and look for 'Model Name' - it'll say something like iPhone 12 
or iPhone 13. What does yours say?

Many Thanks,
AI Steve,
New Forest Device Repairs
```

---

## Step 5: Monitor Console Logs

After RLS fix, you should see:
```
[Prompt Modules] Loaded from database: ['core_identity', 'services_comprehensive', ...]
[Prompt Builder] Database modules available: [...]
[Prompt Builder] Context-aware modules used: ['core_identity', 'friendly_tone', 'context_awareness', 'services_comprehensive']
[Smart AI] Prompt size: 6,000-8,000 characters
```

---

## Troubleshooting

### If AI Still Throws Error After RLS Fix

**Check 1: Verify policies exist**
```sql
SELECT * FROM pg_policies WHERE tablename = 'prompts';
```

**Check 2: Verify prompts table has data**
```sql
SELECT COUNT(*) FROM prompts WHERE active = true;
```

**Check 3: Test function directly**
```sql
SELECT * FROM get_prompt_modules('screen_repair');
```

If any of these fail, the RLS policy didn't apply correctly.

### If AI Says "Bring It In" Instead of Helping

This means database modules ARE loading but the core_identity module is missing device detection.

**Check:**
```sql
SELECT prompt_text FROM prompts WHERE module_name = 'core_identity';
```

Should contain: "Settings > General > About"

---

## Success Criteria

✅ **Database Access Working:**
- Console shows: "Loaded from database: [...]"
- No errors about RLS or policies

✅ **Context-Aware Loading:**
- Console shows different modules for different queries
- Prompt size varies: 6,000-12,000 chars

✅ **Device Detection Working:**
- AI guides to Settings > General > About
- Does NOT immediately say "bring it in"

✅ **Response Quality:**
- Friendly, warm tone
- Only relevant information
- Proper sign-off

---

## Files to Run (In Order)

1. **delete_test_NOW.sql** - Clean up test data
2. **fix_rls_policy.sql** (sections 4-6) - Fix database access
3. **run_all_checks.sql** - Verify everything works
4. Send test message - Verify AI response

---

## Why We Removed Fallback

**Before:**
- Database fails → Uses fallback → AI works but with wrong prompts
- We don't know database is broken
- Masks the real problem

**Now:**
- Database fails → AI throws error → We KNOW something is wrong
- Forces us to fix RLS properly
- Ensures we're using database modules, not outdated fallback

**This is the RIGHT approach** - fail loudly, fix properly! 🎯
