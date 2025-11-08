#!/bin/bash

# Apply All AI Improvements
# 1. Battery health guidance improvements
# 2. Business hours "tomorrow" check fix

echo "════════════════════════════════════════════════════════════════════════════════"
echo "  APPLYING ALL AI IMPROVEMENTS"
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

echo "📋 Improvements to apply:"
echo ""
echo "1️⃣  BATTERY HEALTH GUIDANCE"
echo "   • Clear 85% threshold for replacement"
echo "   • Teaches customers to check Settings > Battery > Battery Health & Charging"
echo "   • Validates subjective experience over percentage"
echo "   • Improves multi-question handling efficiency"
echo ""
echo "2️⃣  BUSINESS HOURS 'TOMORROW' CHECK"
echo "   • Always checks if actually open tomorrow before saying 'see you tomorrow'"
echo "   • Politely corrects customers when closed tomorrow"
echo "   • Uses real-time business hours data"
echo "   • Prevents customer confusion and wasted trips"
echo ""

# Show current prompt versions
echo "📊 Current prompt module versions:"
psql "$DATABASE_URL" -c "SELECT module_name, version, updated_at FROM prompts WHERE module_name IN ('battery_replacement', 'common_scenarios', 'multi_question_handling', 'core_identity', 'time_aware_responses', 'tomorrow_check_reminder') ORDER BY module_name;" 2>/dev/null || echo "  (Unable to query - will show after migration)"
echo ""

read -p "🤔 Apply all improvements? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migrations cancelled"
    exit 0
fi

echo ""
echo "🚀 Applying migrations..."
echo "────────────────────────────────────────────────────────────────────────────────"

# Apply migration 020 - Battery improvements
echo ""
echo "1️⃣  Applying battery health guidance improvements..."
psql "$DATABASE_URL" -f supabase/migrations/020_improve_battery_guidance.sql

if [ $? -ne 0 ]; then
    echo "❌ Battery guidance migration failed!"
    exit 1
fi
echo "✅ Battery guidance improvements applied"

# Apply migration 021 - Tomorrow check fix
echo ""
echo "2️⃣  Applying business hours 'tomorrow' check fix..."
psql "$DATABASE_URL" -f supabase/migrations/021_fix_tomorrow_business_hours_check.sql

if [ $? -ne 0 ]; then
    echo "❌ Tomorrow check migration failed!"
    exit 1
fi
echo "✅ Business hours check improvements applied"

echo "────────────────────────────────────────────────────────────────────────────────"
echo "✅ All migrations applied successfully!"
echo ""

# Show updated versions
echo "📊 Updated prompt module versions:"
psql "$DATABASE_URL" -c "SELECT module_name, version, updated_at FROM prompts WHERE module_name IN ('battery_replacement', 'common_scenarios', 'multi_question_handling', 'core_identity', 'time_aware_responses', 'tomorrow_check_reminder') ORDER BY module_name;"
echo ""

echo "════════════════════════════════════════════════════════════════════════════════"
echo "  TESTING & VERIFICATION"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""
echo "1️⃣  BATTERY HEALTH TESTS:"
echo ""
echo "   Test 1: Battery Question"
echo "   Send: 'My battery drains fast'"
echo "   Expected: AI guides to check Settings > Battery > Battery Health & Charging"
echo ""
echo "   Test 2: Battery During Screen Repair"
echo "   Send: 'Do you think my battery needs doing?' (during screen booking)"
echo "   Expected: Comprehensive answer with self-check guidance + combo discount"
echo ""
echo "   Test 3: Battery Health Percentage"
echo "   Send: 'Battery health is 78%'"
echo "   Expected: 'That definitely needs replacing! Below 85%...'"
echo ""
echo "2️⃣  BUSINESS HOURS TESTS:"
echo ""
echo "   Test 1: 'See You Tomorrow' on Friday"
echo "   Send: 'Ok great see you tomorrow' (on Friday afternoon)"
echo "   Expected: If closed Saturday, AI should correct: 'Just a heads-up - we're"
echo "            actually closed tomorrow (Saturday). We'll be open Monday at 10:00 AM'"
echo ""
echo "   Test 2: 'See You Tomorrow' on Thursday"
echo "   Send: 'Ok great see you tomorrow' (on Thursday)"
echo "   Expected: If open Friday, AI confirms: 'Looking forward to it! Just a"
echo "            reminder, we're open 10:00 AM to 5:00 PM tomorrow'"
echo ""
echo "   Test 3: Late Night Inquiry"
echo "   Send: 'I'll come by tomorrow' (at 11pm Friday)"
echo "   Expected: AI checks hours and responds with actual next opening (Monday)"
echo ""
echo "════════════════════════════════════════════════════════════════════════════════"
echo "  DOCUMENTATION"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""
echo "📖 Battery Improvements:"
echo "   • Full docs: BATTERY_AND_FLOW_IMPROVEMENTS.md"
echo "   • Quick ref: BATTERY_QUICK_REFERENCE.md"
echo "   • Test demo: node test-battery-improvements.js"
echo ""
echo "📖 Business Hours Fix:"
echo "   • Full docs: TOMORROW_HOURS_CHECK_FIX.md"
echo "   • Test demo: node test-tomorrow-hours-check.js"
echo ""
echo "════════════════════════════════════════════════════════════════════════════════"
echo "  NEXT STEPS"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""
echo "1. ✅ Run the test scenarios above to verify improvements"
echo "2. ✅ Monitor real conversations for improved customer experience"
echo "3. ✅ Track battery combo conversion rates"
echo "4. ✅ Watch for fewer confused customers about opening times"
echo "5. ✅ Gather customer feedback on self-diagnosis experience"
echo ""
echo "════════════════════════════════════════════════════════════════════════════════"
echo "✨ AI Steve is now smarter about battery guidance and business hours!"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""
