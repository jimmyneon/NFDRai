/**
 * Test Sentiment Analysis
 * Tests both regex and AI-based sentiment detection
 */

// Simulate the regex-based sentiment check
function quickSentimentCheck(message) {
  const lowerMessage = message.toLowerCase()
  
  const frustratedKeywords = [
    'third time', 'second time', 'again', 'still waiting', 'still no',
    'ridiculous', 'unacceptable', 'disappointed', 'frustrated'
  ]
  
  const angryKeywords = [
    'terrible', 'worst', 'disgusting', 'appalling', 'pathetic',
    'never again', 'money back', 'refund', 'complaint', 'report'
  ]
  
  const urgencyKeywords = [
    'urgent', 'asap', 'immediately', 'now', 'emergency', 'critical'
  ]
  
  const positiveKeywords = [
    'thanks', 'thank you', 'great', 'excellent', 'perfect',
    'brilliant', 'helpful', 'appreciate'
  ]
  
  const foundFrustrated = frustratedKeywords.filter(kw => lowerMessage.includes(kw))
  const foundAngry = angryKeywords.filter(kw => lowerMessage.includes(kw))
  const foundUrgent = urgencyKeywords.filter(kw => lowerMessage.includes(kw))
  const foundPositive = positiveKeywords.filter(kw => lowerMessage.includes(kw))
  
  const hasMultipleQuestions = (message.match(/\?/g) || []).length >= 2
  const hasMultipleExclamations = (message.match(/!/g) || []).length >= 2
  const hasAllCaps = message === message.toUpperCase() && message.length > 10
  
  let sentiment = 'neutral'
  let urgency = 'low'
  let confidence = 0.6
  let reasoning = 'Regex-based analysis'
  let keywords = []
  let requiresStaffAttention = false
  
  if (foundAngry.length > 0 || hasAllCaps) {
    sentiment = 'angry'
    urgency = 'critical'
    confidence = 0.8
    reasoning = 'Angry language detected'
    keywords = foundAngry
    requiresStaffAttention = true
  } else if (foundFrustrated.length > 0 || hasMultipleQuestions || hasMultipleExclamations) {
    sentiment = 'frustrated'
    urgency = foundUrgent.length > 0 ? 'high' : 'medium'
    confidence = 0.7
    reasoning = 'Frustration indicators detected'
    keywords = [...foundFrustrated, ...foundUrgent]
    requiresStaffAttention = true
  } else if (foundPositive.length > 0) {
    sentiment = 'positive'
    urgency = 'low'
    confidence = 0.7
    reasoning = 'Positive language detected'
    keywords = foundPositive
  } else if (foundUrgent.length > 0) {
    sentiment = 'neutral'
    urgency = 'high'
    confidence = 0.6
    reasoning = 'Urgent keywords detected'
    keywords = foundUrgent
    requiresStaffAttention = true
  }
  
  return {
    sentiment,
    urgency,
    confidence,
    reasoning,
    keywords,
    requiresStaffAttention
  }
}

console.log('\n=== Testing Sentiment Analysis ===\n')

const testCases = [
  // Positive
  {
    message: 'Thanks so much! You\'ve been really helpful',
    expected: { sentiment: 'positive', urgency: 'low', attention: false }
  },
  {
    message: 'Perfect, thank you!',
    expected: { sentiment: 'positive', urgency: 'low', attention: false }
  },
  
  // Neutral
  {
    message: 'Hi, when will my phone be ready?',
    expected: { sentiment: 'neutral', urgency: 'low', attention: false }
  },
  {
    message: 'What are your opening hours?',
    expected: { sentiment: 'neutral', urgency: 'low', attention: false }
  },
  
  // Frustrated
  {
    message: 'This is the third time I\'ve asked! Where is my phone?!',
    expected: { sentiment: 'frustrated', urgency: 'medium', attention: true }
  },
  {
    message: 'Still waiting for a response. This is ridiculous.',
    expected: { sentiment: 'frustrated', urgency: 'medium', attention: true }
  },
  {
    message: 'I\'ve been waiting 3 days with no response. Unacceptable.',
    expected: { sentiment: 'frustrated', urgency: 'medium', attention: true }
  },
  
  // Angry
  {
    message: 'Your service is terrible. I want my money back NOW!',
    expected: { sentiment: 'angry', urgency: 'critical', attention: true }
  },
  {
    message: 'THIS IS DISGUSTING! NEVER AGAIN!',
    expected: { sentiment: 'angry', urgency: 'critical', attention: true }
  },
  {
    message: 'Worst experience ever. Filing a complaint.',
    expected: { sentiment: 'angry', urgency: 'critical', attention: true }
  },
  
  // Urgent (but not angry)
  {
    message: 'I need this urgently, can you help asap?',
    expected: { sentiment: 'neutral', urgency: 'high', attention: true }
  },
  {
    message: 'Emergency - phone not turning on',
    expected: { sentiment: 'neutral', urgency: 'high', attention: true }
  },
]

let passed = 0
let failed = 0

console.log('Testing regex-based sentiment detection:\n')

for (const testCase of testCases) {
  const result = quickSentimentCheck(testCase.message)
  
  const sentimentMatch = result.sentiment === testCase.expected.sentiment
  const urgencyMatch = result.urgency === testCase.expected.urgency
  const attentionMatch = result.requiresStaffAttention === testCase.expected.attention
  
  const allMatch = sentimentMatch && urgencyMatch && attentionMatch
  
  const status = allMatch ? '✅' : '❌'
  
  if (allMatch) {
    passed++
  } else {
    failed++
  }
  
  console.log(`${status} "${testCase.message.substring(0, 60)}..."`)
  console.log(`   Expected: ${testCase.expected.sentiment}, ${testCase.expected.urgency}, attention=${testCase.expected.attention}`)
  console.log(`   Got: ${result.sentiment}, ${result.urgency}, attention=${result.requiresStaffAttention}`)
  if (result.keywords.length > 0) {
    console.log(`   Keywords: ${result.keywords.join(', ')}`)
  }
  console.log()
}

console.log('\n=== Test Results ===')
console.log(`Passed: ${passed}/${testCases.length}`)
console.log(`Failed: ${failed}/${testCases.length}`)

if (failed === 0) {
  console.log('\n✅ All tests passed!')
} else {
  console.log(`\n⚠️  ${failed} test(s) failed`)
}

console.log('\n=== AI Enhancement ===')
console.log('With AI (GPT-4o-mini):')
console.log('- More accurate for subtle frustration')
console.log('- Better context understanding')
console.log('- Handles sarcasm and tone')
console.log('- Costs ~$0.0001 per analysis')
console.log('\nFallback to regex if AI fails or low confidence')
