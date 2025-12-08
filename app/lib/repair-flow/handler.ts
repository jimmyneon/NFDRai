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
  const { message, context } = request;

  console.log("[Repair Flow] Processing:", {
    step: context.step,
    message,
    device: context.device_type,
    model: context.device_model,
    issue: context.issue,
  });

  // Route based on step AND message value for special actions
  const msgLower = message.toLowerCase();

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
    return handleModelUnknown(context);
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

  // Standard step routing
  switch (context.step) {
    case "greeting":
      return handleGreeting();

    case "device_selected":
      return handleDeviceSelected(message, context);

    case "model_selected":
      return handleModelSelected(message, context);

    case "model_unknown":
      return handleModelUnknown(context);

    case "identify_device":
      return handleIdentifyDevice(message, context);

    case "identify_model":
      return handleIdentifyModel(message, context);

    case "issue_selected":
      return await handleIssueSelected(message, context);

    case "diagnose_issue":
      return handleDiagnoseIssue(message, context);

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
 * Handle identification response (Face ID, Home Button, size)
 */
function handleIdentifyResponse(
  message: string,
  context: RepairFlowContext
): RepairFlowResponse {
  const action = message.replace("identify_", "").toLowerCase();

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
        value: "model_unknown",
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

  // Fallback
  return handleModelUnknown(context);
}

/**
 * User can't identify model - proceed with range pricing
 */
function handleModelUnknown(context: RepairFlowContext): RepairFlowResponse {
  return {
    type: "repair_flow_response",
    messages: [
      "No worries! We can identify it when you bring it in. 👍",
      "What seems to be wrong with it? I can give you a rough price range.",
    ],
    scene: {
      device_type: context.device_type || "iphone",
      device_name:
        context.device_type === "iphone" ? "iPhone (model TBC)" : "Device",
      device_image: "/images/devices/iphone-generic.png",
      device_summary:
        context.device_type === "iphone"
          ? "iPhone (model TBC)"
          : "Device (model TBC)",
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
  let priceEstimate = job?.price || "Price on request";
  let turnaround = job?.time || "TBC";

  // If we have a specific iPhone model, use those prices
  if (context.device_model && context.device_type === "iphone") {
    const iphoneModel = getIPhoneModel(context.device_model);
    if (iphoneModel) {
      if (jobId === "screen") priceEstimate = iphoneModel.screenPrice;
      if (jobId === "battery") priceEstimate = iphoneModel.batteryPrice;
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
