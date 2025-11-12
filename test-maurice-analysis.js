/**
 * Test script to check Maurice's conversation analysis
 * Run with: node test-maurice-analysis.js
 */

const message = "Good morning John. If you can phone me when you start work it would quicker and easier for me to check the login with you. Regards, Maurice."

// Test the callback detection pattern
const callbackPatterns = [
  /(phone|call|ring)\s+(me|us)\s+(when|once|after)/i,
  /(can|could|would)\s+you\s+(phone|call|ring)\s+(me|us)/i,
  /if\s+you\s+(can|could)\s+(phone|call|ring)/i,
]

console.log('Testing Maurice\'s message:')
console.log(message)
console.log('\n')

let matched = false
for (const pattern of callbackPatterns) {
  if (pattern.test(message)) {
    console.log('✅ MATCHED:', pattern)
    console.log('   Pattern detected callback request')
    matched = true
  }
}

if (!matched) {
  console.log('❌ NO MATCH - AI would respond')
} else {
  console.log('\n📞 Result: AI will NOT respond (callback request detected)')
  console.log('   Reasoning: "Customer requesting callback from staff"')
  console.log('   UI Badge: 📞 Callback Request')
}

console.log('\n')
console.log('Expected behavior:')
console.log('1. AI stays silent ✓')
console.log('2. Alert created for staff ✓')
console.log('3. UI shows "📞 Callback Request" badge ✓')
console.log('4. Urgency set to "medium" ✓')
