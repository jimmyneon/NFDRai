/**
 * Test Holiday Mode Date Checking
 * Tests that holiday mode only activates on actual holiday dates
 */

// Simulate date extraction
function extractDateRange(message) {
  const currentYear = new Date().getFullYear()
  const nextYear = currentYear + 1
  
  const months = {
    'jan': 0, 'january': 0,
    'feb': 1, 'february': 1,
    'mar': 2, 'march': 2,
    'apr': 3, 'april': 3,
    'may': 4,
    'jun': 5, 'june': 5,
    'jul': 6, 'july': 6,
    'aug': 7, 'august': 7,
    'sep': 8, 'sept': 8, 'september': 8,
    'oct': 9, 'october': 9,
    'nov': 10, 'november': 10,
    'dec': 11, 'december': 11
  }
  
  const lowerMessage = message.toLowerCase()
  
  // Pattern 1: "December 25-26"
  const pattern1 = /(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\s+(\d{1,2})\s*-\s*(\d{1,2})/i
  const match1 = lowerMessage.match(pattern1)
  
  if (match1) {
    const month = months[match1[1].toLowerCase()]
    const startDay = parseInt(match1[2])
    const endDay = parseInt(match1[3])
    
    const today = new Date()
    let year = currentYear
    if (month < today.getMonth() || (month === today.getMonth() && startDay < today.getDate())) {
      year = nextYear
    }
    
    return {
      startDate: new Date(year, month, startDay),
      endDate: new Date(year, month, endDay)
    }
  }
  
  // Pattern 2: "December 23 - January 2"
  const pattern2 = /(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\s+(\d{1,2})\s*-\s*(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\s+(\d{1,2})/i
  const match2 = lowerMessage.match(pattern2)
  
  if (match2) {
    const startMonth = months[match2[1].toLowerCase()]
    const startDay = parseInt(match2[2])
    const endMonth = months[match2[3].toLowerCase()]
    const endDay = parseInt(match2[4])
    
    const today = new Date()
    let startYear = currentYear
    let endYear = currentYear
    
    if (startMonth < today.getMonth() || (startMonth === today.getMonth() && startDay < today.getDate())) {
      startYear = nextYear
      endYear = nextYear
    }
    
    if (endMonth < startMonth) {
      endYear = startYear + 1
    }
    
    return {
      startDate: new Date(startYear, startMonth, startDay),
      endDate: new Date(endYear, endMonth, endDay)
    }
  }
  
  return { startDate: null, endDate: null }
}

console.log('\n=== Testing Holiday Date Checking ===\n')
console.log('Today:', new Date().toDateString())
console.log()

const testCases = [
  {
    note: 'Closed December 25-26 for Christmas',
    description: 'Christmas dates (should only activate on Dec 25-26)'
  },
  {
    note: 'Closed December 23 - January 2 for holiday',
    description: 'Holiday spanning months (should activate Dec 23 - Jan 2)'
  },
  {
    note: 'Closed for New Year, back on January 2',
    description: 'No specific dates (activates immediately - old behavior)'
  },
]

for (const testCase of testCases) {
  console.log(`📝 "${testCase.note}"`)
  console.log(`   ${testCase.description}`)
  
  const dateRange = extractDateRange(testCase.note)
  
  if (dateRange.startDate && dateRange.endDate) {
    console.log(`   Start: ${dateRange.startDate.toDateString()}`)
    console.log(`   End: ${dateRange.endDate.toDateString()}`)
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const isActive = today >= dateRange.startDate && today <= dateRange.endDate
    
    console.log(`   Active today? ${isActive ? '✅ YES' : '❌ NO'}`)
  } else {
    console.log(`   No dates found - would activate immediately`)
  }
  console.log()
}

console.log('\n=== Supported Date Formats ===')
console.log('✅ "December 25-26" → Dec 25-26 of current/next year')
console.log('✅ "Dec 25-26" → Same as above')
console.log('✅ "December 23 - January 2" → Spans months')
console.log('✅ "Closed until January 5" → From today until Jan 5')
console.log('❌ "Closed for Christmas" → No dates, activates immediately')
console.log()
console.log('💡 TIP: Always include specific dates for automatic activation!')
console.log('   Example: "Closed December 25-26 for Christmas"')
