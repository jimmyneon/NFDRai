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
  | "repair_status"
  | "technical_support"
  | "email_issue"
  | "device_setup"
  | "data_transfer"
  | "virus_or_popups"
  | "deposit_question"
  | "complaint_or_confusion"
  | "unknown_or_complex";

/**
 * Map intent classification to request type
 * Returns the intent directly since we now have 13 categories
 */
export function mapIntentToRequestType(
  classification: IntentClassification,
): RequestType {
  const { intent, confidence } = classification;

  // If confidence is below 65%, treat as unknown so the full AI handles it
  if (confidence < 0.65) {
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

  // Only escalate for categories where a human genuinely needs to step in
  // unknown_or_complex will fall through to the smart AI, not a generic template
  const shouldEscalate = requestType === "complaint_or_confusion";

  return {
    requestType,
    classification,
    shouldEscalate,
  };
}
