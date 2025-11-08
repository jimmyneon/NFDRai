#!/bin/bash

# Apply Migration 033 - Fix Duplicate Messages & Ask What's Wrong First
# This fixes:
# 1. AI asking for model without asking what's wrong first
# 2. Duplicate messages
# 3. No troubleshooting help
# 4. Poor formatting

echo "=================================================="
echo "Applying Migration 033"
echo "=================================================="
echo ""
echo "This will fix:"
echo "  ✓ Ask 'what's wrong?' FIRST before model"
echo "  ✓ Ask multiple questions at once"
echo "  ✓ Proactive troubleshooting (force restart, etc.)"
echo "  ✓ Smart duplicate prevention"
echo "  ✓ Better message formatting"
echo ""
echo "=================================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local not found"
    echo ""
    echo "Please create .env.local with your DATABASE_URL"
    echo "Or use Supabase Dashboard SQL Editor instead:"
    echo "  1. Go to https://supabase.com/dashboard"
    echo "  2. Select your project"
    echo "  3. Click SQL Editor"
    echo "  4. Copy/paste supabase/migrations/033_fix_duplicate_messages_and_missing_question.sql"
    echo "  5. Click Run"
    exit 1
fi

# Load environment variables
source .env.local

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not set in .env.local"
    echo ""
    echo "Please use Supabase Dashboard SQL Editor instead:"
    echo "  1. Go to https://supabase.com/dashboard"
    echo "  2. Select your project"
    echo "  3. Click SQL Editor"
    echo "  4. Copy/paste supabase/migrations/033_fix_duplicate_messages_and_missing_question.sql"
    echo "  5. Click Run"
    exit 1
fi

echo "Applying migration to database..."
echo ""

# Apply migration
psql "$DATABASE_URL" -f supabase/migrations/033_fix_duplicate_messages_and_missing_question.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "=================================================="
    echo "✅ Migration 033 Applied Successfully!"
    echo "=================================================="
    echo ""
    echo "The AI will now:"
    echo "  ✓ Ask 'what's wrong?' FIRST"
    echo "  ✓ Ask multiple questions at once"
    echo "  ✓ Provide troubleshooting help"
    echo "  ✓ Never ignore customer answers"
    echo "  ✓ Use better formatting"
    echo ""
    echo "Test it by sending:"
    echo "  'My iPhone is broken'"
    echo ""
    echo "Expected response:"
    echo "  'What's happening with it, and what model?'"
    echo ""
    echo "=================================================="
else
    echo ""
    echo "=================================================="
    echo "❌ Migration Failed"
    echo "=================================================="
    echo ""
    echo "Please use Supabase Dashboard SQL Editor instead:"
    echo "  1. Go to https://supabase.com/dashboard"
    echo "  2. Select your project"
    echo "  3. Click SQL Editor"
    echo "  4. Copy/paste supabase/migrations/033_fix_duplicate_messages_and_missing_question.sql"
    echo "  5. Click Run"
    echo ""
    exit 1
fi
