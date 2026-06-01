/**
 * Map AI intent classification to request type for template selection
 */

import { classifyIntent } from "@/lib/ai/intent-classifier";
import type { IntentClassification } from "@/lib/ai/intent-classifier";

export type RequestType =
  | "opening_hours"
  | "lunch_closure"
  | "booking_question"
  | "drop_in_question"
  | "new_repair_request"
  | "screen_quote"
  | "battery_quote"
  | "charging_port_quote"
  | "technical_support"
  | "email_issue"
  | "device_setup"
  | "data_transfer"
  | "virus_or_popups"
  | "repair_status_request"
  | "price_question"
  | "deposit_question"
  | "complaint_or_confusion"
  | "unknown_or_complex";

/**
 * Map intent classification to request type
 * Returns the intent directly since we now have 17 categories
 */
export function mapIntentToRequestType(
  classification: IntentClassification,
): RequestType {
  const { intent, confidence } = classification;

  // If confidence is below 90%, escalate to unknown_or_complex
  if (confidence < 0.9) {
    return "unknown_or_complex";
  }

  // Return the intent directly as the request type
  return intent as RequestType;
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
  shouldEscalate: boolean;
}> {
  const classification = await classifyIntent(params);
  const requestType = mapIntentToRequestType(classification);

  // Escalate if confidence is low or if it's a complex category
  const shouldEscalate =
    classification.confidence < 0.9 ||
    requestType === "unknown_or_complex" ||
    requestType === "complaint_or_confusion" ||
    requestType === "technical_support" ||
    requestType === "email_issue" ||
    requestType === "device_setup" ||
    requestType === "data_transfer" ||
    requestType === "virus_or_popups";

  return {
    requestType,
    classification,
    shouldEscalate,
  };
}
