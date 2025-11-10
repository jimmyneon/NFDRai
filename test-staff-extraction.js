/**
 * Test staff message information extraction
 * Tests with real-world message examples
 */

// Inline the extraction logic for testing
function extractCustomerName(message) {
  const patterns = [
    /(?:hi|hello|hey)\s+([A-Z][a-z]+)/i,
    /^([A-Z][a-z]+),/,
    /for\s+([A-Z][a-z]+)(?:\s|,|\.)/i,
  ]
  
  for (const pattern of patterns) {
    const match = message.match(pattern)
    if (match && match[1]) {
      const name = match[1]
      const excludeWords = ['the', 'your', 'this', 'that', 'device', 'phone', 'repair']
      if (!excludeWords.includes(name.toLowerCase())) {
        return name
      }
    }
  }
  
  return undefined
}

function extractDeviceInfo(message) {
  const lowerMessage = message.toLowerCase()
  let deviceType, deviceModel, deviceIssue
  
  if (/iphone/i.test(message)) {
    deviceType = 'iPhone'
    const modelMatch = message.match(/iphone\s*(1[0-5]|[6-9]|x[rs]?|se|pro\s*max|plus|mini)/i)
    if (modelMatch) deviceModel = `iPhone ${modelMatch[1]}`
  } else if (/ipad/i.test(message)) {
    deviceType = 'iPad'
  } else if (/samsung|galaxy/i.test(message)) {
    deviceType = 'Samsung'
    const modelMatch = message.match(/galaxy\s*([san]\d+|s\d+)/i)
    if (modelMatch) deviceModel = `Galaxy ${modelMatch[1]}`
  }
  
  if (/screen/i.test(lowerMessage)) {
    if (/crack|smash|shatter|broken screen/i.test(lowerMessage)) {
      deviceIssue = 'cracked screen'
    } else {
      deviceIssue = 'screen repair'
    }
  } else if (/battery/i.test(lowerMessage)) {
    deviceIssue = 'battery replacement'
  }
  
  return { deviceType, deviceModel, deviceIssue }
}

function extractPricing(message) {
  const pricePatterns = [
    /£(\d+(?:\.\d{2})?)/g,
    /(\d+(?:\.\d{2})?)\s*(?:pounds?|quid)/gi,
  ]
  
  const prices = []
  
  for (const pattern of pricePatterns) {
    let match
    while ((match = pattern.exec(message)) !== null) {
      const price = parseFloat(match[1])
      if (price > 0 && price < 10000) {
        prices.push(price)
      }
    }
  }
  
  if (prices.length === 0) return {}
  if (prices.length === 1) return { priceQuoted: prices[0] }
  return { priceQuoted: prices[0], priceFinal: prices[prices.length - 1] }
}

function extractRepairStatus(message) {
  const lowerMessage = message.toLowerCase()
  
  if (/(?:is\s+)?(?:all\s+)?(?:ready|done|finished|complete|fixed)/i.test(lowerMessage) &&
      /(?:pick\s*up|collect|ready)/i.test(lowerMessage)) {
    return { repairStatus: 'ready', messageType: 'ready_notification' }
  }
  
  if (/(?:could\s*n[o']t|can\s*n[o']t|unable\s+to)\s+(?:fix|repair)/i.test(lowerMessage)) {
    return { repairStatus: 'not_fixed', messageType: 'not_fixed' }
  }
  
  if (/(?:quote|cost|price|charge|be)\s+(?:is|would\s+be|will\s+be)?.*£/i.test(message) ||
      /£.*(?:for|to\s+(?:fix|repair))/i.test(message)) {
    return { repairStatus: 'quoted', messageType: 'quote' }
  }
  
  if (/(?:waiting|awaiting|ordered)\s+(?:for\s+)?(?:the\s+)?part/i.test(lowerMessage) ||
      /part.*(?:on\s+order|coming|arrive)/i.test(lowerMessage) ||
      (/(?:on\s+order|ordered|coming)/i.test(lowerMessage) && /part/i.test(lowerMessage))) {
    return { repairStatus: 'awaiting_parts', messageType: 'update' }
  }
  
  if (/(?:working\s+on|repairing|fixing)/i.test(lowerMessage)) {
    return { repairStatus: 'in_progress', messageType: 'update' }
  }
  
  return { messageType: 'other' }
}

function extractStaffMessageInfo(message) {
  const customerName = extractCustomerName(message)
  const deviceInfo = extractDeviceInfo(message)
  const pricing = extractPricing(message)
  const statusInfo = extractRepairStatus(message)
  
  let fieldsExtracted = 0
  let totalFields = 6
  
  if (customerName) fieldsExtracted++
  if (deviceInfo.deviceType) fieldsExtracted++
  if (deviceInfo.deviceModel) fieldsExtracted++
  if (deviceInfo.deviceIssue) fieldsExtracted++
  if (pricing.priceQuoted || pricing.priceFinal) fieldsExtracted++
  if (statusInfo.repairStatus) fieldsExtracted++
  
  let confidence = fieldsExtracted / totalFields
  
  if (statusInfo.repairStatus && (deviceInfo.deviceType || customerName)) {
    confidence = Math.min(1.0, confidence + 0.2)
  }
  
  return {
    customerName,
    ...deviceInfo,
    ...pricing,
    ...statusInfo,
    extractionConfidence: Math.round(confidence * 100) / 100,
  }
}

console.log('\n=== Testing Staff Message Extraction ===\n')

// Real-world test cases
const testCases = [
  {
    name: 'Ready notification with price',
    message: 'Hi Carol, your iPhone 14 screen replacement is all done and ready to collect. That\'s £149.99. Many thanks, John',
    expected: {
      customerName: 'Carol',
      deviceType: 'iPhone',
      deviceModel: 'iPhone 14',
      deviceIssue: 'screen repair',
      repairStatus: 'ready',
      messageType: 'ready_notification',
      priceQuoted: 149.99,
    }
  },
  {
    name: 'Quote message',
    message: 'Hi Sarah, the Samsung Galaxy S23 screen would be £199 to fix. Let me know if you want to go ahead. Thanks, John',
    expected: {
      customerName: 'Sarah',
      deviceType: 'Samsung',
      deviceModel: 'Galaxy S23',
      deviceIssue: 'screen repair',
      repairStatus: 'quoted',
      messageType: 'quote',
      priceQuoted: 199,
    }
  },
  {
    name: 'Not fixed message',
    message: 'Hi Mike, unfortunately we couldn\'t fix your iPhone as the motherboard is damaged. Sorry about that. John',
    expected: {
      customerName: 'Mike',
      deviceType: 'iPhone',
      repairStatus: 'not_fixed',
      messageType: 'not_fixed',
    }
  },
  {
    name: 'Awaiting parts',
    message: 'Hi Emma, your iPad screen part is on order, should be here tomorrow. Will let you know when it arrives. John',
    expected: {
      customerName: 'Emma',
      deviceType: 'iPad',
      deviceIssue: 'screen repair',
      repairStatus: 'awaiting_parts',
      messageType: 'update',
    }
  },
  {
    name: 'Simple ready notification',
    message: 'Hi Tom, all done and ready for pickup! £89.99. John',
    expected: {
      customerName: 'Tom',
      repairStatus: 'ready',
      messageType: 'ready_notification',
      priceQuoted: 89.99,
    }
  },
  {
    name: 'Battery replacement quote',
    message: 'Hi Lisa, iPhone 13 battery replacement would be £69.99, takes about an hour. Let me know. John',
    expected: {
      customerName: 'Lisa',
      deviceType: 'iPhone',
      deviceModel: 'iPhone 13',
      deviceIssue: 'battery replacement',
      repairStatus: 'quoted',
      messageType: 'quote',
      priceQuoted: 69.99,
    }
  },
]

let passed = 0
let failed = 0

for (const testCase of testCases) {
  console.log(`\n📝 ${testCase.name}`)
  console.log(`Message: "${testCase.message.substring(0, 80)}..."`)
  
  const extracted = extractStaffMessageInfo(testCase.message)
  
  console.log('\nExtracted:')
  console.log(`  Customer: ${extracted.customerName || 'none'}`)
  console.log(`  Device: ${extracted.deviceType || 'none'} ${extracted.deviceModel || ''}`)
  console.log(`  Issue: ${extracted.deviceIssue || 'none'}`)
  console.log(`  Status: ${extracted.repairStatus || 'none'}`)
  console.log(`  Type: ${extracted.messageType || 'none'}`)
  console.log(`  Price: £${extracted.priceQuoted || 'none'}`)
  console.log(`  Confidence: ${(extracted.extractionConfidence * 100).toFixed(0)}%`)
  
  // Check if key fields match
  let matches = 0
  let checks = 0
  
  if (testCase.expected.customerName) {
    checks++
    if (extracted.customerName === testCase.expected.customerName) matches++
    else console.log(`  ❌ Customer name mismatch: expected "${testCase.expected.customerName}", got "${extracted.customerName}"`)
  }
  
  if (testCase.expected.deviceType) {
    checks++
    if (extracted.deviceType === testCase.expected.deviceType) matches++
    else console.log(`  ❌ Device type mismatch: expected "${testCase.expected.deviceType}", got "${extracted.deviceType}"`)
  }
  
  if (testCase.expected.repairStatus) {
    checks++
    if (extracted.repairStatus === testCase.expected.repairStatus) matches++
    else console.log(`  ❌ Repair status mismatch: expected "${testCase.expected.repairStatus}", got "${extracted.repairStatus}"`)
  }
  
  if (testCase.expected.messageType) {
    checks++
    if (extracted.messageType === testCase.expected.messageType) matches++
    else console.log(`  ❌ Message type mismatch: expected "${testCase.expected.messageType}", got "${extracted.messageType}"`)
  }
  
  if (testCase.expected.priceQuoted) {
    checks++
    if (extracted.priceQuoted === testCase.expected.priceQuoted) matches++
    else console.log(`  ❌ Price mismatch: expected £${testCase.expected.priceQuoted}, got £${extracted.priceQuoted}`)
  }
  
  const testPassed = matches === checks && checks > 0
  
  if (testPassed) {
    console.log(`\n✅ PASS (${matches}/${checks} fields correct)`)
    passed++
  } else {
    console.log(`\n❌ FAIL (${matches}/${checks} fields correct)`)
    failed++
  }
}

console.log(`\n\n=== Test Results ===`)
console.log(`Passed: ${passed}/${testCases.length}`)
console.log(`Failed: ${failed}/${testCases.length}`)

if (failed === 0) {
  console.log('\n✅ All tests passed!\n')
  process.exit(0)
} else {
  console.log('\n❌ Some tests failed\n')
  process.exit(1)
}
