# Apply Migration 047: Add Intent to Sentiment Analysis

## What This Migration Does

Adds three new columns to the `sentiment_analysis` table:
- `intent` - Customer intent (question, complaint, device_issue, etc.)
- `content_type` - Specific topic (pricing, water_damage, screen_damage, etc.)
- `intent_confidence` - Confidence score for intent detection (0.0-1.0)

Also creates:
- Indexes for faster queries
- Analytics view for reporting
- Documentation comments

## How to Apply

### Option 1: Supabase Dashboard (Recommended)

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/047_add_intent_to_sentiment_analysis.sql`
3. Paste and run
4. Verify with: `SELECT * FROM sentiment_analysis LIMIT 1;`

### Option 2: Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push

# Or apply specific migration
supabase migration up 047_add_intent_to_sentiment_analysis
```

### Option 3: Direct SQL

```bash
# Connect to your database
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run migration
\i supabase/migrations/047_add_intent_to_sentiment_analysis.sql
```

## Verification

After applying, verify the columns exist:

```sql
-- Check columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sentiment_analysis' 
AND column_name IN ('intent', 'content_type', 'intent_confidence');

-- Check indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'sentiment_analysis' 
AND indexname LIKE '%intent%';

-- Check view
SELECT * FROM sentiment_analysis_summary LIMIT 5;
```

## Expected Results

```
column_name         | data_type
--------------------+-----------
intent              | text
content_type        | text
intent_confidence   | numeric

indexname
-----------------------------------------
idx_sentiment_analysis_intent
idx_sentiment_analysis_content_type
idx_sentiment_analysis_intent_content
```

## Rollback (if needed)

```sql
-- Remove columns
ALTER TABLE sentiment_analysis
DROP COLUMN IF EXISTS intent,
DROP COLUMN IF EXISTS content_type,
DROP COLUMN IF EXISTS intent_confidence;

-- Remove indexes
DROP INDEX IF EXISTS idx_sentiment_analysis_intent;
DROP INDEX IF EXISTS idx_sentiment_analysis_content_type;
DROP INDEX IF EXISTS idx_sentiment_analysis_intent_content;

-- Remove view
DROP VIEW IF EXISTS sentiment_analysis_summary;
```

## Impact

- **No downtime** - Columns added with IF NOT EXISTS
- **Backward compatible** - Existing code continues to work
- **New data only** - Existing rows will have NULL for new columns
- **Performance** - Indexes added for fast queries

## Next Steps

After applying migration:
1. ✅ Verify columns exist
2. ✅ Check indexes created
3. ✅ Test unified analyzer saves data
4. ✅ Run Phase 5 testing
5. ✅ Monitor logs for any errors

## Troubleshooting

**Error: "permission denied"**
- Use service role key or database owner account

**Error: "column already exists"**
- Migration already applied, safe to skip

**Error: "relation does not exist"**
- Check sentiment_analysis table exists first

## Analytics Query Examples

After migration, you can run analytics:

```sql
-- Most common intents
SELECT intent, COUNT(*) as count
FROM sentiment_analysis
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY intent
ORDER BY count DESC;

-- Content types by sentiment
SELECT content_type, sentiment, COUNT(*) as count
FROM sentiment_analysis
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY content_type, sentiment
ORDER BY count DESC;

-- Average confidence by intent
SELECT intent, 
  AVG(confidence) as avg_confidence,
  AVG(intent_confidence) as avg_intent_confidence
FROM sentiment_analysis
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY intent;
```
