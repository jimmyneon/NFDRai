#!/bin/bash

# Quick Deploy Script - Missed Call & Holiday Fix
# Run this to deploy the context-aware missed call message

echo "🚀 Deploying Missed Call & Holiday Fix"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root directory"
    exit 1
fi

echo "📦 Step 1: Running tests..."
node test-missed-call-context.js
if [ $? -ne 0 ]; then
    echo "❌ Tests failed! Fix errors before deploying."
    exit 1
fi
echo "✅ All tests passed!"
echo ""

echo "🔨 Step 2: Building project..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed! Fix errors before deploying."
    exit 1
fi
echo "✅ Build successful!"
echo ""

echo "📝 Step 3: Committing changes..."
git add app/api/messages/missed-call/route.ts
git add lib/business-hours.ts
git add test-missed-call-context.js
git add DEPLOY_MISSED_CALL_FIX.md
git add MISSED_CALL_FIX_PLAN.md
git add SYSTEM_ARCHITECTURE_FINAL.md
git add QUICK_DEPLOY.sh

git commit -m "Fix: Context-aware missed call messages with holiday support

- Missed call message now checks business hours (open/closed)
- Shows next opening time and Google Maps link
- Applies holiday mode with festive greetings (Christmas, New Year, Easter)
- Specific prompts encourage customer responses
- All 7 test scenarios pass

Benefits:
- Clear expectations (no false hope during holidays)
- Better engagement (specific service examples)
- Professional + festive tone
- No additional costs (all checks are free)"

echo "✅ Changes committed!"
echo ""

echo "🚀 Step 4: Pushing to main branch..."
git push origin main
if [ $? -ne 0 ]; then
    echo "❌ Push failed! Check git status."
    exit 1
fi
echo "✅ Pushed to main!"
echo ""

echo "🎉 Deployment complete!"
echo ""
echo "Vercel will auto-deploy in ~2 minutes."
echo ""
echo "📋 What was fixed:"
echo "  ✅ Missed call message now context-aware"
echo "  ✅ Holiday mode with festive greetings"
echo "  ✅ Shows business hours and next opening time"
echo "  ✅ Includes Google Maps link"
echo "  ✅ Specific prompts (screen, battery, booking)"
echo ""
echo "🧪 Test with a real missed call to verify!"
