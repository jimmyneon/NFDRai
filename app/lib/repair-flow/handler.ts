/**
 * Repair Flow Handler
 *
 * Handles the guided repair flow for the website widget.
 * Returns structured responses with scene data for UI rendering.
 */

import { createServiceClient } from "@/lib/supabase/service";
import { generateSmartResponse } from "@/lib/ai/smart-response-generator";
import {
  RepairFlowRequest,
  RepairFlowResponse,
  RepairFlowContext,
  RepairScene,
  QuickAction,
  DeviceType,
} from "./types";
import {
  DEVICE_CONFIGS,
  DEVICE_SELECTION_ACTIONS,
  ISSUE_SELECTION_ACTIONS,
  BOOKING_ACTIONS,
  getDeviceConfig,
  getJobFromDevice,
  issueToJobId,
} from "./device-config";

// ============================================
// MAIN HANDLER
// ============================================

export async function handleRepairFlow(
  request: RepairFlowRequest,
  sessionId?: string
): Promise<RepairFlowResponse> {
  const { message, context } = request;

  console.log("[Repair Flow] Processing:", {
    step: context.step,
    message,
    device: context.device_type,
  });

  switch (context.step) {
    case "greeting":
      return handleGreeting();

    case "device_selected":
      return handleDeviceSelected(context);

    case "issue_selected":
      return await handleIssueSelected(context);

    case "question":
    case "final":
      return await handleFreeTextQuestion(message, context);

    default:
      return handleGreeting();
  }
}

// ============================================
// STEP HANDLERS
// ============================================

/**
 * Step 1: Initial greeting - show device selection
 */
function handleGreeting(): RepairFlowResponse {
  return {
    type: "repair_flow_response",
    messages: [
      "Hi! I'm Steve, your AI repair assistant. 👋",
      "What device do you need help with today?",
    ],
    scene: null,
    quick_actions: DEVICE_SELECTION_ACTIONS,
    morph_layout: false,
  };
}

/**
 * Step 2: Device selected - show issue selection
 */
function handleDeviceSelected(context: RepairFlowContext): RepairFlowResponse {
  const deviceConfig = context.device_type
    ? getDeviceConfig(context.device_type)
    : null;

  if (!deviceConfig) {
    // Unknown device - ask for clarification
    return {
      type: "repair_flow_response",
      messages: [
        "I'd be happy to help! Could you tell me what type of device you have?",
        "We repair phones, tablets, laptops, MacBooks, and gaming consoles.",
      ],
      scene: null,
      quick_actions: DEVICE_SELECTION_ACTIONS,
      morph_layout: false,
    };
  }

  const scene: RepairScene = {
    device_type: deviceConfig.type,
    device_name: context.device_model || deviceConfig.name,
    device_image: deviceConfig.image,
    device_summary: context.device_model || deviceConfig.name,
    jobs: deviceConfig.jobs,
    selected_job: null,
    price_estimate: null,
    show_book_cta: false,
  };

  // Customize quick actions based on device type
  let issueActions = ISSUE_SELECTION_ACTIONS;

  // For gaming consoles, show different options
  if (["ps5", "ps4", "xbox", "switch"].includes(deviceConfig.type || "")) {
    issueActions = [
      { icon: "fa-tv", label: "HDMI/Display", value: "hdmi" },
      { icon: "fa-compact-disc", label: "Disc Drive", value: "disc-drive" },
      {
        icon: "fa-temperature-high",
        label: "Overheating",
        value: "overheating",
      },
      { icon: "fa-question-circle", label: "Something else", value: "other" },
    ];
  }

  return {
    type: "repair_flow_response",
    messages: [
      `Great! ${getDeviceArticle(deviceConfig.name)} ${
        deviceConfig.name
      }. What seems to be the problem?`,
    ],
    scene,
    quick_actions: issueActions,
    morph_layout: true,
  };
}

/**
 * Step 3: Issue selected - show price and booking options
 */
async function handleIssueSelected(
  context: RepairFlowContext
): Promise<RepairFlowResponse> {
  const deviceConfig = context.device_type
    ? getDeviceConfig(context.device_type)
    : null;

  if (!deviceConfig) {
    return handleGreeting();
  }

  const jobId = context.issue
    ? issueToJobId(context.issue)
    : context.selected_job;
  const job = jobId ? getJobFromDevice(context.device_type || "", jobId) : null;

  // Try to get actual price from database
  let priceEstimate = job?.price || "Price on request";
  let turnaround = job?.time || "TBC";

  if (context.device_model && context.issue) {
    const dbPrice = await lookupPrice(context.device_model, context.issue);
    if (dbPrice) {
      priceEstimate = `£${dbPrice.cost}`;
      turnaround = dbPrice.turnaround || turnaround;
    }
  }

  const scene: RepairScene = {
    device_type: deviceConfig.type,
    device_name: context.device_model || deviceConfig.name,
    device_image: deviceConfig.image,
    device_summary: `${context.device_model || deviceConfig.name} – ${
      job?.label || "Repair"
    }`,
    jobs: deviceConfig.jobs,
    selected_job: jobId || null,
    price_estimate: priceEstimate,
    show_book_cta: true,
  };

  const issueLabel = job?.label || "that repair";
  const messages = getIssueMessages(
    issueLabel,
    priceEstimate,
    turnaround,
    deviceConfig.name
  );

  return {
    type: "repair_flow_response",
    messages,
    scene,
    quick_actions: BOOKING_ACTIONS,
    morph_layout: true,
  };
}

/**
 * Step 4: Handle free-text questions
 */
async function handleFreeTextQuestion(
  message: string,
  context: RepairFlowContext
): Promise<RepairFlowResponse> {
  // Check for common questions we can answer directly
  const quickAnswer = getQuickAnswer(message, context);
  if (quickAnswer) {
    return {
      type: "repair_flow_response",
      messages: [quickAnswer],
      scene: null,
      quick_actions: null,
      morph_layout: false,
    };
  }

  // Use AI for complex questions
  try {
    const aiResponse = await generateSmartResponse({
      customerMessage: message,
      conversationId: null, // No conversation tracking for repair flow questions
      channel: "webchat",
      modules: ["core_identity", "common_scenarios", "pricing_guidance"],
      unifiedAnalysis: {
        intent: "question",
        contentType: "question",
        sentiment: "neutral",
        urgency: "low",
        intentConfidence: 0.8,
      },
    });

    return {
      type: "repair_flow_response",
      messages: [aiResponse.response],
      scene: null,
      quick_actions: null,
      morph_layout: false,
    };
  } catch (error) {
    console.error("[Repair Flow] AI error:", error);
    return {
      type: "repair_flow_response",
      messages: [
        "I'd be happy to help with that! For specific questions, feel free to give us a call or drop in.",
        "Is there anything else about the repair I can help with?",
      ],
      scene: null,
      quick_actions: BOOKING_ACTIONS,
      morph_layout: false,
    };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get article (a/an) for device name
 */
function getDeviceArticle(name: string): string {
  const vowels = ["a", "e", "i", "o", "u"];
  const firstLetter = name.toLowerCase()[0];
  return vowels.includes(firstLetter) ? "An" : "A";
}

/**
 * Generate messages for issue selection
 */
function getIssueMessages(
  issueLabel: string,
  price: string,
  turnaround: string,
  deviceName: string
): string[] {
  const messages: string[] = [];

  // Friendly acknowledgment
  const acknowledgments = [
    `${issueLabel} - no problem! We do these all the time. 💪`,
    `${issueLabel} - we can definitely help with that! 💪`,
    `${issueLabel} - you've come to the right place! 💪`,
  ];
  messages.push(
    acknowledgments[Math.floor(Math.random() * acknowledgments.length)]
  );

  // Price and time info
  if (price.includes("From")) {
    messages.push(
      `The typical price is ${price.toLowerCase()} depending on your ${deviceName} model. Most repairs are done in ${turnaround}!`
    );
  } else {
    messages.push(
      `That would be ${price}, and we can usually have it done in ${turnaround}.`
    );
  }

  // Call to action
  messages.push(
    "Would you like to book this repair, or do you have any questions?"
  );

  return messages;
}

/**
 * Look up price from database
 */
async function lookupPrice(
  deviceModel: string,
  issue: string
): Promise<{ cost: number; turnaround: string | null } | null> {
  try {
    const supabase = createServiceClient();

    // Map issue to repair type
    const repairTypeMap: Record<string, string> = {
      screen: "Screen Replacement",
      battery: "Battery Replacement",
      charging: "Charging Port",
      water: "Water Damage",
      camera: "Camera Repair",
      "back-glass": "Back Glass",
    };

    const repairType = repairTypeMap[issue] || issue;

    const { data } = await supabase
      .from("prices")
      .select("cost, turnaround")
      .ilike("device", `%${deviceModel}%`)
      .ilike("repair_type", `%${repairType}%`)
      .eq("active", true)
      .limit(1)
      .single();

    return data;
  } catch (error) {
    console.log("[Repair Flow] Price lookup failed:", error);
    return null;
  }
}

/**
 * Get quick answer for common questions
 */
function getQuickAnswer(
  message: string,
  context: RepairFlowContext
): string | null {
  const lowerMessage = message.toLowerCase();

  // Time questions
  if (lowerMessage.includes("how long") || lowerMessage.includes("time")) {
    const deviceConfig = context.device_type
      ? getDeviceConfig(context.device_type)
      : null;
    const job = context.selected_job
      ? getJobFromDevice(context.device_type || "", context.selected_job)
      : null;

    if (job?.time) {
      return `Most ${
        deviceConfig?.name || "device"
      } ${job.label.toLowerCase()} repairs take ${
        job.time
      }. You can wait in our shop or pop back later!`;
    }
    return "Most repairs are done same day or within 24-48 hours. We'll give you an exact time when you book in.";
  }

  // Warranty questions
  if (lowerMessage.includes("warranty") || lowerMessage.includes("guarantee")) {
    return "All our repairs come with a warranty. Screen repairs have a 12-month warranty, and battery replacements have a 6-month warranty.";
  }

  // Location questions
  if (
    lowerMessage.includes("where") ||
    lowerMessage.includes("location") ||
    lowerMessage.includes("address")
  ) {
    return "We're based in the New Forest area. You can find our exact address and directions on our contact page, or give us a call!";
  }

  // Opening hours
  if (
    lowerMessage.includes("open") ||
    lowerMessage.includes("hours") ||
    lowerMessage.includes("when")
  ) {
    return "We're open Monday to Friday, 10am to 5pm. Feel free to drop in or book an appointment!";
  }

  // Data safety
  if (
    lowerMessage.includes("data") ||
    lowerMessage.includes("photos") ||
    lowerMessage.includes("backup")
  ) {
    return "Your data is safe with us! We never access personal files. For screen and battery repairs, your data stays intact. For water damage, we always try to preserve data but recommend backing up when possible.";
  }

  return null;
}

// ============================================
// EXPORTS
// ============================================

export { DEVICE_CONFIGS, getDeviceConfig, getJobFromDevice };
