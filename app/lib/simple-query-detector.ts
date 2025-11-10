/**
 * Detects simple queries that AI can answer even when staff is actively handling a conversation
 * These are factual questions about business info that don't require context
 */

export interface SimpleQueryResult {
  isSimpleQuery: boolean
  queryType?: 'hours' | 'location' | 'directions' | 'contact' | 'general_info'
  reason: string
}

/**
 * Check if a message is a simple query that AI can safely answer
 * even when staff is actively handling the conversation
 */
export function isSimpleQuery(message: string): SimpleQueryResult {
  const lowerMessage = message.toLowerCase().trim()
  
  // Hours/Opening times queries
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
      return {
        isSimpleQuery: true,
        queryType: 'hours',
        reason: 'Business hours query'
      }
    }
  }
  
  // Location/Address queries
  const locationPatterns = [
    /where\s+(are\s+you|is\s+your\s+(shop|store|location))/i,
    /what.*address/i,
    /what.*location/i,
    /where\s+(can\s+i\s+find|is\s+it)/i,
  ]
  
  for (const pattern of locationPatterns) {
    if (pattern.test(lowerMessage)) {
      return {
        isSimpleQuery: true,
        queryType: 'location',
        reason: 'Location/address query'
      }
    }
  }
  
  // Directions queries
  const directionsPatterns = [
    /how\s+do\s+i\s+get/i,
    /directions/i,
    /how\s+to\s+get\s+there/i,
    /how\s+to\s+find\s+you/i,
    /where\s+do\s+i\s+go/i,
  ]
  
  for (const pattern of directionsPatterns) {
    if (pattern.test(lowerMessage)) {
      return {
        isSimpleQuery: true,
        queryType: 'directions',
        reason: 'Directions query'
      }
    }
  }
  
  // Contact info queries
  const contactPatterns = [
    /what.*phone\s+number/i,
    /how\s+(can|do)\s+i\s+contact/i,
    /contact\s+(info|details)/i,
    /phone\s+number/i,
    /email\s+address/i,
  ]
  
  for (const pattern of contactPatterns) {
    if (pattern.test(lowerMessage)) {
      return {
        isSimpleQuery: true,
        queryType: 'contact',
        reason: 'Contact information query'
      }
    }
  }
  
  // NOT simple queries - these need context or staff attention
  const complexPatterns = [
    /how\s+much/i,              // Pricing needs context
    /price/i,                    // Pricing needs context
    /cost/i,                     // Pricing needs context
    /ready/i,                    // Status check needs context
    /done/i,                     // Status check needs context
    /finished/i,                 // Status check needs context
    /can\s+you\s+(fix|repair)/i, // Repair inquiry needs context
    /do\s+you\s+(fix|repair)/i,  // Repair inquiry needs context
    /broken/i,                   // Issue description needs context
    /cracked/i,                  // Issue description needs context
    /not\s+working/i,            // Issue description needs context
  ]
  
  for (const pattern of complexPatterns) {
    if (pattern.test(lowerMessage)) {
      return {
        isSimpleQuery: false,
        reason: 'Complex query requiring context or staff attention'
      }
    }
  }
  
  return {
    isSimpleQuery: false,
    reason: 'Not a recognized simple query'
  }
}

/**
 * Check if AI should respond based on staff activity and message type
 * 
 * @param minutesSinceStaffMessage Minutes since last staff message
 * @param message Customer message to analyze
 * @returns Object with shouldRespond flag and reason
 */
export function shouldAIRespond(minutesSinceStaffMessage: number, message: string): {
  shouldRespond: boolean
  reason: string
  queryInfo?: SimpleQueryResult
} {
  const PAUSE_DURATION_MINUTES = 30
  
  // If staff replied more than 30 minutes ago, AI can respond to anything
  if (minutesSinceStaffMessage >= PAUSE_DURATION_MINUTES) {
    return {
      shouldRespond: true,
      reason: `Staff replied ${minutesSinceStaffMessage.toFixed(0)} minutes ago - resuming full AI mode`
    }
  }
  
  // Within 30-minute pause window - check if it's a simple query
  const queryInfo = isSimpleQuery(message)
  
  if (queryInfo.isSimpleQuery) {
    return {
      shouldRespond: true,
      reason: `Simple ${queryInfo.queryType} query - AI can answer even during pause`,
      queryInfo
    }
  }
  
  // Not a simple query and within pause window - don't respond
  const remainingMinutes = Math.ceil(PAUSE_DURATION_MINUTES - minutesSinceStaffMessage)
  return {
    shouldRespond: false,
    reason: `Staff replied ${minutesSinceStaffMessage.toFixed(0)} minutes ago - waiting for staff (${remainingMinutes} min remaining)`,
    queryInfo
  }
}
