/**
 * Unified Message Analyzer
 *
 * ONE AI CALL to analyze:
 * 1. Sentiment (frustrated, angry, etc.)
 * 2. Intent (what customer wants)
 * 3. Context confidence (should AI respond?)
 * 4. Customer name extraction (if introducing themselves)
 * 5. Urgency level
 *
 * COST: $0.0002 per message (vs $0.0003+ for 3 separate calls)
 * SPEED: 1 API call instead of 3
 * ACCURACY: Better because AI sees full context at once
 */

import { OpenAI } from "openai";

export interface UnifiedAnalysis {
  // Sentiment
  sentiment: "positive" | "neutral" | "negative" | "frustrated" | "angry";
  urgency: "low" | "medium" | "high" | "critical";
  requiresStaffAttention: boolean;
  sentimentKeywords: string[];

  // Intent
  intent:
    | "question"
    | "complaint"
    | "booking"
    | "status_check"
    | "greeting"
    | "acknowledgment"
    | "device_issue"
    | "buyback"
    | "purchase"
    | "unclear";
  intentConfidence: number;

  // Content Type (NEW!)
  contentType:
    | "pricing"
    | "business_hours"
    | "location"
    | "services"
    | "warranty"
    | "troubleshooting"
    | "water_damage"
    | "battery_issue"
    | "screen_damage"
    | "camera_issue"
    | "charging_issue"
    | "software_issue"
    | "device_sale"
    | "device_purchase"
    | "appointment"
    | "repair_status"
    | "introduction"
    | "acknowledgment"
    | "dissatisfaction"
    | "unclear";

  // Context
  shouldAIRespond: boolean;
  contextConfidence: number;
  isDirectedAtAI: boolean;
  reasoning: string;

  // Name extraction
  customerName: string | null;
  nameConfidence: number;

  // Overall
  overallConfidence: number;
}

/**
 * Quick regex pre-check (free, instant)
 * Returns null if needs AI analysis
 */
export function quickAnalysis(
  message: string,
  recentMessages: Array<{ sender: string; text: string }>
): UnifiedAnalysis | null {
  const lowerMessage = message.toLowerCase().trim();

  // VERY CLEAR CASES - Don't need AI

  // 1. Pure acknowledgments (don't respond) - EXPANDED
  const acknowledgmentPatterns = [
    /^(ok|okay|alright|sure|fine|thanks|thank you|cheers|ta)[\s.!]*$/i,
    /^(yes|yeah|yep|yup|no|nope|nah)[\s.!]*$/i,
    /^(got it|understood|sounds good|perfect|great|lovely|brilliant|nice one)[\s.!]*$/i,
    /^(will do|noted|roger|copy that|all good)[\s.!]*$/i,
    /^see\s+you\s+(soon|later|then|tomorrow)[\s.!]*$/i,
    /^(bye|goodbye|cya|see ya|later)[\s.!]*$/i,
  ];

  for (const pattern of acknowledgmentPatterns) {
    if (pattern.test(message) && message.length < 40) {
      return {
        sentiment: "neutral",
        urgency: "low",
        requiresStaffAttention: false,
        sentimentKeywords: [],
        intent: "acknowledgment",
        intentConfidence: 0.9,
        contentType: "acknowledgment",
        shouldAIRespond: false,
        contextConfidence: 0.9,
        isDirectedAtAI: false,
        reasoning: "Pure acknowledgment - no response needed",
        customerName: null,
        nameConfidence: 0,
        overallConfidence: 0.9,
      };
    }
  }

  // 2. Clearly frustrated (high confidence)
  const frustrationKeywords = [
    "third time",
    "still waiting",
    "ridiculous",
    "unacceptable",
    "terrible",
    "worst",
    "disgusting",
    "complaint",
    "ai failure",
    "ai fail",
    "not helping",
    "useless",
  ];

  const hasFrustration = frustrationKeywords.some((kw) =>
    lowerMessage.includes(kw)
  );
  if (hasFrustration) {
    return {
      sentiment: "frustrated",
      urgency: "high",
      requiresStaffAttention: true,
      sentimentKeywords: frustrationKeywords.filter((kw) =>
        lowerMessage.includes(kw)
      ),
      intent: "complaint",
      intentConfidence: 0.8,
      contentType: "dissatisfaction",
      shouldAIRespond: false,
      contextConfidence: 0.9,
      isDirectedAtAI: true,
      reasoning: "Customer is frustrated - needs staff attention",
      customerName: null,
      nameConfidence: 0,
      overallConfidence: 0.8,
    };
  }

  // 3. Clearly angry (high confidence)
  const angerKeywords = [
    "money back",
    "refund",
    "never again",
    "report you",
    "trading standards",
    "lawyer",
    "solicitor",
    "sue",
  ];

  const hasAnger = angerKeywords.some((kw) => lowerMessage.includes(kw));
  if (hasAnger) {
    return {
      sentiment: "angry",
      urgency: "critical",
      requiresStaffAttention: true,
      sentimentKeywords: angerKeywords.filter((kw) =>
        lowerMessage.includes(kw)
      ),
      intent: "complaint",
      intentConfidence: 0.9,
      contentType: "dissatisfaction",
      shouldAIRespond: false,
      contextConfidence: 0.95,
      isDirectedAtAI: true,
      reasoning: "Customer is very angry - urgent staff attention required",
      customerName: null,
      nameConfidence: 0,
      overallConfidence: 0.9,
    };
  }

  // 4. Referring to physical person or asking staff to call back (don't respond)
  const physicalPersonPatterns = [
    // Direct address to John
    /^(hi|hey|hello|h)\s+john/i, // "Hi John", "H John", "Hey John"
    /john[,:]\s+/i, // "John, I'm here" or "John: message"
    /^john\s/i, // "John I'm here"

    // Physical descriptions
    /for (the )?(tall|short|big|small|young|old)?\s*(guy|man|gentleman|person|bloke|lad|chap)/i,
    /with (the )?(beard|glasses|tattoo|hat)/i,
    /tell (him|her|them|john)/i,

    // Callback requests - EXPANDED
    /(phone|call|ring)\s+(me|us)\s+(when|once|after|as\s+soon|asap)/i, // "phone me when you start"
    /(can|could|would)\s+you\s+(phone|call|ring)\s+(me|us)/i, // "can you phone me"
    /if\s+you\s+(can|could)\s+(phone|call|ring)/i, // "if you can phone me"
    /(give|send)\s+(me|us)\s+a\s+(call|ring)/i, // "give me a call"
    /(call|phone|ring)\s+(me|us)\s+(back|please)/i, // "call me back", "phone me please"
    /please\s+(call|phone|ring)/i, // "please call me"
    /(need|want)\s+(you\s+to\s+)?(call|phone|ring)/i, // "need you to call", "want to call"

    // Physical location waiting - EXPANDED
    /(i'm|im|i am)\s+(at|in|outside|near)\s+(the\s+)?(shop|store|door|entrance|front|building)/i,
    /(i'm|im|i am)\s+(here|outside|waiting)/i, // "I'm here", "I'm outside", "I'm waiting"
    /(waiting|here)\s+(at|in|outside|for)\s+(the\s+)?(shop|you|door)/i,
    /(at|outside)\s+(your|the)\s+(shop|store|door|place)/i,
    /just\s+(arrived|outside|here)/i, // "just arrived", "just outside"

    // Location/meeting context (airport, arrivals, etc.)
    /(i'm|im)\s+(at|in)\s+(the\s+)?(airport|arrivals|departures|terminal|station)/i,
    /(waiting|here)\s+(at|in)\s+(the\s+)?(airport|arrivals|car\s+park)/i,
    /border\s+control/i,
    /just\s+(landed)/i,
  ];

  for (const pattern of physicalPersonPatterns) {
    if (pattern.test(message)) {
      return {
        sentiment: "neutral",
        urgency: "medium", // Changed from 'low' - callback requests need attention
        requiresStaffAttention: true,
        sentimentKeywords: [],
        intent: "unclear",
        intentConfidence: 0.5,
        contentType: "unclear",
        shouldAIRespond: false,
        contextConfidence: 0.85,
        isDirectedAtAI: false,
        reasoning: "Message directed at John or physical person - not for AI",
        customerName: null,
        nameConfidence: 0,
        overallConfidence: 0.8,
      };
    }
  }

  // 5. Follow-up questions (customer continuing previous topic)
  const followUpPatterns = [
    /^(and|also|what about|how about)\s+(the\s+)?(battery|screen|back|camera|charging|speaker|microphone)/i,
    /^(and|also)\s+(do you|can you|could you)/i,
    /^what about/i,
    /^how about/i,
  ];

  for (const pattern of followUpPatterns) {
    if (pattern.test(message)) {
      return {
        sentiment: "neutral",
        urgency: "low",
        requiresStaffAttention: false,
        sentimentKeywords: [],
        intent: "question",
        intentConfidence: 0.8,
        contentType: "unclear", // Will be determined by AI with context
        shouldAIRespond: true,
        contextConfidence: 0.75,
        isDirectedAtAI: true,
        reasoning: "Follow-up question - continuing previous topic",
        customerName: null,
        nameConfidence: 0,
        overallConfidence: 0.75,
      };
    }
  }

  // 6. Simple questions (can respond)
  const simpleQuestionPatterns = [
    /when (are|do) you (open|close)/i,
    /what (time|are your hours)/i,
    /where are you/i,
    /how much (for|is|does)/i,
    /do you (fix|repair|do)/i,
    // "Are you in the shop today?" / "Are you there today?"
    /are you (in|at) (the )?(shop|store)/i,
    /are you there (today|tomorrow|now)/i,
    /is (the )?(shop|store) open/i,
    /you open (today|tomorrow|now)/i,
    /are you open/i,
  ];

  for (const pattern of simpleQuestionPatterns) {
    if (pattern.test(message)) {
      // Detect content type from pattern
      let contentType: UnifiedAnalysis["contentType"] = "unclear";
      if (
        /when (are|do) you (open|close)|what (time|are your hours)|are you (in|at) (the )?(shop|store)|are you there (today|tomorrow|now)|is (the )?(shop|store) open|you open (today|tomorrow|now)|are you open/i.test(
          message
        )
      ) {
        contentType = "business_hours";
      } else if (/where are you|location|address/i.test(message)) {
        contentType = "location";
      } else if (/how much/i.test(message)) {
        contentType = "pricing";
      } else if (/do you (fix|repair|do)/i.test(message)) {
        contentType = "services";
      }

      return {
        sentiment: "neutral",
        urgency: "low",
        requiresStaffAttention: false,
        sentimentKeywords: [],
        intent: "question",
        intentConfidence: 0.85,
        contentType,
        shouldAIRespond: true,
        contextConfidence: 0.85,
        isDirectedAtAI: true,
        reasoning: "Simple question AI can answer",
        customerName: null,
        nameConfidence: 0,
        overallConfidence: 0.85,
      };
    }
  }

  // Need AI analysis for uncertain cases
  return null;
}

/**
 * Full AI analysis (when regex is uncertain)
 */
export async function analyzeWithAI(
  message: string,
  recentMessages: Array<{ sender: string; text: string }>,
  apiKey: string
): Promise<UnifiedAnalysis> {
  try {
    const openai = new OpenAI({ apiKey });

    // Build conversation context (use last 10 messages for better awareness)
    const contextStr = recentMessages
      .slice(-10) // Last 10 messages
      .map(
        (m) =>
          `${m.sender === "staff" ? "John (Owner)" : "Customer"}: ${m.text}`
      )
      .join("\n");

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content: `You are an expert customer service analyst. Analyze the customer's message and provide a comprehensive assessment.

RECENT CONVERSATION CONTEXT:
${contextStr || "No previous messages"}

ANALYZE THE FOLLOWING:

1. SENTIMENT:
   - positive: Happy, satisfied, grateful
   - neutral: Factual, no strong emotion, describing device issues
   - negative: Disappointed, concerned
   - frustrated: Impatient, annoyed, repeated questions, expressing dissatisfaction with SERVICE
   - angry: Very upset, threatening, demanding

   IMPORTANT: Device descriptions are NEUTRAL, not frustrated!
   ✅ "dead phone", "broken screen", "cracked display", "won't turn on" = NEUTRAL (device issue)
   ❌ "third time asking", "still waiting", "terrible service" = FRUSTRATED (service issue)

2. URGENCY:
   - low: Casual inquiry, no time pressure
   - medium: Wants response soon
   - high: Needs immediate attention, impatient
   - critical: Emergency, very upset, threatening to leave

3. INTENT (what customer wants):
   - question: Asking for information
   - complaint: Expressing dissatisfaction
   - booking: Wants to book/schedule
   - status_check: Checking on existing repair
   - greeting: Introducing themselves
   - acknowledgment: Simple "ok", "thanks", etc.
   - device_issue: Technical problem with device
   - buyback: Wants to sell device
   - purchase: Wants to buy device
   - unclear: Can't determine intent

4. CONTENT TYPE (specific topic):
   Questions: pricing, business_hours, location, services, warranty
   Device Issues: troubleshooting, water_damage, battery_issue, screen_damage, camera_issue, charging_issue, software_issue
   Transactions: device_sale, device_purchase, appointment, repair_status
   Communication: introduction, acknowledgment, dissatisfaction, unclear

5. CONTEXT CONFIDENCE:
   - Is message directed at AI or at a physical person?
   - Does message make sense in context?
   - Would AI response be helpful or confusing?
   - Should AI respond or stay silent?
   
   CRITICAL: AI should NOT respond if:
   - Customer asks staff to call them back ("phone me when you start", "give me a call")
   - Customer is physically waiting at location ("I'm outside", "I'm here", "just arrived")
   - Customer is at airport/station waiting for pickup ("I'm at arrivals", "just landed")
   - Message is directed at John specifically ("Hi John", "John, I'm here")
   - Customer is describing someone physically ("for the tall guy with beard")
   
   AI SHOULD respond if:
   - Customer asks about pricing, hours, services ("how much for screen?", "when are you open?")
   - Customer has device issue and wants help ("my phone won't turn on")
   - Customer wants to book appointment via text ("can I book in for tomorrow?")
   - Follow-up questions about previous topic ("what about the battery?")

6. NAME EXTRACTION:
   - Extract customer's first name ONLY when they clearly identify themselves
   - Common patterns: "Hi, I'm Carol", "This is Mike", "Carol here", "My name is Sarah"
   - Email signatures: "Regards, Maurice", "Thanks, Sarah", "Cheers, Mike", "Best, Carol"
   - Casual mentions: "It's Maurice", "Maurice speaking", "Call me Mike"
   - End of message: "...login with you. Regards, Maurice." or "...see you soon. Sarah"
   
   CRITICAL VALIDATION RULES:
   - MUST be a real person's name (not common words like "there", "here", "fine", "good")
   - MUST be capitalized in the message (names are proper nouns)
   - MUST make sense as someone's name (not verbs, adjectives, or pronouns)
   - DON'T extract from greetings like "Hi there!" or "Hello there" (there = greeting, not name)
   - DON'T extract "John" (that's staff)
   - DON'T extract common words even if capitalized at start of sentence
   
   WHEN IN DOUBT: Return null. It's better to miss a name than extract a wrong one.

NAME EXTRACTION EXAMPLES:
✅ "Good morning John. If you can phone me when you start work. Regards, Maurice." → "Maurice"
✅ "Hi, I'm Carol" → "Carol"
✅ "Thanks for your help. Sarah" → "Sarah"
✅ "This is Mike calling about my phone" → "Mike"
✅ "Cheers, Dave" → "Dave"
✅ "...see you soon. Best, Emma" → "Emma"
✅ "That fine then. Thanks Kaileb" → "Kaileb"
❌ "Your phone is ready. Many thanks, John" → null (John is staff)
❌ "Thanks for the help" → null (no name)
❌ "Hi there! Can you help?" → null ("there" is greeting, not name)
❌ "there! We can certainly help" → null ("there" is not a name)

CRITICAL RULES FOR requiresStaffAttention:
- Set to FALSE for: questions, device issues, pricing inquiries, general inquiries
- Set to TRUE for: complaints about service, callback requests, physically waiting at location, directed at John
- Device problems ("dead phone", "broken screen") = FALSE (AI can help)
- Service problems ("third time asking", "terrible service") = TRUE (needs staff)
- Callback requests ("phone me when", "give me a call") = TRUE (needs staff)
- Physical location ("I'm outside", "I'm here", "just arrived") = TRUE (needs staff)
- Airport/pickup ("I'm at arrivals", "just landed") = TRUE (needs staff)

OUTPUT FORMAT (JSON only, no markdown):
{
  "sentiment": "positive|neutral|negative|frustrated|angry",
  "urgency": "low|medium|high|critical",
  "requiresStaffAttention": true|false,
  "sentimentKeywords": ["keyword1", "keyword2"],
  "intent": "question|complaint|booking|status_check|greeting|acknowledgment|device_issue|buyback|purchase|unclear",
  "intentConfidence": 0.0-1.0,
  "contentType": "pricing|business_hours|location|services|warranty|troubleshooting|water_damage|battery_issue|screen_damage|camera_issue|charging_issue|software_issue|device_sale|device_purchase|appointment|repair_status|introduction|acknowledgment|dissatisfaction|unclear",
  "shouldAIRespond": true|false,
  "contextConfidence": 0.0-1.0,
  "isDirectedAtAI": true|false,
  "reasoning": "Brief explanation of decision",
  "customerName": "Name" or null,
  "nameConfidence": 0.0-1.0,
  "overallConfidence": 0.0-1.0
}`,
        },
        {
          role: "user",
          content: `Analyze this message: "${message}"`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim() || "{}";

    // Parse JSON response
    const analysis = JSON.parse(content) as UnifiedAnalysis;

    // Validate extracted name - reject common words
    if (analysis.customerName) {
      const invalidNames = [
        "there",
        "here",
        "fine",
        "good",
        "great",
        "ok",
        "okay",
        "yes",
        "no",
        "thanks",
        "thank",
        "cheers",
        "hi",
        "hello",
        "hey",
        "bye",
        "goodbye",
        "please",
        "sorry",
        "sure",
        "right",
        "well",
        "just",
        "now",
        "then",
      ];

      if (invalidNames.includes(analysis.customerName.toLowerCase())) {
        console.log(
          "[Unified Analysis] ❌ Rejected invalid name:",
          analysis.customerName
        );
        analysis.customerName = null;
        analysis.nameConfidence = 0;
      }
    }

    // CRITICAL FIX: Device issues should NOT require staff attention
    // AI can handle questions about broken/dead devices
    if (analysis.intent === "device_issue" || analysis.intent === "question") {
      if (
        analysis.requiresStaffAttention &&
        analysis.sentiment !== "frustrated" &&
        analysis.sentiment !== "angry"
      ) {
        console.log(
          "[Unified Analysis] ✅ Override: Device issue/question - AI can handle"
        );
        analysis.requiresStaffAttention = false;
        analysis.shouldAIRespond = true;
      }
    }

    console.log("[Unified Analysis] AI result:", {
      sentiment: analysis.sentiment,
      intent: analysis.intent,
      requiresStaffAttention: analysis.requiresStaffAttention,
      shouldRespond: analysis.shouldAIRespond,
      confidence: analysis.overallConfidence,
      customerName: analysis.customerName,
    });

    return analysis;
  } catch (error) {
    console.error("[Unified Analysis] AI error:", error);

    // Safe fallback
    return {
      sentiment: "neutral",
      urgency: "medium",
      requiresStaffAttention: true,
      sentimentKeywords: [],
      intent: "unclear",
      intentConfidence: 0.3,
      contentType: "unclear",
      shouldAIRespond: false,
      contextConfidence: 0.3,
      isDirectedAtAI: true,
      reasoning: "AI analysis failed - defaulting to manual mode for safety",
      customerName: null,
      nameConfidence: 0,
      overallConfidence: 0.3,
    };
  }
}

/**
 * Main entry point - uses regex first, AI if uncertain
 */
export async function analyzeMessage(
  message: string,
  recentMessages: Array<{ sender: string; text: string }>,
  apiKey?: string
): Promise<UnifiedAnalysis> {
  // Try quick regex analysis first
  const quickResult = quickAnalysis(message, recentMessages);

  if (quickResult) {
    console.log("[Unified Analysis] Regex result:", {
      sentiment: quickResult.sentiment,
      intent: quickResult.intent,
      shouldRespond: quickResult.shouldAIRespond,
      confidence: quickResult.overallConfidence,
    });
    return quickResult;
  }

  // Need AI analysis
  if (!apiKey) {
    console.log("[Unified Analysis] No API key - defaulting to safe mode");
    return {
      sentiment: "neutral",
      urgency: "medium",
      requiresStaffAttention: true,
      sentimentKeywords: [],
      intent: "unclear",
      intentConfidence: 0.5,
      contentType: "unclear",
      shouldAIRespond: false,
      contextConfidence: 0.5,
      isDirectedAtAI: true,
      reasoning: "No API key available - defaulting to manual mode for safety",
      customerName: null,
      nameConfidence: 0,
      overallConfidence: 0.5,
    };
  }

  console.log("[Unified Analysis] Using AI for uncertain case...");
  return analyzeWithAI(message, recentMessages, apiKey);
}
