#!/bin/bash

# Test API Endpoint
# This simulates what MacroDroid sends

echo "🧪 Testing NFD AI Responder API..."
echo ""
echo "📍 URL: https://nfd-rai.vercel.app/api/messages/incoming"
echo ""

# Test 1: Send a test message
echo "📤 Sending test message..."
echo ""

response=$(curl -X POST https://nfd-rai.vercel.app/api/messages/incoming \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+447700900999",
    "message": "How much for iPhone 14 screen repair?",
    "channel": "sms"
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s)

echo "📥 Response:"
echo "$response"
echo ""
echo "---"
echo ""

# Test 2: Check what type of response we got
if echo "$response" | grep -q "<!DOCTYPE html>"; then
  echo "❌ ERROR: Got HTML response (should be JSON)"
  echo ""
  echo "Possible issues:"
  echo "1. Environment variables not set in Vercel"
  echo "2. Supabase migrations not run"
  echo "3. API route has an error"
  echo ""
  echo "Next steps:"
  echo "1. Check Vercel → Settings → Environment Variables"
  echo "2. Check Vercel → Deployments → Latest → Function Logs"
elif echo "$response" | grep -q "error"; then
  echo "⚠️  Got error response (but it's JSON - API is working!)"
  echo ""
  echo "Check the error message above to see what's wrong"
elif echo "$response" | grep -q "200"; then
  echo "✅ SUCCESS! API is working correctly"
else
  echo "❓ Unexpected response - check above"
fi

echo ""
echo "---"
echo ""
echo "💡 To check Vercel logs:"
echo "   1. Go to https://vercel.com"
echo "   2. Click your project"
echo "   3. Go to Deployments → Latest"
echo "   4. Click 'Functions' tab"
echo "   5. Look for errors"
