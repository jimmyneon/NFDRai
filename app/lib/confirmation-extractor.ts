/**
 * Extract customer information from confirmation SMS messages
 * Pattern: "Hi there {name}, your {device} is fixed and ready for collection..."
 */

export interface ExtractedConfirmationData {
  customerName: string | null
  device: string | null
  isConfirmationMessage: boolean
}

/**
 * Detect if a message is a confirmation SMS from John
 * Signature: "many thanks, john" or "many thanks john" or similar
 */
export function isConfirmationFromJohn(message: string): boolean {
  const lowerMessage = message.toLowerCase()
  
  // Check for John's signature patterns
  const johnSignatures = [
    'many thanks, john',
    'many thanks john',
    'thanks, john',
    'thanks john',
    'new forest device repairs',
    'nfdr'
  ]
  
  // Check if message contains "ready for collection" or similar
  const readyPhrases = [
    'ready for collection',
    'ready to collect',
    'ready for pickup',
    'is fixed',
    'is repaired',
    'repair is complete'
  ]
  
  const hasJohnSignature = johnSignatures.some(sig => lowerMessage.includes(sig))
  const hasReadyPhrase = readyPhrases.some(phrase => lowerMessage.includes(phrase))
  
  // Must have BOTH John's signature AND a "ready" phrase to be a confirmation
  return hasJohnSignature && hasReadyPhrase
}

/**
 * Extract customer name and device from confirmation message
 * Pattern: "Hi there {name}, your {device} is fixed..."
 */
export function extractConfirmationData(message: string): ExtractedConfirmationData {
  const isConfirmation = isConfirmationFromJohn(message)
  
  if (!isConfirmation) {
    return {
      customerName: null,
      device: null,
      isConfirmationMessage: false
    }
  }
  
  let customerName: string | null = null
  let device: string | null = null
  
  // Pattern 1: "Hi there {name}, your {device}"
  const pattern1 = /hi\s+there\s+([^,]+),\s+your\s+([^,\s]+(?:\s+[^,\s]+)?)/i
  const match1 = message.match(pattern1)
  
  if (match1) {
    customerName = match1[1].trim()
    device = match1[2].trim()
  }
  
  // Pattern 2: "Hi {name}, your {device}"
  if (!customerName) {
    const pattern2 = /hi\s+([^,]+),\s+your\s+([^,\s]+(?:\s+[^,\s]+)?)/i
    const match2 = message.match(pattern2)
    
    if (match2) {
      customerName = match2[1].trim()
      device = match2[2].trim()
    }
  }
  
  // Pattern 3: "Hello {name}, your {device}"
  if (!customerName) {
    const pattern3 = /hello\s+([^,]+),\s+your\s+([^,\s]+(?:\s+[^,\s]+)?)/i
    const match3 = message.match(pattern3)
    
    if (match3) {
      customerName = match3[1].trim()
      device = match3[2].trim()
    }
  }
  
  // Clean up device name - remove "is fixed" or similar
  if (device) {
    device = device.replace(/\s+(is|has|was)\s+.*/i, '').trim()
  }
  
  return {
    customerName,
    device,
    isConfirmationMessage: true
  }
}

/**
 * Determine if AI should respond to this message
 * Returns false if it's a confirmation message from John (customer replies to these should be ignored)
 */
export function shouldAIRespond(message: string, isFromCustomer: boolean): boolean {
  // If message is FROM customer, check if it's a reply to John's confirmation
  // We'll handle this in the incoming message handler by checking recent staff messages
  
  // If message is FROM staff (John), don't auto-respond
  if (!isFromCustomer) {
    return false
  }
  
  return true
}
