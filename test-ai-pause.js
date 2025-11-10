/**
 * Test AI pause behavior after staff messages
 * This tests the logic inline since the module is TypeScript
 */

// Inline implementation for testing
function isSimpleQuery(message) {
  const lowerMessage = message.toLowerCase().trim()
  
  // Hours queries
  const hoursPatterns = [
    /when\s+(are\s+you|do\s+you)\s+open/i,
    /what\s+time\s+(are\s+you|do\s+you)\s+(open|close)/i,
    /what\s+(are\s+your|are\s+the)\s+(hours|opening|times)/i,
    /opening\s+(hours|times)/i,
    /are\s+you\s+open/i,
    /what\s+time.*open/i,
    /when.*open/i,
    /open\s+(today|tomorrow|now)/i,
  ]
  
  for (const pattern of hoursPatterns) {
    if (pattern.test(lowerMessage)) {
      return { isSimpleQuery: true, queryType: 'hours', reason: 'Business hours query' }
    }
  }
  
  // Location queries
  const locationPatterns = [
    /where\s+(are\s+you|is\s+your\s+(shop|store|location))/i,
    /what.*address/i,
    /what.*location/i,
  ]
  
  for (const pattern of locationPatterns) {
    if (pattern.test(lowerMessage)) {
      return { isSimpleQuery: true, queryType: 'location', reason: 'Location/address query' }
    }
  }
  
  // Directions queries
  const directionsPatterns = [
    /how\s+do\s+i\s+get/i,
    /directions/i,
    /how\s+to\s+get\s+there/i,
  ]
  
  for (const pattern of directionsPatterns) {
    if (pattern.test(lowerMessage)) {
      return { isSimpleQuery: true, queryType: 'directions', reason: 'Directions query' }
    }
  }
  
  // Complex queries
  const complexPatterns = [
    /how\s+much/i,
    /price/i,
    /cost/i,
    /ready/i,
    /done/i,
    /finished/i,
    /can\s+you\s+(fix|repair)/i,
    /do\s+you\s+(fix|repair)/i,
    /broken/i,
    /cracked/i,
    /not\s+working/i,
  ]
  
  for (const pattern of complexPatterns) {
    if (pattern.test(lowerMessage)) {
      return { isSimpleQuery: false, reason: 'Complex query requiring context' }
    }
  }
  
  return { isSimpleQuery: false, reason: 'Not a recognized simple query' }
}

function isAcknowledgment(message) {
  const lowerMessage = message.toLowerCase().trim()
  
  // If message contains a question mark, it's NOT just an acknowledgment
  if (lowerMessage.includes('?')) {
    return false
  }
  
  // If message is longer than 50 characters, likely has additional content
  if (lowerMessage.length > 50) {
    return false
  }
  
  // If message contains question words, it's NOT just an acknowledgment
  const questionWords = ['how', 'what', 'when', 'where', 'why', 'which', 'who', 'much', 'many', 'owe']
  if (questionWords.some(word => lowerMessage.includes(word))) {
    return false
  }
  
  const acknowledgmentPatterns = [
    /^thanks?\s+(john|mate|boss|bro|buddy)[\s!.]*$/i,
    /^thank\s+you\s+(john|mate|boss|bro|buddy)[\s!.]*$/i,
    /^cheers?\s+(john|mate|boss|bro|buddy)[\s!.]*$/i,
    /^(ok|okay|alright|cool|nice|great|perfect|brilliant|lovely|sound|sounds good)[\s!.]*$/i,
    /^(thanks?|thank you|cheers?|ta)[\s!.]*$/i,
    /^(bye|goodbye|see ya|cya|later)[\s!.]*$/i,
    /^see\s+you\s+(soon|later|tomorrow|today)[\s!.]*$/i,
    /^on\s+my\s+way[\s!.]*$/i,
  ]
  
  return acknowledgmentPatterns.some(pattern => pattern.test(lowerMessage))
}

function shouldAIRespond(minutesSinceStaffMessage, message) {
  const PAUSE_DURATION_MINUTES = 30
  
  if (minutesSinceStaffMessage >= PAUSE_DURATION_MINUTES) {
    return {
      shouldRespond: true,
      reason: `Staff replied ${minutesSinceStaffMessage.toFixed(0)} minutes ago - resuming full AI mode`
    }
  }
  
  // Check for acknowledgments first
  if (isAcknowledgment(message)) {
    return {
      shouldRespond: false,
      reason: 'Customer acknowledgment - no AI response needed'
    }
  }
  
  const queryInfo = isSimpleQuery(message)
  
  if (queryInfo.isSimpleQuery) {
    return {
      shouldRespond: true,
      reason: `Simple ${queryInfo.queryType} query - AI can answer even during pause`,
      queryInfo
    }
  }
  
  const remainingMinutes = Math.ceil(PAUSE_DURATION_MINUTES - minutesSinceStaffMessage)
  return {
    shouldRespond: false,
    reason: `Staff replied ${minutesSinceStaffMessage.toFixed(0)} minutes ago - waiting for staff (${remainingMinutes} min remaining)`,
    queryInfo
  }
}

console.log('\n=== Testing AI Pause Logic ===\n')

// Test cases
const testCases = [
  // Simple queries (should respond even during pause)
  {
    message: 'When are you open?',
    minutesSinceStaff: 10,
    expectedRespond: true,
    expectedType: 'hours'
  },
  {
    message: 'What time do you close today?',
    minutesSinceStaff: 15,
    expectedRespond: true,
    expectedType: 'hours'
  },
  {
    message: 'Where are you located?',
    minutesSinceStaff: 20,
    expectedRespond: true,
    expectedType: 'location'
  },
  {
    message: 'How do I get there?',
    minutesSinceStaff: 5,
    expectedRespond: true,
    expectedType: 'directions'
  },
  {
    message: 'What\'s your address?',
    minutesSinceStaff: 25,
    expectedRespond: true,
    expectedType: 'location'
  },
  
  // Complex queries (should NOT respond during pause)
  {
    message: 'How much for iPhone screen?',
    minutesSinceStaff: 10,
    expectedRespond: false,
    expectedType: null
  },
  {
    message: 'Is my phone ready?',
    minutesSinceStaff: 15,
    expectedRespond: false,
    expectedType: null
  },
  {
    message: 'Can you fix my laptop?',
    minutesSinceStaff: 20,
    expectedRespond: false,
    expectedType: null
  },
  {
    message: 'My screen is cracked',
    minutesSinceStaff: 5,
    expectedRespond: false,
    expectedType: null
  },
  
  // After 30 minutes (should respond to everything)
  {
    message: 'How much for iPhone screen?',
    minutesSinceStaff: 35,
    expectedRespond: true,
    expectedType: null
  },
  {
    message: 'Is my phone ready?',
    minutesSinceStaff: 40,
    expectedRespond: true,
    expectedType: null
  },
  {
    message: 'Can you fix my laptop?',
    minutesSinceStaff: 45,
    expectedRespond: true,
    expectedType: null
  },
  
  // Acknowledgments (should NOT respond during pause)
  {
    message: 'Thanks John',
    minutesSinceStaff: 5,
    expectedRespond: false,
    expectedType: null
  },
  {
    message: 'Thank you John!',
    minutesSinceStaff: 10,
    expectedRespond: false,
    expectedType: null
  },
  {
    message: 'Cheers mate',
    minutesSinceStaff: 8,
    expectedRespond: false,
    expectedType: null
  },
  {
    message: 'Ok',
    minutesSinceStaff: 12,
    expectedRespond: false,
    expectedType: null
  },
  {
    message: 'Perfect',
    minutesSinceStaff: 7,
    expectedRespond: false,
    expectedType: null
  },
  {
    message: 'See you soon',
    minutesSinceStaff: 15,
    expectedRespond: false,
    expectedType: null
  },
  {
    message: 'On my way',
    minutesSinceStaff: 20,
    expectedRespond: false,
    expectedType: null
  },
  
  // Acknowledgment with question (should respond to the question)
  {
    message: 'Thanks John! When are you open tomorrow?',
    minutesSinceStaff: 10,
    expectedRespond: true,
    expectedType: 'hours'
  },
  
  // Real-world case: "Thank you John, I will collect during the week. How much do I owe you?"
  {
    message: 'Thank you John, I will collect during the week. How much do I owe you?',
    minutesSinceStaff: 5,
    expectedRespond: false, // Complex pricing question - wait for staff
    expectedType: null
  },
]

let passed = 0
let failed = 0

console.log('Testing simple query detection and AI pause logic:\n')

for (const testCase of testCases) {
  const queryInfo = isSimpleQuery(testCase.message)
  const decision = shouldAIRespond(testCase.minutesSinceStaff, testCase.message)
  
  const respondMatch = decision.shouldRespond === testCase.expectedRespond
  const typeMatch = !testCase.expectedType || queryInfo.queryType === testCase.expectedType
  
  const status = respondMatch && typeMatch ? '✅' : '❌'
  
  if (respondMatch && typeMatch) {
    passed++
  } else {
    failed++
  }
  
  console.log(`${status} [${testCase.minutesSinceStaff} min] "${testCase.message}"`)
  console.log(`   Expected: ${testCase.expectedRespond ? 'RESPOND' : 'PAUSE'}`)
  console.log(`   Actual: ${decision.shouldRespond ? 'RESPOND' : 'PAUSE'}`)
  console.log(`   Reason: ${decision.reason}`)
  
  if (!respondMatch) {
    console.log(`   ⚠️  Response decision mismatch!`)
  }
  if (!typeMatch) {
    console.log(`   ⚠️  Query type mismatch! Expected: ${testCase.expectedType}, Got: ${queryInfo.queryType}`)
  }
  console.log()
}

console.log(`\n=== Test Results ===`)
console.log(`Passed: ${passed}/${testCases.length}`)
console.log(`Failed: ${failed}/${testCases.length}`)

if (failed === 0) {
  console.log('\n✅ All tests passed!\n')
  process.exit(0)
} else {
  console.log('\n❌ Some tests failed\n')
  process.exit(1)
}
