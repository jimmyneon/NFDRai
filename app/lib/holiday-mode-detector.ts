/**
 * Holiday Mode Detector
 * Detects if business is on holiday/closed and adjusts AI behavior
 * NOW WITH DATE CHECKING - only activates on actual holiday dates!
 */

export interface HolidayStatus {
  isOnHoliday: boolean
  holidayMessage: string | null
  shouldLeadWithClosure: boolean
  returnDate: string | null
}

/**
 * Detect if business is currently on holiday based on special hours note
 * Checks if TODAY is within the holiday date range
 */
export function detectHolidayMode(specialHoursNote: string | null): HolidayStatus {
  if (!specialHoursNote) {
    return {
      isOnHoliday: false,
      holidayMessage: null,
      shouldLeadWithClosure: false,
      returnDate: null
    }
  }
  
  const lowerNote = specialHoursNote.toLowerCase()
  
  // Holiday/closure keywords
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
  
  // Check if any holiday keyword is present
  const hasHolidayKeyword = holidayKeywords.some(keyword => lowerNote.includes(keyword))
  
  if (!hasHolidayKeyword) {
    return {
      isOnHoliday: false,
      holidayMessage: null,
      shouldLeadWithClosure: false,
      returnDate: null
    }
  }
  
  // Extract dates from the message
  const dateRange = extractDateRange(specialHoursNote)
  
  // Check if TODAY is within the holiday date range
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Reset time to midnight for date comparison
  
  let isOnHoliday = false
  
  if (dateRange.startDate && dateRange.endDate) {
    // We have both start and end dates - check if today is in range
    isOnHoliday = today >= dateRange.startDate && today <= dateRange.endDate
    console.log('[Holiday Mode] Date range check:', {
      today: today.toDateString(),
      start: dateRange.startDate.toDateString(),
      end: dateRange.endDate.toDateString(),
      isOnHoliday
    })
  } else if (dateRange.startDate) {
    // Only start date - assume closed from that date onwards
    isOnHoliday = today >= dateRange.startDate
    console.log('[Holiday Mode] Start date only:', {
      today: today.toDateString(),
      start: dateRange.startDate.toDateString(),
      isOnHoliday
    })
  } else {
    // No dates found - activate immediately (old behavior)
    isOnHoliday = true
    console.log('[Holiday Mode] No dates found - activating immediately')
  }
  
  // Extract return date if mentioned
  const returnDate = extractReturnDate(specialHoursNote)
  
  return {
    isOnHoliday,
    holidayMessage: specialHoursNote,
    shouldLeadWithClosure: isOnHoliday,
    returnDate
  }
}

/**
 * Extract date range from holiday message
 * Supports formats like:
 * - "December 25-26"
 * - "Dec 25-26"
 * - "25-26 December"
 * - "December 23 - January 2"
 * - "Closed until January 5"
 */
function extractDateRange(message: string): { startDate: Date | null; endDate: Date | null } {
  const currentYear = new Date().getFullYear()
  const nextYear = currentYear + 1
  
  // Month names mapping
  const months: { [key: string]: number } = {
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
  
  // Pattern 1: "December 25-26" or "Dec 25-26"
  const pattern1 = /(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\s+(\d{1,2})\s*-\s*(\d{1,2})/i
  const match1 = lowerMessage.match(pattern1)
  
  if (match1) {
    const month = months[match1[1].toLowerCase()]
    const startDay = parseInt(match1[2])
    const endDay = parseInt(match1[3])
    
    // Determine year (if month is in past, use next year)
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
  
  // Pattern 2: "December 23 - January 2" (spanning months)
  const pattern2 = /(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\s+(\d{1,2})\s*-\s*(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\s+(\d{1,2})/i
  const match2 = lowerMessage.match(pattern2)
  
  if (match2) {
    const startMonth = months[match2[1].toLowerCase()]
    const startDay = parseInt(match2[2])
    const endMonth = months[match2[3].toLowerCase()]
    const endDay = parseInt(match2[4])
    
    // Determine years
    const today = new Date()
    let startYear = currentYear
    let endYear = currentYear
    
    // If start month is in past, use next year
    if (startMonth < today.getMonth() || (startMonth === today.getMonth() && startDay < today.getDate())) {
      startYear = nextYear
      endYear = nextYear
    }
    
    // If end month is before start month, it spans to next year
    if (endMonth < startMonth) {
      endYear = startYear + 1
    }
    
    return {
      startDate: new Date(startYear, startMonth, startDay),
      endDate: new Date(endYear, endMonth, endDay)
    }
  }
  
  // Pattern 3: "Closed until January 5"
  const pattern3 = /until\s+(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\s+(\d{1,2})/i
  const match3 = lowerMessage.match(pattern3)
  
  if (match3) {
    const month = months[match3[1].toLowerCase()]
    const day = parseInt(match3[2])
    
    // Determine year
    const today = new Date()
    let year = currentYear
    if (month < today.getMonth() || (month === today.getMonth() && day < today.getDate())) {
      year = nextYear
    }
    
    return {
      startDate: new Date(), // Start from today
      endDate: new Date(year, month, day)
    }
  }
  
  // No dates found
  return {
    startDate: null,
    endDate: null
  }
}

/**
 * Try to extract return date from holiday message
 */
function extractReturnDate(message: string): string | null {
  // Patterns like "back on January 2nd", "reopening January 2", "returning 2nd Jan"
  const patterns = [
    /back on ([A-Za-z]+ \d{1,2}(?:st|nd|rd|th)?)/i,
    /reopening (?:on )?([A-Za-z]+ \d{1,2}(?:st|nd|rd|th)?)/i,
    /returning (?:on )?([A-Za-z]+ \d{1,2}(?:st|nd|rd|th)?)/i,
    /open again (?:on )?([A-Za-z]+ \d{1,2}(?:st|nd|rd|th)?)/i,
    /closed until ([A-Za-z]+ \d{1,2}(?:st|nd|rd|th)?)/i,
  ]
  
  for (const pattern of patterns) {
    const match = message.match(pattern)
    if (match) {
      return match[1]
    }
  }
  
  return null
}

/**
 * Generate holiday greeting message for AI to lead with
 */
export function generateHolidayGreeting(holidayStatus: HolidayStatus): string {
  if (!holidayStatus.isOnHoliday || !holidayStatus.holidayMessage) {
    return ''
  }
  
  let greeting = `*** HOLIDAY NOTICE ***\n\n`
  greeting += `${holidayStatus.holidayMessage}\n\n`
  
  if (holidayStatus.returnDate) {
    greeting += `We'll be back ${holidayStatus.returnDate}.\n\n`
  }
  
  greeting += `In the meantime:\n`
  greeting += `- I can provide repair quotes and information\n`
  greeting += `- I can help with general questions\n`
  greeting += `- John will confirm all quotes and bookings when he returns\n\n`
  
  return greeting
}

/**
 * Generate holiday reminder for AI responses (shorter version)
 */
export function generateHolidayReminder(holidayStatus: HolidayStatus): string {
  if (!holidayStatus.isOnHoliday || !holidayStatus.holidayMessage) {
    return ''
  }
  
  let reminder = `\n\nPlease note: ${holidayStatus.holidayMessage}`
  
  if (holidayStatus.returnDate) {
    reminder += ` We'll be back ${holidayStatus.returnDate}.`
  }
  
  reminder += ` John will confirm all quotes and bookings when he returns.`
  
  return reminder
}

/**
 * Detect holiday type and return appropriate greeting style
 */
function getHolidayGreetingStyle(holidayMessage: string): string {
  const lowerMessage = holidayMessage.toLowerCase()
  
  if (lowerMessage.includes('christmas') || lowerMessage.includes('xmas')) {
    return 'Christmas - Use warm, festive tone. Start with "Merry Christmas!" or "Season\'s greetings!" Be extra cheerful and mention wishing them well for the festive season.'
  }
  
  if (lowerMessage.includes('new year')) {
    return 'New Year - Use celebratory tone. Start with "Happy New Year!" Be upbeat and mention wishing them a great year ahead.'
  }
  
  if (lowerMessage.includes('easter')) {
    return 'Easter - Use cheerful, springtime tone. Start with "Happy Easter!" Be warm and friendly.'
  }
  
  if (lowerMessage.includes('bank holiday')) {
    return 'Bank Holiday - Use relaxed, friendly tone. Mention enjoying the long weekend. Be casual and upbeat.'
  }
  
  if (lowerMessage.includes('annual leave') || lowerMessage.includes('holiday')) {
    return 'Holiday/Leave - Use warm, friendly tone. Mention taking a well-earned break. Be understanding and friendly.'
  }
  
  return 'General closure - Use professional but friendly tone.'
}

/**
 * Get holiday-aware system prompt addition
 */
export function getHolidaySystemPrompt(holidayStatus: HolidayStatus): string {
  if (!holidayStatus.isOnHoliday) {
    return ''
  }
  
  const greetingStyle = getHolidayGreetingStyle(holidayStatus.holidayMessage || '')
  
  return `
*** CRITICAL - HOLIDAY CLOSURE ***
${holidayStatus.holidayMessage}

HOLIDAY TONE: ${greetingStyle}

IMPORTANT INSTRUCTIONS:
1. START EVERY RESPONSE with a friendly holiday greeting based on the holiday type
2. Add festive flair and warmth appropriate to the occasion
3. Be helpful but SET EXPECTATIONS: John will confirm when he returns
4. For quotes: Provide estimate but say "John will confirm this quote when he returns"
5. For bookings: Say "I can note your interest, John will confirm availability when he returns"
6. For repairs: Say "John will assess and confirm when he returns"
7. Be extra friendly and warm - it's a holiday!
8. NO EMOJIS - SMS doesn't support them

EXAMPLE RESPONSES:

Customer: "How much for iPhone screen?"
You (Christmas): "Merry Christmas!

We're closed December 25-26 for Christmas, but I'm happy to help with a quote!

For an iPhone screen repair, it's typically around £80-120 depending on the model. John will confirm the exact quote when he returns on December 27th.

Hope you're having a wonderful festive season! Which iPhone model do you have?"

You (New Year): "Happy New Year!

We're closed January 1st to celebrate, but I can still help with information!

For an iPhone screen repair, it's typically around £80-120. John will confirm the exact quote when he's back on January 2nd.

Wishing you a fantastic year ahead! What iPhone model is it?"

You (Bank Holiday): "Hope you're enjoying the long weekend!

We're closed for the bank holiday, but I'm here to help with quotes and info!

For an iPhone screen repair, it's typically around £80-120. John will confirm when he's back.

What iPhone model do you have?"

Customer: "Can I book in for tomorrow?"
You (Christmas): "Merry Christmas!

We're closed December 25-26 for the festive season, so we can't do tomorrow I'm afraid.

But I'd be happy to note your interest and John will get back to you on December 27th to arrange a time that works for you.

Hope you're having a lovely Christmas! Shall I make a note for John?"

ALWAYS be warm, friendly, and add appropriate holiday cheer based on the occasion!
`
}
