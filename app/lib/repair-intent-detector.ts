/**
 * Repair Intent Detector
 *
 * Detects when customer is asking about repairs and extracts:
 * - Device type (iPhone, Samsung, etc.)
 * - Device model (iPhone 14, Galaxy S23, etc.)
 * - Issue (screen, battery, charging, etc.)
 * - Confidence score
 *
 * Used by webchat API to return structured context in responses
 */

export interface RepairContext {
  hasRepairIntent: boolean;
  deviceType: string | null;
  deviceModel: string | null;
  issue: string | null;
  issueLabel: string | null;
  confidence: number;
}

/**
 * Detect repair intent and extract device/issue details
 */
export function detectRepairIntent(
  message: string,
  conversationHistory?: Array<{ sender: string; text: string }>
): RepairContext {
  const lowerMessage = message.toLowerCase();
  const fullContext = conversationHistory
    ? conversationHistory.map((m) => m.text.toLowerCase()).join(" ") +
      " " +
      lowerMessage
    : lowerMessage;

  let hasRepairIntent = false;
  let deviceType: string | null = null;
  let deviceModel: string | null = null;
  let issue: string | null = null;
  let issueLabel: string | null = null;
  let confidence = 0;

  // 1. DETECT REPAIR INTENT
  const repairKeywords = [
    /\b(fix|repair|broken|cracked|smashed|shattered|damaged|dead|not working|won'?t work)\b/i,
    /\b(screen|battery|charging|camera|speaker|microphone|button|port)\b/i,
    /\b(replace|replacement)\b/i,
    /\b(how much|price|cost|quote)\b.*\b(fix|repair|screen|battery)\b/i,
    /\b(water damage|dropped|fell)\b/i,
    // Detect "device + part" pattern (e.g., "iphone 13 screen", "samsung battery")
    /\b(iphone|ipad|samsung|galaxy|pixel|phone|laptop|macbook)\s+\d+.*\b(screen|battery|charging|camera|back|glass)\b/i,
  ];

  for (const pattern of repairKeywords) {
    if (pattern.test(fullContext)) {
      hasRepairIntent = true;
      confidence += 0.2;
      break;
    }
  }

  if (!hasRepairIntent) {
    return {
      hasRepairIntent: false,
      deviceType: null,
      deviceModel: null,
      issue: null,
      issueLabel: null,
      confidence: 0,
    };
  }

  // 2. DETECT DEVICE TYPE
  const devicePatterns: Array<{ pattern: RegExp; type: string }> = [
    { pattern: /\b(iphone)\b/i, type: "iphone" },
    { pattern: /\b(ipad)\b/i, type: "ipad" },
    { pattern: /\b(macbook|mac\s*book)\b/i, type: "macbook" },
    { pattern: /\b(apple\s*watch)\b/i, type: "apple_watch" },
    { pattern: /\b(samsung|galaxy)\b/i, type: "samsung" },
    { pattern: /\b(google|pixel)\b/i, type: "google" },
    { pattern: /\b(huawei)\b/i, type: "huawei" },
    { pattern: /\b(oneplus|one\s*plus)\b/i, type: "oneplus" },
    { pattern: /\b(sony|xperia)\b/i, type: "sony" },
    { pattern: /\b(xiaomi|redmi|poco)\b/i, type: "xiaomi" },
    { pattern: /\b(oppo|realme)\b/i, type: "oppo" },
    { pattern: /\b(nokia)\b/i, type: "nokia" },
    { pattern: /\b(motorola|moto)\b/i, type: "motorola" },
    { pattern: /\b(ps5|playstation\s*5)\b/i, type: "ps5" },
    { pattern: /\b(ps4|playstation\s*4)\b/i, type: "ps4" },
    { pattern: /\b(xbox)\b/i, type: "xbox" },
    { pattern: /\b(switch|nintendo\s*switch)\b/i, type: "switch" },
    { pattern: /\b(laptop)\b/i, type: "laptop" },
    { pattern: /\b(tablet)\b/i, type: "tablet" },
    { pattern: /\b(phone)\b/i, type: "phone" },
  ];

  for (const { pattern, type } of devicePatterns) {
    if (pattern.test(fullContext)) {
      deviceType = type;
      confidence += 0.2;
      break;
    }
  }

  // 3. DETECT DEVICE MODEL
  const modelPatterns: Array<{ pattern: RegExp; model: string }> = [
    // iPhone models
    { pattern: /\biphone\s*15\s*pro\s*max\b/i, model: "iPhone 15 Pro Max" },
    { pattern: /\biphone\s*15\s*pro\b/i, model: "iPhone 15 Pro" },
    { pattern: /\biphone\s*15\s*plus\b/i, model: "iPhone 15 Plus" },
    { pattern: /\biphone\s*15\b/i, model: "iPhone 15" },
    { pattern: /\biphone\s*14\s*pro\s*max\b/i, model: "iPhone 14 Pro Max" },
    { pattern: /\biphone\s*14\s*pro\b/i, model: "iPhone 14 Pro" },
    { pattern: /\biphone\s*14\s*plus\b/i, model: "iPhone 14 Plus" },
    { pattern: /\biphone\s*14\b/i, model: "iPhone 14" },
    { pattern: /\biphone\s*13\s*pro\s*max\b/i, model: "iPhone 13 Pro Max" },
    { pattern: /\biphone\s*13\s*pro\b/i, model: "iPhone 13 Pro" },
    { pattern: /\biphone\s*13\s*mini\b/i, model: "iPhone 13 Mini" },
    { pattern: /\biphone\s*13\b/i, model: "iPhone 13" },
    { pattern: /\biphone\s*12\s*pro\s*max\b/i, model: "iPhone 12 Pro Max" },
    { pattern: /\biphone\s*12\s*pro\b/i, model: "iPhone 12 Pro" },
    { pattern: /\biphone\s*12\s*mini\b/i, model: "iPhone 12 Mini" },
    { pattern: /\biphone\s*12\b/i, model: "iPhone 12" },
    { pattern: /\biphone\s*11\s*pro\s*max\b/i, model: "iPhone 11 Pro Max" },
    { pattern: /\biphone\s*11\s*pro\b/i, model: "iPhone 11 Pro" },
    { pattern: /\biphone\s*11\b/i, model: "iPhone 11" },
    { pattern: /\biphone\s*se\s*\(?202[02]\)?\b/i, model: "iPhone SE" },
    { pattern: /\biphone\s*x[rs]\s*max\b/i, model: "iPhone XS Max" },
    { pattern: /\biphone\s*x[rs]\b/i, model: "iPhone XS" },
    { pattern: /\biphone\s*xr\b/i, model: "iPhone XR" },
    { pattern: /\biphone\s*x\b/i, model: "iPhone X" },

    // Samsung models
    { pattern: /\bgalaxy\s*s24\s*ultra\b/i, model: "Galaxy S24 Ultra" },
    { pattern: /\bgalaxy\s*s24\s*\+\b/i, model: "Galaxy S24+" },
    { pattern: /\bgalaxy\s*s24\b/i, model: "Galaxy S24" },
    { pattern: /\bgalaxy\s*s23\s*ultra\b/i, model: "Galaxy S23 Ultra" },
    { pattern: /\bgalaxy\s*s23\s*\+\b/i, model: "Galaxy S23+" },
    { pattern: /\bgalaxy\s*s23\b/i, model: "Galaxy S23" },
    { pattern: /\bgalaxy\s*s22\s*ultra\b/i, model: "Galaxy S22 Ultra" },
    { pattern: /\bgalaxy\s*s22\s*\+\b/i, model: "Galaxy S22+" },
    { pattern: /\bgalaxy\s*s22\b/i, model: "Galaxy S22" },
    { pattern: /\bgalaxy\s*s21\s*ultra\b/i, model: "Galaxy S21 Ultra" },
    { pattern: /\bgalaxy\s*s21\s*\+\b/i, model: "Galaxy S21+" },
    { pattern: /\bgalaxy\s*s21\b/i, model: "Galaxy S21" },
    { pattern: /\bgalaxy\s*a54\b/i, model: "Galaxy A54" },
    { pattern: /\bgalaxy\s*a53\b/i, model: "Galaxy A53" },
    { pattern: /\bgalaxy\s*a34\b/i, model: "Galaxy A34" },
    { pattern: /\bgalaxy\s*a14\b/i, model: "Galaxy A14" },

    // Google Pixel
    { pattern: /\bpixel\s*8\s*pro\b/i, model: "Pixel 8 Pro" },
    { pattern: /\bpixel\s*8\b/i, model: "Pixel 8" },
    { pattern: /\bpixel\s*7\s*pro\b/i, model: "Pixel 7 Pro" },
    { pattern: /\bpixel\s*7\b/i, model: "Pixel 7" },
    { pattern: /\bpixel\s*6\s*pro\b/i, model: "Pixel 6 Pro" },
    { pattern: /\bpixel\s*6\b/i, model: "Pixel 6" },
  ];

  for (const { pattern, model } of modelPatterns) {
    if (pattern.test(fullContext)) {
      deviceModel = model;
      confidence += 0.3;
      break;
    }
  }

  // 4. DETECT ISSUE
  const issuePatterns: Array<{
    pattern: RegExp;
    issue: string;
    label: string;
  }> = [
    {
      pattern: /\b(crack|smash|broken|shatter).*screen\b/i,
      issue: "screen",
      label: "Screen Repair",
    },
    {
      pattern: /\bscreen.*(crack|smash|broken|shatter)\b/i,
      issue: "screen",
      label: "Screen Repair",
    },
    {
      pattern: /\bscreen\s*repair\b/i,
      issue: "screen",
      label: "Screen Repair",
    },
    {
      pattern:
        /\b(iphone|ipad|samsung|galaxy|pixel|phone|laptop|macbook).*\bscreen\b/i,
      issue: "screen",
      label: "Screen Repair",
    },
    {
      pattern: /\b(battery|won'?t\s+hold\s+charge|dies?\s+quick|drain)\b/i,
      issue: "battery",
      label: "Battery Replacement",
    },
    {
      pattern: /\bbattery\s*replace?ment?\b/i,
      issue: "battery",
      label: "Battery Replacement",
    },
    {
      pattern: /\b(won'?t\s+charge|not\s+charging|charging\s+port)\b/i,
      issue: "charging",
      label: "Charging Port Repair",
    },
    {
      pattern: /\b(water\s+damage|dropped\s+in\s+water|wet)\b/i,
      issue: "water",
      label: "Water Damage Repair",
    },
    {
      pattern: /\b(won'?t\s+turn\s+on|dead|not\s+working)\b/i,
      issue: "power",
      label: "Power Issue",
    },
    {
      pattern: /\b(camera|back\s+camera|front\s+camera)\b/i,
      issue: "camera",
      label: "Camera Repair",
    },
    {
      pattern: /\b(speaker|sound|audio|microphone|mic)\b/i,
      issue: "audio",
      label: "Audio Repair",
    },
    {
      pattern: /\b(button|power\s+button|volume|home\s+button)\b/i,
      issue: "button",
      label: "Button Repair",
    },
    {
      pattern: /\bback\s*(glass|cover|panel)\b/i,
      issue: "back_glass",
      label: "Back Glass Repair",
    },
  ];

  for (const { pattern, issue: issueType, label } of issuePatterns) {
    if (pattern.test(fullContext)) {
      issue = issueType;
      issueLabel = label;
      confidence += 0.3;
      break;
    }
  }

  // Normalize confidence to 0-1 range
  confidence = Math.min(confidence, 1.0);

  return {
    hasRepairIntent,
    deviceType,
    deviceModel,
    issue,
    issueLabel,
    confidence,
  };
}

/**
 * Get suggested action based on detected context
 */
export function getSuggestedAction(context: RepairContext): {
  type: string;
  message: string;
} | null {
  if (!context.hasRepairIntent) {
    return null;
  }

  // If we have device and issue, suggest requesting a quote
  if (context.deviceModel && context.issue) {
    return {
      type: "start_quote",
      message:
        "Request a quote/repair - John will get back to you ASAP, usually within 10 minutes",
    };
  }

  // If we have device but no issue, ask about the problem
  if (context.deviceModel && !context.issue) {
    return {
      type: "ask_issue",
      message: "What seems to be the problem with it?",
    };
  }

  // If we have issue but no device, ask about device
  if (context.issue && !context.deviceModel) {
    return {
      type: "ask_device",
      message: "Which device is this for?",
    };
  }

  // General repair inquiry
  return {
    type: "gather_info",
    message:
      "I can help with that! What device do you have and what's the issue?",
  };
}
