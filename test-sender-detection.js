#!/usr/bin/env node

/**
 * Test script for sender detection
 * Verifies that AI messages and staff messages are correctly identified
 */

// Test cases
const testCases = [
  {
    name: 'AI Steve signature - standard',
    message: 'Hi! Your phone is ready for collection. Many thanks, AI Steve',
    expectedSender: 'ai',
    expectedConfidence: 'high'
  },
  {
    name: 'AI Steve signature - with company',
    message: 'Hello! We can help with that. Best regards, AI Steve from New Forest Device Repairs',
    expectedSender: 'ai',
    expectedConfidence: 'high'
  },
  {
    name: 'John signature - standard',
    message: 'Your device is ready. Many thanks, John',
    expectedSender: 'staff',
    expectedConfidence: 'high'
  },
  {
    name: 'John signature - with typo',
    message: 'Your device is ready. Many thenks, John',
    expectedSender: 'staff',
    expectedConfidence: 'high'
  },
  {
    name: 'AI mentioning John as third person',
    message: 'I\'ll pass this onto John and he\'ll get back to you. Many thanks, AI Steve',
    expectedSender: 'ai',
    expectedConfidence: 'high'
  },
  {
    name: 'AI saying John will call back',
    message: 'John will call you back about this. Thanks, AI Steve',
    expectedSender: 'ai',
    expectedConfidence: 'high'
  },
  {
    name: 'Customer named John (should not be detected as staff)',
    message: 'Hi John, your phone is ready for collection. Many thanks, AI Steve',
    expectedSender: 'ai',
    expectedConfidence: 'high'
  },
  {
    name: 'Message without signature',
    message: 'Your device is ready for collection',
    expectedSender: 'staff', // Default
    expectedConfidence: 'low'
  },
  {
    name: 'AI-like language',
    message: 'I\'m here to help with your device repair query',
    expectedSender: 'ai',
    expectedConfidence: 'medium'
  }
]

// Simple implementation of detectSender for testing
function detectSender(messageText) {
  const lowerText = messageText.toLowerCase()
  
  // AI Steve signatures (high confidence)
  const aiSteveSignatures = [
    /many\s+thanks,?\s+ai\s+steve/i,
    /best\s+regards,?\s+ai\s+steve/i,
    /kind\s+regards,?\s+ai\s+steve/i,
    /regards,?\s+ai\s+steve/i,
    /thanks,?\s+ai\s+steve/i,
    /cheers,?\s+ai\s+steve/i,
    /ai\s+steve\s+from\s+new\s+forest\s+device\s+repairs/i,
  ]
  
  // Staff (John) signatures (high confidence)
  const johnSignatures = [
    /many\s+thanks,?\s+john/i,
    /best\s+regards,?\s+john/i,
    /kind\s+regards,?\s+john/i,
    /regards,?\s+john/i,
    /thanks,?\s+john/i,
    /cheers,?\s+john/i,
    /john\s+from\s+new\s+forest\s+device\s+repairs/i,
    /many\s+thenks,?\s+john/i, // Handle typo
  ]
  
  // Check for AI Steve signature
  for (const pattern of aiSteveSignatures) {
    if (pattern.test(messageText)) {
      return {
        sender: 'ai',
        confidence: 'high',
        reason: 'Message contains AI Steve signature'
      }
    }
  }
  
  // Check for John signature
  for (const pattern of johnSignatures) {
    if (pattern.test(messageText)) {
      return {
        sender: 'staff',
        confidence: 'high',
        reason: 'Message contains John signature'
      }
    }
  }
  
  // Check if message mentions "John" in context that suggests it's TO John (not FROM John)
  const mentionsJohnAsThirdPerson = [
    /i'?ll\s+(?:pass|forward|send).*to\s+john/i,
    /john\s+will\s+(?:call|contact|get\s+back)/i,
    /let\s+me\s+check\s+with\s+john/i,
    /i'?ll\s+ask\s+john/i,
  ]
  
  for (const pattern of mentionsJohnAsThirdPerson) {
    if (pattern.test(messageText)) {
      return {
        sender: 'ai',
        confidence: 'high',
        reason: 'Message mentions John as third person (AI referring to staff)'
      }
    }
  }
  
  // Medium confidence: Check for AI-like language patterns
  const aiPatterns = [
    /i'?m\s+(?:an\s+)?ai\s+assistant/i,
    /as\s+(?:an\s+)?ai/i,
    /i'?m\s+here\s+to\s+help/i,
    /happy\s+to\s+assist/i,
  ]
  
  for (const pattern of aiPatterns) {
    if (pattern.test(messageText)) {
      return {
        sender: 'ai',
        confidence: 'medium',
        reason: 'Message contains AI-like language patterns'
      }
    }
  }
  
  // Low confidence: If no clear signature, default to staff
  return {
    sender: 'staff',
    confidence: 'low',
    reason: 'No clear signature detected - defaulting to staff'
  }
}

// Run tests
console.log('🧪 Testing Sender Detection\n')
console.log('=' .repeat(80))

let passed = 0
let failed = 0

for (const testCase of testCases) {
  const result = detectSender(testCase.message)
  const success = result.sender === testCase.expectedSender && 
                  result.confidence === testCase.expectedConfidence
  
  if (success) {
    console.log(`✅ PASS: ${testCase.name}`)
    console.log(`   Detected: ${result.sender} (${result.confidence})`)
    console.log(`   Reason: ${result.reason}`)
    passed++
  } else {
    console.log(`❌ FAIL: ${testCase.name}`)
    console.log(`   Expected: ${testCase.expectedSender} (${testCase.expectedConfidence})`)
    console.log(`   Got: ${result.sender} (${result.confidence})`)
    console.log(`   Reason: ${result.reason}`)
    console.log(`   Message: "${testCase.message}"`)
    failed++
  }
  console.log('')
}

console.log('=' .repeat(80))
console.log(`\n📊 Results: ${passed} passed, ${failed} failed`)

if (failed === 0) {
  console.log('\n✨ All tests passed! Sender detection is working correctly.')
  process.exit(0)
} else {
  console.log('\n⚠️  Some tests failed. Please review the sender detection logic.')
  process.exit(1)
}
