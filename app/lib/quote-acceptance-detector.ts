/**
 * Quote Acceptance Detector
 * Detects when a customer wants to proceed with a repair quote
 */

/**
 * Check if message indicates customer wants to accept/proceed with quote
 * Uses regex patterns to detect various ways customers confirm
 */
export function detectQuoteAcceptance(message: string): {
  isAcceptance: boolean;
  confidence: number;
  needsConfirmation: boolean;
} {
  const lowerMessage = message.toLowerCase().trim();

  // High confidence acceptance patterns
  const highConfidencePatterns = [
    /^yes\s*please$/i,
    /^yes$/i,
    /^yeah$/i,
    /^yep$/i,
    /^sure$/i,
    /^ok$/i,
    /^okay$/i,
    /^please\s+go\s+ahead$/i,
    /go\s+ahead/i,
    /proceed/i,
    /book\s+(it\s+)?in/i,
    /let'?s\s+do\s+it/i,
    /i'?ll\s+take\s+it/i,
    /sounds\s+good/i,
    /that'?s\s+fine/i,
    /accept/i,
    /confirmed?/i,
    /i\s+want\s+to\s+(go\s+ahead|proceed|book)/i,
    /when\s+can\s+(i\s+)?(drop\s+it\s+off|bring\s+it\s+in)/i,
    /i'?ll\s+bring\s+it\s+in/i,
    /i'?ll\s+drop\s+it\s+off/i,
    /book\s+me\s+in/i,
    /get\s+it\s+booked/i,
    /yes\s+i\s+want/i,
    /yes\s+i'?d\s+like/i,
  ];

  // Medium confidence patterns (might need confirmation)
  const mediumConfidencePatterns = [
    /^perfect$/i,
    /^great$/i,
    /^brilliant$/i,
    /^lovely$/i,
    /^thanks$/i,
    /^thank\s+you$/i,
    /that'?s\s+perfect/i,
    /that'?s\s+great/i,
    /happy\s+with\s+that/i,
    /i'?m\s+happy/i,
  ];

  // Check high confidence patterns
  for (const pattern of highConfidencePatterns) {
    if (pattern.test(lowerMessage)) {
      return {
        isAcceptance: true,
        confidence: 0.9,
        needsConfirmation: false,
      };
    }
  }

  // Check medium confidence patterns
  for (const pattern of mediumConfidencePatterns) {
    if (pattern.test(lowerMessage)) {
      return {
        isAcceptance: true,
        confidence: 0.6,
        needsConfirmation: true, // Ask "Would you like to proceed with this repair?"
      };
    }
  }

  // Rejection patterns (explicitly saying no)
  const rejectionPatterns = [
    /^no$/i,
    /^nope$/i,
    /^nah$/i,
    /no\s+thanks/i,
    /not\s+(right\s+)?now/i,
    /too\s+(expensive|much|dear)/i,
    /can'?t\s+afford/i,
    /i'?ll\s+think\s+about\s+it/i,
    /let\s+me\s+think/i,
    /maybe\s+later/i,
  ];

  for (const pattern of rejectionPatterns) {
    if (pattern.test(lowerMessage)) {
      return {
        isAcceptance: false,
        confidence: 0.9,
        needsConfirmation: false,
      };
    }
  }

  // Default: unclear
  return {
    isAcceptance: false,
    confidence: 0,
    needsConfirmation: false,
  };
}

/**
 * Check if message is asking about the quote or repair
 */
export function isQuoteInquiry(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim();

  const inquiryPatterns = [
    /how\s+much/i,
    /what'?s\s+the\s+(price|cost|quote)/i,
    /quote/i,
    /repair/i,
    /when\s+(can|will)\s+(you|it\s+be)/i,
    /how\s+long/i,
    /turnaround/i,
    /ready/i,
  ];

  return inquiryPatterns.some((pattern) => pattern.test(lowerMessage));
}
