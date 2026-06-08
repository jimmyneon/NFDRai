/**
 * Intent Classifier
 * Uses GPT-4o-mini for fast, cheap intent classification
 * Runs BEFORE main response generation to determine which prompt module to load
 */

import { ConversationIntent } from "./conversation-state";

export interface IntentClassification {
  intent: ConversationIntent;
  confidence: number;
  deviceType?: "iphone" | "ipad" | "macbook" | "laptop" | "samsung" | "other";
  deviceModel?: string;
  urgency?: "same_day" | "routine" | "unknown";
  reasoning?: string;
}

/**
 * Classify customer intent using GPT-4o-mini
 * Fast and cheap (~$0.0001 per classification vs $0.01 for full response)
 */
export async function classifyIntent(params: {
  customerMessage: string;
  conversationHistory?: Array<{ sender: string; text: string }>;
  apiKey: string;
}): Promise<IntentClassification> {
  const { customerMessage, conversationHistory = [], apiKey } = params;

  // Build context from recent messages
  const recentContext = conversationHistory
    .slice(-3) // Only last 3 messages
    .map((m) => `${m.sender}: ${m.text}`)
    .join("\n");

  const classificationPrompt = `You are an intent classifier for a device repair shop. Analyze the customer message WITH CONTEXT and classify it into ONE category.

CATEGORIES:
- opening_hours: Customer asks about opening hours, closing time, when open
- lunch_closure: Customer asks about lunch breaks, closed for lunch
- booking_question: Customer asks about booking appointments, scheduling repairs
- drop_in_question: Customer asks about dropping in without appointment, walk-ins
- repair_status: Customer asks about existing repair status, "is it ready", "when done"
- technical_support: Customer asks for help with a technical issue, troubleshooting
- email_issue: Customer has email problems, can't send/receive emails
- device_setup: Customer needs help setting up a new device, transferring data
- data_transfer: Customer wants to transfer data from old to new device
- virus_or_popups: Customer mentions virus, malware, popups, slow performance
- deposit_question: Customer asks about deposits, payment terms
- complaint_or_confusion: Customer sounds angry, confused, or challenging something
- unknown_or_complex: Unclear intent, complex request, or multiple topics

CRITICAL RULES:
- If confidence < 0.9, classify as unknown_or_complex (escalation required)
- If customer sounds angry/frustrated, classify as complaint_or_confusion
- If customer asks technical fault questions, classify as technical_support
- If customer asks for exact quote without device details, classify as unknown_or_complex
- If customer asks about existing repair status, classify as repair_status
- DO NOT classify as specific repair quote types (screen, battery, etc.) - use unknown_or_complex instead

CONTEXT MATTERS:
- If conversation just started → Likely NEW inquiry
- If customer just told you device model → Use that context
- If no previous repair mentioned → NEW repair, not status check

RECENT CONVERSATION:
${recentContext || "No previous messages - this is likely a NEW inquiry"}

CURRENT MESSAGE:
${customerMessage}

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "intent": "category_name",
  "confidence": 0.0-1.0,
  "deviceType": "iphone|ipad|macbook|laptop|samsung|other" (if mentioned),
  "deviceModel": "exact model" (if mentioned),
  "urgency": "same_day|routine|unknown",
  "reasoning": "brief explanation"
}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Cheap and fast
        messages: [
          {
            role: "system",
            content:
              "You are an intent classifier. Respond ONLY with valid JSON, no markdown formatting.",
          },
          {
            role: "user",
            content: classificationPrompt,
          },
        ],
        temperature: 0.3, // Low temperature for consistent classification
        max_tokens: 150, // Small response
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "{}";

    // Clean up response (remove markdown code blocks if present)
    const cleanContent = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const classification = JSON.parse(cleanContent) as IntentClassification;

    console.log("[Intent Classifier] Result:", {
      intent: classification.intent,
      confidence: classification.confidence,
      device: classification.deviceModel || classification.deviceType,
      reasoning: classification.reasoning,
    });

    return classification;
  } catch (error) {
    console.error("[Intent Classifier] Error:", error);

    // Fallback to rule-based classification
    return fallbackClassification(customerMessage, conversationHistory);
  }
}

/**
 * Fallback rule-based classification if API fails
 */
function fallbackClassification(
  message: string,
  history: Array<{ sender: string; text: string }>,
): IntentClassification {
  const lowerMessage = message.toLowerCase();
  const allText = [message, ...history.map((h) => h.text)]
    .join(" ")
    .toLowerCase();

  // Screen repair patterns
  if (lowerMessage.match(/screen|crack|smash|broken|shatter|display/)) {
    return {
      intent: "screen_repair",
      confidence: 0.85,
      deviceType: extractDeviceType(allText),
      reasoning: "Detected screen-related keywords",
    };
  }

  // Battery patterns
  if (lowerMessage.match(/battery|drain|charg|power|dying|dead/)) {
    return {
      intent: "battery_replacement",
      confidence: 0.85,
      deviceType: extractDeviceType(allText),
      reasoning: "Detected battery-related keywords",
    };
  }

  // Diagnostic patterns
  if (lowerMessage.match(/won't turn on|not working|broken|dead|fix/)) {
    return {
      intent: "diagnostic",
      confidence: 0.75,
      deviceType: extractDeviceType(allText),
      reasoning: "Detected diagnostic keywords",
    };
  }

  // Buyback patterns - include past tense "sold" and variations
  if (
    lowerMessage.match(
      /sell|sold|selling|buy my|trade.?in|how much.*worth|valuation/,
    )
  ) {
    return {
      intent: "buyback",
      confidence: 0.8,
      deviceType: extractDeviceType(allText),
      reasoning: "Detected buyback keywords",
    };
  }

  // Warranty patterns
  if (
    lowerMessage.match(/warranty|still.*not working|repaired.*before|came back/)
  ) {
    return {
      intent: "warranty_claim",
      confidence: 0.8,
      reasoning: "Detected warranty keywords",
    };
  }

  // Status check patterns - BE VERY SPECIFIC
  // Only match if explicitly asking about existing repair
  if (
    lowerMessage.match(
      /is\s+(it|my|the).*(ready|done|finished)|can\s+i\s+pick.*up|repair\s+status|when\s+will.*be\s+(ready|done)/,
    )
  ) {
    return {
      intent: "status_check",
      confidence: 0.85,
      reasoning: "Detected explicit status check question",
    };
  }

  // "I'm ready" or "ready to bring it in" = NOT status check
  if (lowerMessage.match(/i'?m\s+ready|ready\s+to/)) {
    return {
      intent: "diagnostic",
      confidence: 0.75,
      reasoning: "Customer ready to proceed with repair",
    };
  }

  // Default to general inquiry
  return {
    intent: "general_info",
    confidence: 0.6,
    reasoning: "No specific intent detected - general inquiry",
  };
}

/**
 * Extract device type from text
 */
function extractDeviceType(text: string): IntentClassification["deviceType"] {
  if (text.includes("iphone")) return "iphone";
  if (text.includes("ipad")) return "ipad";
  if (text.includes("macbook")) return "macbook";
  if (text.includes("samsung")) return "samsung";
  if (text.includes("laptop")) return "laptop";
  return undefined;
}

/**
 * Batch classify multiple messages (for analytics)
 */
export async function batchClassifyIntents(params: {
  messages: Array<{ id: string; text: string }>;
  apiKey: string;
}): Promise<Map<string, IntentClassification>> {
  const results = new Map<string, IntentClassification>();

  // Process in parallel (but limit concurrency to avoid rate limits)
  const batchSize = 5;
  for (let i = 0; i < params.messages.length; i += batchSize) {
    const batch = params.messages.slice(i, i + batchSize);

    const classifications = await Promise.all(
      batch.map((msg) =>
        classifyIntent({
          customerMessage: msg.text,
          apiKey: params.apiKey,
        }).catch((error) => {
          console.error(
            `[Batch Classifier] Error for message ${msg.id}:`,
            error,
          );
          return fallbackClassification(msg.text, []);
        }),
      ),
    );

    batch.forEach((msg, idx) => {
      results.set(msg.id, classifications[idx]);
    });
  }

  return results;
}

/**
 * Validate classification confidence
 * Returns true if confidence is high enough to use
 */
export function isConfidentClassification(
  classification: IntentClassification,
  threshold: number = 0.7,
): boolean {
  return classification.confidence >= threshold;
}

/**
 * Get suggested follow-up questions based on intent
 */
export function getSuggestedQuestions(intent: ConversationIntent): string[] {
  const questions: Record<ConversationIntent, string[]> = {
    screen_repair: [
      "What make and model is your device?",
      "Is the screen cracked or not responding?",
      "When do you need it done by?",
    ],
    battery_replacement: [
      "What device do you have?",
      "What's your battery health percentage?",
      "How long has the battery been an issue?",
    ],
    diagnostic: [
      "What device is it?",
      "What symptoms are you experiencing?",
      "Have you tried restarting it?",
    ],
    buyback: [
      "What device are you looking to sell?",
      "What condition is it in?",
      "Do you have the box and accessories?",
    ],
    sell_device: [
      "What device are you looking for?",
      "What's your budget?",
      "Any specific requirements?",
    ],
    warranty_claim: [
      "When did we do the repair?",
      "What issue are you experiencing now?",
      "Is it the same issue or something different?",
    ],
    status_check: [
      "What's your name?",
      "What device did you bring in?",
      "When did you drop it off?",
    ],
    general_info: [
      "What can I help you with?",
      "Are you looking for a repair, sale, or purchase?",
    ],
    unknown: [
      "What can I help you with today?",
      "Are you looking to repair, buy, or sell a device?",
    ],
  };

  return questions[intent] || questions.unknown;
}
