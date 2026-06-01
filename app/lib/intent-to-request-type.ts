/**
 * Map AI intent classification to request type for template selection
 */

import { classifyIntent } from "@/lib/ai/intent-classifier";
import type { IntentClassification } from "@/lib/ai/intent-classifier";

export type RequestType = "quote" | "technical_support" | "dont_know";

/**
 * Map intent classification to request type
 */
export function mapIntentToRequestType(
  classification: IntentClassification,
): RequestType {
  const { intent, confidence } = classification;

  // If confidence is low, default to dont_know (needs human review)
  if (confidence < 0.6) {
    return "dont_know";
  }

  // Quote-related intents - customer wants a repair quote
  switch (intent) {
    case "screen_repair":
    case "battery_replacement":
    case "diagnostic":
    case "buyback":
    case "sell_device":
    case "warranty_claim":
      return "quote";

    case "status_check":
      // Status check is about existing repair - not a new quote
      // But we can't check status, so pass to John
      return "dont_know";

    case "general_info":
      // General info could be technical support or just simple questions
      // We'll need to check the actual message content
      // For now, treat as dont_know to be safe
      return "dont_know";

    default:
      return "dont_know";
  }
}

/**
 * Analyze message and determine request type using AI
 */
export async function determineRequestType(params: {
  customerMessage: string;
  conversationHistory?: Array<{ sender: string; text: string }>;
  apiKey: string;
}): Promise<{
  requestType: RequestType;
  classification: IntentClassification;
}> {
  const classification = await classifyIntent(params);
  const requestType = mapIntentToRequestType(classification);

  return {
    requestType,
    classification,
  };
}
