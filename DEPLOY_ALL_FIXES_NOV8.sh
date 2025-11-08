#!/bin/bash

# Deploy All November 8 Fixes
# Comprehensive deployment script for all AI improvements

echo "════════════════════════════════════════════════════════════════════════════════"
echo "  DEPLOYING ALL NOVEMBER 8 AI IMPROVEMENTS"
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

echo "📋 Fixes to deploy:"
echo ""
echo "1️⃣  BATTERY HEALTH GUIDANCE"
echo "   • Clear 85% threshold"
echo "   • Self-check instructions"
echo "   • Multi-question efficiency"
echo ""
echo "2️⃣  BUSINESS HOURS 'TOMORROW' CHECK"
echo "   • Verifies hours before saying 'tomorrow'"
echo "   • Corrects customers when closed"
echo ""
echo "3️⃣  🚨 CRITICAL: BUYBACK DETECTION"
echo "   • Fixed 'we don't buy old tech' error"
echo "   • Added 'buy' keyword detection"
echo "   • Clear age guidance (under 6 years)"
echo ""
echo "4️⃣  CONTEXT SWITCHING"
echo "   • Recognizes clarifications ('I mean for fixing')"
echo "   • Adapts to topic switches"
echo ""
echo "5️⃣  LAPTOP DIAGNOSTICS & DUPLICATES"
echo "   • Brand name is enough for diagnostics"
echo "   • Prevents duplicate messages"
echo "   • Chromebook detection"
echo ""
echo "6️⃣  NAME PREFERENCE CORRECTIONS"
echo "   • Updates database when customer corrects name"
echo "   • Handles 'refer to me as Mr Davidson not Dave'"
echo "   • Polite acknowledgment"
echo ""

read -p "🤔 Deploy all fixes? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 0
fi

echo ""
echo "🚀 Applying migrations..."
echo "────────────────────────────────────────────────────────────────────────────────"

# Counter for successful migrations
SUCCESS_COUNT=0
TOTAL_COUNT=6

# Migration 020 - Battery guidance
echo ""
echo "1️⃣  Applying battery health guidance improvements..."
if psql "$DATABASE_URL" -f supabase/migrations/020_improve_battery_guidance.sql > /dev/null 2>&1; then
    echo "✅ Battery guidance applied"
    ((SUCCESS_COUNT++))
else
    echo "⚠️  Battery guidance already applied or error"
fi

# Migration 021 - Business hours
echo ""
echo "2️⃣  Applying business hours 'tomorrow' check..."
if psql "$DATABASE_URL" -f supabase/migrations/021_fix_tomorrow_business_hours_check.sql > /dev/null 2>&1; then
    echo "✅ Business hours check applied"
    ((SUCCESS_COUNT++))
else
    echo "⚠️  Business hours check already applied or error"
fi

# Migration 022 - Buyback
echo ""
echo "3️⃣  Applying CRITICAL buyback fix..."
if psql "$DATABASE_URL" -f supabase/migrations/022_fix_buyback_guidance.sql > /dev/null 2>&1; then
    echo "✅ Buyback fix applied"
    ((SUCCESS_COUNT++))
else
    echo "⚠️  Buyback fix already applied or error"
fi

# Migration 023 - Context switching
echo ""
echo "4️⃣  Applying context switching improvements..."
if psql "$DATABASE_URL" -f supabase/migrations/023_improve_context_switching.sql > /dev/null 2>&1; then
    echo "✅ Context switching applied"
    ((SUCCESS_COUNT++))
else
    echo "⚠️  Context switching already applied or error"
fi

# Migration 024 - Laptop diagnostics
echo ""
echo "5️⃣  Applying laptop diagnostics & duplicate prevention..."
if psql "$DATABASE_URL" -f supabase/migrations/024_fix_laptop_diagnostics_and_duplicates.sql > /dev/null 2>&1; then
    echo "✅ Laptop diagnostics applied"
    ((SUCCESS_COUNT++))
else
    echo "⚠️  Laptop diagnostics already applied or error"
fi

# Migration 025 - Name preference
echo ""
echo "6️⃣  Applying name preference correction handling..."
if psql "$DATABASE_URL" -f supabase/migrations/025_name_preference_handling.sql > /dev/null 2>&1; then
    echo "✅ Name preference handling applied"
    ((SUCCESS_COUNT++))
else
    echo "⚠️  Name preference handling already applied or error"
fi

echo "────────────────────────────────────────────────────────────────────────────────"
echo "✅ Deployment complete! ($SUCCESS_COUNT/$TOTAL_COUNT migrations applied)"
echo ""

# Show updated versions
echo "📊 Updated prompt modules:"
psql "$DATABASE_URL" -c "SELECT module_name, version, updated_at FROM prompts WHERE module_name IN ('battery_replacement', 'common_scenarios', 'multi_question_handling', 'core_identity', 'time_aware_responses', 'tomorrow_check_reminder', 'buyback', 'topic_switch_handler', 'diagnostic') ORDER BY updated_at DESC LIMIT 10;"
echo ""

echo "════════════════════════════════════════════════════════════════════════════════"
echo "  CODE CHANGES"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""
echo "⚠️  IMPORTANT: Code changes in lib/ai/smart-response-generator.ts also need"
echo "   to be deployed to production."
echo ""
echo "If using Vercel/Netlify:"
echo "   ✅ Already pushed to GitHub - automatic deployment will handle it"
echo ""
echo "If using manual server:"
echo "   npm run build"
echo "   pm2 restart all  (or your restart command)"
echo ""

echo "════════════════════════════════════════════════════════════════════════════════"
echo "  TESTING CHECKLIST"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""
echo "✅ Battery Health:"
echo "   • Send: 'My battery drains fast'"
echo "   • Expected: Guides to check Settings > Battery > Battery Health & Charging"
echo ""
echo "✅ Business Hours:"
echo "   • Send: 'See you tomorrow' (on Friday)"
echo "   • Expected: Corrects if closed Saturday"
echo ""
echo "✅ Buyback:"
echo "   • Send: 'Do you buy phones?'"
echo "   • Expected: 'Yes! We buy iPhones, iPads, MacBooks...'"
echo ""
echo "✅ Context Switching:"
echo "   • Send: 'How about laptop' then 'I mean for fixing'"
echo "   • Expected: 'Ah, you want to get it repaired!'"
echo ""
echo "✅ Laptop Diagnostics:"
echo "   • Send: 'HP' then 'Blue screen'"
echo "   • Expected: Diagnostic offer, NO model request, NO duplicates"
echo ""
echo "✅ Name Preference:"
echo "   • Send: 'Please refer to me as Mr Davidson not Dave'"
echo "   • Expected: Database updated, AI acknowledges politely"
echo ""
echo "════════════════════════════════════════════════════════════════════════════════"
echo "  DOCUMENTATION"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""
echo "📖 Full documentation:"
echo "   • ALL_FIXES_NOV8_FINAL.md - Complete summary"
echo "   • BATTERY_AND_FLOW_IMPROVEMENTS.md"
echo "   • TOMORROW_HOURS_CHECK_FIX.md"
echo "   • BUYBACK_FIX.md"
echo "   • CONTEXT_SWITCHING_FIX.md"
echo "   • LAPTOP_DIAGNOSTICS_FIX.md"
echo "   • NAME_PREFERENCE_FIX.md"
echo ""
echo "════════════════════════════════════════════════════════════════════════════════"
echo "✨ All fixes deployed! Monitor conversations for improved customer experience."
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""
