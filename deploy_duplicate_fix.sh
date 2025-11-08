#!/bin/bash

# Deploy duplicate messages and black screen troubleshooting fix
# Migration 028

echo "=========================================="
echo "Deploying Duplicate Messages Fix"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "supabase/migrations/028_fix_duplicate_messages_and_black_screen.sql" ]; then
    echo "❌ Error: Migration file not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

echo "📋 Changes being deployed:"
echo "  1. Fix duplicate AI greeting messages"
echo "  2. Black screen triggers force restart + damage check"
echo "  3. Ask multiple diagnostic questions at once"
echo "  4. Increased message batching window (3s → 5s)"
echo ""

# Confirm deployment
read -p "Deploy these changes? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo "🚀 Applying database migration..."

# Apply migration
npx supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Database migration applied successfully!"
else
    echo "❌ Migration failed! Check the error above."
    exit 1
fi

echo ""
echo "📝 Code changes (automatic):"
echo "  ✅ message-batcher.ts - Batch window increased to 5 seconds"
echo ""

echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "What changed:"
echo "  • AI checks conversation history before introducing itself"
echo "  • Black screen ALWAYS triggers force restart + damage check"
echo "  • Multiple related questions asked together (faster)"
echo "  • 5-second wait for rapid customer messages"
echo ""
echo "Test it:"
echo "  1. Send 'Can you fix my phone' then 'iPhone' quickly"
echo "     → Should get ONE combined response"
echo "  2. Say 'Screen black'"
echo "     → Should get force restart + damage check in ONE message"
echo "  3. Start new conversation"
echo "     → Should only introduce AI Steve ONCE"
echo ""
echo "Documentation: DUPLICATE_MESSAGES_FIX.md"
echo ""
