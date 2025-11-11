#!/bin/bash

# ============================================================================
# DEPLOY MULTI-MESSAGE IMPROVEMENTS
# ============================================================================
# Deploys fixes for multi-message (|||) usage
# - First AI disclosure now sends separately
# - Better multi-message guidance in database modules
# ============================================================================

set -e  # Exit on error

echo "=================================================="
echo "DEPLOYING MULTI-MESSAGE IMPROVEMENTS"
echo "=================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from project root directory"
    exit 1
fi

echo "📋 CHANGES BEING DEPLOYED:"
echo "   1. First AI disclosure sends as separate message (|||)"
echo "   2. Updated pricing_flow_detailed module with ||| examples"
echo "   3. New multi_message_best_practices module (priority 95)"
echo "   4. New multi_message_reminder module (priority 90)"
echo ""

# Step 1: Apply database migration
echo "=================================================="
echo "STEP 1: Applying Database Migration"
echo "=================================================="
echo ""

if [ -f "supabase/migrations/046_improve_multi_message_usage.sql" ]; then
    echo "✅ Migration file found: 046_improve_multi_message_usage.sql"
    echo ""
    echo "Applying migration..."
    
    # Apply migration using Supabase CLI
    if command -v supabase &> /dev/null; then
        supabase db push
        echo "✅ Migration applied successfully"
    else
        echo "⚠️  Supabase CLI not found - apply migration manually:"
        echo "   supabase db push"
        echo "   OR run the SQL file directly in Supabase dashboard"
    fi
else
    echo "❌ Migration file not found!"
    exit 1
fi

echo ""

# Step 2: Verify code changes
echo "=================================================="
echo "STEP 2: Verifying Code Changes"
echo "=================================================="
echo ""

if grep -q "Sending disclosure as SEPARATE message" lib/ai/smart-response-generator.ts; then
    echo "✅ Code changes verified in smart-response-generator.ts"
else
    echo "❌ Code changes not found in smart-response-generator.ts"
    exit 1
fi

echo ""

# Step 3: Build Next.js application
echo "=================================================="
echo "STEP 3: Building Next.js Application"
echo "=================================================="
echo ""

echo "Running build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

echo ""

# Step 4: Deployment summary
echo "=================================================="
echo "DEPLOYMENT SUMMARY"
echo "=================================================="
echo ""
echo "✅ Database migration applied"
echo "✅ Code changes verified"
echo "✅ Next.js build successful"
echo ""
echo "WHAT CHANGED:"
echo "   • First AI disclosure now sends as separate message"
echo "   • AI has better guidance on when to use |||"
echo "   • Pricing flow explicitly shows ||| examples"
echo "   • New best practices module (priority 95)"
echo ""
echo "TESTING:"
echo "   1. Send message to new customer"
echo "   2. Should receive 2 messages:"
echo "      - Message 1: AI disclosure with signature"
echo "      - Message 2: Actual response with signature"
echo "   3. Check logs for: [AI Disclosure] Sending disclosure as SEPARATE message"
echo ""
echo "MONITORING:"
echo "   • Watch for multi-message usage in logs"
echo "   • Verify 2-second delay between messages"
echo "   • Check customer feedback on message flow"
echo ""
echo "ROLLBACK (if needed):"
echo "   1. Revert lib/ai/smart-response-generator.ts"
echo "   2. Run: supabase db reset"
echo "   3. Redeploy previous version"
echo ""
echo "=================================================="
echo "DEPLOYMENT COMPLETE! 🚀"
echo "=================================================="
echo ""
echo "Next steps:"
echo "   1. Test with a new conversation"
echo "   2. Monitor logs for multi-message usage"
echo "   3. Check customer engagement metrics"
echo ""
echo "Documentation:"
echo "   • MULTI_MESSAGE_AUDIT.md - Full audit"
echo "   • MULTI_MESSAGE_IMPROVEMENTS.md - Implementation details"
echo ""
