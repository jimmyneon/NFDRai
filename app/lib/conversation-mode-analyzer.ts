/**
 * Analyzes customer messages to determine if conversation should switch from manual to auto mode
 * 
 * Returns true if the message is a generic query that AI can handle
 * Returns false if the message is directed at staff or requires manual attention
 */
export function shouldSwitchToAutoMode(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim()
  
  // Messages clearly directed at staff - STAY IN MANUAL MODE
  const manualPatterns = [
    /thanks?\s+(john|mate|boss|bro|buddy)/i,
    /thank\s+you\s+(john|mate|boss|bro|buddy)/i,
    /cheers?\s+(john|mate|boss|bro|buddy)/i,
    /appreciate\s+it\s+(john|mate|boss|bro|buddy)/i,
    /see\s+you\s+(soon|later|tomorrow|today)/i,
    /speak\s+(soon|later|tomorrow)/i,
    /talk\s+(soon|later|tomorrow)/i,
    /on\s+my\s+way/i,
    /be\s+there\s+(soon|in|at)/i,
    /coming\s+(now|soon|in)/i,
    /just\s+(left|leaving)/i,
    /^(ok|okay|alright|cool|nice|great|perfect|brilliant|lovely|sound|sounds good)[\s!.]*$/i,
    /^(thanks?|thank you|cheers?|ta)[\s!.]*$/i,
    /^(yes|yeah|yep|yup|sure|definitely)[\s!.]*$/i,
    /^(no|nah|nope)[\s!.]*$/i,
    /^(bye|goodbye|see ya|cya|later)[\s!.]*$/i,
  ]
  
  for (const pattern of manualPatterns) {
    if (pattern.test(lowerMessage)) {
      return false // Stay in manual mode
    }
  }
  
  // Generic questions AI can handle - SWITCH TO AUTO MODE
  const autoPatterns = [
    /when\s+(are\s+you|do\s+you)\s+open/i,
    /what\s+(time|are\s+your|are\s+the)\s+(hours|opening)/i,
    /how\s+much\s+(is|does|for|to)/i,
    /what.*price/i,
    /do\s+you\s+(have|do|offer|provide|fix|repair)/i,
    /can\s+you\s+(fix|repair|do|help)/i,
    /how\s+long\s+(does|will|to)/i,
    /where\s+(are\s+you|is\s+your)/i,
    /what.*address/i,
    /how\s+do\s+i/i,
    /what\s+is\s+your/i,
    /tell\s+me\s+about/i,
    /i\s+need\s+(a|to|help)/i,
    /looking\s+for/i,
    /interested\s+in/i,
    /can\s+i\s+get/i,
    /is\s+it\s+possible/i,
    /do\s+you\s+know/i,
  ]
  
  for (const pattern of autoPatterns) {
    if (pattern.test(lowerMessage)) {
      return true // Switch to auto mode
    }
  }
  
  // If message contains a question mark, likely a real question
  if (lowerMessage.includes('?')) {
    return true // Switch to auto mode for questions
  }
  
  // If message is longer than 5 words and not a simple acknowledgment, likely needs a response
  const wordCount = lowerMessage.split(/\s+/).length
  if (wordCount > 5) {
    return true // Switch to auto mode for longer messages
  }
  
  // Default: if uncertain and short, stay in manual mode to be safe
  return false
}

/**
 * Get a human-readable reason for the mode decision
 */
export function getModeDecisionReason(message: string, shouldSwitch: boolean): string {
  if (shouldSwitch) {
    return 'Generic question detected - AI can handle this'
  }
  
  const lowerMessage = message.toLowerCase().trim()
  
  if (/thanks?\s+(john|mate|boss)/i.test(lowerMessage)) {
    return 'Message directed at staff member'
  }
  
  if (/^(ok|thanks?|yes|no|bye)[\s!.]*$/i.test(lowerMessage)) {
    return 'Acknowledgment or closing message'
  }
  
  if (/see\s+you|speak\s+soon|on\s+my\s+way/i.test(lowerMessage)) {
    return 'Customer is coming in or ending conversation'
  }
  
  return 'Uncertain - staying in manual mode to be safe'
}
