/**
 * Test AI Frustration Detection
 * Tests that "AI failure" and similar messages are detected and handled correctly
 */

// Test sentiment detection
function quickSentimentCheck(message) {
  const lowerMessage = message.toLowerCase()
  
  const frustratedKeywords = [
    'third time', 'second time', 'again', 'still waiting', 'still no',
    'ridiculous', 'unacceptable', 'disappointed', 'frustrated',
    'ai failure', 'ai fail', 'not helping', 'useless', 'doesn\'t understand',
    'not working', 'this isn\'t working'
  ]
  
  const foundFrustrated = frustratedKeywords.filter(kw => lowerMessage.includes(kw))
  
  if (foundFrustrated.length > 0) {
    return {
      sentiment: 'frustrated',
      urgency: 'medium',
      confidence: 0.7,
      keywords: foundFrustrated,
      requiresStaffAttention: true
    }
  }
  
  return {
    sentiment: 'neutral',
    urgency: 'low',
    confidence: 0.6,
    requiresStaffAttention: false
  }
}

// Test conversation mode analyzer
function shouldSwitchToAutoMode(message) {
  const lowerMessage = message.toLowerCase().trim()
  
  const manualPatterns = [
    // Frustrated with AI - wants human
    /ai\s+(failure|fail|useless|stupid|not\s+working|doesn't\s+understand)/i,
    /(this|you|it)(\s+\w+)?\s+(is|are|isn't|isnt|not)\s+(useless|stupid|terrible|rubbish)/i,
    /speak\s+to\s+(a\s+)?(human|person|someone|john|staff|owner)/i,
    /talk\s+to\s+(a\s+)?(human|person|someone|john|staff|owner)/i,
    /get\s+me\s+(a\s+)?(human|person|someone|john|staff|owner)/i,
    /real\s+person/i,
    /actual\s+person/i,
    /not\s+helping/i,
    /this\s+(isn't|isnt|is\s+not)\s+working/i,
  ]
  
  for (const pattern of manualPatterns) {
    if (pattern.test(lowerMessage)) {
      return false // Stay in manual mode
    }
  }
  
  return true // Can switch to auto
}

console.log('\n=== Testing AI Frustration Detection ===\n')

const testCases = [
  // AI frustration messages - should detect and stay manual
  {
    message: 'AI failure 😣',
    expectedSentiment: 'frustrated',
    expectedAttention: true,
    expectedMode: 'manual',
    description: 'Customer frustrated with AI'
  },
  {
    message: 'This AI is useless',
    expectedSentiment: 'frustrated',
    expectedAttention: true,
    expectedMode: 'manual',
    description: 'Customer says AI is useless'
  },
  {
    message: 'Not helping at all',
    expectedSentiment: 'frustrated',
    expectedAttention: true,
    expectedMode: 'manual',
    description: 'Customer says AI not helping'
  },
  {
    message: 'Can I speak to a real person?',
    expectedSentiment: 'neutral',
    expectedAttention: false,
    expectedMode: 'manual',
    description: 'Customer wants human'
  },
  {
    message: 'Get me John please',
    expectedSentiment: 'neutral',
    expectedAttention: false,
    expectedMode: 'manual',
    description: 'Customer asks for John'
  },
  
  // Normal messages - should allow auto mode
  {
    message: 'When are you open?',
    expectedSentiment: 'neutral',
    expectedAttention: false,
    expectedMode: 'auto',
    description: 'Simple question'
  },
  {
    message: 'How much for iPhone screen?',
    expectedSentiment: 'neutral',
    expectedAttention: false,
    expectedMode: 'auto',
    description: 'Pricing question'
  },
]

let passed = 0
let failed = 0

for (const testCase of testCases) {
  const sentiment = quickSentimentCheck(testCase.message)
  const shouldAuto = shouldSwitchToAutoMode(testCase.message)
  const mode = shouldAuto ? 'auto' : 'manual'
  
  const sentimentMatch = sentiment.sentiment === testCase.expectedSentiment
  const attentionMatch = sentiment.requiresStaffAttention === testCase.expectedAttention
  const modeMatch = mode === testCase.expectedMode
  
  const allMatch = sentimentMatch && attentionMatch && modeMatch
  
  const status = allMatch ? '✅' : '❌'
  
  if (allMatch) {
    passed++
  } else {
    failed++
  }
  
  console.log(`${status} "${testCase.message}"`)
  console.log(`   ${testCase.description}`)
  console.log(`   Expected: ${testCase.expectedSentiment}, attention=${testCase.expectedAttention}, mode=${testCase.expectedMode}`)
  console.log(`   Got: ${sentiment.sentiment}, attention=${sentiment.requiresStaffAttention}, mode=${mode}`)
  if (sentiment.keywords && sentiment.keywords.length > 0) {
    console.log(`   Keywords: ${sentiment.keywords.join(', ')}`)
  }
  if (!allMatch) {
    console.log(`   ⚠️  MISMATCH!`)
  }
  console.log()
}

console.log('\n=== Test Results ===')
console.log(`Passed: ${passed}/${testCases.length}`)
console.log(`Failed: ${failed}/${testCases.length}`)

if (failed === 0) {
  console.log('\n✅ All tests passed!')
  console.log('\nBehavior:')
  console.log('- "AI failure" → Detected as frustrated, stays in manual mode')
  console.log('- "Not helping" → Detected as frustrated, stays in manual mode')
  console.log('- "Speak to a person" → Stays in manual mode')
  console.log('- Normal questions → Can use auto mode')
} else {
  console.log(`\n⚠️  ${failed} test(s) failed`)
}
