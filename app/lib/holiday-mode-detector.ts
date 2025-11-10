/**
 * Holiday Mode Detector
 * Detects if business is on holiday/closed and adjusts AI behavior
 */

export interface HolidayStatus {
  isOnHoliday: boolean
  holidayMessage: string | null
  shouldLeadWithClosure: boolean
  returnDate: string | null
}

/**
 * Detect if business is currently on holiday based on special hours note
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
  const isOnHoliday = holidayKeywords.some(keyword => lowerNote.includes(keyword))
  
  if (!isOnHoliday) {
    return {
      isOnHoliday: false,
      holidayMessage: null,
      shouldLeadWithClosure: false,
      returnDate: null
    }
  }
  
  // Extract return date if mentioned
  const returnDate = extractReturnDate(specialHoursNote)
  
  return {
    isOnHoliday: true,
    holidayMessage: specialHoursNote,
    shouldLeadWithClosure: true,
    returnDate
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
  
  let greeting = `🎄 **HOLIDAY NOTICE** 🎄\n\n`
  greeting += `${holidayStatus.holidayMessage}\n\n`
  
  if (holidayStatus.returnDate) {
    greeting += `We'll be back ${holidayStatus.returnDate}.\n\n`
  }
  
  greeting += `**In the meantime:**\n`
  greeting += `- I can provide repair quotes and information\n`
  greeting += `- I can help with general questions\n`
  greeting += `- John will confirm all quotes and bookings when he returns\n\n`
  greeting += `What can I help you with today?\n\n`
  
  return greeting
}

/**
 * Generate holiday reminder for AI responses (shorter version)
 */
export function generateHolidayReminder(holidayStatus: HolidayStatus): string {
  if (!holidayStatus.isOnHoliday || !holidayStatus.holidayMessage) {
    return ''
  }
  
  let reminder = `\n\n**Please note:** ${holidayStatus.holidayMessage}`
  
  if (holidayStatus.returnDate) {
    reminder += ` We'll be back ${holidayStatus.returnDate}.`
  }
  
  reminder += ` John will confirm all quotes and bookings when he returns.`
  
  return reminder
}

/**
 * Get holiday-aware system prompt addition
 */
export function getHolidaySystemPrompt(holidayStatus: HolidayStatus): string {
  if (!holidayStatus.isOnHoliday) {
    return ''
  }
  
  return `
🚨 CRITICAL - HOLIDAY CLOSURE:
${holidayStatus.holidayMessage}

IMPORTANT INSTRUCTIONS:
1. START EVERY RESPONSE with the holiday notice (use the greeting provided)
2. Be helpful but SET EXPECTATIONS: John will confirm when he returns
3. For quotes: Provide estimate but say "John will confirm this quote when he returns"
4. For bookings: Say "I can note your interest, John will confirm availability when he returns"
5. For repairs: Say "John will assess and confirm when he returns"
6. Be friendly and helpful, but always remind them about the holiday closure

EXAMPLE RESPONSES:

Customer: "How much for iPhone screen?"
You: "🎄 HOLIDAY NOTICE: ${holidayStatus.holidayMessage}

For an iPhone screen repair, it's typically around £80-120 depending on the model. 

However, John will confirm the exact quote when he returns${holidayStatus.returnDate ? ` on ${holidayStatus.returnDate}` : ''}. 

Can you tell me which iPhone model you have so I can give you a more accurate estimate?"

Customer: "Can I book in for tomorrow?"
You: "🎄 HOLIDAY NOTICE: ${holidayStatus.holidayMessage}

I'd love to help, but we're currently closed for the holiday. 

John will be back${holidayStatus.returnDate ? ` on ${holidayStatus.returnDate}` : ''} and can confirm availability then. Would you like me to note your interest so John can contact you when he returns?"

ALWAYS lead with the holiday notice, then be helpful!
`
}
