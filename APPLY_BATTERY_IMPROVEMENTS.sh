#!/bin/bash

# Apply Battery Health & Multi-Question Flow Improvements
# This script applies the migration to enhance AI Steve's battery guidance

echo "════════════════════════════════════════════════════════════════════════════════"
echo "  APPLYING BATTERY HEALTH & MULTI-QUESTION FLOW IMPROVEMENTS"
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

echo "📋 What this migration does:"
echo "  • Enhances battery health guidance with clear 85% threshold"
echo "  • Teaches customers to check Settings > Battery > Battery Health & Charging"
echo "  • Validates subjective experience over percentage"
echo "  • Improves multi-question handling efficiency"
echo "  • Adds proactive battery combo upselling"
echo ""

# Show current prompt versions
echo "📊 Current prompt module versions:"
psql "$DATABASE_URL" -c "SELECT module_name, version, updated_at FROM prompts WHERE module_name IN ('battery_replacement', 'common_scenarios', 'multi_question_handling') ORDER BY module_name;" 2>/dev/null || echo "  (Unable to query - will show after migration)"
echo ""

read -p "🤔 Apply migration? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled"
    exit 0
fi

echo ""
echo "🚀 Applying migration..."
echo "────────────────────────────────────────────────────────────────────────────────"

# Apply the migration
psql "$DATABASE_URL" -f supabase/migrations/020_improve_battery_guidance.sql

if [ $? -eq 0 ]; then
    echo "────────────────────────────────────────────────────────────────────────────────"
    echo "✅ Migration applied successfully!"
    echo ""
    
    # Show updated versions
    echo "📊 Updated prompt module versions:"
    psql "$DATABASE_URL" -c "SELECT module_name, version, updated_at FROM prompts WHERE module_name IN ('battery_replacement', 'common_scenarios', 'multi_question_handling') ORDER BY module_name;"
    echo ""
    
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo "  NEXT STEPS"
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo ""
    echo "1. ✅ Test the improvements:"
    echo "   • Send a test message: 'My battery drains fast'"
    echo "   • Expected: AI guides to check Settings > Battery > Battery Health & Charging"
    echo ""
    echo "2. ✅ Test multi-question handling:"
    echo "   • Send: 'Do you think my battery needs doing?' during screen repair"
    echo "   • Expected: Comprehensive answer with self-check guidance"
    echo ""
    echo "3. ✅ Monitor conversations:"
    echo "   • Check if customers are self-diagnosing successfully"
    echo "   • Track battery combo conversion rates"
    echo ""
    echo "4. 📖 Read full documentation:"
    echo "   • See BATTERY_AND_FLOW_IMPROVEMENTS.md for details"
    echo "   • Run: node test-battery-improvements.js for examples"
    echo ""
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo "✨ AI Steve is now smarter about battery guidance!"
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
