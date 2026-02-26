/**
 * Integration layer for Human Control Window system
 * Replaces old 30-minute pause logic with intent-based gating
 */

import { classifyIntent, shouldAIRespondWithIntent } from "./intent-classifier";
import {
  getHumanControlStatus,
  shouldAIRespondWithControl,
  CONTROL_WINDOW_HOURS,
  SINGLE_SHOT_COOLDOWN_HOURS,
} from "./human-control-window";

export interface AIResponseDecision {
  shouldRespond: boolean;
  reason: string;
  intent?: string;
  controlStatus?: any;
  requiresAlert: boolean;
}

/**
 * Main decision function - determines if AI should respond to a message
 * Replaces old shouldAIRespond() from simple-query-detector.ts
 */
export async function shouldAIRespondNew(
  conversationId: string,
  message: string
): Promise<AIResponseDecision> {
  console.log("[Human Control] Analyzing message for AI response decision...");

  // Step 1: Classify message intent
  const classification = classifyIntent(message);
  console.log("[Human Control] Intent classification:", {
    intent: classification.intent,
    confidence: classification.confidence,
    allowDuringControl: classification.allowAIDuringHumanControl,
  });

  // Step 2: Get Human Control Window status
  const controlStatus = await getHumanControlStatus(conversationId);
  console.log("[Human Control] Control status:", {
    isActive: controlStatus.isActive,
    hoursRemaining: controlStatus.hoursRemaining.toFixed(1),
    controlMode: controlStatus.controlMode,
    canAIRespond: controlStatus.canAIRespond,
  });

  // Step 3: Check if AI should respond based on intent + control status
  const intentDecision = shouldAIRespondWithIntent(
    classification,
    controlStatus.isActive,
    controlStatus.aiMutedUntil
  );

  // Step 4: Check single-shot cooldown
  if (controlStatus.lastAIResponseAt && !classification.allowAIDuringHumanControl) {
    const hoursSinceLastResponse =
      (Date.now() - controlStatus.lastAIResponseAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastResponse < SINGLE_SHOT_COOLDOWN_HOURS) {
      return {
        shouldRespond: false,
        reason: `AI cooldown active - last response ${hoursSinceLastResponse.toFixed(1)}h ago (${(SINGLE_SHOT_COOLDOWN_HOURS - hoursSinceLastResponse).toFixed(1)}h remaining)`,
        intent: classification.intent,
        controlStatus,
        requiresAlert: true,
      };
    }
  }

  // Step 5: Make final decision
  const shouldRespond = intentDecision.shouldRespond;
  const requiresAlert = !shouldRespond && classification.intent !== "ACKNOWLEDGMENT";

  console.log("[Human Control] Final decision:", {
    shouldRespond,
    reason: intentDecision.reason,
    requiresAlert,
  });

  return {
    shouldRespond,
    reason: intentDecision.reason,
    intent: classification.intent,
    controlStatus,
    requiresAlert,
  };
}

/**
 * Format decision for logging/display
 */
export function formatDecisionLog(decision: AIResponseDecision): string {
  const emoji = decision.shouldRespond ? "✅" : "⏸️";
  const alert = decision.requiresAlert ? " [ALERT STAFF]" : "";
  return `${emoji} ${decision.reason}${alert}`;
}

/**
 * Get user-friendly explanation of Human Control Window status
 */
export function getControlStatusExplanation(controlStatus: any): string {
  if (controlStatus.controlMode === "permanently_muted") {
    return "AI permanently muted - human only mode";
  }

  if (controlStatus.controlMode === "safe_faq_only") {
    return "Safe FAQ only mode - AI responds to hours/location/parking only";
  }

  if (controlStatus.isActive) {
    return `Human Control Window active - ${controlStatus.hoursRemaining.toFixed(1)}h remaining (until ${controlStatus.aiMutedUntil?.toLocaleTimeString()})`;
  }

  if (controlStatus.lastAIResponseAt) {
    const hoursSince =
      (Date.now() - controlStatus.lastAIResponseAt.getTime()) / (1000 * 60 * 60);
    const cooldownRemaining = SINGLE_SHOT_COOLDOWN_HOURS - hoursSince;

    if (cooldownRemaining > 0) {
      return `AI cooldown active - ${cooldownRemaining.toFixed(1)}h remaining`;
    }
  }

  return "No restrictions - AI can respond normally";
}
