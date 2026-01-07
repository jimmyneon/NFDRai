#!/bin/bash
# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Run the migration
psql "$DATABASE_URL" -f supabase/migrations/040_remove_pricing_from_responses.sql
