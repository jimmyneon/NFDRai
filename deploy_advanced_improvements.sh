#!/bin/bash

# Deploy advanced conversation improvements
# Migration 029

echo "=========================================="
echo "Deploying Advanced Improvements"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "supabase/migrations/029_advanced_conversation_improvements.sql" ]; then
    echo "❌ Error: Migration file not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

echo "📋 Advanced improvements being deployed:"
echo ""
echo "1. 🎯 Model Detection with Options"
echo "   • Provides common model options (iPhone 12, 13, 14, 15, 16)"
echo "   • One message shorter, faster response"
echo ""
echo "2. 💰 Proactive Pricing"
echo "   • Mentions pricing during troubleshooting"
echo "   • Customer has full context upfront"
echo ""
echo "3. 🤖 Confidence-Based Handoff"
echo "   • Auto-escalates complex cases to John"
echo "   • Water damage, unclear diagnosis, multiple issues"
echo ""
echo "4. ⏱️ Adaptive Message Batching"
echo "   • 2.5s wait for corrections (50% faster)"
echo "   • 5s wait for normal messages"
echo "   • Smart correction detection"
echo ""
echo "5. 📝 Typo Tolerance"
echo "   • Understands 'ohone', 'scren', 'baterry'"
echo "   • No awkward corrections"
echo ""

# Confirm deployment
read -p "Deploy these improvements? (y/n) " -n 1 -r
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
echo "  ✅ message-batcher.ts - Adaptive batching with correction detection"
echo ""

echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "What's new:"
echo "  • Model options speed up responses"
echo "  • Pricing mentioned during troubleshooting"
echo "  • Complex cases auto-escalate to John"
echo "  • Corrections detected = 2.5s wait (faster)"
echo "  • Typos understood automatically"
echo ""
echo "Test it:"
echo "  1. Send 'ohone' then 'iPhone' quickly"
echo "     → Should wait 2.5s and understand both"
echo "  2. Say 'iPhone'"
echo "     → Should get model options (12, 13, 14, 15, 16)"
echo "  3. Say 'iPhone 14 screen black'"
echo "     → Should get troubleshooting + pricing together"
echo "  4. Say 'tried restart, no damage'"
echo "     → Should escalate to John automatically"
echo ""
echo "Documentation: ADVANCED_IMPROVEMENTS.md"
echo ""
