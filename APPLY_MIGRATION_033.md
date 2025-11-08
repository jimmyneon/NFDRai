# Apply Migration 033 - Fix Duplicate Messages & Ask What's Wrong First

## What This Migration Fixes

1. **Asks "What's wrong?" FIRST** - Before asking for model
2. **Asks multiple questions at once** - "What's happening with it, and what model?"
3. **Proactive troubleshooting** - Force restart instructions before "bring it in"
4. **Smart duplicate prevention** - Never ignores real answers
5. **Better formatting** - Line breaks for readability

## Current Problem

AI is asking:
```
Customer: "I've got an iPhone needs fixing"
AI: "What model is your iPhone?"  ❌ Should ask what's wrong FIRST!
```

## After Migration

AI will ask:
```
Customer: "I've got an iPhone needs fixing"
AI: "What's happening with it, and what model - iPhone 12, 13, 14, 15, or 16?"  ✅
```

## How to Apply

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of `supabase/migrations/033_fix_duplicate_messages_and_missing_question.sql`
6. Paste into the SQL editor
7. Click **Run** (or press Cmd/Ctrl + Enter)
8. You should see: "Success. No rows returned"

### Option 2: Supabase CLI

```bash
# Make sure you're in the project directory
cd /Users/johnhopwood/NFDRAIRESPONDER

# Apply the migration
npx supabase db push
```

### Option 3: Direct psql (If you have DATABASE_URL)

```bash
# Load environment variables
source .env.local

# Apply migration
psql $DATABASE_URL -f supabase/migrations/033_fix_duplicate_messages_and_missing_question.sql
```

## Verify Migration Applied

Run this query in Supabase SQL Editor:

```sql
-- Check if new modules exist
SELECT module_name, priority, active, updated_at 
FROM prompts 
WHERE module_name IN (
  'duplicate_prevention',
  'ask_whats_wrong_first',
  'proactive_troubleshooting'
)
ORDER BY priority DESC;
```

You should see:
- `duplicate_prevention` (priority 99)
- `ask_whats_wrong_first` (priority 97)
- `proactive_troubleshooting` (priority 96)

## Test After Migration

Send these test messages:

### Test 1: Ask What's Wrong First
```
Customer: "My iPhone is broken"
Expected: "What's happening with it, and what model - iPhone 12, 13, 14, 15, or 16?"
```

### Test 2: Black Screen Troubleshooting
```
Customer: "iPhone 13 black screen"
Expected: Force restart instructions + pricing
```

### Test 3: No Duplicates
```
Customer: "Hello"
Expected: ONE response, not multiple duplicates
```

## What Gets Updated

### New Modules Added:
1. **duplicate_prevention** - Never send duplicate messages, process real answers
2. **ask_whats_wrong_first** - Always ask issue before model
3. **proactive_troubleshooting** - Help with force restart, battery check, etc.

### Existing Modules Updated:
1. **core_identity** - Ask what's wrong first, use line breaks
2. **context_awareness** - Check if customer already answered

## Important Notes

- ✅ Migration is **safe** - only updates prompts table
- ✅ No data loss - only changes AI behavior
- ✅ Can be rolled back if needed (see below)
- ✅ Code changes already deployed via Vercel

## Rollback (If Needed)

If you need to undo this migration:

```sql
-- Restore previous version of core_identity
UPDATE prompts 
SET version = version - 1 
WHERE module_name = 'core_identity';

-- Delete new modules
DELETE FROM prompts 
WHERE module_name IN (
  'duplicate_prevention',
  'ask_whats_wrong_first', 
  'proactive_troubleshooting'
);
```

## After Applying

The AI will immediately:
1. ✅ Ask "what's wrong?" before asking for model
2. ✅ Ask multiple questions at once for efficiency
3. ✅ Provide troubleshooting help (force restart, battery check)
4. ✅ Never ignore customer answers
5. ✅ Use better formatting with line breaks

No app restart needed - changes take effect immediately!

## Summary

**Current behavior:**
```
Customer: "iPhone broken"
AI: "What model?"
Customer: "iPhone 15"
AI: "What model?" (asks again - doesn't know what's wrong!)
```

**After migration:**
```
Customer: "iPhone broken"
AI: "What's happening with it, and what model - iPhone 12, 13, 14, 15, or 16?"
Customer: "Screen cracked, iPhone 15"
AI: "Let's try a force restart first: [instructions]
     
     If that doesn't help, screen replacements for iPhone 15 are £120..."
```

Much better! 🚀
