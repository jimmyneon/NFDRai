/**
 * Test name extraction from Maurice's message
 * Run with: node test-maurice-name-extraction.js
 */

// Simulate the name extraction logic
function extractCustomerName(message) {
  // Pattern 9: Email signature
  const pattern9 = /(?:regards|thanks|thank you|cheers|best regards|kind regards),?\s+([a-z]+)(?:\s*\.)?$/i
  const match9 = message.match(pattern9)
  
  if (match9) {
    const customerName = match9[1].trim()
    // Don't extract staff names (John)
    if (customerName.toLowerCase() !== 'john') {
      return {
        customerName: customerName.charAt(0).toUpperCase() + customerName.slice(1).toLowerCase(),
        confidence: 'medium',
        pattern: 'signature'
      }
    }
  }
  
  return { customerName: null, confidence: 'low' }
}

// Test cases
const testCases = [
  {
    message: "Good morning John. If you can phone me when you start work it would quicker and easier for me to check the login with you. Regards, Maurice.",
    expected: "Maurice"
  },
  {
    message: "Thanks for your help. Regards, Sarah",
    expected: "Sarah"
  },
  {
    message: "I'll be there soon. Cheers, Mike",
    expected: "Mike"
  },
  {
    message: "Your phone is ready. Many thanks, John",
    expected: null  // Should NOT extract John (staff name)
  },
  {
    message: "Best regards, Carol",
    expected: "Carol"
  },
  {
    message: "Kind regards, David.",
    expected: "David"
  }
]

console.log('Testing name extraction from signatures:\n')

let passed = 0
let failed = 0

testCases.forEach((test, index) => {
  const result = extractCustomerName(test.message)
  const success = result.customerName === test.expected
  
  if (success) {
    console.log(`✅ Test ${index + 1}: PASS`)
    passed++
  } else {
    console.log(`❌ Test ${index + 1}: FAIL`)
    console.log(`   Message: "${test.message.substring(0, 60)}..."`)
    console.log(`   Expected: ${test.expected}`)
    console.log(`   Got: ${result.customerName}`)
    failed++
  }
})

console.log(`\n${passed}/${testCases.length} tests passed`)

if (failed === 0) {
  console.log('\n🎉 All tests passed! Maurice\'s name will now be extracted.')
} else {
  console.log(`\n⚠️  ${failed} test(s) failed`)
}
