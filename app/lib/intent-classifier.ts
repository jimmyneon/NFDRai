/**
 * Intent Classification System
 * Classifies customer messages into intent categories to determine if AI should respond
 * during Human Control Window
 */

export type MessageIntent =
  | "SAFE_FAQ"           // Location, hours, parking, booking link - AI can respond
  | "CONTEXTUAL_QUERY"   // Pricing, status checks - needs context, AI should NOT respond
  | "JOB_SPECIFIC"       // "Is my phone ready?", "How much will it cost?" - needs context
  | "COMPLAINT"          // Frustration, complaints - needs human
  | "CONVERSATION"       // Conversational messages - needs human
  | "ACKNOWLEDGMENT"     // "Thanks", "Ok" - no response needed
  | "UNKNOWN";           // Uncertain - default to human

export interface IntentClassification {
  intent: MessageIntent;
  confidence: number;
  reason: string;
  allowAIDuringHumanControl: boolean;
}

/**
 * Safe FAQ patterns - AI can respond even during Human Control Window
 */
const SAFE_FAQ_PATTERNS = {
  // Opening hours
  hours: [
    /when\s+(are\s+you|do\s+you)\s+open/i,
    /what\s+time\s+(are\s+you|do\s+you)\s+(open|close)/i,
    /what\s+(are\s+your|are\s+the)\s+(hours|opening|times)/i,
    /opening\s+(hours|times)/i,
    /are\s+you\s+open/i,
    /what\s+time.*open/i,
    /when.*open/i,
    /open\s+(today|tomorrow|now)/i,
    /are\s+you\s+(in|at)\s+(the\s+)?(shop|store)/i,
    /is\s+(the\s+)?(shop|store)\s+open/i,
  ],

  // Location/Address
  location: [
    /where\s+(are\s+you|is\s+your\s+(shop|store|location))/i,
    /what.*address/i,
    /what.*location/i,
    /where\s+(can\s+i\s+find|is\s+it)/i,
    /how\s+do\s+i\s+find\s+you/i,
  ],

  // Parking
  parking: [
    /where.*park/i,
    /parking/i,
    /can\s+i\s+park/i,
    /is\s+there\s+parking/i,
  ],

  // Booking process (how to book, not actual booking)
  bookingInfo: [
    /how\s+do\s+i\s+book/i,
    /how\s+to\s+book/i,
    /booking\s+(link|process)/i,
    /can\s+i\s+book\s+online/i,
  ],

  // Basic process questions (generic, non-contextual)
  process: [
    /how\s+does\s+(it|this|the\s+process)\s+work/i,
    /what.*process/i,
    /how\s+long\s+does\s+(a|the)\s+repair\s+(usually|typically)\s+take/i,
  ],
};

/**
 * Contextual query patterns - AI should NOT respond during Human Control Window
 */
const CONTEXTUAL_PATTERNS = {
  // Pricing (needs context about specific device/issue)
  pricing: [
    /how\s+much/i,
    /what.*price/i,
    /what.*cost/i,
    /how\s+much\s+(is|does|for|to|will)/i,
  ],

  // Status checks (needs context about specific job)
  status: [
    /is\s+(it|my\s+\w+)\s+ready/i,
    /is\s+(it|my\s+\w+)\s+done/i,
    /is\s+(it|my\s+\w+)\s+finished/i,
    /can\s+i\s+(pick\s+up|collect)/i,
    /when\s+(will|can)\s+(it|my\s+\w+)\s+be\s+ready/i,
    /ready\s+(yet|for\s+collection)/i,
  ],

  // Repair inquiries (needs context)
  repair: [
    /can\s+you\s+(fix|repair)/i,
    /do\s+you\s+(fix|repair)/i,
    /my\s+\w+\s+(is|has)\s+(broken|cracked|not\s+working)/i,
  ],

  // Booking requests (needs context and scheduling)
  booking: [
    /can\s+i\s+book/i,
    /i\s+(want|need)\s+to\s+book/i,
    /book\s+(me\s+)?in/i,
    /make\s+an?\s+appointment/i,
  ],
};

/**
 * Complaint/sensitive patterns - always needs human
 */
const COMPLAINT_PATTERNS = [
  /frustrated/i,
  /annoyed/i,
  /angry/i,
  /complaint/i,
  /terrible/i,
  /worst/i,
  /disgusting/i,
  /unacceptable/i,
  /ridiculous/i,
  /third\s+time/i,
  /still\s+waiting/i,
  /ai\s+(failure|fail|useless)/i,
  /not\s+helping/i,
  /speak\s+to\s+(a\s+)?(human|person|john)/i,
];

/**
 * Acknowledgment patterns - no response needed
 */
const ACKNOWLEDGMENT_PATTERNS = [
  /^(ok|okay|alright|cool|nice|great|perfect|brilliant|lovely)[\s!.]*$/i,
  /^(thanks?|thank you|cheers?|ta)[\s!.]*$/i,
  /^(yes|yeah|yep|yup|no|nope|nah)[\s!.]*$/i,
  /^(bye|goodbye|see ya|cya|later)[\s!.]*$/i,
  /^see\s+you\s+(soon|later|tomorrow)[\s!.]*$/i,
];

/**
 * Classify message intent using regex patterns (fast, free)
 */
export function classifyIntent(message: string): IntentClassification {
  const lowerMessage = message.toLowerCase().trim();

  // 1. Check for acknowledgments first (no response needed)
  if (lowerMessage.length < 50) {
    for (const pattern of ACKNOWLEDGMENT_PATTERNS) {
      if (pattern.test(lowerMessage)) {
        return {
          intent: "ACKNOWLEDGMENT",
          confidence: 0.95,
          reason: "Pure acknowledgment - no response needed",
          allowAIDuringHumanControl: false,
        };
      }
    }
  }

  // 2. Check for complaints/sensitive (always human)
  for (const pattern of COMPLAINT_PATTERNS) {
    if (pattern.test(lowerMessage)) {
      return {
        intent: "COMPLAINT",
        confidence: 0.9,
        reason: "Complaint or sensitive issue - requires human attention",
        allowAIDuringHumanControl: false,
      };
    }
  }

  // 3. Check for SAFE FAQ patterns (AI can respond)
  for (const [category, patterns] of Object.entries(SAFE_FAQ_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(lowerMessage)) {
        return {
          intent: "SAFE_FAQ",
          confidence: 0.9,
          reason: `Safe FAQ query (${category}) - AI can respond`,
          allowAIDuringHumanControl: true,
        };
      }
    }
  }

  // 4. Check for contextual patterns (AI should NOT respond during human control)
  for (const [category, patterns] of Object.entries(CONTEXTUAL_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(lowerMessage)) {
        return {
          intent: category === "pricing" || category === "status" 
            ? "JOB_SPECIFIC" 
            : "CONTEXTUAL_QUERY",
          confidence: 0.85,
          reason: `Contextual query (${category}) - requires conversation context`,
          allowAIDuringHumanControl: false,
        };
      }
    }
  }

  // 5. If message has question mark, likely a question
  if (lowerMessage.includes("?")) {
    // Could be safe FAQ or contextual - default to contextual for safety
    return {
      intent: "UNKNOWN",
      confidence: 0.5,
      reason: "Question detected but intent unclear - defaulting to human",
      allowAIDuringHumanControl: false,
    };
  }

  // 6. Longer messages are likely conversational
  const wordCount = lowerMessage.split(/\s+/).length;
  if (wordCount > 10) {
    return {
      intent: "CONVERSATION",
      confidence: 0.7,
      reason: "Longer conversational message - likely needs human context",
      allowAIDuringHumanControl: false,
    };
  }

  // 7. Default: unknown, let human handle
  return {
    intent: "UNKNOWN",
    confidence: 0.3,
    reason: "Intent unclear - defaulting to human for safety",
    allowAIDuringHumanControl: false,
  };
}

/**
 * Check if AI should respond based on intent and Human Control Window status
 */
export function shouldAIRespondWithIntent(
  classification: IntentClassification,
  humanControlActive: boolean,
  aiMutedUntil: Date | null
): {
  shouldRespond: boolean;
  reason: string;
} {
  // If AI is permanently muted, never respond
  if (aiMutedUntil && aiMutedUntil.getTime() > Date.now() + 365 * 24 * 60 * 60 * 1000) {
    return {
      shouldRespond: false,
      reason: "AI permanently muted for this conversation",
    };
  }

  // If acknowledgment, never respond
  if (classification.intent === "ACKNOWLEDGMENT") {
    return {
      shouldRespond: false,
      reason: "Acknowledgment - no response needed",
    };
  }

  // If Human Control Window is active
  if (humanControlActive && aiMutedUntil && aiMutedUntil.getTime() > Date.now()) {
    const hoursRemaining = (aiMutedUntil.getTime() - Date.now()) / (1000 * 60 * 60);
    
    // Only respond to safe FAQs during Human Control Window
    if (classification.allowAIDuringHumanControl) {
      return {
        shouldRespond: true,
        reason: `Safe FAQ (${classification.intent}) - AI can respond even during Human Control Window`,
      };
    }

    return {
      shouldRespond: false,
      reason: `Human Control Window active (${hoursRemaining.toFixed(1)}h remaining) - ${classification.reason}`,
    };
  }

  // Human Control Window expired or not active - AI can respond normally
  return {
    shouldRespond: true,
    reason: classification.intent === "SAFE_FAQ" 
      ? `Safe FAQ - AI responding`
      : `Human Control Window inactive - AI responding to ${classification.intent}`,
  };
}
