# 🚀 Run Learning System Migration

## Step 1: Run the Migration

You need to run the learning system migration to create the new tables.

### Option A: Via Supabase Dashboard (Easiest)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file: `supabase/migrations/012_learning_system.sql`
4. Copy the entire contents
5. Paste into SQL Editor
6. Click **Run**

### Option B: Via Supabase CLI
```bash
# Make sure you're in the project directory
cd /Users/johnhopwood/NFDRAIRESPONDER

# Run the migration
supabase db push
```

### Option C: Manual SQL Execution
If you prefer to run it manually, the migration file is at:
`/Users/johnhopwood/NFDRAIRESPONDER/supabase/migrations/012_learning_system.sql`

---

## Step 2: Verify Migration Success

Run this query in Supabase SQL Editor to verify tables were created:

```sql
-- Check if all new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'conversation_context',
  'ai_analytics',
  'prompt_performance',
  'learning_feedback',
  'learned_patterns',
  'intent_classifications'
)
ORDER BY table_name;
```

You should see 6 tables listed.

---

## Step 3: Check Table Structure

```sql
-- View conversation_context structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'conversation_context'
ORDER BY ordinal_position;

-- View ai_analytics structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'ai_analytics'
ORDER BY ordinal_position;
```

---

## Step 4: Test Insert (Optional)

```sql
-- Test inserting a sample conversation context
INSERT INTO conversation_context (
  conversation_id,
  state,
  intent,
  device_type,
  device_model,
  confidence
) VALUES (
  gen_random_uuid(),
  'new_inquiry',
  'screen_repair',
  'iphone',
  'iPhone 12',
  0.85
);

-- Check it was inserted
SELECT * FROM conversation_context ORDER BY created_at DESC LIMIT 1;
```

---

## What These Tables Do

### 1. **conversation_context**
Tracks the current state of each conversation:
- Where are we in the flow? (gathering info, presenting options, etc.)
- What's the intent? (screen repair, battery, etc.)
- What do we know? (device model, customer name, etc.)

### 2. **ai_analytics**
Performance metrics for every AI response:
- Response time
- Token usage
- Cost
- Validation results
- Customer interaction data

### 3. **prompt_performance**
A/B testing data:
- Which prompt versions work best
- Conversion rates
- Cost per intent

### 4. **learning_feedback**
Staff corrections:
- When AI makes mistakes
- What should have been said
- Used to improve AI

### 5. **learned_patterns**
Auto-learned patterns:
- Common device mentions
- Successful phrases
- Customer behavior patterns

### 6. **intent_classifications**
Intent accuracy tracking:
- What AI predicted
- What actually happened
- Accuracy over time

---

## Next Steps After Migration

Once the migration is complete:

1. ✅ Restart your Next.js dev server:
   ```bash
   npm run dev
   ```

2. ✅ Test with a sample message (I'll help you with this)

3. ✅ Check the new tables are being populated:
   ```sql
   SELECT COUNT(*) FROM conversation_context;
   SELECT COUNT(*) FROM ai_analytics;
   ```

4. ✅ Monitor the console logs for Smart AI output

---

## Troubleshooting

### Error: "relation already exists"
If you see this error, it means the tables already exist. You can either:
- Drop the tables first: `DROP TABLE IF EXISTS conversation_context CASCADE;`
- Or skip this migration

### Error: "permission denied"
Make sure you're running as a user with CREATE TABLE permissions.

### Error: "function update_updated_at_column does not exist"
This function should exist from the initial migration. If not, add it:
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Ready?

Once you've run the migration, let me know and we'll:
1. Test with a real conversation
2. Show you the state tracking in action
3. Demonstrate the learning system working

**Run the migration now and tell me when it's done!** 🚀
