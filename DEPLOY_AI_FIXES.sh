#!/bin/bash

# Deploy AI Steve Fixes
# Fixes: No pricing quotes, no John mentions, proper greetings, acknowledgment responses

set -e

echo "🚀 Deploying AI Steve Fixes..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from project root"
    exit 1
fi

# Run the database migration
echo "📊 Running database migration 079..."
npx supabase db push

echo ""
echo "✅ Migration complete!"
echo ""
echo "🔍 Changes deployed:"
echo "  1. ❌ Removed ALL pricing quotes from AI responses"
echo "  2. ❌ Removed ALL John mentions and handoffs"
echo "  3. ✅ AI now directs to website links instead:"
echo "     - Repairs/quotes: https://www.newforestdevicerepairs.co.uk/repair-request"
echo "     - General questions: https://www.newforestdevicerepairs.co.uk/start"
echo "  4. ✅ Fixed greeting logic - no more aggressive 'Name!' greetings"
echo "  5. ✅ AI now responds warmly to 'thank you' messages"
echo "  6. ✅ Added acknowledgment_responses module for friendly replies"
echo ""
echo "📝 What AI will say now:"
echo ""
echo "Customer: 'How much for iPhone screen?'"
echo "AI: 'You can get a quote here: https://www.newforestdevicerepairs.co.uk/repair-request - or pop in during opening hours for an instant quote!'"
echo ""
echo "Customer: 'Thanks!'"
echo "AI: 'You're welcome! Let me know if you need anything else.'"
echo ""
echo "Customer: 'I need my iPhone 16 battery replacing'"
echo "AI: 'Perfect! You can get started here: https://www.newforestdevicerepairs.co.uk/repair-request - or pop in during opening hours and we'll sort you out!'"
echo ""
echo "✅ Deployment complete!"
echo ""
echo "🧪 Test with a real message to verify the changes work correctly."
