#!/bin/bash

# Deploy Buyback Fix - CRITICAL
# AI was saying "we don't buy old tech" when business DOES buy devices under 6 years old

echo "════════════════════════════════════════════════════════════════════════════════"
echo "  CRITICAL: DEPLOYING BUYBACK FIX"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo ""
    echo "Please set your Supabase database URL:"
    echo "  export DATABASE_URL='postgresql://...' "
    echo ""
    exit 1
fi

echo "🚨 PROBLEM:"
echo "   AI was saying 'we don't buy old tech' when customers asked about selling devices"
echo "   This is WRONG - business DOES buy devices under 6 years old!"
echo ""
echo "🔧 FIXES:"
echo "   1. Added 'buy' and 'old tech' to buyback detection keywords"
echo "   2. Load dedicated buyback module (not just common_scenarios)"
echo "   3. Updated buyback module with clear age guidance (under 6 years)"
echo "   4. Added 'NEVER SAY WE DON'T BUY OLD TECH' instruction"
echo ""

read -p "🤔 Deploy buyback fix? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 0
fi

echo ""
echo "🚀 Applying database migration..."
echo "────────────────────────────────────────────────────────────────────────────────"

psql "$DATABASE_URL" -f supabase/migrations/022_fix_buyback_guidance.sql

if [ $? -eq 0 ]; then
    echo "────────────────────────────────────────────────────────────────────────────────"
    echo "✅ Database migration applied successfully!"
    echo ""
    
    echo "📊 Updated buyback module:"
    psql "$DATABASE_URL" -c "SELECT module_name, version, updated_at FROM prompts WHERE module_name = 'buyback';"
    echo ""
    
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo "  NEXT STEPS - DEPLOY CODE CHANGES"
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo ""
    echo "⚠️  IMPORTANT: Code changes in lib/ai/smart-response-generator.ts also need"
    echo "   to be deployed to production for the fix to work completely."
    echo ""
    echo "If using Vercel/Netlify:"
    echo "   git push origin main  (already done)"
    echo "   → Automatic deployment will pick up the code changes"
    echo ""
    echo "If using a manual server:"
    echo "   npm run build"
    echo "   pm2 restart all  (or your restart command)"
    echo ""
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo "  TESTING"
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo ""
    echo "Test these scenarios:"
    echo ""
    echo "1. Send: 'Do you buy phones?'"
    echo "   Expected: 'Yes! We buy iPhones, iPads, MacBooks, and laptops at good rates...'"
    echo ""
    echo "2. Send: 'I've got some old tech'"
    echo "   Expected: 'We're always looking for phones, laptops, consoles, etc...'"
    echo ""
    echo "3. Send: 'Do you buy stuff?'"
    echo "   Expected: 'Absolutely! We buy iPhones, iPads, MacBooks, laptops...'"
    echo ""
    echo "4. Send: 'How about laptop'"
    echo "   Expected: 'Yes! We buy laptops at good rates. What model is it...'"
    echo ""
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo "✨ Buyback fix deployed! Code changes will take effect on next deployment."
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo ""
else
    echo "────────────────────────────────────────────────────────────────────────────────"
    echo "❌ Migration failed!"
    echo ""
    echo "Please check:"
    echo "  • DATABASE_URL is correct"
    echo "  • Database is accessible"
    echo "  • You have proper permissions"
    echo ""
    exit 1
fi
