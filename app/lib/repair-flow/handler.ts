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
  return handleModelUnknown(context);
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
 * Uses context.identification to track what we've already asked
 */
function handleModelUnknown(context: RepairFlowContext): RepairFlowResponse {
  const deviceType = context.device_type || "iphone";
  const id = context.identification || {};
  const attempts = (id.attempts || 0) + 1;

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
