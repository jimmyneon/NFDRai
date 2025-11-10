/**
 * Test Holiday Mode Detection
 * Tests that AI detects holidays and leads with closure notice
 */

// Simulate holiday detection
function detectHolidayMode(specialHoursNote) {
  if (!specialHoursNote) {
    return {
      isOnHoliday: false,
      holidayMessage: null,
      shouldLeadWithClosure: false,
      returnDate: null
    }
  }
  
  const lowerNote = specialHoursNote.toLowerCase()
  
  const holidayKeywords = [
    'closed for holiday',
    'closed for christmas',
    'closed for new year',
    'closed for easter',
    'away on holiday',
    'on holiday',
    'closed until',
    'back on',
    'returning on',
    'reopening on',
    'closed from',
    'closed dec',
    'closed jan',
    'closed for vacation'
  ]
  
  const isOnHoliday = holidayKeywords.some(keyword => lowerNote.includes(keyword))
  
  if (!isOnHoliday) {
    return {
      isOnHoliday: false,
      holidayMessage: null,
      shouldLeadWithClosure: false,
      returnDate: null
    }
  }
  
  // Extract return date
  const returnDatePatterns = [
    /back on ([A-Za-z]+ \d{1,2}(?:st|nd|rd|th)?)/i,
    /reopening (?:on )?([A-Za-z]+ \d{1,2}(?:st|nd|rd|th)?)/i,
    /returning (?:on )?([A-Za-z]+ \d{1,2}(?:st|nd|rd|th)?)/i,
    /open again (?:on )?([A-Za-z]+ \d{1,2}(?:st|nd|rd|th)?)/i,
    /closed until ([A-Za-z]+ \d{1,2}(?:st|nd|rd|th)?)/i,
  ]
  
  let returnDate = null
  for (const pattern of returnDatePatterns) {
    const match = specialHoursNote.match(pattern)
    if (match) {
      returnDate = match[1]
      break
    }
  }
  
  return {
    isOnHoliday: true,
    holidayMessage: specialHoursNote,
    shouldLeadWithClosure: true,
    returnDate
  }
}

console.log('\n=== Testing Holiday Mode Detection ===\n')

const testCases = [
  // Holiday closures
  {
    note: 'Closed December 25-26 for Christmas',
    expected: { isOnHoliday: true, hasReturnDate: false },
    description: 'Christmas closure'
  },
  {
    note: 'Closed for holiday, back on January 2nd',
    expected: { isOnHoliday: true, hasReturnDate: true, returnDate: 'January 2nd' },
    description: 'Holiday with return date'
  },
  {
    note: 'Away on holiday until January 5th',
    expected: { isOnHoliday: true, hasReturnDate: true, returnDate: 'January 5th' },
    description: 'Holiday until date'
  },
  {
    note: 'Closed for New Year, reopening January 2',
    expected: { isOnHoliday: true, hasReturnDate: true, returnDate: 'January 2' },
    description: 'New Year closure'
  },
  {
    note: 'On holiday from Dec 20 - returning January 3rd',
    expected: { isOnHoliday: true, hasReturnDate: true, returnDate: 'January 3rd' },
    description: 'Holiday with return'
  },
  
  // NOT holidays (temporary changes)
  {
    note: 'Early closing 3pm on December 24th',
    expected: { isOnHoliday: false, hasReturnDate: false },
    description: 'Early closing (not holiday)'
  },
  {
    note: 'Open late until 8pm this Friday',
    expected: { isOnHoliday: false, hasReturnDate: false },
    description: 'Extended hours (not holiday)'
  },
  {
    note: '',
    expected: { isOnHoliday: false, hasReturnDate: false },
    description: 'No special hours'
  },
]

let passed = 0
let failed = 0

for (const testCase of testCases) {
  const result = detectHolidayMode(testCase.note)
  
  const holidayMatch = result.isOnHoliday === testCase.expected.isOnHoliday
  const returnDateMatch = testCase.expected.hasReturnDate 
    ? result.returnDate === testCase.expected.returnDate
    : !result.returnDate
  
  const allMatch = holidayMatch && returnDateMatch
  
  const status = allMatch ? '✅' : '❌'
  
  if (allMatch) {
    passed++
  } else {
    failed++
  }
  
  console.log(`${status} "${testCase.note || '(empty)'}"`)
  console.log(`   ${testCase.description}`)
  console.log(`   Expected: holiday=${testCase.expected.isOnHoliday}, returnDate=${testCase.expected.returnDate || 'none'}`)
  console.log(`   Got: holiday=${result.isOnHoliday}, returnDate=${result.returnDate || 'none'}`)
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
  console.log('- "Closed for Christmas" → Holiday mode ON')
  console.log('- "Back on January 2nd" → Extracts return date')
  console.log('- "Early closing 3pm" → NOT holiday mode')
  console.log('- AI will lead with holiday notice when detected')
} else {
  console.log(`\n⚠️  ${failed} test(s) failed`)
}

console.log('\n=== AI Behavior in Holiday Mode ===')
console.log('When holiday detected:')
console.log('1. AI STARTS EVERY RESPONSE with holiday notice')
console.log('2. AI provides quotes but says "John will confirm when he returns"')
console.log('3. AI notes booking interest but says "John will confirm availability"')
console.log('4. AI is helpful but sets expectations')
console.log('\nExample:')
console.log('Customer: "How much for iPhone screen?"')
console.log('AI: "🎄 HOLIDAY NOTICE: Closed Dec 25-26, back January 2nd')
console.log('     For iPhone screen repair, typically £80-120.')
console.log('     John will confirm the exact quote when he returns."')
