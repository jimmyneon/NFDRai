/**
 * Detect the actual sender of a message based on content
 * Distinguishes between AI messages (signed "AI Steve") and staff messages (signed "John")
 */

export interface SenderDetectionResult {
  sender: 'ai' | 'staff' | 'system'
  confidence: 'high' | 'medium' | 'low'
  reason: string
}

/**
 * Detect if a message is from AI Steve
 * AI messages are signed with "many thanks, AI Steve" or similar
 */
export function detectSender(messageText: string): SenderDetectionResult {
  const lowerText = messageText.toLowerCase()
  
  // AI Steve signatures (high confidence)
  const aiSteveSignatures = [
    /many\s+thanks,?\s+ai\s+steve/i,
    /best\s+regards,?\s+ai\s+steve/i,
    /kind\s+regards,?\s+ai\s+steve/i,
    /regards,?\s+ai\s+steve/i,
    /thanks,?\s+ai\s+steve/i,
    /cheers,?\s+ai\s+steve/i,
    /ai\s+steve\s+from\s+new\s+forest\s+device\s+repairs/i,
  ]
  
  // Staff (John) signatures (high confidence)
  const johnSignatures = [
    /many\s+thanks,?\s+john/i,
    /best\s+regards,?\s+john/i,
    /kind\s+regards,?\s+john/i,
    /regards,?\s+john/i,
    /thanks,?\s+john/i,
    /cheers,?\s+john/i,
    /john\s+from\s+new\s+forest\s+device\s+repairs/i,
    /many\s+thenks,?\s+john/i, // Handle typo
  ]
  
  // Check for AI Steve signature
  for (const pattern of aiSteveSignatures) {
    if (pattern.test(messageText)) {
      return {
        sender: 'ai',
        confidence: 'high',
        reason: 'Message contains AI Steve signature'
      }
    }
  }
  
  // Check for John signature
  for (const pattern of johnSignatures) {
    if (pattern.test(messageText)) {
      return {
        sender: 'staff',
        confidence: 'high',
        reason: 'Message contains John signature'
      }
    }
  }
  
  // Check if message mentions "John" in context that suggests it's TO John (not FROM John)
  // e.g., "I'll pass this to John" or "John will call you back"
  const mentionsJohnAsThirdPerson = [
    /i'?ll\s+(?:pass|forward|send).*to\s+john/i,
    /john\s+will\s+(?:call|contact|get\s+back)/i,
    /let\s+me\s+check\s+with\s+john/i,
    /i'?ll\s+ask\s+john/i,
  ]
  
  for (const pattern of mentionsJohnAsThirdPerson) {
    if (pattern.test(messageText)) {
      return {
        sender: 'ai',
        confidence: 'high',
        reason: 'Message mentions John as third person (AI referring to staff)'
      }
    }
  }
  
  // Medium confidence: Check for AI-like language patterns
  const aiPatterns = [
    /i'?m\s+(?:an\s+)?ai\s+assistant/i,
    /as\s+(?:an\s+)?ai/i,
    /i'?m\s+here\s+to\s+help/i,
    /happy\s+to\s+assist/i,
  ]
  
  for (const pattern of aiPatterns) {
    if (pattern.test(messageText)) {
      return {
        sender: 'ai',
        confidence: 'medium',
        reason: 'Message contains AI-like language patterns'
      }
    }
  }
  
  // Low confidence: If no clear signature, default to staff
  // This is safer as staff messages are less frequent and more important
  return {
    sender: 'staff',
    confidence: 'low',
    reason: 'No clear signature detected - defaulting to staff'
  }
}

/**
 * Check if a message is from AI Steve
 */
export function isAIMessage(messageText: string): boolean {
  const result = detectSender(messageText)
  return result.sender === 'ai' && result.confidence === 'high'
}

/**
 * Check if a message is from staff (John)
 */
export function isStaffMessage(messageText: string): boolean {
  const result = detectSender(messageText)
  return result.sender === 'staff' && result.confidence === 'high'
}

/**
 * Get the correct sender type for a message
 * Returns 'ai' if message is from AI Steve, 'staff' if from John, or the provided default
 */
export function getCorrectSender(messageText: string, defaultSender: 'ai' | 'staff' | 'system' = 'staff'): 'ai' | 'staff' | 'system' {
  const result = detectSender(messageText)
  
  // Only override if we have high confidence
  if (result.confidence === 'high') {
    return result.sender
  }
  
  // For medium confidence AI detection, return AI
  if (result.sender === 'ai' && result.confidence === 'medium') {
    return 'ai'
  }
  
  // Otherwise use the default
  return defaultSender
}
