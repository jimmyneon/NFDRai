#!/bin/bash

# Apply migration 090 - Fix payment methods, expedited repairs, collection confirmations

echo "Applying migration 090..."

# Read the migration file and execute it
cat supabase/migrations/090_fix_payment_expedite_collection.sql | \
  PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h "$SUPABASE_DB_HOST" -U postgres -d postgres

echo "Migration 090 applied!"
