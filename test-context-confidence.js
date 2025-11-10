/**
 * Test Context Confidence Checker
 * Tests that AI recognizes when messages don't make sense in context
 */

// Simulate the quick context check
function quickContextCheck(message, recentMessages) {
  const lowerMessage = message.toLowerCase()
  
  // Patterns that suggest message is NOT for AI
  const notForAIPatterns = [
    // Referring to physical person
    /for (the )?(tall|short|big|small|young|old)?\s*(guy|man|gentleman|person|bloke|lad|chap)/i,
    /with (the )?(beard|glasses|tattoo|hat)/i,
    
    // Vague/unclear messages
    /^(it's|its|this is|that's|thats)\s+for\s+/i,
    /^(tell|give|pass|show)\s+(him|her|them|john)/i,
    
    // Messages that need context we don't have
    /^(yes|yeah|yep|yup|no|nope|nah)[\s.!]*$/i,
    /^(ok|okay|alright|sure|fine)[\s.!]*$/i,
    
    // Continuing previous conversation we're not part of
    /^(and|also|plus|but|so|then)/i,
  ]
  
  for (const pattern of notForAIPatterns) {
    if (pattern.test(message)) {
      return {
        shouldRespond: false,
        confidence: 0.8,
        reasoning: 'Message appears to be directed at someone else or lacks context',
        isDirectedAtAI: false,
        contextMakesSense: false,
        wouldBeHelpful: false
      }
    }
  }
  
  // Check if message is very short and vague
  const words = message.trim().split(/\s+/)
  if (words.length <= 3 && !message.includes('?')) {
    return {
      shouldRespond: false,
      confidence: 0.7,
      reasoning: 'Message too short and vague to respond confidently',
      isDirectedAtAI: false,
      contextMakesSense: false,
      wouldBeHelpful: false
    }
  }
  
  // Default: probably OK to respond
  return {
    shouldRespond: true,
    confidence: 0.6,
    reasoning: 'No obvious issues detected',
    isDirectedAtAI: true,
    contextMakesSense: true,
    wouldBeHelpful: true
  }
}

console.log('\n=== Testing Context Confidence Checker ===\n')

const testCases = [
  // Messages that should NOT get AI response
  {
    message: "It's for the tall gentleman with the beard",
    expected: { shouldRespond: false, reason: 'Referring to physical person' },
    description: 'Customer referring to John physically'
  },
  {
    message: "For the guy with the beard",
    expected: { shouldRespond: false, reason: 'Referring to physical person' },
    description: 'Referring to person with beard'
  },
  {
    message: "Tell John I'll be there soon",
    expected: { shouldRespond: false, reason: 'Message for John' },
    description: 'Message directed at John'
  },
  {
    message: "Pass it to him please",
    expected: { shouldRespond: false, reason: 'Vague reference' },
    description: 'Vague pronoun reference'
  },
  {
    message: "Yes",
    expected: { shouldRespond: false, reason: 'Too vague' },
    description: 'Single word - too vague'
  },
  {
    message: "Ok",
    expected: { shouldRespond: false, reason: 'Too vague' },
    description: 'Acknowledgment only'
  },
  {
    message: "And the screen too",
    expected: { shouldRespond: false, reason: 'Continuing conversation' },
    description: 'Continuing previous topic'
  },
  
  // Messages that SHOULD get AI response
  {
    message: "When are you open?",
    expected: { shouldRespond: true, reason: 'Clear question' },
    description: 'Clear question about hours'
  },
  {
    message: "How much for iPhone 14 screen repair?",
    expected: { shouldRespond: true, reason: 'Clear repair inquiry' },
    description: 'Specific repair question'
  },
  {
    message: "Is my phone ready yet?",
    expected: { shouldRespond: true, reason: 'Status check' },
    description: 'Status inquiry'
  },
  {
    message: "Do you fix Samsung phones?",
    expected: { shouldRespond: true, reason: 'Service inquiry' },
    description: 'Service capability question'
  },
]

let passed = 0
let failed = 0

for (const testCase of testCases) {
  const result = quickContextCheck(testCase.message, [])
  
  const responseMatch = result.shouldRespond === testCase.expected.shouldRespond
  
  const status = responseMatch ? '✅' : '❌'
  
  if (responseMatch) {
    passed++
  } else {
    failed++
  }
  
  console.log(`${status} "${testCase.message}"`)
  console.log(`   ${testCase.description}`)
  console.log(`   Expected: ${testCase.expected.shouldRespond ? 'RESPOND' : 'STAY SILENT'}`)
  console.log(`   Got: ${result.shouldRespond ? 'RESPOND' : 'STAY SILENT'}`)
  console.log(`   Reasoning: ${result.reasoning}`)
  if (!responseMatch) {
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
  console.log('- "For the tall guy with beard" → STAY SILENT')
  console.log('- "Tell John..." → STAY SILENT')
  console.log('- "Yes" / "Ok" → STAY SILENT (too vague)')
  console.log('- "When are you open?" → RESPOND (clear question)')
  console.log('- "How much for repair?" → RESPOND (clear inquiry)')
} else {
  console.log(`\n⚠️  ${failed} test(s) failed`)
}

console.log('\n=== AI Enhancement ===')
console.log('With AI (GPT-4o-mini):')
console.log('- Better context understanding')
console.log('- Detects subtle misdirection')
console.log('- Understands conversation flow')
console.log('- Costs ~$0.0001 per check')
console.log('\nFallback to regex if AI fails or low confidence')
