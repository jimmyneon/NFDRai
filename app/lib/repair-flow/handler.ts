/**
 * Repair Flow Handler v2
 *
 * Conversational repair flow that handles uncertainty gracefully.
 * AI Steve acts like a helpful technician - asking clarifying questions,
 * helping identify devices/issues, and offering escape routes.
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
  CATEGORY_SELECTION_ACTIONS,
  PHONE_BRAND_ACTIONS,
  ISSUE_SELECTION_ACTIONS,
  BOOKING_ACTIONS,
  ESCAPE_ACTIONS,
  DIAGNOSTIC_ACTIONS,
  SYMPTOM_ACTIONS,
  IPHONE_IDENTIFY_ACTIONS,
  IPHONE_SIZE_ACTIONS,
  getDeviceConfig,
  getJobFromDevice,
  issueToJobId,
  getMatchingIPhones,
  getIPhoneModel,
  parseSymptomToIssue,
  needsDiagnostic,
  BUSINESS_INFO,
  IPHONE_MODELS,
} from "./device-config";

// ============================================
// MAIN HANDLER
// ============================================

export async function handleRepairFlow(
  request: RepairFlowRequest,
  sessionId?: string
): Promise<RepairFlowResponse> {
  const { message } = request;

  // Default context if not provided (session handler should always provide it)
  const context = request.context || { step: "greeting", device_type: null };

  console.log("[Repair Flow] Processing:", {
    step: context.step,
    message,
    device: context.device_type,
    model: context.device_model,
    issue: context.issue,
    ai_takeover: context.ai_takeover,
  });

  const msgLower = message.toLowerCase();

  // Check for special commands FIRST - these are always allowed regardless of step
  const specialCommands = [
    "price_estimate:",
    "identify_",
    "book_",
    "confirm_",
    "category_",
  ];
  const isSpecialCommand = specialCommands.some((cmd) =>
    msgLower.startsWith(cmd)
  );

  // Handle price_estimate: messages - NOT greeting requests
  if (msgLower.startsWith("price_estimate:")) {
    return handlePriceEstimateCommand(message, context);
  }

  // RULE: Never return greeting - frontend handles it
  // But only block if NOT a special command
  if (
    !isSpecialCommand &&
    context.step === "greeting" &&
    !context.ai_takeover
  ) {
    return {
      type: "repair_flow_response",
      messages: [],
      scene: null,
      quick_actions: null,
      morph_layout: false,
      error: "greeting_not_allowed",
    };
  }

  // Handle AI Instructions - frontend is asking backend to gather missing info
  if (context.ai_instructions) {
    return handleAIInstructions(message, context);
  }

  // Handle AI Takeover mode - AI has full conversational control
  if (context.step === "ai_takeover" || context.ai_takeover) {
    return handleAITakeover(message, context);
  }

  // Handle special action values first
  if (
    msgLower === "unknown" ||
    msgLower === "i dont know" ||
    msgLower === "not sure"
  ) {
    return handleUnknownDevice();
  }
  if (msgLower.startsWith("category_")) {
    return handleCategorySelected(message, context);
  }
  if (msgLower === "unknown_device") {
    return handleCompletelyUnknown();
  }
  if (msgLower.startsWith("identify_")) {
    return handleIdentifyResponse(message, context);
  }
  if (msgLower === "model_unknown") {
    return handleModelUnknown(message, context);
  }
  if (msgLower.startsWith("symptom_")) {
    return handleSymptomSelected(message, context);
  }
  if (msgLower === "describe_issue") {
    return handleDescribeIssue(context);
  }
  if (msgLower === "start_again") {
    return handleGreeting();
  }
  if (msgLower === "directions") {
    return handleDirections();
  }
  if (msgLower === "call") {
    return handleCallUs();
  }

  // Handle macbook_year:model:year:issue format (MacBook year selection)
  if (msgLower.startsWith("macbook_year:")) {
    const parts = message.split(":");
    if (parts.length >= 4) {
      const [, model, year, issue] = parts;
      return handleMacBookYearSelected(model, year, issue);
    }
  }

  // Handle price_estimate:device:model:issue format from frontend
  if (msgLower.startsWith("price_estimate:")) {
    const parts = message.split(":");
    if (parts.length >= 4) {
      const [, deviceType, model, issue] = parts;

      // For MacBooks, we need more specific model info (year, chip type)
      if (deviceType === "macbook" && needsMoreMacBookInfo(model)) {
        return askMacBookDetails(model, issue);
      }

      const enrichedContext: RepairFlowContext = {
        ...context,
        step: "issue_selected",
        device_type: deviceType as any,
        device_model: model,
        issue: issue as any,
      };
      return handleIssueSelected(issue, enrichedContext);
    }
  }

  // Standard step routing
  // Note: Frontend sends steps like "model", "issue" but backend used "model_selected", "issue_selected"
  // We handle both for compatibility
  switch (context.step) {
    case "greeting":
      // Already handled above - return error
      return handleInvalidRequest("greeting", message);

    case "ai_takeover" as any:
      // Already handled above
      return handleAITakeover(message, context);

    case "device_selected":
      return handleDeviceSelected(message, context);

    case "model":
    case "model_selected":
      return handleModelSelected(message, context);

    case "model_unknown":
      return handleModelUnknown(message, context);

    case "identify_device":
      return handleIdentifyDevice(message, context);

    case "identify_model":
      return handleIdentifyModel(message, context);

    case "issue":
    case "issue_selected":
      return await handleIssueSelected(message, context);

    case "issue_unknown":
      // User described an unusual issue - try to understand it
      return await handleIssueSelected(message, context);

    case "diagnose_issue":
      return handleDiagnoseIssue(message, context);

    case "outcome_price":
    case "outcome_assessment":
      // User is on outcome screen - handle booking actions or questions
      return handleOutcomeStep(message, context);

    case "collect_contact":
      // User is providing contact info
      return handleCollectContact(message, context);

    case "confirmation":
      // User is confirming before submit
      return handleConfirmation(message, context);

    case "other_device":
      // User clicked "Other" and described their device
      return handleOtherDevice(message, context);

    case "question":
    case "final":
      return await handleFreeTextQuestion(message, context);

    default:
      // Unknown step - try to be helpful based on context
      console.log(
        "[Repair Flow] Unknown step:",
        context.step,
        "- trying to help based on context"
      );
      return handleUnknownStep(message, context);
  }
}

// ============================================
// AI INSTRUCTIONS HANDLER
// ============================================

/**
 * Handle AI Instructions - frontend asks backend to gather missing info
 * Parse user message, extract device/model/issue info, and hand back control
 * with structured data when we have enough info
 */
function handleAIInstructions(
  message: string,
  context: RepairFlowContext
): RepairFlowResponse {
  const instructions = context.ai_instructions!;
  const msgLower = message.toLowerCase();
  const missing = instructions.missing || [];

  console.log("[AI Instructions] Processing:", {
    message,
    missing,
    context_summary: instructions.context_summary,
    device_type: context.device_type,
    device_name: context.device_name,
  });

  // Extract info from the message
  const extracted = extractInfoFromMessage(msgLower, context);

  // Merge with existing context
  const deviceType = extracted.device_type || context.device_type;
  const deviceName =
    extracted.device_name || context.device_name || context.device_model_label;
  const deviceModel = extracted.device_model || context.device_model;
  const deviceModelLabel =
    extracted.device_model_label || context.device_model_label;
  const issue = extracted.issue || context.issue;
  const issueLabel = extracted.issue_label || context.issue_label;
  const needsAssessment = extracted.needs_assessment || false;

  console.log("[AI Instructions] Extracted:", {
    deviceType,
    deviceName,
    deviceModel,
    deviceModelLabel,
    issue,
    issueLabel,
    needsAssessment,
  });

  // Check what we still need
  const stillMissing: string[] = [];
  if (!deviceType && missing.includes("device")) stillMissing.push("device");
  if (!deviceModel && !deviceModelLabel && missing.includes("model"))
    stillMissing.push("model");
  if (!issue && missing.includes("issue")) stillMissing.push("issue");

  // If we have everything (or enough), hand back control
  if (stillMissing.length === 0 || (deviceType && issue)) {
    console.log("[AI Instructions] Handing back control with:", {
      deviceType,
      deviceName: deviceModelLabel || deviceName,
      issue,
      issueLabel,
      needsAssessment,
    });

    return {
      type: "repair_flow_response",
      messages: needsAssessment
        ? [
            `${deviceModelLabel || deviceName || deviceType} with ${
              issueLabel || issue || "an issue"
            } - we can take a look at that!`,
            "This will need an in-person assessment to give you an accurate quote.",
          ]
        : [
            `${deviceModelLabel || deviceName || deviceType} ${
              issueLabel || issue || ""
            } - got it! 👍`,
          ],
      new_step: needsAssessment ? "outcome_assessment" : "outcome_price",
      hand_back_control: {
        device_type: deviceType || "other",
        device_name: deviceModelLabel || deviceName || deviceType || "Device",
        device_model: deviceModel ?? undefined,
        device_model_label: (deviceModelLabel || deviceName) ?? undefined,
        issue: issue || "assessment",
        issue_label: issueLabel || "Assessment Required",
        needs_assessment: needsAssessment,
      },
      scene: {
        device_type: (deviceType || "other") as any,
        device_name: deviceModelLabel || deviceName || deviceType || "Device",
        device_model: deviceModel || null,
        device_model_label: deviceModelLabel || deviceName,
        device_image: `/images/devices/${deviceType || "other"}-generic.png`,
        device_summary: `${deviceModelLabel || deviceName || deviceType} – ${
          issueLabel || issue || "Assessment"
        }`,
        jobs: null,
        selected_job: issue || null,
        price_estimate: null,
        show_book_cta: true,
        needs_diagnostic: needsAssessment,
      },
      quick_actions: BOOKING_ACTIONS,
      morph_layout: true,
    };
  }

  // Still missing info - ask for it
  if (stillMissing.includes("model") && deviceType) {
    const deviceDisplayName = formatDeviceName(deviceType, "");
    return {
      type: "repair_flow_response",
      messages: [`Which ${deviceDisplayName} model do you have?`],
      new_step: "model",
      scene: {
        device_type: deviceType as any,
        device_name: deviceDisplayName,
        device_image: `/images/devices/${deviceType}-generic.png`,
        device_summary: deviceDisplayName,
        jobs: null,
        selected_job: null,
        price_estimate: null,
        show_book_cta: false,
      },
      quick_actions: [
        {
          icon: "fa-question-circle",
          label: "I'm not sure",
          value: "model_unknown",
        },
      ],
      morph_layout: true,
    };
  }

  if (stillMissing.includes("issue")) {
    return {
      type: "repair_flow_response",
      messages: [
        `What's wrong with your ${
          deviceModelLabel || deviceName || deviceType || "device"
        }?`,
      ],
      new_step: "issue",
      scene: {
        device_type: (deviceType || "other") as any,
        device_name: deviceModelLabel || deviceName || deviceType || "Device",
        device_image: `/images/devices/${deviceType || "other"}-generic.png`,
        device_summary:
          deviceModelLabel || deviceName || deviceType || "Device",
        jobs: null,
        selected_job: null,
        price_estimate: null,
        show_book_cta: false,
      },
      quick_actions: getIssueActionsForDevice(deviceType || "other"),
      morph_layout: true,
    };
  }

  // Fallback - ask what they need help with
  return {
    type: "repair_flow_response",
    messages: ["What device do you need help with?"],
    new_step: "greeting",
    scene: null,
    quick_actions: DEVICE_SELECTION_ACTIONS,
    morph_layout: false,
  };
}

/**
 * Extract device, model, and issue info from a message
 */
function extractInfoFromMessage(
  message: string,
  context: RepairFlowContext
): {
  device_type?: string;
  device_name?: string;
  device_model?: string;
  device_model_label?: string;
  issue?: string;
  issue_label?: string;
  needs_assessment?: boolean;
} {
  const result: any = {};

  // Device patterns (including common typos)
  const devicePatterns: Record<string, { type: string; name: string }> = {
    iphone: { type: "iphone", name: "iPhone" },
    ipone: { type: "iphone", name: "iPhone" }, // common typo
    "i phone": { type: "iphone", name: "iPhone" }, // space typo
    ipad: { type: "ipad", name: "iPad" },
    samsung: { type: "samsung", name: "Samsung" },
    galaxy: { type: "samsung", name: "Samsung Galaxy" },
    macbook: { type: "macbook", name: "MacBook" },
    mac: { type: "macbook", name: "Mac" },
    laptop: { type: "laptop", name: "Laptop" },
    xbox: { type: "console", name: "Xbox" },
    playstation: { type: "console", name: "PlayStation" },
    ps4: { type: "console", name: "PS4" },
    ps5: { type: "console", name: "PS5" },
    switch: { type: "console", name: "Nintendo Switch" },
    nintendo: { type: "console", name: "Nintendo" },
  };

  // Check for device type
  for (const [keyword, info] of Object.entries(devicePatterns)) {
    if (message.includes(keyword)) {
      result.device_type = info.type;
      result.device_name = info.name;
      break;
    }
  }

  // Xbox model patterns
  if (message.includes("xbox")) {
    if (message.includes("360")) {
      result.device_model_label = "Xbox 360";
    } else if (message.includes("one")) {
      result.device_model_label = "Xbox One";
    } else if (message.includes("series x") || message.includes("series s")) {
      result.device_model_label = message.includes("series x")
        ? "Xbox Series X"
        : "Xbox Series S";
    }
    result.device_type = "console";
    result.device_name = result.device_model_label || "Xbox";
  }

  // PlayStation model patterns
  if (message.includes("ps") || message.includes("playstation")) {
    if (message.includes("ps5") || message.includes("playstation 5")) {
      result.device_model_label = "PS5";
    } else if (message.includes("ps4") || message.includes("playstation 4")) {
      result.device_model_label = "PS4";
    } else if (message.includes("ps3") || message.includes("playstation 3")) {
      result.device_model_label = "PS3";
    }
    result.device_type = "console";
    result.device_name = result.device_model_label || "PlayStation";
  }

  // Issue patterns
  const issuePatterns: Record<
    string,
    { issue: string; label: string; needsAssessment?: boolean }
  > = {
    screen: { issue: "screen", label: "Screen Repair" },
    cracked: { issue: "screen", label: "Screen Repair" },
    "broken screen": { issue: "screen", label: "Screen Repair" },
    battery: { issue: "battery", label: "Battery Replacement" },
    charging: { issue: "charging", label: "Charging Port Repair" },
    "won't charge": { issue: "charging", label: "Charging Port Repair" },
    "not charging": { issue: "charging", label: "Charging Port Repair" },
    camera: { issue: "camera", label: "Camera Repair" },
    water: { issue: "water", label: "Water Damage", needsAssessment: true },
    wet: { issue: "water", label: "Water Damage", needsAssessment: true },
    power: { issue: "power", label: "Power Issue", needsAssessment: true },
    "won't turn on": {
      issue: "power",
      label: "Power Issue",
      needsAssessment: true,
    },
    "doesn't turn on": {
      issue: "power",
      label: "Power Issue",
      needsAssessment: true,
    },
    "not turning on": {
      issue: "power",
      label: "Power Issue",
      needsAssessment: true,
    },
    dead: { issue: "power", label: "Power Issue", needsAssessment: true },
    died: { issue: "power", label: "Power Issue", needsAssessment: true },
    "has died": { issue: "power", label: "Power Issue", needsAssessment: true },
    "no image": {
      issue: "display",
      label: "Display Issue",
      needsAssessment: true,
    },
    "no picture": {
      issue: "display",
      label: "Display Issue",
      needsAssessment: true,
    },
    "black screen": {
      issue: "display",
      label: "Display Issue",
      needsAssessment: true,
    },
    hdmi: { issue: "hdmi", label: "HDMI Port Repair", needsAssessment: true },
    disc: { issue: "disc", label: "Disc Drive Issue", needsAssessment: true },
    overheating: {
      issue: "overheating",
      label: "Overheating Issue",
      needsAssessment: true,
    },
    loud: { issue: "fan", label: "Fan Issue", needsAssessment: true },
    noisy: { issue: "fan", label: "Fan Issue", needsAssessment: true },
  };

  for (const [keyword, info] of Object.entries(issuePatterns)) {
    if (message.includes(keyword)) {
      result.issue = info.issue;
      result.issue_label = info.label;
      result.needs_assessment = info.needsAssessment || false;
      break;
    }
  }

  return result;
}

// ============================================
// AI TAKEOVER HANDLER
// ============================================

/**
 * AI Takeover mode - AI has full conversational control
 * Parse user message, understand intent, and either:
 * 1. Ask clarifying questions
 * 2. Provide price and offer booking
 * 3. Hand back control to frontend with collected data
 */
function handleAITakeover(
  message: string,
  context: RepairFlowContext
): RepairFlowResponse {
  const msgLower = message.toLowerCase();
  const fullState = context.full_state || {};

  console.log("[Repair Flow] AI Takeover:", { message, fullState });

  // Issue keywords with prices
  const issues: Record<string, { label: string; range: string; time: string }> =
    {
      screen: {
        label: "Screen Repair",
        range: "£45 - £149",
        time: "1-2 hours",
      },
      battery: {
        label: "Battery Replacement",
        range: "£35 - £89",
        time: "30-60 mins",
      },
      charging: { label: "Charging Port", range: "£45 - £79", time: "45 mins" },
      charge: { label: "Charging Port", range: "£45 - £79", time: "45 mins" },
      back: { label: "Back Glass", range: "£39 - £99", time: "1-2 hours" },
      camera: {
        label: "Camera Repair",
        range: "£49 - £129",
        time: "1-2 hours",
      },
      water: { label: "Water Damage", range: "£49 - £99", time: "24-72 hours" },
    };

  // Device keywords
  const devices: Record<string, { type: string; name: string }> = {
    iphone: { type: "iphone", name: "iPhone" },
    ipad: { type: "ipad", name: "iPad" },
    samsung: { type: "samsung", name: "Samsung" },
    macbook: { type: "macbook", name: "MacBook" },
    mac: { type: "macbook", name: "MacBook" },
    laptop: { type: "laptop", name: "Laptop" },
  };

  // Model patterns
  const modelPatterns: Record<string, { model: string; label: string }> = {
    "iphone 15": { model: "iphone-15", label: "iPhone 15" },
    "iphone 14": { model: "iphone-14", label: "iPhone 14" },
    "iphone 13": { model: "iphone-13", label: "iPhone 13" },
    "iphone 12": { model: "iphone-12", label: "iPhone 12" },
    "iphone 11": { model: "iphone-11", label: "iPhone 11" },
    "iphone x": { model: "iphone-x", label: "iPhone X" },
    "iphone se": { model: "iphone-se", label: "iPhone SE" },
  };

  // Try to extract device, model, and issue from message
  let detectedDevice: { type: string; name: string } | null = null;
  let detectedModel: { model: string; label: string } | null = null;
  let detectedIssue: { label: string; range: string; time: string } | null =
    null;

  // Check for device
  for (const [keyword, device] of Object.entries(devices)) {
    if (msgLower.includes(keyword)) {
      detectedDevice = device;
      break;
    }
  }

  // Check for model
  for (const [pattern, model] of Object.entries(modelPatterns)) {
    if (msgLower.includes(pattern)) {
      detectedModel = model;
      if (!detectedDevice) {
        detectedDevice = { type: "iphone", name: "iPhone" };
      }
      break;
    }
  }

  // Check for issue
  for (const [keyword, issue] of Object.entries(issues)) {
    if (msgLower.includes(keyword)) {
      detectedIssue = issue;
      break;
    }
  }

  // If we have device + issue (with or without model), hand back control
  if (detectedDevice && detectedIssue) {
    const price = detectedModel
      ? getSpecificPrice(detectedModel.model, detectedIssue.label)
      : detectedIssue.range;

    return {
      type: "repair_flow_response",
      messages: [
        `Got it! ${
          detectedModel?.label || detectedDevice.name
        } ${detectedIssue.label.toLowerCase()} - I've got all the details.`,
        `That's typically ${price}. Most repairs take ${detectedIssue.time}.`,
        "This is just an estimate - John will confirm the exact price when he sees your device.",
      ],
      scene: {
        device_type: detectedDevice.type as any,
        device_name: detectedModel?.label || detectedDevice.name,
        device_image: `/images/devices/${detectedDevice.type}-generic.png`,
        device_summary: `${detectedModel?.label || detectedDevice.name} – ${
          detectedIssue.label
        }`,
        jobs: null,
        selected_job: detectedIssue.label,
        price_estimate: price,
        show_book_cta: true,
      },
      quick_actions: BOOKING_ACTIONS,
      morph_layout: true,
      new_step: "outcome_price",
      hand_back_control: {
        device_type: detectedDevice.type,
        device_name: detectedDevice.name,
        device_model: detectedModel?.model,
        device_model_label: detectedModel?.label,
        issue: detectedIssue.label.toLowerCase().replace(" ", "_"),
        issue_label: detectedIssue.label,
        price: price,
        resume_step: "collect_contact",
        message: "Now I just need your contact details to book this in!",
      },
    };
  }

  // If we only have device, ask for issue
  if (detectedDevice && !detectedIssue) {
    return {
      type: "repair_flow_response",
      messages: [
        `Got it, a ${
          detectedModel?.label || detectedDevice.name
        }! What seems to be the problem?`,
      ],
      scene: null,
      quick_actions: [
        { icon: "fa-mobile-screen", label: "Screen", value: "screen" },
        { icon: "fa-battery-quarter", label: "Battery", value: "battery" },
        { icon: "fa-plug", label: "Charging", value: "charging" },
        { icon: "fa-droplet", label: "Water damage", value: "water" },
        {
          icon: "fa-question",
          label: "Something else",
          value: "describe_issue",
        },
      ],
      morph_layout: false,
    };
  }

  // If we only have issue, ask for device
  if (detectedIssue && !detectedDevice) {
    return {
      type: "repair_flow_response",
      messages: [
        `${detectedIssue.label} - I can help with that! What device is it?`,
      ],
      scene: null,
      quick_actions: DEVICE_SELECTION_ACTIONS,
      morph_layout: false,
    };
  }

  // Couldn't understand - ask for clarification
  return {
    type: "repair_flow_response",
    messages: [
      "I'd love to help! Could you tell me what device you have and what's wrong with it?",
      "For example: 'iPhone 12 screen cracked' or 'Samsung battery dying'",
    ],
    scene: null,
    quick_actions: DEVICE_SELECTION_ACTIONS,
    morph_layout: false,
  };
}

/**
 * Handle price_estimate: command messages
 * Format: price_estimate:device_type:model:issue
 * Returns price_estimate object AND messages for frontend
 */
function handlePriceEstimateCommand(
  message: string,
  context: RepairFlowContext
): RepairFlowResponse {
  const parts = message.split(":");
  const deviceType = parts[1] || context.device_type || "iphone";
  // Use model from message, but fall back to context if "null" or empty
  let model = parts[2];
  if (!model || model === "null" || model === "undefined") {
    model = context.device_model || "";
  }
  const issue = parts[3] || context.issue || "";

  console.log("[Price Estimate Command]", {
    deviceType,
    model,
    issue,
    contextModel: context.device_model,
  });

  // Get price based on model and issue
  const price = getPriceForModelAndIssue(model, issue, deviceType);
  const turnaround = getTurnaroundTime(issue);

  // Format issue label
  const issueLabel = formatIssueLabel(issue);

  // Format device/model name - NEVER returns "Null"
  const deviceName = formatDeviceName(deviceType, model);

  // Get model label for response
  const modelLabel = context.device_model_label || deviceName;

  // Generate helpful messages
  const messages = [
    `${issueLabel} for ${deviceName} - we can help with that! 💪`,
    `That's typically ${price}. Most repairs take ${turnaround}.`,
    "This is just an estimate - John will confirm the exact price after your repair request.",
  ];

  return {
    type: "repair_flow_response",
    messages: messages,
    new_step: "outcome_price",
    scene: {
      device_type: deviceType as any,
      device_name: deviceName,
      device_model: model || null,
      device_model_label: modelLabel,
      device_image: `/images/devices/${deviceType}-generic.png`,
      device_summary: `${deviceName} – ${issueLabel}`,
      jobs: null,
      selected_job: issue,
      price_estimate: price,
      show_book_cta: true,
    },
    quick_actions: BOOKING_ACTIONS,
    morph_layout: true,
    price_estimate: {
      price: price,
      turnaround: turnaround,
      warranty: "90 days",
    },
  };
}

/**
 * Format issue into readable label
 */
function formatIssueLabel(issue: string): string {
  const labels: Record<string, string> = {
    screen: "Screen Repair",
    battery: "Battery Replacement",
    charging: "Charging Port Repair",
    charge: "Charging Port Repair",
    camera: "Camera Repair",
    back: "Back Glass Repair",
    glass: "Back Glass Repair",
    water: "Water Damage Assessment",
    speaker: "Speaker Repair",
    mic: "Microphone Repair",
    button: "Button Repair",
  };
  return (
    labels[issue.toLowerCase()] ||
    issue.charAt(0).toUpperCase() + issue.slice(1) + " Repair"
  );
}

/**
 * Format device type and model into readable name
 * NEVER returns "Null" - always uses actual device/model names
 */
function formatDeviceName(deviceType: string, model: string): string {
  // Device type fallback names
  const deviceNames: Record<string, string> = {
    iphone: "iPhone",
    ipad: "iPad",
    samsung: "Samsung",
    macbook: "MacBook",
    laptop: "Laptop",
    ps5: "PS5",
    ps4: "PS4",
    xbox: "Xbox",
    switch: "Nintendo Switch",
  };

  // Check if model is valid (not null, "null", empty, or undefined)
  const hasValidModel =
    model && model !== "null" && model !== "undefined" && model.trim() !== "";

  if (hasValidModel) {
    // Convert model ID to readable name
    const modelName = model
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .replace("Iphone", "iPhone")
      .replace("Ipad", "iPad")
      .replace("Galaxy ", "Galaxy ");
    return modelName;
  }

  // Fallback to device type - NEVER return "Null"
  return (
    deviceNames[deviceType] ||
    deviceType.charAt(0).toUpperCase() + deviceType.slice(1)
  );
}

/**
 * Get price for model and issue combination
 */
function getPriceForModelAndIssue(
  model: string,
  issue: string,
  deviceType: string
): string {
  const issueLower = issue.toLowerCase();
  const modelLower = model.toLowerCase();

  // iPhone screen prices
  if (deviceType === "iphone" && issueLower.includes("screen")) {
    const screenPrices: Record<string, string> = {
      "iphone-15-pro-max": "£329",
      "iphone-15-pro": "£279",
      "iphone-15": "£149",
      "iphone-14-pro-max": "£299",
      "iphone-14-pro": "£249",
      "iphone-14": "£129",
      "iphone-13-pro-max": "£249",
      "iphone-13-pro": "£199",
      "iphone-13": "£109",
      "iphone-12-pro-max": "£179",
      "iphone-12-pro": "£149",
      "iphone-12": "£89",
      "iphone-11-pro-max": "£149",
      "iphone-11-pro": "£129",
      "iphone-11": "£79",
      "iphone-xr": "£69",
      "iphone-xs-max": "£99",
      "iphone-xs": "£89",
      "iphone-x": "£69",
      "iphone-se": "£59",
      "iphone-8-plus": "£55",
      "iphone-8": "£49",
    };
    return screenPrices[modelLower] || "£45 - £149";
  }

  // iPhone battery prices
  if (deviceType === "iphone" && issueLower.includes("battery")) {
    const batteryPrices: Record<string, string> = {
      "iphone-15-pro-max": "£89",
      "iphone-15-pro": "£89",
      "iphone-15": "£79",
      "iphone-14-pro-max": "£79",
      "iphone-14-pro": "£79",
      "iphone-14": "£69",
      "iphone-13-pro-max": "£69",
      "iphone-13-pro": "£69",
      "iphone-13": "£59",
      "iphone-12-pro-max": "£59",
      "iphone-12-pro": "£59",
      "iphone-12": "£55",
      "iphone-11-pro-max": "£55",
      "iphone-11-pro": "£55",
      "iphone-11": "£49",
      "iphone-xr": "£45",
      "iphone-xs-max": "£49",
      "iphone-xs": "£49",
      "iphone-x": "£45",
      "iphone-se": "£39",
      "iphone-8-plus": "£39",
      "iphone-8": "£35",
    };
    return batteryPrices[modelLower] || "£35 - £89";
  }

  // iPhone charging port
  if (
    deviceType === "iphone" &&
    (issueLower.includes("charging") || issueLower.includes("charge"))
  ) {
    return "£55";
  }

  // Samsung screen prices
  if (deviceType === "samsung" && issueLower.includes("screen")) {
    const samsungScreenPrices: Record<string, string> = {
      "galaxy-s24-ultra": "£299",
      "galaxy-s24": "£199",
      "galaxy-s23-ultra": "£279",
      "galaxy-s23": "£179",
      "galaxy-s22-ultra": "£249",
      "galaxy-s22": "£149",
      "galaxy-s21-ultra": "£199",
      "galaxy-s21": "£129",
      "galaxy-s20": "£109",
      "galaxy-a54": "£99",
      "galaxy-a53": "£89",
      "galaxy-a52": "£79",
    };
    return samsungScreenPrices[modelLower] || "£79 - £299";
  }

  // Samsung battery
  if (deviceType === "samsung" && issueLower.includes("battery")) {
    return "£49 - £79";
  }

  // Default ranges by issue
  if (issueLower.includes("screen")) return "£40 - £200";
  if (issueLower.includes("battery")) return "£40 - £90";
  if (issueLower.includes("charging") || issueLower.includes("charge"))
    return "around £50";
  if (issueLower.includes("back") || issueLower.includes("glass"))
    return "£80 - £150";
  if (issueLower.includes("camera")) return "£50 - £120";
  if (issueLower.includes("water")) return "from £50";

  return "Price on assessment";
}

/**
 * Get turnaround time for issue type
 */
function getTurnaroundTime(issue: string): string {
  const issueLower = issue.toLowerCase();

  if (issueLower.includes("screen")) return "1-2 hours";
  if (issueLower.includes("battery")) return "30-60 mins";
  if (issueLower.includes("charging") || issueLower.includes("charge"))
    return "45 mins";
  if (issueLower.includes("back") || issueLower.includes("glass"))
    return "1-2 hours";
  if (issueLower.includes("camera")) return "1-2 hours";
  if (issueLower.includes("water")) return "24-72 hours";

  return "Same day";
}

/**
 * Get specific price for known model + issue (legacy helper)
 */
function getSpecificPrice(model: string, issueLabel: string): string {
  const issue = issueLabel.toLowerCase();

  // Screen prices by model
  if (issue.includes("screen")) {
    const screenPrices: Record<string, string> = {
      "iphone-15": "£149",
      "iphone-14": "£129",
      "iphone-13": "£109",
      "iphone-12": "£89",
      "iphone-11": "£79",
      "iphone-x": "£69",
      "iphone-se": "£59",
    };
    return screenPrices[model] || "£45 - £149";
  }

  // Battery prices
  if (issue.includes("battery")) {
    const batteryPrices: Record<string, string> = {
      "iphone-15": "£79",
      "iphone-14": "£69",
      "iphone-13": "£59",
      "iphone-12": "£55",
      "iphone-11": "£49",
      "iphone-x": "£45",
      "iphone-se": "£39",
    };
    return batteryPrices[model] || "£35 - £89";
  }

  // Charging port
  if (issue.includes("charging")) {
    return "£55";
  }

  return "Price on assessment";
}

// ============================================
// ERROR HANDLERS
// ============================================

/**
 * Handle invalid/unexpected requests
 * Frontend handles greeting - AI should never return greeting
 */
function handleInvalidRequest(
  step: string,
  message: string
): RepairFlowResponse {
  console.log(
    "[Repair Flow] Invalid request - step:",
    step,
    "message:",
    message
  );

  // If they sent a message with greeting step, try to be helpful
  // but don't send a greeting
  return {
    type: "repair_flow_response",
    messages: [
      "I received your message but I'm not sure what step we're on.",
      "Please select a device to get started, or describe what you need help with.",
    ],
    scene: null,
    quick_actions: DEVICE_SELECTION_ACTIONS,
    morph_layout: false,
    error: `Unexpected step: ${step}`,
  };
}

// ============================================
// STEP HANDLERS
// ============================================

/**
 * Handle outcome step - user is on price/assessment screen
 * They might ask questions, request booking, or want directions
 */
function handleOutcomeStep(
  message: string,
  context: RepairFlowContext
): RepairFlowResponse {
  const msgLower = message.toLowerCase();
  const deviceName =
    context.device_model_label ||
    context.device_name ||
    formatDeviceName(
      context.device_type || "device",
      context.device_model || ""
    );
  const issueLabel =
    context.issue_label || formatIssueLabel(context.issue || "repair");

  // Handle booking request
  if (
    msgLower === "request" ||
    msgLower.includes("book") ||
    msgLower.includes("request")
  ) {
    return {
      type: "repair_flow_response",
      messages: [
        "Great! Let's get your repair booked in. 📋",
        "I just need a few details to complete your request.",
      ],
      new_step: "collect_contact",
      scene: {
        device_type: context.device_type,
        device_name: deviceName,
        device_image: `/images/devices/${context.device_type}-generic.png`,
        device_summary: `${deviceName} – ${issueLabel}`,
        jobs: null,
        selected_job: context.issue || null,
        price_estimate: null,
        show_book_cta: false,
      },
      quick_actions: null,
      morph_layout: true,
    };
  }

  // Handle directions request
  if (
    msgLower === "directions" ||
    msgLower.includes("direction") ||
    msgLower.includes("where")
  ) {
    return {
      type: "repair_flow_response",
      messages: [
        "We're located at: New Forest Device Repairs, Ringwood, Hampshire 📍",
        "You can find us on Google Maps for directions.",
      ],
      new_step: context.step,
      scene: null,
      quick_actions: BOOKING_ACTIONS,
      morph_layout: false,
    };
  }

  // Handle restart
  if (
    msgLower === "restart" ||
    msgLower.includes("start again") ||
    msgLower.includes("different")
  ) {
    return {
      type: "repair_flow_response",
      messages: [
        "No problem! Let's start fresh. What device do you need help with?",
      ],
      new_step: "greeting",
      scene: null,
      quick_actions: DEVICE_SELECTION_ACTIONS,
      morph_layout: false,
    };
  }

  // Default - offer booking options
  return {
    type: "repair_flow_response",
    messages: [
      `I've got your ${deviceName} ${issueLabel.toLowerCase()} quote ready.`,
      "Would you like to request a repair, or is there anything else I can help with?",
    ],
    new_step: context.step,
    scene: null,
    quick_actions: BOOKING_ACTIONS,
    morph_layout: false,
  };
}

/**
 * Handle contact collection step
 */
function handleCollectContact(
  message: string,
  context: RepairFlowContext
): RepairFlowResponse {
  // For now, just acknowledge - frontend handles the form
  return {
    type: "repair_flow_response",
    messages: [
      "Thanks! Please fill in your contact details and we'll be in touch to confirm your booking.",
    ],
    new_step: "collect_contact",
    scene: null,
    quick_actions: null,
    morph_layout: false,
  };
}

/**
 * Handle confirmation step
 */
function handleConfirmation(
  message: string,
  context: RepairFlowContext
): RepairFlowResponse {
  const msgLower = message.toLowerCase();

  if (
    msgLower === "confirm" ||
    msgLower.includes("yes") ||
    msgLower.includes("submit")
  ) {
    return {
      type: "repair_flow_response",
      messages: [
        "Your repair request has been submitted! 🎉",
        "John will be in touch shortly to confirm the details.",
      ],
      new_step: "final",
      scene: null,
      quick_actions: [
        {
          icon: "fa-rotate-left",
          label: "Start New Request",
          value: "restart",
        },
      ],
      morph_layout: false,
    };
  }

  // User wants to go back or change something
  return {
    type: "repair_flow_response",
    messages: ["No problem! What would you like to change?"],
    new_step: "outcome_price",
    scene: null,
    quick_actions: BOOKING_ACTIONS,
    morph_layout: false,
  };
}

/**
 * Handle unknown step - try to be helpful based on context
 */
function handleUnknownStep(
  message: string,
  context: RepairFlowContext
): RepairFlowResponse {
  console.log("[Repair Flow] Unknown step handler:", {
    step: context.step,
    message,
    context,
  });

  // If we have device info, try to continue the flow
  if (context.device_type && context.device_model) {
    // We have device and model - probably need issue
    return {
      type: "repair_flow_response",
      messages: [
        `I see you have a ${
          context.device_model_label ||
          context.device_name ||
          context.device_type
        }.`,
        "What's wrong with it?",
      ],
      new_step: "issue",
      scene: {
        device_type: context.device_type,
        device_name:
          context.device_model_label ||
          context.device_name ||
          context.device_type,
        device_image: `/images/devices/${context.device_type}-generic.png`,
        device_summary:
          context.device_model_label ||
          context.device_name ||
          context.device_type,
        jobs: null,
        selected_job: null,
        price_estimate: null,
        show_book_cta: false,
      },
      quick_actions: getIssueActionsForDevice(context.device_type),
      morph_layout: true,
    };
  }

  if (context.device_type) {
    // We have device type but no model - ask for model
    const deviceName = formatDeviceName(context.device_type, "");
    return {
      type: "repair_flow_response",
      messages: [`Which ${deviceName} model do you have?`],
      new_step: "model",
      scene: {
        device_type: context.device_type,
        device_name: deviceName,
        device_image: `/images/devices/${context.device_type}-generic.png`,
        device_summary: deviceName,
        jobs: null,
        selected_job: null,
        price_estimate: null,
        show_book_cta: false,
      },
      quick_actions: null,
      morph_layout: true,
    };
  }

  // No context - start fresh
  return {
    type: "repair_flow_response",
    messages: ["What device do you need help with today?"],
    new_step: "greeting",
    scene: null,
    quick_actions: DEVICE_SELECTION_ACTIONS,
    morph_layout: false,
  };
}

/**
 * Get issue quick actions for a device type
 */
function getIssueActionsForDevice(deviceType: string): QuickAction[] {
  const commonIssues: QuickAction[] = [
    { icon: "fa-mobile-screen", label: "Screen Repair", value: "screen" },
    { icon: "fa-battery-half", label: "Battery", value: "battery" },
    { icon: "fa-plug", label: "Charging Port", value: "charging" },
  ];

  if (deviceType === "iphone" || deviceType === "samsung") {
    return [
      ...commonIssues,
      { icon: "fa-camera", label: "Camera", value: "camera" },
      { icon: "fa-droplet", label: "Water Damage", value: "water" },
      { icon: "fa-question-circle", label: "Other Issue", value: "other" },
    ];
  }

  return [
    ...commonIssues,
    { icon: "fa-question-circle", label: "Other Issue", value: "other" },
  ];
}

/**
 * Step 1: Initial greeting - show device selection
 * NOTE: Frontend handles this - AI should rarely call this
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
 * User clicked "Other" and described their device
 * e.g. "I have a Kindle with a cracked screen"
 */
function handleOtherDevice(
  message: string,
  context: RepairFlowContext
): RepairFlowResponse {
  const msgLower = message.toLowerCase();

  // Try to identify device type from message
  const deviceKeywords: Record<string, string> = {
    kindle: "e-reader",
    kobo: "e-reader",
    fitbit: "smartwatch",
    garmin: "smartwatch",
    "apple watch": "smartwatch",
    airpods: "earbuds",
    switch: "games console",
    nintendo: "games console",
    playstation: "games console",
    xbox: "games console",
    ps5: "games console",
    ps4: "games console",
    drone: "drone",
    dji: "drone",
    gopro: "camera",
    camera: "camera",
  };

  let deviceType = "device";
  for (const [keyword, type] of Object.entries(deviceKeywords)) {
    if (msgLower.includes(keyword)) {
      deviceType = type;
      break;
    }
  }

  // Try to identify issue from message
  const issueKeywords = [
    "screen",
    "battery",
    "charging",
    "broken",
    "cracked",
    "water",
    "not working",
  ];
  const hasIssue = issueKeywords.some((k) => msgLower.includes(k));

  if (hasIssue) {
    return {
      type: "repair_flow_response",
      messages: [
        `Thanks for the details! We can take a look at your ${deviceType}. 👍`,
        "For non-standard devices, we'll need to assess it in person to give you an accurate quote.",
        "The assessment is free - just bring it in and John will take a look!",
      ],
      scene: null,
      quick_actions: BOOKING_ACTIONS,
      morph_layout: true,
      next_context: {
        step: "final",
        device_type: "other",
      },
    };
  }

  // Need more info
  return {
    type: "repair_flow_response",
    messages: [
      `Got it - a ${deviceType}! What seems to be the problem with it?`,
    ],
    scene: null,
    quick_actions: [
      { icon: "fa-mobile-screen", label: "Screen issue", value: "screen" },
      { icon: "fa-battery-quarter", label: "Battery issue", value: "battery" },
      { icon: "fa-plug", label: "Won't charge", value: "charging" },
      { icon: "fa-droplet", label: "Water damage", value: "water" },
      { icon: "fa-question", label: "Something else", value: "describe_issue" },
    ],
    morph_layout: false,
    next_context: {
      step: "diagnose_issue",
      device_type: "other",
    },
  };
}

/**
 * User doesn't know what device they have
 */
function handleUnknownDevice(): RepairFlowResponse {
  return {
    type: "repair_flow_response",
    messages: [
      "No worries! Let me help you figure it out. 🔍",
      "Is it a phone, tablet, laptop, or games console?",
    ],
    scene: null,
    quick_actions: CATEGORY_SELECTION_ACTIONS,
    morph_layout: false,
  };
}

/**
 * User selected a category (phone, tablet, etc.)
 */
function handleCategorySelected(
  message: string,
  context: RepairFlowContext
): RepairFlowResponse {
  const category = message.replace("category_", "").toLowerCase();

  if (category === "phone") {
    return {
      type: "repair_flow_response",
      messages: ["Great! What brand is it? Apple, Samsung, or something else?"],
      scene: null,
      quick_actions: PHONE_BRAND_ACTIONS,
      morph_layout: false,
    };
  }

  if (category === "tablet") {
    return {
      type: "repair_flow_response",
      messages: ["Is it an iPad or another type of tablet?"],
      scene: null,
      quick_actions: [
        { icon: "fa-apple", label: "iPad", value: "ipad" },
        {
          icon: "fa-tablet-screen-button",
          label: "Samsung Tablet",
          value: "samsung_tablet",
        },
        {
          icon: "fa-tablet-screen-button",
          label: "Other Tablet",
          value: "tablet_other",
        },
      ],
      morph_layout: false,
    };
  }

  if (category === "laptop") {
    return {
      type: "repair_flow_response",
      messages: ["Is it a MacBook or a Windows laptop?"],
      scene: null,
      quick_actions: [
        { icon: "fa-apple", label: "MacBook", value: "macbook" },
        { icon: "fa-laptop", label: "Windows Laptop", value: "laptop" },
        {
          icon: "fa-question-circle",
          label: "Not sure",
          value: "laptop_unknown",
        },
      ],
      morph_layout: false,
    };
  }

  if (category === "console") {
    return {
      type: "repair_flow_response",
      messages: ["Which games console is it?"],
      scene: null,
      quick_actions: [
        { icon: "fa-playstation", label: "PlayStation 5", value: "ps5" },
        { icon: "fa-playstation", label: "PlayStation 4", value: "ps4" },
        { icon: "fa-xbox", label: "Xbox", value: "xbox" },
        { icon: "fa-gamepad", label: "Nintendo Switch", value: "switch" },
      ],
      morph_layout: false,
    };
  }

  return handleCompletelyUnknown();
}

/**
 * User really doesn't know what device they have
 */
function handleCompletelyUnknown(): RepairFlowResponse {
  return {
    type: "repair_flow_response",
    messages: [
      "That's okay! The best thing to do is pop into our shop at " +
        BUSINESS_INFO.address +
        ".",
      "We can take a look and give you a quote on the spot. 👍",
      "Or give us a call on " +
        BUSINESS_INFO.phone +
        " and describe what you've got!",
    ],
    scene: null,
    quick_actions: ESCAPE_ACTIONS,
    morph_layout: false,
  };
}

/**
 * Step 2: Device selected - ask for model or show issues
 * Note: device_type comes from message (user's selection) OR context.device_type
 */
function handleDeviceSelected(
  message: string,
  context: RepairFlowContext
): RepairFlowResponse {
  // Device type can come from message (button click) or context
  const deviceType = context.device_type || message.toLowerCase();
  const deviceConfig = getDeviceConfig(deviceType);

  if (!deviceConfig) {
    return handleUnknownDevice();
  }

  // For iPhones, ask for model
  if (deviceType === "iphone") {
    return {
      type: "repair_flow_response",
      messages: ["Great! An iPhone. 📱", "Do you know which model you have?"],
      scene: {
        device_type: "iphone",
        device_name: "iPhone",
        device_image: "/images/devices/iphone-generic.png",
        device_summary: "iPhone",
        jobs: null,
        selected_job: null,
        price_estimate: null,
        show_book_cta: false,
      },
      quick_actions: [
        ...getRecentIPhoneActions(),
        {
          icon: "fa-question-circle",
          label: "Not sure / Other",
          value: "iphone-other",
        },
      ],
      morph_layout: true,
    };
  }

  // For other devices, go straight to issue selection
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
      { icon: "fa-power-off", label: "Power Issues", value: "power" },
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
 * Step 2b: Model selected (for iPhones)
 * Note: model comes from message (button click) OR context.device_model
 */
function handleModelSelected(
  message: string,
  context: RepairFlowContext
): RepairFlowResponse {
  // Model can come from message (button click) or context
  const modelId = (context.device_model || message).toLowerCase();

  // Check if user selected "not sure" / "other"
  if (modelId === "iphone-other" || modelId === "not sure") {
    return handleIdentifyiPhone(context);
  }

  const iphoneModel = getIPhoneModel(modelId);

  if (iphoneModel) {
    // We have a specific model - show issues with prices
    return {
      type: "repair_flow_response",
      messages: [`Perfect! ${iphoneModel.name}. What's wrong with it?`],
      scene: {
        device_type: "iphone",
        device_name: iphoneModel.name,
        device_image: "/images/devices/iphone-generic.png",
        device_summary: iphoneModel.name,
        jobs: [
          {
            id: "screen",
            label: "Screen Repair",
            price: iphoneModel.screenPrice,
            time: "45 mins",
          },
          {
            id: "battery",
            label: "Battery Replacement",
            price: iphoneModel.batteryPrice,
            time: "30 mins",
          },
          {
            id: "charging",
            label: "Charging Port",
            price: "From £45",
            time: "45 mins",
          },
          {
            id: "camera",
            label: "Camera Repair",
            price: "From £55",
            time: "45 mins",
          },
          {
            id: "water",
            label: "Water Damage",
            price: "Assessment required",
            time: "24-48 hrs",
          },
        ],
        selected_job: null,
        price_estimate: null,
        show_book_cta: false,
      },
      quick_actions: [
        { icon: "fa-mobile-screen", label: "Screen Repair", value: "screen" },
        { icon: "fa-battery-half", label: "Battery", value: "battery" },
        { icon: "fa-plug", label: "Charging Port", value: "charging" },
        { icon: "fa-question-circle", label: "Something else", value: "other" },
      ],
      morph_layout: true,
    };
  }

  // Unknown model - help identify
  return handleIdentifyiPhone(context);
}

/**
 * Help identify iPhone model
 */
function handleIdentifyiPhone(context: RepairFlowContext): RepairFlowResponse {
  return {
    type: "repair_flow_response",
    messages: [
      "No problem! Let me help you figure out which iPhone you have. 🔍",
      "Does your iPhone have Face ID (no home button) or a round home button at the bottom?",
    ],
    scene: {
      device_type: "iphone",
      device_name: "iPhone",
      device_image: "/images/devices/iphone-generic.png",
      device_summary: "iPhone (identifying model...)",
      jobs: null,
      selected_job: null,
      price_estimate: null,
      show_book_cta: false,
    },
    quick_actions: IPHONE_IDENTIFY_ACTIONS,
    morph_layout: true,
  };
}

/**
 * Handle identification response (Face ID, Home Button, size, usable/not usable)
 */
function handleIdentifyResponse(
  message: string,
  context: RepairFlowContext
): RepairFlowResponse {
  const action = message.replace("identify_", "").toLowerCase();
  const deviceType = context.device_type || "iphone";
  const deviceName =
    deviceType === "iphone"
      ? "iPhone"
      : deviceType === "ipad"
      ? "iPad"
      : deviceType === "samsung"
      ? "Samsung"
      : "device";
  const id = context.identification || {};

  // Device is usable - guide them to Settings
  if (action === "device_usable") {
    return {
      type: "repair_flow_response",
      messages: [
        "Perfect! Here's the easiest way to find your model: 📱",
        deviceType === "iphone"
          ? "Go to Settings → General → About → look for 'Model Name'"
          : deviceType === "samsung"
          ? "Go to Settings → About Phone → look for 'Model Name'"
          : "Go to Settings → About → look for 'Model Name'",
        "What does it say?",
      ],
      new_step: "identify_model",
      scene: {
        device_type: deviceType,
        device_name: `${deviceName} (checking Settings...)`,
        device_image: `/images/devices/${deviceType}-generic.png`,
        device_summary: `${deviceName} - Checking Settings`,
        jobs: null,
        selected_job: null,
        price_estimate: null,
        show_book_cta: false,
      },
      quick_actions: [
        {
          icon: "fa-cog",
          label: "Found it!",
          value: "identify_found",
        },
        {
          icon: "fa-question-circle",
          label: "Can't find it",
          value: "identify_cant_find_settings",
        },
        {
          icon: "fa-store",
          label: "Skip - I'll bring it in",
          value: "identify_giveup",
        },
      ],
      morph_layout: true,
      next_context: {
        identification: {
          ...id,
          device_usable: true,
          asked_settings: true,
        },
      },
    };
  }

  // Device not usable - ask about physical characteristics (port, cameras)
  if (action === "device_not_usable") {
    return {
      type: "repair_flow_response",
      messages: [
        "No worries! Let's figure it out from the outside. 🔍",
        deviceType === "iphone"
          ? "What type of charging port does it have?"
          : "Can you describe it a bit? (size, cameras, any distinguishing features)",
      ],
      new_step: "identify_model",
      scene: {
        device_type: deviceType,
        device_name: `${deviceName} (identifying...)`,
        device_image: `/images/devices/${deviceType}-generic.png`,
        device_summary: `${deviceName} - Physical identification`,
        jobs: null,
        selected_job: null,
        price_estimate: null,
        show_book_cta: false,
      },
      quick_actions:
        deviceType === "iphone"
          ? [
              {
                icon: "fa-bolt",
                label: "Lightning (old style)",
                value: "identify_lightning",
              },
              {
                icon: "fa-plug",
                label: "USB-C (new style)",
                value: "identify_usbc",
              },
              {
                icon: "fa-question-circle",
                label: "Not sure",
                value: "identify_port_unknown",
              },
              {
                icon: "fa-store",
                label: "Skip - I'll bring it in",
                value: "identify_giveup",
              },
            ]
          : [
              {
                icon: "fa-store",
                label: "I'll bring it in",
                value: "identify_giveup",
              },
            ],
      morph_layout: true,
      next_context: {
        identification: {
          ...id,
          device_usable: false,
          asked_port: true,
        },
      },
    };
  }

  // Can't find in Settings - fall back to port/camera questions
  if (action === "cant_find_settings") {
    return {
      type: "repair_flow_response",
      messages: [
        "No problem! Let's try another way. 🔍",
        deviceType === "iphone"
          ? "What type of charging port does it have?"
          : "Can you tell me roughly how big it is, or how many cameras it has?",
      ],
      new_step: "identify_model",
      scene: {
        device_type: deviceType,
        device_name: `${deviceName} (identifying...)`,
        device_image: `/images/devices/${deviceType}-generic.png`,
        device_summary: `${deviceName} - Physical identification`,
        jobs: null,
        selected_job: null,
        price_estimate: null,
        show_book_cta: false,
      },
      quick_actions:
        deviceType === "iphone"
          ? [
              {
                icon: "fa-bolt",
                label: "Lightning (old style)",
                value: "identify_lightning",
              },
              {
                icon: "fa-plug",
                label: "USB-C (new style)",
                value: "identify_usbc",
              },
              {
                icon: "fa-question-circle",
                label: "Not sure about port",
                value: "identify_port_unknown",
              },
            ]
          : [
              {
                icon: "fa-store",
                label: "I'll bring it in",
                value: "identify_giveup",
              },
            ],
      morph_layout: true,
      next_context: {
        identification: {
          ...id,
          asked_port: true,
        },
      },
    };
  }

  // Don't know port type - ask about cameras instead
  if (action === "port_unknown") {
    return {
      type: "repair_flow_response",
      messages: [
        "OK, let's try cameras! How many cameras does it have on the back?",
      ],
      new_step: "identify_model",
      scene: {
        device_type: deviceType,
        device_name: `${deviceName} (identifying...)`,
        device_image: `/images/devices/${deviceType}-generic.png`,
        device_summary: `${deviceName} - Checking cameras`,
        jobs: null,
        selected_job: null,
        price_estimate: null,
        show_book_cta: false,
      },
      quick_actions: [
        { icon: "fa-circle", label: "1 camera", value: "identify_1cam" },
        { icon: "fa-circle", label: "2 cameras", value: "identify_2cam" },
        { icon: "fa-circle", label: "3 cameras", value: "identify_3cam" },
        {
          icon: "fa-store",
          label: "Skip - I'll bring it in",
          value: "identify_giveup",
        },
      ],
      morph_layout: true,
      next_context: {
        identification: {
          ...id,
          asked_cameras: true,
        },
      },
    };
  }

  if (action === "faceid") {
    // Face ID phone - ask about size
    return {
      type: "repair_flow_response",
      messages: ["Great! And roughly how big is the screen?"],
      scene: {
        device_type: "iphone",
        device_name: "iPhone (Face ID)",
        device_image: "/images/devices/iphone-generic.png",
        device_summary: "iPhone with Face ID",
        jobs: null,
        selected_job: null,
        price_estimate: null,
        show_book_cta: false,
      },
      quick_actions: IPHONE_SIZE_ACTIONS,
      morph_layout: true,
    };
  }

  if (action === "homebutton") {
    // Home button phone - narrowed down to older models
    const homeButtonModels = getMatchingIPhones(false, null);
    return {
      type: "repair_flow_response",
      messages: ["Got it! That narrows it down. Is it one of these?"],
      scene: {
        device_type: "iphone",
        device_name: "iPhone (Home Button)",
        device_image: "/images/devices/iphone-generic.png",
        device_summary: "iPhone with Home Button",
        jobs: null,
        selected_job: null,
        price_estimate: null,
        show_book_cta: false,
      },
      quick_actions: [
        { icon: "fa-mobile-alt", label: "iPhone SE", value: "iphone-se-3" },
        {
          icon: "fa-mobile-alt",
          label: "iPhone 8 / 8 Plus",
          value: "iphone-8",
        },
        {
          icon: "fa-mobile-alt",
          label: "iPhone 7 / 7 Plus",
          value: "iphone-7",
        },
        {
          icon: "fa-mobile-alt",
          label: "iPhone 6S / 6S Plus",
          value: "iphone-6s",
        },
        {
          icon: "fa-question-circle",
          label: "Still not sure",
          value: "model_unknown",
        },
      ],
      morph_layout: true,
    };
  }

  // Size selected for Face ID phones
  if (action === "small" || action === "medium" || action === "large") {
    const size = action as "small" | "medium" | "large";
    const matchingModels = getMatchingIPhones(true, size);

    if (matchingModels.length > 0) {
      const modelActions: QuickAction[] = matchingModels
        .slice(0, 5)
        .map((m) => ({
          icon: "fa-mobile-alt",
          label: m.name,
          value: m.id,
        }));
      modelActions.push({
        icon: "fa-question-circle",
        label: "Still not sure",
        value: "identify_giveup",
      });

      return {
        type: "repair_flow_response",
        messages: ["Based on that, it's likely one of these:"],
        scene: {
          device_type: "iphone",
          device_name: "iPhone",
          device_image: "/images/devices/iphone-generic.png",
          device_summary: "iPhone (Face ID, " + size + " screen)",
          jobs: null,
          selected_job: null,
          price_estimate: null,
          show_book_cta: false,
        },
        quick_actions: modelActions,
        morph_layout: true,
      };
    }
  }

  // Lightning port = iPhone 14 or earlier
  if (action === "lightning") {
    const id = context.identification || {};
    return {
      type: "repair_flow_response",
      messages: [
        "Lightning port - that means iPhone 14 or earlier. 👍",
        "How many cameras does it have on the back?",
      ],
      scene: {
        device_type: "iphone",
        device_name: "iPhone (Lightning)",
        device_image: "/images/devices/iphone-generic.png",
        device_summary: "iPhone with Lightning port",
        jobs: null,
        selected_job: null,
        price_estimate: null,
        show_book_cta: false,
      },
      quick_actions: [
        { icon: "fa-circle", label: "1 camera", value: "identify_1cam" },
        {
          icon: "fa-circle",
          label: "2 cameras (diagonal)",
          value: "identify_2cam",
        },
        { icon: "fa-circle", label: "3 cameras", value: "identify_3cam" },
        {
          icon: "fa-cog",
          label: "Found it in Settings!",
          value: "identify_found",
        },
      ],
      morph_layout: true,
      next_context: {
        identification: {
          ...id,
          port_type: "lightning",
          asked_port: true,
          asked_cameras: true,
        },
      },
    };
  }

  // USB-C = iPhone 15 or later
  if (action === "usbc") {
    const id = context.identification || {};
    return {
      type: "repair_flow_response",
      messages: [
        "USB-C - that's an iPhone 15 or newer! 🎉",
        "Which one is it?",
      ],
      scene: {
        device_type: "iphone",
        device_name: "iPhone 15 series",
        device_image: "/images/devices/iphone-generic.png",
        device_summary: "iPhone 15 series",
        jobs: null,
        selected_job: null,
        price_estimate: null,
        show_book_cta: false,
      },
      quick_actions: [
        { icon: "fa-mobile-alt", label: "iPhone 15", value: "iphone-15" },
        {
          icon: "fa-mobile-alt",
          label: "iPhone 15 Plus",
          value: "iphone-15-plus",
        },
        {
          icon: "fa-mobile-alt",
          label: "iPhone 15 Pro",
          value: "iphone-15-pro",
        },
        {
          icon: "fa-mobile-alt",
          label: "iPhone 15 Pro Max",
          value: "iphone-15-pro-max",
        },
        {
          icon: "fa-mobile-alt",
          label: "iPhone 16 series",
          value: "identify_iphone16",
        },
      ],
      morph_layout: true,
      next_context: {
        identification: { ...id, port_type: "usbc", asked_port: true },
      },
    };
  }

  // 1 camera (Lightning) = iPhone SE, XR, or older
  if (action === "1cam") {
    const id = context.identification || {};
    return {
      type: "repair_flow_response",
      messages: ["One camera - is it a smaller phone or full-size?"],
      scene: {
        device_type: "iphone",
        device_name: "iPhone (1 camera)",
        device_image: "/images/devices/iphone-generic.png",
        device_summary: "iPhone with 1 camera",
        jobs: null,
        selected_job: null,
        price_estimate: null,
        show_book_cta: false,
      },
      quick_actions: [
        {
          icon: "fa-mobile-alt",
          label: "iPhone SE (small, home button)",
          value: "iphone-se-3",
        },
        {
          icon: "fa-mobile-alt",
          label: "iPhone XR (colourful, no home button)",
          value: "iphone-xr",
        },
        {
          icon: "fa-mobile-alt",
          label: "iPhone 11 (colourful, no home button)",
          value: "iphone-11",
        },
        {
          icon: "fa-mobile-alt",
          label: "iPhone 8 or older (home button)",
          value: "iphone-8",
        },
      ],
      morph_layout: true,
      next_context: {
        identification: { ...id, camera_count: 1, asked_cameras: true },
      },
    };
  }

  // 2 cameras (Lightning) = iPhone X, XS, 11 Pro, 12, 13, 14
  if (action === "2cam") {
    const id = context.identification || {};
    return {
      type: "repair_flow_response",
      messages: [
        "Two cameras - does it have Face ID (no home button) or a home button?",
      ],
      scene: {
        device_type: "iphone",
        device_name: "iPhone (2 cameras)",
        device_image: "/images/devices/iphone-generic.png",
        device_summary: "iPhone with 2 cameras",
        jobs: null,
        selected_job: null,
        price_estimate: null,
        show_book_cta: false,
      },
      quick_actions: [
        {
          icon: "fa-expand",
          label: "Face ID (no home button)",
          value: "identify_2cam_faceid",
        },
        { icon: "fa-circle", label: "Has home button", value: "iphone-8-plus" },
      ],
      morph_layout: true,
      next_context: {
        identification: {
          ...id,
          camera_count: 2,
          asked_cameras: true,
          asked_faceid: true,
        },
      },
    };
  }

  // 2 cameras + Face ID
  if (action === "2cam_faceid") {
    const id = context.identification || {};
    return {
      type: "repair_flow_response",
      messages: ["Great! It's likely one of these - which looks right?"],
      scene: {
        device_type: "iphone",
        device_name: "iPhone (2 cam, Face ID)",
        device_image: "/images/devices/iphone-generic.png",
        device_summary: "iPhone with 2 cameras + Face ID",
        jobs: null,
        selected_job: null,
        price_estimate: null,
        show_book_cta: false,
      },
      quick_actions: [
        {
          icon: "fa-mobile-alt",
          label: "iPhone 14 / 14 Plus",
          value: "iphone-14",
        },
        {
          icon: "fa-mobile-alt",
          label: "iPhone 13 / 13 Mini",
          value: "iphone-13",
        },
        {
          icon: "fa-mobile-alt",
          label: "iPhone 12 / 12 Mini",
          value: "iphone-12",
        },
        { icon: "fa-mobile-alt", label: "iPhone 11", value: "iphone-11" },
        { icon: "fa-mobile-alt", label: "iPhone X / XS", value: "iphone-x" },
      ],
      morph_layout: true,
    };
  }

  // 3 cameras = Pro models
  if (action === "3cam") {
    return {
      type: "repair_flow_response",
      messages: ["Three cameras - that's a Pro model! Which one?"],
      scene: {
        device_type: "iphone",
        device_name: "iPhone Pro",
        device_image: "/images/devices/iphone-generic.png",
        device_summary: "iPhone Pro (3 cameras)",
        jobs: null,
        selected_job: null,
        price_estimate: null,
        show_book_cta: false,
      },
      quick_actions: [
        {
          icon: "fa-mobile-alt",
          label: "iPhone 14 Pro / Pro Max",
          value: "iphone-14-pro",
        },
        {
          icon: "fa-mobile-alt",
          label: "iPhone 13 Pro / Pro Max",
          value: "iphone-13-pro",
        },
        {
          icon: "fa-mobile-alt",
          label: "iPhone 12 Pro / Pro Max",
          value: "iphone-12-pro",
        },
        {
          icon: "fa-mobile-alt",
          label: "iPhone 11 Pro / Pro Max",
          value: "iphone-11-pro",
        },
      ],
      morph_layout: true,
    };
  }

  // iPhone 16 series
  if (action === "iphone16") {
    return {
      type: "repair_flow_response",
      messages: ["iPhone 16 - the latest! Which model?"],
      scene: {
        device_type: "iphone",
        device_name: "iPhone 16 series",
        device_image: "/images/devices/iphone-generic.png",
        device_summary: "iPhone 16 series",
        jobs: null,
        selected_job: null,
        price_estimate: null,
        show_book_cta: false,
      },
      quick_actions: [
        { icon: "fa-mobile-alt", label: "iPhone 16", value: "iphone-16" },
        {
          icon: "fa-mobile-alt",
          label: "iPhone 16 Plus",
          value: "iphone-16-plus",
        },
        {
          icon: "fa-mobile-alt",
          label: "iPhone 16 Pro",
          value: "iphone-16-pro",
        },
        {
          icon: "fa-mobile-alt",
          label: "iPhone 16 Pro Max",
          value: "iphone-16-pro-max",
        },
      ],
      morph_layout: true,
    };
  }

  // User has box/receipt
  if (action === "box") {
    return {
      type: "repair_flow_response",
      messages: [
        "Perfect! The model name should be printed on the box. 📦",
        "Just type it in below, or pick from the list if you see it:",
      ],
      scene: {
        device_type: context.device_type || "iphone",
        device_name: "Checking box...",
        device_image: "/images/devices/iphone-generic.png",
        device_summary: "Checking box/receipt",
        jobs: null,
        selected_job: null,
        price_estimate: null,
        show_book_cta: false,
      },
      quick_actions: [
        ...getRecentIPhoneActions(),
        {
          icon: "fa-keyboard",
          label: "Let me type it",
          value: "identify_type",
        },
      ],
      morph_layout: true,
    };
  }

  // User found it in settings
  if (action === "found") {
    return {
      type: "repair_flow_response",
      messages: [
        "Brilliant! What does it say? 📱",
        "Type the model name, or pick from the list:",
      ],
      scene: {
        device_type: context.device_type || "iphone",
        device_name: "Found in Settings",
        device_image: "/images/devices/iphone-generic.png",
        device_summary: "Model found in Settings",
        jobs: null,
        selected_job: null,
        price_estimate: null,
        show_book_cta: false,
      },
      quick_actions: [
        ...getRecentIPhoneActions(),
        {
          icon: "fa-keyboard",
          label: "Let me type it",
          value: "identify_type",
        },
      ],
      morph_layout: true,
    };
  }

  // User wants to type model
  if (action === "type") {
    return {
      type: "repair_flow_response",
      messages: [
        "No problem! Just type your model (e.g. 'iPhone 13 Pro' or 'Galaxy S23'):",
      ],
      scene: null,
      quick_actions: null,
      morph_layout: false,
    };
  }

  // User gives up - proceed with range pricing
  if (action === "giveup" || action === "skip") {
    return handleProceedWithoutModel(context);
  }

  // Fallback
  return handleModelUnknown("", context);
}

/**
 * Start identification flow - first ask if device is turned on/usable
 * If usable → Guide to Settings to find model
 * If not usable → Ask about port type, cameras, etc.
 */
function startIdentificationFlow(
  context: RepairFlowContext
): RepairFlowResponse {
  const deviceType = context.device_type || "iphone";
  const deviceName =
    deviceType === "iphone"
      ? "iPhone"
      : deviceType === "ipad"
      ? "iPad"
      : deviceType === "samsung"
      ? "Samsung"
      : "device";

  return {
    type: "repair_flow_response",
    messages: [
      "No problem - let me help you figure it out! 🔍",
      `Is your ${deviceName} turned on and usable right now?`,
    ],
    new_step: "identify_device",
    scene: {
      device_type: deviceType,
      device_name: `${deviceName} (identifying...)`,
      device_image: `/images/devices/${deviceType}-generic.png`,
      device_summary: `${deviceName} - Let's identify it`,
      jobs: null,
      selected_job: null,
      price_estimate: null,
      show_book_cta: false,
    },
    quick_actions: [
      {
        icon: "fa-check",
        label: "Yes, it's working",
        value: "identify_device_usable",
      },
      {
        icon: "fa-times",
        label: "No, it won't turn on",
        value: "identify_device_not_usable",
      },
      {
        icon: "fa-question-circle",
        label: "Skip - I'll bring it in",
        value: "identify_giveup",
      },
    ],
    morph_layout: true,
    next_context: {
      identification: {
        ...(context.identification || {}),
        asked_usable: true,
        attempts: (context.identification?.attempts || 0) + 1,
      },
    },
  };
}

/**
 * Proceed without knowing exact model - give range pricing
 */
function handleProceedWithoutModel(
  context: RepairFlowContext
): RepairFlowResponse {
  const deviceType = context.device_type || "iphone";

  return {
    type: "repair_flow_response",
    messages: [
      "No worries! We'll identify it when you come in. 👍",
      "What seems to be wrong with it? I can give you a price range:",
    ],
    scene: {
      device_type: deviceType,
      device_name:
        deviceType === "iphone" ? "iPhone (model TBC)" : "Device (model TBC)",
      device_image: "/images/devices/iphone-generic.png",
      device_summary:
        deviceType === "iphone" ? "iPhone (model TBC)" : "Device (model TBC)",
      jobs: [
        {
          id: "screen",
          label: "Screen Repair",
          price: "From £49*",
          time: "30-60 mins",
        },
        {
          id: "battery",
          label: "Battery Replacement",
          price: "From £35*",
          time: "30 mins",
        },
        {
          id: "charging",
          label: "Charging Port",
          price: "From £45*",
          time: "45 mins",
        },
        {
          id: "water",
          label: "Water Damage",
          price: "Assessment required",
          time: "24-48 hrs",
        },
      ],
      selected_job: null,
      price_estimate: null,
      show_book_cta: false,
    },
    quick_actions: [
      { icon: "fa-mobile-screen", label: "Screen Repair", value: "screen" },
      { icon: "fa-battery-half", label: "Battery", value: "battery" },
      { icon: "fa-plug", label: "Charging Port", value: "charging" },
      { icon: "fa-question-circle", label: "Something else", value: "other" },
    ],
    morph_layout: true,
  };
}

/**
 * User can't identify model - HELP them find it!
 * Uses context awareness: selected_series, known_info_summary
 * Uses regex patterns for flexible model detection
 * If user types a model name, accept it and move to issue selection
 * If user mentions an issue, skip to pricing with range
 */
function handleModelUnknown(
  message: string,
  context: RepairFlowContext
): RepairFlowResponse {
  const deviceType = context.device_type || "iphone";
  const series = context.selected_series || "";
  const summary = context.known_info_summary || "";
  const id = context.identification || {};
  const attempts = (id.attempts || 0) + 1;
  const msgLower = message.toLowerCase().trim();

  console.log("[Model Unknown] Parsing:", {
    message: msgLower,
    deviceType,
    series,
    summary,
  });

  // Detect "I don't know" type phrases - start identification help flow
  const dontKnowPatterns = [
    /^i('m| am)?\s*(not\s+sure|unsure|don'?t\s+know)/i,
    /^not\s+sure/i,
    /^don'?t\s+know/i,
    /^no\s+idea/i,
    /^i\s+have\s+no\s+(idea|clue)/i,
    /^can'?t\s+(remember|tell)/i,
    /^(dunno|idk)$/i,
  ];

  if (dontKnowPatterns.some((pattern) => pattern.test(msgLower))) {
    console.log(
      "[Model Unknown] User doesn't know model - starting identification help"
    );
    // Start identification flow - first ask if device is usable
    return startIdentificationFlow(context);
  }

  // Try regex-based model detection with context awareness
  const modelDetected = detectModelWithContext(
    msgLower,
    deviceType,
    series,
    summary
  );
  if (modelDetected) {
    return {
      type: "repair_flow_response",
      messages: [
        `${modelDetected.label} - got it! 👍`,
        `What's wrong with it?`,
      ],
      new_step: "issue",
      identified: {
        device_model: modelDetected.id,
        device_model_label: modelDetected.label,
      },
      scene: {
        device_type: deviceType,
        device_name: modelDetected.label,
        device_image: `/images/devices/${deviceType}-generic.png`,
        device_summary: modelDetected.label,
        jobs: null,
        selected_job: null,
        price_estimate: null,
        show_book_cta: false,
      },
      quick_actions: [
        { icon: "fa-mobile-screen", label: "Screen Repair", value: "screen" },
        { icon: "fa-battery-half", label: "Battery", value: "battery" },
        { icon: "fa-plug", label: "Charging Port", value: "charging" },
        { icon: "fa-camera", label: "Camera", value: "camera" },
        { icon: "fa-droplet", label: "Water Damage", value: "water" },
        { icon: "fa-question", label: "Something Else", value: "other_issue" },
      ],
      morph_layout: true,
    };
  }

  // Check if user mentioned an issue - skip to pricing with range
  const issueKeywords: Record<
    string,
    { label: string; priceRange: string; time: string }
  > = {
    screen: {
      label: "Screen Repair",
      priceRange: "£40 - £200",
      time: "1-2 hours",
    },
    battery: {
      label: "Battery Replacement",
      priceRange: "£40 - £90",
      time: "30-60 mins",
    },
    charging: {
      label: "Charging Port",
      priceRange: "around £50",
      time: "45 mins",
    },
    charge: {
      label: "Charging Port",
      priceRange: "around £50",
      time: "45 mins",
    },
    back: { label: "Back Glass", priceRange: "£80 - £150", time: "1-2 hours" },
    camera: {
      label: "Camera Repair",
      priceRange: "£50 - £120",
      time: "1-2 hours",
    },
    water: {
      label: "Water Damage",
      priceRange: "from £50",
      time: "24-72 hours",
    },
  };

  for (const [keyword, info] of Object.entries(issueKeywords)) {
    if (msgLower.includes(keyword)) {
      const deviceName =
        context.device_type === "iphone"
          ? "iPhone"
          : context.device_type === "ipad"
          ? "iPad"
          : context.device_type === "samsung"
          ? "Samsung"
          : "device";
      return {
        type: "repair_flow_response",
        messages: [
          `${info.label} - got it! 💪`,
          `For an unknown ${deviceName} model, that's typically ${info.priceRange}. Most repairs take ${info.time}.`,
          "This is just an estimate - John will confirm the exact price when he sees your device.",
        ],
        new_step: "outcome_price",
        scene: {
          device_type: context.device_type || "iphone",
          device_name: deviceName,
          device_image: `/images/devices/${
            context.device_type || "iphone"
          }-generic.png`,
          device_summary: `${deviceName} – ${info.label}`,
          jobs: null,
          selected_job: keyword,
          price_estimate: info.priceRange,
          show_book_cta: true,
        },
        quick_actions: BOOKING_ACTIONS,
        morph_layout: true,
        next_context: {
          step: "final",
          issue: keyword as any,
        },
      };
    }
  }

  // Couldn't identify model - ask for clarification (don't restart flow!)
  // If user typed something we didn't understand, be helpful
  if (msgLower.length > 0 && msgLower !== "model_unknown") {
    const deviceName = getDeviceName(deviceType);
    return {
      type: "repair_flow_response",
      messages: [
        `I'm not sure which model "${message}" is. Could you be more specific?`,
        `For example: "${
          deviceType === "samsung"
            ? "S21"
            : deviceType === "iphone"
            ? "iPhone 12"
            : "the model number"
        }"`,
      ],
      new_step: "model_unknown", // Stay on same step but don't loop
      scene: null,
      quick_actions: [
        { icon: "fa-store", label: "I'll bring it in", value: "bring_in" },
        {
          icon: "fa-question",
          label: "I really don't know",
          value: "identify_giveup",
        },
      ],
      morph_layout: false,
    };
  }

  // After 3+ attempts, just proceed with range pricing
  if (attempts >= 3) {
    return handleProceedWithoutModel(context);
  }

  // iPhone-specific identification help
  if (deviceType === "iphone") {
    // First time: Tell them about Settings + ask about port
    if (!id.asked_settings && !id.asked_port) {
      return {
        type: "repair_flow_response",
        messages: [
          "No problem! Let's figure it out together. 🔍",
          "The easiest way: Go to Settings → General → About and look for 'Model Name' - it'll say exactly which iPhone you have!",
          "Or I can help narrow it down - what type of charging port does it have?",
        ],
        scene: {
          device_type: "iphone",
          device_name: "iPhone (identifying...)",
          device_image: "/images/devices/iphone-generic.png",
          device_summary: "iPhone - Let's identify it",
          jobs: null,
          selected_job: null,
          price_estimate: null,
          show_book_cta: false,
        },
        quick_actions: [
          {
            icon: "fa-bolt",
            label: "Lightning (old style)",
            value: "identify_lightning",
          },
          {
            icon: "fa-plug",
            label: "USB-C (new style)",
            value: "identify_usbc",
          },
          {
            icon: "fa-box",
            label: "I have the box/receipt",
            value: "identify_box",
          },
          {
            icon: "fa-cog",
            label: "Found it in Settings!",
            value: "identify_found",
          },
          {
            icon: "fa-question-circle",
            label: "Still not sure",
            value: "identify_giveup",
          },
        ],
        morph_layout: true,
        next_context: {
          identification: {
            ...id,
            asked_settings: true,
            asked_port: true,
            attempts,
          },
        },
      };
    }

    // Already asked about port but not cameras - ask about cameras
    if (id.asked_port && !id.asked_cameras && id.port_type === "lightning") {
      return {
        type: "repair_flow_response",
        messages: [
          "OK, let's try another way. How many cameras does it have on the back?",
        ],
        scene: {
          device_type: "iphone",
          device_name: "iPhone (Lightning)",
          device_image: "/images/devices/iphone-generic.png",
          device_summary: "iPhone with Lightning port",
          jobs: null,
          selected_job: null,
          price_estimate: null,
          show_book_cta: false,
        },
        quick_actions: [
          { icon: "fa-circle", label: "1 camera", value: "identify_1cam" },
          { icon: "fa-circle", label: "2 cameras", value: "identify_2cam" },
          { icon: "fa-circle", label: "3 cameras", value: "identify_3cam" },
          {
            icon: "fa-arrow-right",
            label: "Just give me a price range",
            value: "identify_skip",
          },
        ],
        morph_layout: true,
        next_context: {
          identification: { ...id, asked_cameras: true, attempts },
        },
      };
    }

    // Already asked cameras - ask about Face ID
    if (id.asked_cameras && !id.asked_faceid && id.camera_count === 2) {
      return {
        type: "repair_flow_response",
        messages: [
          "Nearly there! Does it have Face ID (no home button) or a round home button?",
        ],
        scene: {
          device_type: "iphone",
          device_name: "iPhone (2 cameras)",
          device_image: "/images/devices/iphone-generic.png",
          device_summary: "iPhone with 2 cameras",
          jobs: null,
          selected_job: null,
          price_estimate: null,
          show_book_cta: false,
        },
        quick_actions: [
          {
            icon: "fa-expand",
            label: "Face ID (no home button)",
            value: "identify_faceid",
          },
          {
            icon: "fa-circle",
            label: "Has home button",
            value: "identify_homebutton",
          },
          {
            icon: "fa-arrow-right",
            label: "Just give me a price range",
            value: "identify_skip",
          },
        ],
        morph_layout: true,
        next_context: {
          identification: { ...id, asked_faceid: true, attempts },
        },
      };
    }

    // We've tried everything - offer to proceed with range pricing
    return {
      type: "repair_flow_response",
      messages: [
        "No worries - we can identify it when you come in! 👍",
        "In the meantime, what's wrong with it? I'll give you a price range:",
      ],
      scene: {
        device_type: "iphone",
        device_name: "iPhone (model TBC)",
        device_image: "/images/devices/iphone-generic.png",
        device_summary: "iPhone (model TBC)",
        jobs: [
          {
            id: "screen",
            label: "Screen Repair",
            price: "From £49*",
            time: "30-60 mins",
          },
          {
            id: "battery",
            label: "Battery Replacement",
            price: "From £35*",
            time: "30 mins",
          },
          {
            id: "charging",
            label: "Charging Port",
            price: "From £45*",
            time: "45 mins",
          },
          {
            id: "water",
            label: "Water Damage",
            price: "Assessment required",
            time: "24-48 hrs",
          },
        ],
        selected_job: null,
        price_estimate: null,
        show_book_cta: false,
      },
      quick_actions: [
        { icon: "fa-mobile-screen", label: "Screen Repair", value: "screen" },
        { icon: "fa-battery-half", label: "Battery", value: "battery" },
        { icon: "fa-plug", label: "Charging Port", value: "charging" },
        { icon: "fa-question-circle", label: "Something else", value: "other" },
      ],
      morph_layout: true,
      next_context: {
        identification: { ...id, attempts },
      },
    };
  }

  // iPad identification help
  if (deviceType === "ipad") {
    return {
      type: "repair_flow_response",
      messages: [
        "No problem! Let's work it out. 🔍",
        "Go to Settings → General → About and look for 'Model Name'.",
        "Or tell me - does it have a Home button, or is it all-screen with Face ID?",
      ],
      scene: {
        device_type: "ipad",
        device_name: "iPad (identifying...)",
        device_image: "/images/devices/ipad-generic.png",
        device_summary: "iPad - Let's identify it",
        jobs: null,
        selected_job: null,
        price_estimate: null,
        show_book_cta: false,
      },
      quick_actions: [
        {
          icon: "fa-circle",
          label: "Has Home Button",
          value: "identify_homebutton",
        },
        {
          icon: "fa-expand",
          label: "All-screen (Face ID)",
          value: "identify_faceid",
        },
        {
          icon: "fa-box",
          label: "I have the box/receipt",
          value: "identify_box",
        },
        {
          icon: "fa-cog",
          label: "Found it in Settings!",
          value: "identify_found",
        },
      ],
      morph_layout: true,
    };
  }

  // Samsung identification help
  if (deviceType === "samsung") {
    return {
      type: "repair_flow_response",
      messages: [
        "Let's find out which Samsung you have! 🔍",
        "Go to Settings → About Phone → Model Name.",
        "Or check the back of the phone - Samsung usually prints the model there too!",
      ],
      scene: {
        device_type: "samsung",
        device_name: "Samsung (identifying...)",
        device_image: "/images/devices/samsung-generic.png",
        device_summary: "Samsung - Let's identify it",
        jobs: null,
        selected_job: null,
        price_estimate: null,
        show_book_cta: false,
      },
      quick_actions: [
        { icon: "fa-mobile-alt", label: "Galaxy S series", value: "samsung-s" },
        { icon: "fa-mobile-alt", label: "Galaxy A series", value: "samsung-a" },
        {
          icon: "fa-mobile-alt",
          label: "Galaxy Note/Fold/Flip",
          value: "samsung-premium",
        },
        {
          icon: "fa-cog",
          label: "Found it in Settings!",
          value: "identify_found",
        },
        { icon: "fa-box", label: "I have the box", value: "identify_box" },
      ],
      morph_layout: true,
    };
  }

  // Generic fallback with helpful guidance
  return {
    type: "repair_flow_response",
    messages: [
      "No problem! Here's how to find your model: 🔍",
      "Check Settings → About (or About Phone/Device) for the model name.",
      "You can also check the original box, receipt, or invoice if you have it!",
    ],
    scene: {
      device_type: deviceType,
      device_name: "Device (identifying...)",
      device_image: "/images/devices/device-generic.png",
      device_summary: "Device - Let's identify it",
      jobs: null,
      selected_job: null,
      price_estimate: null,
      show_book_cta: false,
    },
    quick_actions: [
      {
        icon: "fa-cog",
        label: "Found it in Settings!",
        value: "identify_found",
      },
      {
        icon: "fa-box",
        label: "I have the box/receipt",
        value: "identify_box",
      },
      { icon: "fa-keyboard", label: "Let me type it", value: "identify_type" },
      {
        icon: "fa-arrow-right",
        label: "Skip - give me a range",
        value: "identify_skip",
      },
    ],
    morph_layout: true,
  };
}

/**
 * Handle device identification flow
 */
function handleIdentifyDevice(
  message: string,
  context: RepairFlowContext
): RepairFlowResponse {
  // This is called when we're in the middle of identifying a device
  return handleCategorySelected(message, context);
}

/**
 * Handle model identification flow
 */
function handleIdentifyModel(
  message: string,
  context: RepairFlowContext
): RepairFlowResponse {
  return handleIdentifyResponse(message, context);
}

/**
 * Step 3: Issue selected - show price and booking options
 */
async function handleIssueSelected(
  message: string,
  context: RepairFlowContext
): Promise<RepairFlowResponse> {
  const issue = context.issue || message.toLowerCase();

  // Check if issue is "other" - need to diagnose
  if (issue === "other") {
    return handleDiagnoseIssue(message, context);
  }

  // Check if this needs a diagnostic (water damage, unknown model, etc.)
  if (needsDiagnostic(issue, context.device_model || null)) {
    return handleNeedsDiagnostic(context, issue);
  }

  const deviceConfig = context.device_type
    ? getDeviceConfig(context.device_type)
    : null;

  if (!deviceConfig) {
    return handleGreeting();
  }

  const jobId = issueToJobId(issue);
  const job = jobId ? getJobFromDevice(context.device_type || "", jobId) : null;

  // Try to get actual price from database or iPhone model
  // Use sensible defaults if no specific price found
  let priceEstimate = job?.price || getDefaultPriceRange(jobId || issue);
  let turnaround = job?.time || getDefaultTurnaround(jobId || issue);

  console.log("[Repair Flow] Price lookup:", {
    device_model: context.device_model,
    device_type: context.device_type,
    issue,
    jobId,
    initialPrice: priceEstimate,
  });

  // If we have a specific iPhone model, use those prices
  if (context.device_model && context.device_type === "iphone") {
    const iphoneModel = getIPhoneModel(context.device_model);
    console.log("[Repair Flow] iPhone model lookup:", {
      model: context.device_model,
      found: !!iphoneModel,
      screenPrice: iphoneModel?.screenPrice,
      batteryPrice: iphoneModel?.batteryPrice,
    });

    // Screen and battery need exact model match
    if (iphoneModel) {
      if (jobId === "screen") priceEstimate = iphoneModel.screenPrice;
      if (jobId === "battery") priceEstimate = iphoneModel.batteryPrice;
    }

    // Charging port price works with partial model match (iphone-12, iphone-14-pro, etc.)
    if (jobId === "charging") {
      priceEstimate = getIPhoneChargingPrice(context.device_model);
      turnaround = "45 mins";
    }
  }

  // Try database lookup
  if (context.device_model && issue) {
    const dbPrice = await lookupPrice(context.device_model, issue);
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
 * Handle "other" issue - ask diagnostic questions
 */
function handleDiagnoseIssue(
  message: string,
  context: RepairFlowContext
): RepairFlowResponse {
  const deviceName =
    context.device_model ||
    (context.device_type
      ? getDeviceConfig(context.device_type)?.name
      : "device") ||
    "device";

  return {
    type: "repair_flow_response",
    messages: [
      "No problem, let's figure out what's going on! 🔍",
      `What happens when you try to use your ${deviceName}?`,
    ],
    scene: null,
    quick_actions: SYMPTOM_ACTIONS,
    morph_layout: true,
  };
}

/**
 * Handle symptom selection
 */
function handleSymptomSelected(
  message: string,
  context: RepairFlowContext
): RepairFlowResponse {
  const symptom = message.replace("symptom_", "").toLowerCase();

  // Map symptom to issue
  const issueMap: Record<string, string> = {
    no_power: "charging",
    screen: "screen",
    battery: "battery",
    sound: "speaker",
    camera: "camera",
    water: "water",
  };

  const issue = issueMap[symptom] || "other";

  // Water damage always needs diagnostic
  if (symptom === "water") {
    return handleNeedsDiagnostic(context, "water");
  }

  // Power issues often need diagnostic
  if (symptom === "no_power") {
    return handleNeedsDiagnostic(context, "power");
  }

  // Update context and proceed to issue selected
  const newContext: RepairFlowContext = {
    ...context,
    issue: issue as any,
  };

  return handleIssueSelected(issue, newContext) as any;
}

/**
 * User wants to describe issue in text
 */
function handleDescribeIssue(context: RepairFlowContext): RepairFlowResponse {
  return {
    type: "repair_flow_response",
    messages: [
      "Sure! Just type what's happening and I'll help figure out what repair you need.",
    ],
    scene: null,
    quick_actions: null,
    morph_layout: false,
  };
}

/**
 * Issue needs diagnostic - can't give exact price
 */
function handleNeedsDiagnostic(
  context: RepairFlowContext,
  issue: string
): RepairFlowResponse {
  const deviceName =
    context.device_model ||
    (context.device_type
      ? getDeviceConfig(context.device_type)?.name
      : "device") ||
    "device";

  let messages: string[];

  if (issue === "water") {
    messages = [
      "Water damage can be tricky - it really depends on what's affected inside. 💧",
      "The best thing is to bring it in for a free diagnostic. We'll open it up, assess the damage, and give you a firm quote.",
      "No fix, no fee! 👍",
    ];
  } else if (issue === "power") {
    messages = [
      "Power issues can have a few causes - could be the battery, charging port, or something else.",
      "The best thing is to bring it in for a free diagnostic - we'll figure out exactly what's wrong and give you a firm quote.",
      "No fix, no fee! 👍",
    ];
  } else {
    messages = [
      "Based on what you've described, this might need a closer look.",
      "The best thing is to bring it in for a free diagnostic - we'll tell you exactly what's wrong and give you a firm quote before doing any work.",
      "No fix, no fee! 👍",
    ];
  }

  return {
    type: "repair_flow_response",
    messages,
    scene: {
      device_type: context.device_type,
      device_name: deviceName,
      device_image: context.device_type
        ? getDeviceConfig(context.device_type)?.image || ""
        : "",
      device_summary: `${deviceName} – Diagnostic Required`,
      jobs: null,
      selected_job: null,
      price_estimate: "Free Assessment",
      show_book_cta: true,
      needs_diagnostic: true,
    },
    quick_actions: DIAGNOSTIC_ACTIONS,
    morph_layout: true,
  };
}

/**
 * Handle directions request
 */
function handleDirections(): RepairFlowResponse {
  return {
    type: "repair_flow_response",
    messages: [
      `We're at ${BUSINESS_INFO.address}. 📍`,
      "Easy to find - right in the town centre!",
      "See you soon! 👋",
    ],
    scene: null,
    quick_actions: [
      { icon: "fa-map", label: "Open in Maps", value: "open_maps" },
      { icon: "fa-rotate-left", label: "Start Again", value: "start_again" },
    ],
    morph_layout: false,
  };
}

/**
 * Detect model with context awareness using regex patterns
 * Uses selected_series and known_info_summary to understand context
 * e.g. "21" + series="galaxy-s-series" → Galaxy S21
 */
function detectModelWithContext(
  text: string,
  deviceType: string,
  series: string,
  summary: string
): { id: string; label: string } | null {
  const msgLower = text.toLowerCase().trim();

  // Samsung patterns with regex
  if (deviceType === "samsung" || summary.toLowerCase().includes("samsung")) {
    // S series: s21, s20 fe, s23 ultra, etc.
    const sMatch = msgLower.match(/s\s*(\d+)\s*(fe|ultra|plus|\+)?/i);
    if (sMatch) {
      const num = sMatch[1];
      const variant = sMatch[2]?.toLowerCase();
      const variantId = variant ? "-" + variant.replace("+", "plus") : "";
      const variantLabel = variant
        ? " " + variant.toUpperCase().replace("PLUS", "+")
        : "";
      return {
        id: `galaxy-s${num}${variantId}`,
        label: `Galaxy S${num}${variantLabel}`,
      };
    }

    // If series is S and user just typed a number like "21"
    if (
      (series.includes("s-series") || series.includes("s series")) &&
      /^\d+$/.test(msgLower)
    ) {
      return {
        id: `galaxy-s${msgLower}`,
        label: `Galaxy S${msgLower}`,
      };
    }

    // A series: a54, a52, etc.
    const aMatch = msgLower.match(/a\s*(\d+)\s*(5g)?/i);
    if (aMatch) {
      const num = aMatch[1];
      const suffix = aMatch[2] ? " 5G" : "";
      return {
        id: `galaxy-a${num}`,
        label: `Galaxy A${num}${suffix}`,
      };
    }

    // If series is A and user just typed a number
    if (
      (series.includes("a-series") || series.includes("a series")) &&
      /^\d+$/.test(msgLower)
    ) {
      return {
        id: `galaxy-a${msgLower}`,
        label: `Galaxy A${msgLower}`,
      };
    }

    // Note series
    const noteMatch = msgLower.match(/note\s*(\d+)\s*(ultra|\+)?/i);
    if (noteMatch) {
      const num = noteMatch[1];
      const variant = noteMatch[2] ? " " + noteMatch[2] : "";
      return {
        id: `galaxy-note${num}`,
        label: `Galaxy Note ${num}${variant}`,
      };
    }

    // Z Flip/Fold
    const zMatch = msgLower.match(/z?\s*(flip|fold)\s*(\d+)?/i);
    if (zMatch) {
      const type = zMatch[1].toLowerCase();
      const num = zMatch[2] || "";
      return {
        id: `galaxy-z-${type}${num ? "-" + num : ""}`,
        label: `Galaxy Z ${type.charAt(0).toUpperCase() + type.slice(1)}${
          num ? " " + num : ""
        }`,
      };
    }
  }

  // iPhone patterns with regex
  if (deviceType === "iphone" || summary.toLowerCase().includes("iphone")) {
    // Match patterns like "12", "12 pro", "12 pro max", "12pro", etc.
    const iMatch = msgLower.match(/(\d+)\s*(pro\s*max|pro|plus|mini)?/i);
    if (iMatch) {
      const num = iMatch[1];
      const variant = iMatch[2]?.toLowerCase().replace(/\s+/g, "-");
      const variantId = variant ? "-" + variant : "";
      const variantLabel = iMatch[2] ? " " + iMatch[2].replace(/-/g, " ") : "";
      return {
        id: `iphone-${num}${variantId}`,
        label: `iPhone ${num}${variantLabel}`,
      };
    }

    // SE models
    const seMatch = msgLower.match(/se\s*(\d+|2020|2022)?/i);
    if (seMatch) {
      const gen = seMatch[1];
      if (gen === "3" || gen === "2022") {
        return { id: "iphone-se-3", label: "iPhone SE (3rd gen)" };
      } else if (gen === "2" || gen === "2020") {
        return { id: "iphone-se-2", label: "iPhone SE (2nd gen)" };
      }
      return { id: "iphone-se", label: "iPhone SE" };
    }

    // XR, XS, X
    if (msgLower.includes("xr")) return { id: "iphone-xr", label: "iPhone XR" };
    if (msgLower.includes("xs max"))
      return { id: "iphone-xs-max", label: "iPhone XS Max" };
    if (msgLower.includes("xs")) return { id: "iphone-xs", label: "iPhone XS" };
    if (msgLower === "x" || msgLower === "iphone x")
      return { id: "iphone-x", label: "iPhone X" };
  }

  // iPad patterns
  if (deviceType === "ipad" || summary.toLowerCase().includes("ipad")) {
    if (msgLower.includes("pro 12.9") || msgLower.includes("pro 129")) {
      return { id: "ipad-pro-12.9", label: 'iPad Pro 12.9"' };
    }
    if (msgLower.includes("pro 11")) {
      return { id: "ipad-pro-11", label: 'iPad Pro 11"' };
    }
    const airMatch = msgLower.match(/air\s*(\d+)?/i);
    if (airMatch) {
      const gen = airMatch[1] || "";
      return {
        id: `ipad-air${gen ? "-" + gen : ""}`,
        label: `iPad Air${gen ? " " + gen : ""}`,
      };
    }
    const miniMatch = msgLower.match(/mini\s*(\d+)?/i);
    if (miniMatch) {
      const gen = miniMatch[1] || "";
      return {
        id: `ipad-mini${gen ? "-" + gen : ""}`,
        label: `iPad Mini${gen ? " " + gen : ""}`,
      };
    }
    const genMatch = msgLower.match(/(\d+)(?:th|st|nd|rd)?\s*(?:gen)?/i);
    if (genMatch) {
      return { id: `ipad-${genMatch[1]}`, label: `iPad ${genMatch[1]}th Gen` };
    }
  }

  // Fallback to old pattern matching
  return detectModelFromText(text, deviceType);
}

/**
 * Detect model from user text input (legacy pattern matching)
 */
function detectModelFromText(
  text: string,
  deviceType: string
): { id: string; label: string } | null {
  const textLower = text.toLowerCase().replace(/[^a-z0-9\s]/g, "");

  // Samsung models
  if (deviceType === "samsung") {
    const samsungPatterns: Array<{
      patterns: string[];
      id: string;
      label: string;
    }> = [
      {
        patterns: ["s24 ultra", "s24ultra"],
        id: "galaxy-s24-ultra",
        label: "Galaxy S24 Ultra",
      },
      {
        patterns: ["s24+", "s24 plus"],
        id: "galaxy-s24-plus",
        label: "Galaxy S24+",
      },
      { patterns: ["s24"], id: "galaxy-s24", label: "Galaxy S24" },
      {
        patterns: ["s23 ultra", "s23ultra"],
        id: "galaxy-s23-ultra",
        label: "Galaxy S23 Ultra",
      },
      {
        patterns: ["s23+", "s23 plus"],
        id: "galaxy-s23-plus",
        label: "Galaxy S23+",
      },
      { patterns: ["s23"], id: "galaxy-s23", label: "Galaxy S23" },
      {
        patterns: ["s22 ultra", "s22ultra"],
        id: "galaxy-s22-ultra",
        label: "Galaxy S22 Ultra",
      },
      {
        patterns: ["s22+", "s22 plus"],
        id: "galaxy-s22-plus",
        label: "Galaxy S22+",
      },
      { patterns: ["s22"], id: "galaxy-s22", label: "Galaxy S22" },
      {
        patterns: ["s21 ultra", "s21ultra"],
        id: "galaxy-s21-ultra",
        label: "Galaxy S21 Ultra",
      },
      {
        patterns: ["s21+", "s21 plus"],
        id: "galaxy-s21-plus",
        label: "Galaxy S21+",
      },
      { patterns: ["s21 fe"], id: "galaxy-s21-fe", label: "Galaxy S21 FE" },
      { patterns: ["s21"], id: "galaxy-s21", label: "Galaxy S21" },
      {
        patterns: ["s20 ultra", "s20ultra"],
        id: "galaxy-s20-ultra",
        label: "Galaxy S20 Ultra",
      },
      {
        patterns: ["s20+", "s20 plus"],
        id: "galaxy-s20-plus",
        label: "Galaxy S20+",
      },
      { patterns: ["s20 fe"], id: "galaxy-s20-fe", label: "Galaxy S20 FE" },
      { patterns: ["s20"], id: "galaxy-s20", label: "Galaxy S20" },
      { patterns: ["a54"], id: "galaxy-a54", label: "Galaxy A54" },
      { patterns: ["a53"], id: "galaxy-a53", label: "Galaxy A53" },
      { patterns: ["a52"], id: "galaxy-a52", label: "Galaxy A52" },
      { patterns: ["a34"], id: "galaxy-a34", label: "Galaxy A34" },
      { patterns: ["a33"], id: "galaxy-a33", label: "Galaxy A33" },
      { patterns: ["a14"], id: "galaxy-a14", label: "Galaxy A14" },
      { patterns: ["a13"], id: "galaxy-a13", label: "Galaxy A13" },
      {
        patterns: ["z fold 5", "zfold5", "fold 5", "fold5"],
        id: "galaxy-z-fold-5",
        label: "Galaxy Z Fold 5",
      },
      {
        patterns: ["z fold 4", "zfold4", "fold 4", "fold4"],
        id: "galaxy-z-fold-4",
        label: "Galaxy Z Fold 4",
      },
      {
        patterns: ["z flip 5", "zflip5", "flip 5", "flip5"],
        id: "galaxy-z-flip-5",
        label: "Galaxy Z Flip 5",
      },
      {
        patterns: ["z flip 4", "zflip4", "flip 4", "flip4"],
        id: "galaxy-z-flip-4",
        label: "Galaxy Z Flip 4",
      },
    ];

    for (const model of samsungPatterns) {
      for (const pattern of model.patterns) {
        if (textLower.includes(pattern)) {
          return { id: model.id, label: model.label };
        }
      }
    }
  }

  // iPhone models
  if (deviceType === "iphone") {
    const iphonePatterns: Array<{
      patterns: string[];
      id: string;
      label: string;
    }> = [
      {
        patterns: ["15 pro max", "15promax"],
        id: "iphone-15-pro-max",
        label: "iPhone 15 Pro Max",
      },
      { patterns: ["15 pro"], id: "iphone-15-pro", label: "iPhone 15 Pro" },
      { patterns: ["15 plus"], id: "iphone-15-plus", label: "iPhone 15 Plus" },
      { patterns: ["15"], id: "iphone-15", label: "iPhone 15" },
      {
        patterns: ["14 pro max", "14promax"],
        id: "iphone-14-pro-max",
        label: "iPhone 14 Pro Max",
      },
      { patterns: ["14 pro"], id: "iphone-14-pro", label: "iPhone 14 Pro" },
      { patterns: ["14 plus"], id: "iphone-14-plus", label: "iPhone 14 Plus" },
      { patterns: ["14"], id: "iphone-14", label: "iPhone 14" },
      {
        patterns: ["13 pro max", "13promax"],
        id: "iphone-13-pro-max",
        label: "iPhone 13 Pro Max",
      },
      { patterns: ["13 pro"], id: "iphone-13-pro", label: "iPhone 13 Pro" },
      { patterns: ["13 mini"], id: "iphone-13-mini", label: "iPhone 13 Mini" },
      { patterns: ["13"], id: "iphone-13", label: "iPhone 13" },
      {
        patterns: ["12 pro max", "12promax"],
        id: "iphone-12-pro-max",
        label: "iPhone 12 Pro Max",
      },
      { patterns: ["12 pro"], id: "iphone-12-pro", label: "iPhone 12 Pro" },
      { patterns: ["12 mini"], id: "iphone-12-mini", label: "iPhone 12 Mini" },
      { patterns: ["12"], id: "iphone-12", label: "iPhone 12" },
      {
        patterns: ["11 pro max", "11promax"],
        id: "iphone-11-pro-max",
        label: "iPhone 11 Pro Max",
      },
      { patterns: ["11 pro"], id: "iphone-11-pro", label: "iPhone 11 Pro" },
      { patterns: ["11"], id: "iphone-11", label: "iPhone 11" },
      { patterns: ["xr"], id: "iphone-xr", label: "iPhone XR" },
      { patterns: ["xs max"], id: "iphone-xs-max", label: "iPhone XS Max" },
      { patterns: ["xs"], id: "iphone-xs", label: "iPhone XS" },
      { patterns: ["x"], id: "iphone-x", label: "iPhone X" },
      {
        patterns: ["se 3", "se3", "se 2022"],
        id: "iphone-se-3",
        label: "iPhone SE (3rd gen)",
      },
      {
        patterns: ["se 2", "se2", "se 2020"],
        id: "iphone-se-2",
        label: "iPhone SE (2nd gen)",
      },
      { patterns: ["se"], id: "iphone-se", label: "iPhone SE" },
      { patterns: ["8 plus"], id: "iphone-8-plus", label: "iPhone 8 Plus" },
      { patterns: ["8"], id: "iphone-8", label: "iPhone 8" },
    ];

    for (const model of iphonePatterns) {
      for (const pattern of model.patterns) {
        if (textLower.includes(pattern)) {
          return { id: model.id, label: model.label };
        }
      }
    }
  }

  // iPad models
  if (deviceType === "ipad") {
    const ipadPatterns: Array<{
      patterns: string[];
      id: string;
      label: string;
    }> = [
      {
        patterns: ["pro 12.9", "pro 129"],
        id: "ipad-pro-12.9",
        label: 'iPad Pro 12.9"',
      },
      { patterns: ["pro 11"], id: "ipad-pro-11", label: 'iPad Pro 11"' },
      { patterns: ["air 5", "air5"], id: "ipad-air-5", label: "iPad Air 5" },
      { patterns: ["air 4", "air4"], id: "ipad-air-4", label: "iPad Air 4" },
      {
        patterns: ["mini 6", "mini6"],
        id: "ipad-mini-6",
        label: "iPad Mini 6",
      },
      { patterns: ["10th", "10 gen"], id: "ipad-10", label: "iPad 10th Gen" },
      { patterns: ["9th", "9 gen"], id: "ipad-9", label: "iPad 9th Gen" },
    ];

    for (const model of ipadPatterns) {
      for (const pattern of model.patterns) {
        if (textLower.includes(pattern)) {
          return { id: model.id, label: model.label };
        }
      }
    }
  }

  return null;
}

/**
 * Get friendly device name from type
 */
function getDeviceName(deviceType: string): string {
  const names: Record<string, string> = {
    iphone: "iPhone",
    ipad: "iPad",
    samsung: "Samsung",
    macbook: "MacBook",
    laptop: "Laptop",
    ps5: "PS5",
    ps4: "PS4",
    xbox: "Xbox",
    switch: "Nintendo Switch",
    watch: "Watch",
  };
  return names[deviceType] || "device";
}

/**
 * Handle call us request
 */
function handleCallUs(): RepairFlowResponse {
  return {
    type: "repair_flow_response",
    messages: [
      `Give us a call on ${BUSINESS_INFO.phone}. 📞`,
      "We're happy to chat through your repair!",
    ],
    scene: null,
    quick_actions: [
      { icon: "fa-phone", label: "Call Now", value: "phone_call" },
      { icon: "fa-rotate-left", label: "Start Again", value: "start_again" },
    ],
    morph_layout: false,
  };
}

/**
 * Step 4: Handle free-text questions
 */
async function handleFreeTextQuestion(
  message: string,
  context: RepairFlowContext
): Promise<RepairFlowResponse> {
  // First, try to parse as a symptom description
  const parsedIssue = parseSymptomToIssue(message);
  if (parsedIssue !== "other") {
    const newContext: RepairFlowContext = {
      ...context,
      issue: parsedIssue as any,
    };
    return handleIssueSelected(parsedIssue, newContext);
  }

  // Check for common questions we can answer directly
  const quickAnswer = getQuickAnswer(message, context);
  if (quickAnswer) {
    return {
      type: "repair_flow_response",
      messages: [quickAnswer],
      scene: null,
      quick_actions: BOOKING_ACTIONS,
      morph_layout: false,
    };
  }

  // Use AI for complex questions
  try {
    const aiResponse = await generateSmartResponse({
      customerMessage: message,
      conversationId: null,
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
      quick_actions: BOOKING_ACTIONS,
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
      quick_actions: ESCAPE_ACTIONS,
      morph_layout: false,
    };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get quick actions for recent/popular iPhone models
 */
function getRecentIPhoneActions(): QuickAction[] {
  return [
    { icon: "fa-mobile-alt", label: "iPhone 15 / 15 Pro", value: "iphone-15" },
    { icon: "fa-mobile-alt", label: "iPhone 14 / 14 Pro", value: "iphone-14" },
    { icon: "fa-mobile-alt", label: "iPhone 13 / 13 Pro", value: "iphone-13" },
    { icon: "fa-mobile-alt", label: "iPhone 12 / 12 Pro", value: "iphone-12" },
    { icon: "fa-mobile-alt", label: "iPhone 11", value: "iphone-11" },
    { icon: "fa-mobile-alt", label: "iPhone SE", value: "iphone-se-3" },
  ];
}

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
  if (
    price.includes("From") ||
    price.includes("-") ||
    price.includes("around")
  ) {
    messages.push(
      `The typical price is ${price.toLowerCase()} depending on your ${deviceName} model. Most repairs are done in ${turnaround}!`
    );
  } else {
    messages.push(
      `That would be ${price}, and we can usually have it done in ${turnaround}.`
    );
  }

  // Always add disclaimer that John will confirm
  messages.push(
    "This is just an estimate - John will confirm the exact price when he sees your device."
  );

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
// DEFAULT PRICE HELPERS
// ============================================

/**
 * Get default price range when specific price not known
 * Based on typical repair costs for phones/tablets
 */
function getDefaultPriceRange(issueOrJobId: string): string {
  const issue = issueOrJobId.toLowerCase();

  if (issue === "battery" || issue.includes("battery")) {
    return "£40 - £90 (most around £50)";
  }

  if (issue === "screen" || issue.includes("screen")) {
    return "£40 - £200 (budget phones £40-£80, premium £80-£200)";
  }

  if (issue === "charging" || issue.includes("charg")) {
    return "around £50";
  }

  if (
    issue === "back" ||
    issue.includes("back") ||
    issue.includes("housing") ||
    issue.includes("rear")
  ) {
    return "£80 - £150";
  }

  if (issue === "camera" || issue.includes("camera")) {
    return "£50 - £120";
  }

  if (issue === "water" || issue.includes("water")) {
    return "from £50 (diagnostic fee applies)";
  }

  return "Price on assessment";
}

/**
 * Get default turnaround time when specific time not known
 */
function getDefaultTurnaround(issueOrJobId: string): string {
  const issue = issueOrJobId.toLowerCase();

  if (issue === "battery" || issue.includes("battery")) {
    return "30-60 mins";
  }

  if (issue === "screen" || issue.includes("screen")) {
    return "1-2 hours";
  }

  if (issue === "charging" || issue.includes("charg")) {
    return "45 mins";
  }

  if (issue === "water" || issue.includes("water")) {
    return "24-72 hours";
  }

  return "same day where possible";
}

// ============================================
// IPHONE PRICE HELPERS
// ============================================

/**
 * Get iPhone charging port price based on model
 */
function getIPhoneChargingPrice(model: string): string {
  const modelLower = model.toLowerCase();

  // iPhone 15 series uses USB-C - different repair
  if (modelLower.includes("iphone-15") || modelLower.includes("iphone-16")) {
    return "£65";
  }

  // iPhone 12-14 series (Lightning)
  if (
    modelLower.includes("iphone-14") ||
    modelLower.includes("iphone-13") ||
    modelLower.includes("iphone-12")
  ) {
    return "£55";
  }

  // iPhone 11 series
  if (modelLower.includes("iphone-11")) {
    return "£49";
  }

  // iPhone X series
  if (modelLower.includes("iphone-x")) {
    return "£45";
  }

  // Older models (iPhone 8 and below)
  if (
    modelLower.includes("iphone-8") ||
    modelLower.includes("iphone-7") ||
    modelLower.includes("iphone-6") ||
    modelLower.includes("iphone-se")
  ) {
    return "£39";
  }

  return "£45"; // Default
}

// ============================================
// MACBOOK IDENTIFICATION HELPERS
// ============================================

/**
 * Handle MacBook year selection and return price
 */
async function handleMacBookYearSelected(
  model: string,
  year: string,
  issue: string
): Promise<RepairFlowResponse> {
  const modelLabel = model
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const issueLabel = issue
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // Build specific model ID with year
  const specificModel = `${model}-${year}`;

  // Get price based on year and model
  const priceInfo = getMacBookPrice(model, year, issue);

  if (year === "unknown") {
    return {
      type: "repair_flow_response",
      messages: [
        `No problem! For a ${modelLabel} ${issueLabel}, prices typically range from ${priceInfo.range}.`,
        "Bring it in and we'll identify the exact model and give you a firm quote. The assessment is free!",
      ],
      scene: {
        device_type: "macbook",
        device_name: model,
        device_image: "/images/devices/macbook-generic.png",
        device_summary: `${modelLabel} – ${issueLabel}`,
        jobs: null,
        selected_job: issue,
        price_estimate: priceInfo.range,
        show_book_cta: true,
        needs_diagnostic: true,
      },
      quick_actions: BOOKING_ACTIONS,
      morph_layout: true,
    };
  }

  return {
    type: "repair_flow_response",
    messages: [
      `${modelLabel} (${year}) ${issueLabel} - we can definitely help! 💪`,
      `The price is ${priceInfo.price}, and it typically takes ${priceInfo.turnaround}.`,
      "Would you like to book this repair?",
    ],
    scene: {
      device_type: "macbook",
      device_name: specificModel,
      device_image: "/images/devices/macbook-generic.png",
      device_summary: `${modelLabel} (${year}) – ${issueLabel}`,
      jobs: null,
      selected_job: issue,
      price_estimate: priceInfo.price,
      show_book_cta: true,
    },
    quick_actions: BOOKING_ACTIONS,
    morph_layout: true,
  };
}

/**
 * Get MacBook price based on model, year, and issue
 */
function getMacBookPrice(
  model: string,
  year: string,
  issue: string
): { price: string; range: string; turnaround: string } {
  // Screen repair prices by year/chip
  const screenPrices: Record<string, Record<string, string>> = {
    "macbook-pro-13": {
      "2024": "£449",
      "2023": "£399",
      "2022": "£399",
      "2021": "£379",
      "2020": "£349",
      "2019": "£299",
    },
    "macbook-pro-14": {
      "2024": "£549",
      "2023": "£499",
      "2022": "£499",
      "2021": "£479",
    },
    "macbook-pro-15": {
      "2019": "£349",
      "2018": "£329",
      "2017": "£299",
    },
    "macbook-pro-16": {
      "2024": "£599",
      "2023": "£549",
      "2022": "£549",
      "2021": "£499",
      "2020": "£449",
      "2019": "£399",
    },
    "macbook-air-13": {
      "2024": "£349",
      "2023": "£299",
      "2022": "£299",
      "2020": "£279",
      "2019": "£249",
    },
    "macbook-air-15": {
      "2024": "£399",
      "2023": "£379",
    },
  };

  // Battery prices
  const batteryPrices: Record<string, Record<string, string>> = {
    "macbook-pro-13": {
      "2024": "£199",
      "2023": "£179",
      "2022": "£179",
      "2021": "£169",
      "2020": "£149",
      "2019": "£129",
    },
    "macbook-pro-14": {
      "2024": "£229",
      "2023": "£199",
      "2022": "£199",
      "2021": "£189",
    },
    "macbook-pro-16": {
      "2024": "£249",
      "2023": "£229",
      "2022": "£229",
      "2021": "£199",
      "2020": "£179",
      "2019": "£159",
    },
    "macbook-air-13": {
      "2024": "£149",
      "2023": "£129",
      "2022": "£129",
      "2020": "£119",
      "2019": "£99",
    },
    "macbook-air-15": {
      "2024": "£169",
      "2023": "£149",
    },
  };

  const prices = issue === "screen" ? screenPrices : batteryPrices;
  const modelPrices = prices[model.toLowerCase()] || {};
  const price = modelPrices[year] || "Price on assessment";

  // Calculate range for unknown year
  const allPrices = Object.values(modelPrices)
    .map((p) => parseInt(p.replace("£", "")) || 0)
    .filter((p) => p > 0);
  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 299;
  const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 599;
  const range = `£${minPrice} - £${maxPrice}`;

  const turnaround = issue === "screen" ? "3-5 days" : "1-2 days";

  return { price, range, turnaround };
}

/**
 * Check if MacBook model needs more specific info
 * Generic models like "macbook-pro-13" need year/chip type
 */
function needsMoreMacBookInfo(model: string): boolean {
  const genericModels = [
    "macbook-pro-13",
    "macbook-pro-14",
    "macbook-pro-15",
    "macbook-pro-16",
    "macbook-air-13",
    "macbook-air-15",
    "macbook",
  ];
  return genericModels.includes(model.toLowerCase());
}

/**
 * Ask for more specific MacBook details
 */
function askMacBookDetails(model: string, issue: string): RepairFlowResponse {
  const modelLabel = model
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const issueLabel = issue
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    type: "repair_flow_response",
    messages: [
      `For a ${modelLabel} ${issueLabel}, I need a bit more info to give you an accurate price.`,
      "Could you tell me the year of your MacBook? You can find this by clicking the Apple menu > About This Mac.",
    ],
    scene: {
      device_type: "macbook",
      device_name: model,
      device_image: "/images/devices/macbook-generic.png",
      device_summary: `${modelLabel} - Identifying year`,
      jobs: null,
      selected_job: null,
      price_estimate: null,
      show_book_cta: false,
    },
    quick_actions: [
      {
        icon: "fa-calendar",
        label: "2024 (M3)",
        value: `macbook_year:${model}:2024:${issue}`,
      },
      {
        icon: "fa-calendar",
        label: "2023 (M2)",
        value: `macbook_year:${model}:2023:${issue}`,
      },
      {
        icon: "fa-calendar",
        label: "2022 (M2)",
        value: `macbook_year:${model}:2022:${issue}`,
      },
      {
        icon: "fa-calendar",
        label: "2021 (M1 Pro/Max)",
        value: `macbook_year:${model}:2021:${issue}`,
      },
      {
        icon: "fa-calendar",
        label: "2020 (M1)",
        value: `macbook_year:${model}:2020:${issue}`,
      },
      {
        icon: "fa-calendar",
        label: "2019 or older",
        value: `macbook_year:${model}:2019:${issue}`,
      },
      {
        icon: "fa-question",
        label: "I'm not sure",
        value: `macbook_year:${model}:unknown:${issue}`,
      },
    ],
    morph_layout: true,
    next_context: {
      step: "identify_macbook",
      device_type: "macbook",
      device_model: model,
      issue: issue as any,
    },
  };
}

// ============================================
// EXPORTS
// ============================================

export { DEVICE_CONFIGS, getDeviceConfig, getJobFromDevice };
