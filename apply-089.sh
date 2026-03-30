#!/bin/bash

# Apply migration 089 - Fix name usage and confident messaging

echo "Applying migration 089..."

# Read the migration file and execute it
cat supabase/migrations/089_fix_name_usage_and_confident_messaging.sql | \
  PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h "$SUPABASE_DB_HOST" -U postgres -d postgres

echo "Migration 089 applied!"
