/**
 * Module Selector
 *
 * Maps intent + contentType to specific prompt modules
 * Ensures AI loads ONLY relevant modules for each conversation
 */

import { UnifiedAnalysis } from "./unified-message-analyzer";

/**
 * Get list of prompt modules to load based on analysis
 */
export function getModulesForAnalysis(analysis: UnifiedAnalysis): string[] {
  // Always load core modules
  const modules = [
    "core_identity",
    "unknown_service_policy",
    "context_awareness",
    "duplicate_prevention",
  ];

  const { intent, contentType } = analysis;

  // PRICING QUESTIONS
  if (intent === "question" && contentType === "pricing") {
    modules.push(
      "pricing_flow_detailed",
      "services_comprehensive",
      "operational_policies",
      "time_aware_responses"
    );
  }

  // BUSINESS HOURS
  else if (intent === "question" && contentType === "business_hours") {
    modules.push(
      "time_aware_responses",
      "time_awareness",
      "operational_policies"
    );
  }

  // LOCATION
  else if (intent === "question" && contentType === "location") {
    modules.push("time_aware_responses", "operational_policies");
  }

  // GENERAL SERVICES
  else if (intent === "question" && contentType === "services") {
    modules.push(
      "services_comprehensive",
      "operational_policies",
      "device_quick_reference"
    );
  }

  // WARRANTY
  else if (intent === "question" && contentType === "warranty") {
    modules.push(
      "operational_policies",
      "common_scenarios",
      "services_comprehensive"
    );
  }

  // REPAIR STATUS
  else if (intent === "status_check") {
    modules.push("status_check", "handoff_rules", "time_aware_responses");
  }

  // COMPLAINT
  else if (intent === "complaint") {
    modules.push(
      "handoff_rules",
      "confidence_based_handoff",
      "operational_policies"
    );
  }

  // BOOKING
  else if (intent === "booking") {
    modules.push(
      "time_aware_responses",
      "operational_policies",
      "services_comprehensive"
    );
  }

  // GREETING/INTRODUCTION
  else if (intent === "greeting") {
    modules.push("efficient_questioning", "ask_whats_wrong_first");
  }

  // DEVICE ISSUES - TROUBLESHOOTING
  else if (intent === "device_issue" && contentType === "troubleshooting") {
    modules.push(
      "proactive_troubleshooting",
      "device_quick_reference",
      "common_scenarios",
      "diagnostic",
      "ask_whats_wrong_first"
    );
  }

  // DEVICE ISSUES - WATER DAMAGE
  else if (intent === "device_issue" && contentType === "water_damage") {
    modules.push("common_scenarios", "diagnostic", "operational_policies");
  }

  // DEVICE ISSUES - BATTERY
  else if (intent === "device_issue" && contentType === "battery_issue") {
    modules.push(
      "battery_replacement",
      "common_scenarios",
      "pricing_flow_detailed"
    );
  }

  // DEVICE ISSUES - SCREEN
  else if (intent === "device_issue" && contentType === "screen_damage") {
    modules.push(
      "screen_repair",
      "pricing_flow_detailed",
      "operational_policies"
    );
  }

  // DEVICE ISSUES - CAMERA
  else if (intent === "device_issue" && contentType === "camera_issue") {
    modules.push("common_scenarios", "diagnostic", "operational_policies");
  }

  // DEVICE ISSUES - CHARGING
  else if (intent === "device_issue" && contentType === "charging_issue") {
    modules.push("diagnostic", "common_scenarios", "operational_policies");
  }

  // DEVICE ISSUES - SOFTWARE
  else if (intent === "device_issue" && contentType === "software_issue") {
    modules.push(
      "common_scenarios",
      "services_comprehensive",
      "operational_policies"
    );
  }

  // BUYBACK
  else if (intent === "buyback") {
    modules.push("buyback", "common_scenarios", "efficient_questioning");
  }

  // PURCHASE
  else if (intent === "purchase") {
    modules.push(
      "services_comprehensive",
      "common_scenarios",
      "operational_policies"
    );
  }

  // UNCLEAR - minimal modules
  else if (intent === "unclear") {
    modules.push("efficient_questioning", "handoff_rules");
  }

  // Add communication modules (always useful)
  modules.push("friendly_tone", "typo_tolerance");

  return modules;
}

/**
 * Get module names as comma-separated string for logging
 */
export function getModuleNamesString(modules: string[]): string {
  return modules.join(", ");
}

/**
 * Log module selection decision
 */
export function logModuleSelection(
  analysis: UnifiedAnalysis,
  modules: string[]
): void {
  console.log("[Module Selection]", {
    intent: analysis.intent,
    contentType: analysis.contentType,
    modulesCount: modules.length,
    modules: getModuleNamesString(modules),
  });
}
