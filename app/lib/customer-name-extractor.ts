/**
 * Extract customer name from their messages when they introduce themselves
 * Patterns:
 * - "Hi, I'm John"
 * - "My name is Sarah"
 * - "This is Mike"
 * - "It's Emma here"
 * - "Hi, John here"
 */

export interface ExtractedNameData {
  customerName: string | null
  confidence: 'high' | 'medium' | 'low'
  isCorrection?: boolean  // True if customer is correcting their name preference
}

/**
 * Extract customer name from message
 */
export function extractCustomerName(message: string): ExtractedNameData {
  const lowerMessage = message.toLowerCase()
  let customerName: string | null = null
  let confidence: 'high' | 'medium' | 'low' = 'low'
  
  // Pattern 1: "Hi, I'm {name}" or "Hello, I'm {name}" (avoid articles like "an", "a", "the")
  const pattern1 = /(?:hi|hello|hey),?\s+i'?m\s+(?!an\b|a\b|the\b)([a-z]+)/i
  const match1 = message.match(pattern1)
  
  if (match1) {
    customerName = match1[1].trim()
    confidence = 'high'
    return { customerName: capitalizeFirstLetter(customerName), confidence }
  }
  
  // Pattern 2: "My name is {name}" or "My name's {name}"
  const pattern2 = /my\s+name(?:'s|\s+is)\s+([a-z]+)/i
  const match2 = message.match(pattern2)
  
  if (match2) {
    customerName = match2[1].trim()
    confidence = 'high'
    return { customerName: capitalizeFirstLetter(customerName), confidence }
  }
  
  // Pattern 3: "This is {name}" (at start of message)
  const pattern3 = /^this\s+is\s+([a-z]+)/i
  const match3 = message.match(pattern3)
  
  if (match3) {
    customerName = match3[1].trim()
    confidence = 'high'
    return { customerName: capitalizeFirstLetter(customerName), confidence }
  }
  
  // Pattern 4: "It's {name} here" or "It's {name}" (avoid articles)
  const pattern4 = /it'?s\s+(?!an\b|a\b|the\b)([a-z]+)(?:\s+here)?/i
  const match4 = message.match(pattern4)
  
  if (match4) {
    customerName = match4[1].trim()
    confidence = 'medium'
    return { customerName: capitalizeFirstLetter(customerName), confidence }
  }
  
  // Pattern 5: "{name} here" (at start of message)
  const pattern5 = /^([a-z]+)\s+here/i
  const match5 = message.match(pattern5)
  
  if (match5) {
    customerName = match5[1].trim()
    confidence = 'medium'
    return { customerName: capitalizeFirstLetter(customerName), confidence }
  }
  
  // Pattern 6: "I am {name}"
  const pattern6 = /i\s+am\s+(?!an\b|a\b|the\b)([a-z]+)/i
  const match6 = message.match(pattern6)
  
  if (match6) {
    customerName = match6[1].trim()
    confidence = 'high'
    return { customerName: capitalizeFirstLetter(customerName), confidence }
  }
  
  // Pattern 7: Name preference correction - "please refer to me as {name}" or "call me {name}"
  const pattern7 = /(?:please\s+)?(?:refer\s+to\s+me\s+as|call\s+me)\s+([a-z]+(?:\s+[a-z]+)?)/i
  const match7 = message.match(pattern7)
  
  if (match7) {
    customerName = match7[1].trim()
    confidence = 'high'
    return { customerName: capitalizeProperName(customerName), confidence, isCorrection: true }
  }
  
  // Pattern 8: Name correction - "not {old_name}" pattern followed by new name
  // Example: "Also please refer to me as Mr Davidson not dave"
  const pattern8 = /(?:refer\s+to\s+me\s+as|call\s+me)\s+([a-z]+(?:\s+[a-z]+)?)\s+not\s+[a-z]+/i
  const match8 = message.match(pattern8)
  
  if (match8) {
    customerName = match8[1].trim()
    confidence = 'high'
    return { customerName: capitalizeProperName(customerName), confidence, isCorrection: true }
  }
  
  return { customerName: null, confidence: 'low' }
}

/**
 * Capitalize first letter of name
 */
function capitalizeFirstLetter(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
}

/**
 * Capitalize proper names (handles titles like "Mr Davidson")
 */
function capitalizeProperName(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Check if extracted name is likely valid (not a common word)
 */
export function isLikelyValidName(name: string): boolean {
  const lowerName = name.toLowerCase()
  
  // Common words that are NOT names
  const commonWords = [
    'the', 'a', 'an', 'and', 'but', 'for', 'not', 'yes', 'sure', 'okay', 'ok',
    'thanks', 'thank', 'please', 'sorry', 'hello', 'hi', 'hey',
    'good', 'bad', 'great', 'fine', 'well', 'very', 'much', 'more',
    'just', 'only', 'also', 'even', 'still', 'back', 'here', 'there',
    'this', 'that', 'these', 'those', 'what', 'when', 'where', 'which',
    'who', 'why', 'how', 'can', 'could', 'would', 'should', 'will',
    'phone', 'screen', 'battery', 'repair', 'fix', 'broken', 'cracked',
    'lol'
  ]
  
  // Name should be at least 2 characters
  if (lowerName.length < 2) {
    return false
  }
  
  // Name should not be a common word
  if (commonWords.includes(lowerName)) {
    return false
  }
  
  // Name should only contain letters
  if (!/^[a-z]+$/i.test(lowerName)) {
    return false
  }
  
  return true
}
