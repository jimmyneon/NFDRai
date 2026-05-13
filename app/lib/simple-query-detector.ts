/**
 * Detects simple queries that AI can answer even when staff is actively handling a conversation
 * These are factual questions about business info that don't require context
 */

export interface SimpleQueryResult {
  isSimpleQuery: boolean;
  queryType?:
    | "hours"
    | "location"
    | "directions"
    | "contact"
    | "general_info"
    | "turnaround_time";
  reason: string;
}

/**
 * Check if a message is a simple query that AI can safely answer
 * even when staff is actively handling the conversation
 */
export function isSimpleQuery(message: string): SimpleQueryResult {
  const lowerMessage = message.toLowerCase().trim();

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
    // "Are you in the shop today?" / "Are you there today?"
    /are\s+you\s+(in|at)\s+(the\s+)?(shop|store)/i,
    /are\s+you\s+there\s+(today|tomorrow|now)/i,
    /is\s+(the\s+)?(shop|store)\s+open/i,
    /you\s+open\s+(today|tomorrow|now)/i,
  ];

  for (const pattern of hoursPatterns) {
    if (pattern.test(lowerMessage)) {
      return {
        isSimpleQuery: true,
        queryType: "hours",
        reason: "Business hours query",
      };
    }
  }

  // Location/Address queries
  const locationPatterns = [
    /where\s+(are\s+you|is\s+your\s+(shop|store|location))/i,
    /what.*address/i,
    /what.*location/i,
    /where\s+(can\s+i\s+find|is\s+it)/i,
  ];

  for (const pattern of locationPatterns) {
    if (pattern.test(lowerMessage)) {
      return {
        isSimpleQuery: true,
        queryType: "location",
        reason: "Location/address query",
      };
    }
  }

  // Directions queries
  const directionsPatterns = [
    /how\s+do\s+i\s+get/i,
    /directions/i,
    /how\s+to\s+get\s+there/i,
    /how\s+to\s+find\s+you/i,
    /where\s+do\s+i\s+go/i,
  ];

  for (const pattern of directionsPatterns) {
    if (pattern.test(lowerMessage)) {
      return {
        isSimpleQuery: true,
        queryType: "directions",
        reason: "Directions query",
      };
    }
  }

  // Contact info queries
  const contactPatterns = [
    /what.*phone\s+number/i,
    /how\s+(can|do)\s+i\s+contact/i,
    /contact\s+(info|details)/i,
    /phone\s+number/i,
    /email\s+address/i,
  ];

  for (const pattern of contactPatterns) {
    if (pattern.test(lowerMessage)) {
      return {
        isSimpleQuery: true,
        queryType: "contact",
        reason: "Contact information query",
      };
    }
  }

  // Turnaround time queries (general timeframes, not specific job status)
  const turnaroundPatterns = [
    /how\s+long\s+(does|will|would)\s+(it|this|that)\s+take/i,
    /how\s+long\s+(for|to)\s+(repair|fix)/i,
    /what.*turnaround\s+time/i,
    /when\s+will\s+it\s+be\s+(ready|done|finished)/i,
    /how\s+quickly\s+can\s+you/i,
    /same\s+day\s+(repair|service)/i,
    /turn\s*around\s+time/i,
  ];

  for (const pattern of turnaroundPatterns) {
    if (pattern.test(lowerMessage)) {
      // Only treat as simple if it's a general question, not asking about a specific repair in progress
      // If message contains "my" it's likely asking about their specific repair
      if (!/\bmy\b/i.test(lowerMessage)) {
        return {
          isSimpleQuery: true,
          queryType: "turnaround_time",
          reason: "General turnaround time query",
        };
      }
    }
  }

  // NOT simple queries - these need context or staff attention
  const complexPatterns = [
    /how\s+much/i, // Pricing needs context
    /price/i, // Pricing needs context
    /cost/i, // Pricing needs context
    /ready/i, // Status check needs context
    /done/i, // Status check needs context
    /finished/i, // Status check needs context
    /can\s+you\s+(fix|repair)/i, // Repair inquiry needs context
    /do\s+you\s+(fix|repair)/i, // Repair inquiry needs context
    /broken/i, // Issue description needs context
    /cracked/i, // Issue description needs context
    /not\s+working/i, // Issue description needs context
  ];

  for (const pattern of complexPatterns) {
    if (pattern.test(lowerMessage)) {
      return {
        isSimpleQuery: false,
        reason: "Complex query requiring context or staff attention",
      };
    }
  }

  return {
    isSimpleQuery: false,
    reason: "Not a recognized simple query",
  };
}

/**
 * Check if message is just an acknowledgment (thanks, ok, bye, etc.)
 * These don't need AI responses when staff has recently replied
 *
 * IMPORTANT: Only returns true for PURE acknowledgments (no questions or additional content)
 */
function isAcknowledgment(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim();

  // Safety checks FIRST - reject if these are present
  // 1. Contains question mark = NOT pure acknowledgment
  if (lowerMessage.includes("?")) {
    return false;
  }

  // 2. Too long = likely has more content
  if (lowerMessage.length > 50) {
    return false;
  }

  // 3. Contains question words = NOT pure acknowledgment
  const questionWords = [
    "how",
    "what",
    "when",
    "where",
    "why",
    "which",
    "who",
    "much",
    "many",
    "owe",
  ];
  if (questionWords.some((word) => lowerMessage.includes(word))) {
    return false;
  }

  // NEW: Check for acknowledgments of John's updates/info
  // "thanks for the update", "appreciate it", "no problem", etc.
  const updateAcknowledgments = [
    /thanks?\s+(for\s+)?(the\s+)?(update|info|letting me know|heads up)/i,
    /appreciate\s+(it|that|the update|the info)/i,
    /no\s+(problem|worries|probs)/i,
    /got\s+it/i,
    /understood/i,
    /will\s+do/i,
    /sounds?\s+good/i,
  ];

  for (const pattern of updateAcknowledgments) {
    if (pattern.test(lowerMessage)) {
      return true;
    }
  }

  const acknowledgmentPatterns = [
    // Thanks to John (pure acknowledgment only)
    /^thanks?\s+(john|mate|boss|bro|buddy)[\s!.]*$/i,
    /^thank\s+you\s+(john|mate|boss|bro|buddy)[\s!.]*$/i,
    /^cheers?\s+(john|mate|boss|bro|buddy)[\s!.]*$/i,
    /^appreciate\s+it\s+(john|mate|boss|bro|buddy)[\s!.]*$/i,
    /^lovely\s+(john|mate|boss|bro|buddy)[\s!.]*$/i,
    /^brilliant\s+(john|mate|boss|bro|buddy)[\s!.]*$/i,

    // Simple acknowledgments
    /^(ok|okay|alright|cool|nice|great|perfect|brilliant|lovely|sound|sounds good)[\s!.]*$/i,
    /^(thanks?|thank you|cheers?|ta)[\s!.]*$/i,
    /^(yes|yeah|yep|yup|sure|definitely)[\s!.]*$/i,
    /^(no|nah|nope)[\s!.]*$/i,

    // Closing messages
    /^(bye|goodbye|see ya|cya|later)[\s!.]*$/i,
    /^see\s+you\s+(soon|later|tomorrow|today)[\s!.]*$/i,
    /^speak\s+(soon|later|tomorrow)[\s!.]*$/i,
    /^talk\s+(soon|later|tomorrow)[\s!.]*$/i,

    // Coming in messages
    /^on\s+my\s+way[\s!.]*$/i,
    /^be\s+there\s+(soon|in|at)[\s!.]*$/i,
    /^coming\s+(now|soon|in)[\s!.]*$/i,
    /^just\s+(left|leaving)[\s!.]*$/i,
  ];

  return acknowledgmentPatterns.some((pattern) => pattern.test(lowerMessage));
}

/**
 * Check if message is likely responding to staff's question or statement
 * These should not get AI responses - customer is talking to John
 */
function isRespondingToStaff(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim();

  // Direct answers to questions (likely responding to John's question)
  const directAnswerPatterns = [
    /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s*(would be|works|is good)/i,
    /^(today|tomorrow|this week|next week)\s*(would be|works|is good)/i,
    /^(morning|afternoon|evening)\s*(would be|works|is good)/i,
    /^(yes|yeah|yep|sure|ok|okay)\s*,?\s*(that|it)?\s*(would be|works|is|sounds)\s*(good|fine|great|perfect)/i,
    /^(no|nope|nah)\s*,?\s*(that|it)?\s*(doesn't|does not|won't|will not)\s*work/i,
  ];

  for (const pattern of directAnswerPatterns) {
    if (pattern.test(lowerMessage)) {
      return true;
    }
  }

  // NEW: Yes/no answers with "please" or emojis (very likely answering John's question)
  const yesNoWithPlease = [
    /^(yes|yeah|yep|sure)\s+please[\s!.😊👍✅]*$/i,
    /^(no|nope|nah)\s+(thanks?|thank you)[\s!.😊👍]*$/i,
    /^(yes|yeah|yep|sure)[\s!.😊👍✅]+$/i, // "Yes 😊" or "Yeah!"
    /^(no|nope|nah)[\s!.😊👍]+$/i,
  ];

  for (const pattern of yesNoWithPlease) {
    if (pattern.test(lowerMessage)) {
      return true;
    }
  }

  // NEW: Responses to offers ("just the screen please", "both please", etc.)
  const offerResponses = [
    /just\s+the\s+\w+\s+please/i,
    /both\s+please/i,
    /all\s+of\s+(it|them)\s+please/i,
    /only\s+the\s+\w+/i,
  ];

  for (const pattern of offerResponses) {
    if (pattern.test(lowerMessage)) {
      return true;
    }
  }

  // Short responses that are likely answers to John's questions
  // Only if message is very short (under 30 chars) and doesn't contain question words
  if (lowerMessage.length < 30 && !lowerMessage.includes("?")) {
    const shortAnswers = [
      /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i,
      /^(today|tomorrow)$/i,
      /^(morning|afternoon|evening)$/i,
      /^(yes|yeah|yep|sure|ok|okay|alright)$/i,
      /^(no|nope|nah|not really)$/i,
      /^(anytime|any time|whenever)$/i,
      /^(as soon as possible|asap)$/i,
    ];

    for (const pattern of shortAnswers) {
      if (pattern.test(lowerMessage)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if AI should respond based on staff activity and message type
 *
 * DYNAMIC APPROACH - No hard 30-minute limit:
 * - AI ALWAYS responds to simple queries (hours, location, directions, contact)
 * - AI stays silent if customer is clearly responding to John's question
 * - AI uses John's messages as context when responding
 *
 * @param minutesSinceStaffMessage Minutes since last staff message
 * @param message Customer message to analyze
 * @returns Object with shouldRespond flag and reason
 */
export function shouldAIRespond(
  minutesSinceStaffMessage: number,
  message: string,
): {
  shouldRespond: boolean;
  reason: string;
  queryInfo?: SimpleQueryResult;
} {
  // Check if it's a simple query (hours, location, directions, contact)
  // AI ALWAYS responds to these - John doesn't want to answer basic questions
  const queryInfo = isSimpleQuery(message);

  if (queryInfo.isSimpleQuery) {
    return {
      shouldRespond: true,
      reason: `Simple query (${queryInfo.queryType}) - AI can answer even if John is talking`,
      queryInfo,
    };
  }

  // Check if it's just an acknowledgment (thanks John, ok, bye, etc.)
  // These don't need AI responses - customer is just acknowledging staff
  const isAck = isAcknowledgment(message);
  console.log("[AI Response Check] Acknowledgment check:", {
    message: message.substring(0, 100),
    isAcknowledgment: isAck,
    minutesSinceStaff: minutesSinceStaffMessage.toFixed(1),
    hasQuestionMark: message.includes("?"),
    length: message.length,
  });

  if (isAck) {
    return {
      shouldRespond: false,
      reason: "Customer acknowledgment - no AI response needed",
    };
  }

  // Check if customer is responding to John's question/statement
  // If John just messaged (< 5 minutes ago) and customer sends a short response
  // that looks like an answer, stay quiet
  if (minutesSinceStaffMessage < 5) {
    const respondingToStaff = isRespondingToStaff(message);
    console.log("[AI Response Check] Staff response check:", {
      message: message.substring(0, 100),
      isRespondingToStaff: respondingToStaff,
      minutesSinceStaff: minutesSinceStaffMessage.toFixed(1),
    });

    if (respondingToStaff) {
      return {
        shouldRespond: false,
        reason: `Customer responding to John's message (${minutesSinceStaffMessage.toFixed(1)} min ago) - staying quiet`,
      };
    }
  }

  // AI responds to non-acknowledgment, non-simple-query messages
  // Staff message is in conversation context, AI will use it appropriately
  return {
    shouldRespond: true,
    reason: `AI responding (using John's messages as context if available)`,
    queryInfo,
  };
}
