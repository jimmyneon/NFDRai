/**
 * Device Configuration for Repair Flow
 *
 * Static configuration for devices and their common repairs.
 * Prices shown are "From £X" - actual prices come from the prices table.
 */

import {
  DeviceConfig,
  DeviceType,
  DeviceCategory,
  QuickAction,
  RepairJob,
} from "./types";

// ============================================
// DEVICE CONFIGURATIONS
// ============================================

export const DEVICE_CONFIGS: Record<string, DeviceConfig> = {
  iphone: {
    type: "iphone",
    name: "iPhone",
    icon: "fa-apple",
    image: "/images/devices/iphone-generic.png",
    jobs: [
      {
        id: "screen",
        label: "Screen Repair",
        price: "From £49",
        time: "45 mins",
      },
      {
        id: "battery",
        label: "Battery Replacement",
        price: "From £39",
        time: "30 mins",
      },
      {
        id: "charging",
        label: "Charging Port",
        price: "From £45",
        time: "45 mins",
      },
      {
        id: "back-glass",
        label: "Back Glass",
        price: "From £59",
        time: "1 hour",
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
        price: "From £50",
        time: "24-48 hrs",
      },
    ],
  },
  ipad: {
    type: "ipad",
    name: "iPad",
    icon: "fa-tablet-screen-button",
    image: "/images/devices/ipad-generic.png",
    jobs: [
      {
        id: "screen",
        label: "Screen Repair",
        price: "From £99",
        time: "1-2 hours",
      },
      {
        id: "battery",
        label: "Battery Replacement",
        price: "From £79",
        time: "1-2 hours",
      },
      {
        id: "charging",
        label: "Charging Port",
        price: "From £65",
        time: "1 hour",
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
        price: "From £60",
        time: "24-48 hrs",
      },
    ],
  },
  samsung: {
    type: "samsung",
    name: "Samsung",
    icon: "fa-mobile-alt",
    image: "/images/devices/samsung-generic.png",
    jobs: [
      {
        id: "screen",
        label: "Screen Repair",
        price: "From £79",
        time: "1-2 hours",
      },
      {
        id: "battery",
        label: "Battery Replacement",
        price: "From £49",
        time: "45 mins",
      },
      {
        id: "charging",
        label: "Charging Port",
        price: "From £45",
        time: "45 mins",
      },
      {
        id: "back-glass",
        label: "Back Glass",
        price: "From £69",
        time: "1 hour",
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
        price: "From £50",
        time: "24-48 hrs",
      },
    ],
  },
  macbook: {
    type: "macbook",
    name: "MacBook",
    icon: "fa-laptop",
    image: "/images/devices/macbook-generic.png",
    jobs: [
      {
        id: "screen",
        label: "Screen Repair",
        price: "From £299",
        time: "3-5 days",
      },
      {
        id: "battery",
        label: "Battery Replacement",
        price: "From £149",
        time: "1-2 days",
      },
      {
        id: "keyboard",
        label: "Keyboard Repair",
        price: "From £199",
        time: "2-3 days",
      },
      {
        id: "charging",
        label: "Charging Port",
        price: "From £129",
        time: "1-2 days",
      },
      {
        id: "water",
        label: "Water Damage",
        price: "From £99",
        time: "3-5 days",
      },
    ],
  },
  laptop: {
    type: "laptop",
    name: "Laptop",
    icon: "fa-laptop",
    image: "/images/devices/laptop-generic.png",
    jobs: [
      {
        id: "screen",
        label: "Screen Repair",
        price: "From £99",
        time: "2-3 days",
      },
      {
        id: "battery",
        label: "Battery Replacement",
        price: "From £79",
        time: "1-2 days",
      },
      {
        id: "keyboard",
        label: "Keyboard Repair",
        price: "From £69",
        time: "1-2 days",
      },
      {
        id: "charging",
        label: "Charging Port",
        price: "From £59",
        time: "1-2 days",
      },
      {
        id: "water",
        label: "Water Damage",
        price: "From £79",
        time: "3-5 days",
      },
    ],
  },
  ps5: {
    type: "ps5",
    name: "PlayStation 5",
    icon: "fa-gamepad",
    image: "/images/devices/ps5.png",
    jobs: [
      {
        id: "hdmi",
        label: "HDMI Port Repair",
        price: "From £89",
        time: "1-2 days",
      },
      {
        id: "disc-drive",
        label: "Disc Drive Repair",
        price: "From £79",
        time: "1-2 days",
      },
      {
        id: "overheating",
        label: "Overheating Fix",
        price: "From £49",
        time: "1 day",
      },
      {
        id: "power",
        label: "Power Issues",
        price: "From £69",
        time: "1-2 days",
      },
      {
        id: "controller",
        label: "Controller Repair",
        price: "From £35",
        time: "Same day",
      },
    ],
  },
  ps4: {
    type: "ps4",
    name: "PlayStation 4",
    icon: "fa-gamepad",
    image: "/images/devices/ps4.png",
    jobs: [
      {
        id: "hdmi",
        label: "HDMI Port Repair",
        price: "From £69",
        time: "1-2 days",
      },
      {
        id: "disc-drive",
        label: "Disc Drive Repair",
        price: "From £59",
        time: "1-2 days",
      },
      {
        id: "overheating",
        label: "Overheating Fix",
        price: "From £39",
        time: "1 day",
      },
      {
        id: "power",
        label: "Power Issues",
        price: "From £49",
        time: "1-2 days",
      },
      {
        id: "controller",
        label: "Controller Repair",
        price: "From £29",
        time: "Same day",
      },
    ],
  },
  xbox: {
    type: "xbox",
    name: "Xbox",
    icon: "fa-gamepad",
    image: "/images/devices/xbox.png",
    jobs: [
      {
        id: "hdmi",
        label: "HDMI Port Repair",
        price: "From £79",
        time: "1-2 days",
      },
      {
        id: "disc-drive",
        label: "Disc Drive Repair",
        price: "From £69",
        time: "1-2 days",
      },
      {
        id: "overheating",
        label: "Overheating Fix",
        price: "From £45",
        time: "1 day",
      },
      {
        id: "power",
        label: "Power Issues",
        price: "From £59",
        time: "1-2 days",
      },
      {
        id: "controller",
        label: "Controller Repair",
        price: "From £35",
        time: "Same day",
      },
    ],
  },
  switch: {
    type: "switch",
    name: "Nintendo Switch",
    icon: "fa-gamepad",
    image: "/images/devices/switch.png",
    jobs: [
      {
        id: "screen",
        label: "Screen Repair",
        price: "From £79",
        time: "1-2 days",
      },
      {
        id: "joycon",
        label: "Joy-Con Repair",
        price: "From £35",
        time: "Same day",
      },
      {
        id: "charging",
        label: "Charging Port",
        price: "From £55",
        time: "1 day",
      },
      {
        id: "battery",
        label: "Battery Replacement",
        price: "From £49",
        time: "1 day",
      },
      {
        id: "game-slot",
        label: "Game Slot Repair",
        price: "From £45",
        time: "1 day",
      },
    ],
  },
};

// ============================================
// QUICK ACTIONS
// ============================================

export const DEVICE_SELECTION_ACTIONS: QuickAction[] = [
  { icon: "fa-apple", label: "iPhone", value: "iphone" },
  { icon: "fa-tablet-screen-button", label: "iPad", value: "ipad" },
  { icon: "fa-mobile-alt", label: "Samsung", value: "samsung" },
  { icon: "fa-laptop", label: "MacBook", value: "macbook" },
  { icon: "fa-laptop", label: "Laptop", value: "laptop" },
  { icon: "fa-gamepad", label: "PlayStation", value: "playstation" },
  { icon: "fa-gamepad", label: "Xbox", value: "xbox" },
  { icon: "fa-gamepad", label: "Switch", value: "switch" },
  { icon: "fa-question-circle", label: "Not sure", value: "unknown" },
];

// Category selection when user doesn't know device type
export const CATEGORY_SELECTION_ACTIONS: QuickAction[] = [
  { icon: "fa-mobile-alt", label: "Phone", value: "category_phone" },
  {
    icon: "fa-tablet-screen-button",
    label: "Tablet",
    value: "category_tablet",
  },
  { icon: "fa-laptop", label: "Laptop", value: "category_laptop" },
  { icon: "fa-gamepad", label: "Games Console", value: "category_console" },
  {
    icon: "fa-question-circle",
    label: "Still not sure",
    value: "unknown_device",
  },
];

// Brand selection for phones
export const PHONE_BRAND_ACTIONS: QuickAction[] = [
  { icon: "fa-apple", label: "Apple (iPhone)", value: "iphone" },
  { icon: "fa-mobile-alt", label: "Samsung", value: "samsung" },
  { icon: "fa-mobile-alt", label: "Other Android", value: "android_other" },
  { icon: "fa-question-circle", label: "Not sure", value: "phone_unknown" },
];

export const ISSUE_SELECTION_ACTIONS: QuickAction[] = [
  { icon: "fa-mobile-screen", label: "Screen Repair", value: "screen" },
  { icon: "fa-battery-half", label: "Battery", value: "battery" },
  { icon: "fa-plug", label: "Charging Port", value: "charging" },
  { icon: "fa-question-circle", label: "Something else", value: "other" },
];

export const BOOKING_ACTIONS: QuickAction[] = [
  { icon: "fa-calendar-check", label: "Book Now", value: "book" },
  { icon: "fa-phone", label: "Call Us", value: "call" },
  { icon: "fa-question-circle", label: "Ask a Question", value: "question" },
];

// Escape route actions - always offer a way out
export const ESCAPE_ACTIONS: QuickAction[] = [
  { icon: "fa-phone", label: "Call Us", value: "call" },
  { icon: "fa-map-marker-alt", label: "Get Directions", value: "directions" },
  { icon: "fa-rotate-left", label: "Start Again", value: "start_again" },
];

// Diagnostic booking actions
export const DIAGNOSTIC_ACTIONS: QuickAction[] = [
  {
    icon: "fa-calendar-check",
    label: "Book Diagnostic",
    value: "book_diagnostic",
  },
  { icon: "fa-phone", label: "Call to Discuss", value: "call" },
  { icon: "fa-map-marker-alt", label: "Get Directions", value: "directions" },
];

// Symptom identification actions
export const SYMPTOM_ACTIONS: QuickAction[] = [
  { icon: "fa-power-off", label: "Won't turn on", value: "symptom_no_power" },
  { icon: "fa-display", label: "Screen issues", value: "symptom_screen" },
  {
    icon: "fa-battery-empty",
    label: "Battery drains fast",
    value: "symptom_battery",
  },
  {
    icon: "fa-volume-xmark",
    label: "Sound / speaker issues",
    value: "symptom_sound",
  },
  { icon: "fa-camera", label: "Camera not working", value: "symptom_camera" },
  {
    icon: "fa-droplet",
    label: "Got wet / water damage",
    value: "symptom_water",
  },
  { icon: "fa-comment", label: "Let me describe it", value: "describe_issue" },
];

// iPhone identification - Face ID vs Home Button
export const IPHONE_IDENTIFY_ACTIONS: QuickAction[] = [
  {
    icon: "fa-face-smile",
    label: "Face ID (no button)",
    value: "identify_faceid",
  },
  { icon: "fa-circle", label: "Home Button", value: "identify_homebutton" },
  {
    icon: "fa-question-circle",
    label: "I really don't know",
    value: "model_unknown",
  },
];

// iPhone size identification
export const IPHONE_SIZE_ACTIONS: QuickAction[] = [
  {
    icon: "fa-mobile-alt",
    label: "Smaller (fits easily in hand)",
    value: "identify_small",
  },
  { icon: "fa-mobile-screen", label: "Medium", value: "identify_medium" },
  {
    icon: "fa-tablet-screen-button",
    label: "Large (Pro Max size)",
    value: "identify_large",
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get device config by type or name
 */
export function getDeviceConfig(deviceType: string): DeviceConfig | null {
  const normalized = deviceType.toLowerCase().trim();

  // Direct match
  if (DEVICE_CONFIGS[normalized]) {
    return DEVICE_CONFIGS[normalized];
  }

  // Handle PlayStation variants
  if (normalized === "playstation" || normalized === "ps") {
    return DEVICE_CONFIGS.ps5; // Default to PS5
  }

  // Handle common aliases
  const aliases: Record<string, string> = {
    apple: "iphone",
    phone: "iphone",
    tablet: "ipad",
    nintendo: "switch",
    "windows laptop": "laptop",
    "pc laptop": "laptop",
  };

  if (aliases[normalized]) {
    return DEVICE_CONFIGS[aliases[normalized]];
  }

  return null;
}

/**
 * Get job from device config by job ID
 */
export function getJobFromDevice(
  deviceType: string,
  jobId: string
): RepairJob | null {
  const config = getDeviceConfig(deviceType);
  if (!config) return null;

  return config.jobs.find((job) => job.id === jobId) || null;
}

/**
 * Map issue type to job ID
 */
export function issueToJobId(issue: string): string {
  const normalized = issue.toLowerCase().trim();

  const mappings: Record<string, string> = {
    screen: "screen",
    "screen repair": "screen",
    "cracked screen": "screen",
    "broken screen": "screen",
    battery: "battery",
    "battery replacement": "battery",
    charging: "charging",
    "charging port": "charging",
    "won't charge": "charging",
    "not charging": "charging",
    water: "water",
    "water damage": "water",
    camera: "camera",
    "back glass": "back-glass",
    "back-glass": "back-glass",
    speaker: "speaker",
    button: "button",
    keyboard: "keyboard",
    hdmi: "hdmi",
    "disc drive": "disc-drive",
    joycon: "joycon",
    "joy-con": "joycon",
  };

  return mappings[normalized] || "other";
}

// ============================================
// IPHONE MODELS
// ============================================

export interface iPhoneModel {
  id: string;
  name: string;
  hasFaceId: boolean;
  size: "small" | "medium" | "large";
  screenPrice: string;
  batteryPrice: string;
}

export const IPHONE_MODELS: iPhoneModel[] = [
  // Face ID - Large (Pro Max)
  {
    id: "iphone-15-pro-max",
    name: "iPhone 15 Pro Max",
    hasFaceId: true,
    size: "large",
    screenPrice: "£289",
    batteryPrice: "£89",
  },
  {
    id: "iphone-14-pro-max",
    name: "iPhone 14 Pro Max",
    hasFaceId: true,
    size: "large",
    screenPrice: "£269",
    batteryPrice: "£79",
  },
  {
    id: "iphone-13-pro-max",
    name: "iPhone 13 Pro Max",
    hasFaceId: true,
    size: "large",
    screenPrice: "£249",
    batteryPrice: "£69",
  },
  {
    id: "iphone-12-pro-max",
    name: "iPhone 12 Pro Max",
    hasFaceId: true,
    size: "large",
    screenPrice: "£199",
    batteryPrice: "£59",
  },
  {
    id: "iphone-11-pro-max",
    name: "iPhone 11 Pro Max",
    hasFaceId: true,
    size: "large",
    screenPrice: "£179",
    batteryPrice: "£55",
  },
  {
    id: "iphone-xs-max",
    name: "iPhone XS Max",
    hasFaceId: true,
    size: "large",
    screenPrice: "£149",
    batteryPrice: "£49",
  },
  // Face ID - Medium (Pro / Standard)
  {
    id: "iphone-15-pro",
    name: "iPhone 15 Pro",
    hasFaceId: true,
    size: "medium",
    screenPrice: "£269",
    batteryPrice: "£89",
  },
  {
    id: "iphone-15",
    name: "iPhone 15",
    hasFaceId: true,
    size: "medium",
    screenPrice: "£229",
    batteryPrice: "£79",
  },
  {
    id: "iphone-14-pro",
    name: "iPhone 14 Pro",
    hasFaceId: true,
    size: "medium",
    screenPrice: "£249",
    batteryPrice: "£79",
  },
  {
    id: "iphone-14",
    name: "iPhone 14",
    hasFaceId: true,
    size: "medium",
    screenPrice: "£199",
    batteryPrice: "£69",
  },
  {
    id: "iphone-13-pro",
    name: "iPhone 13 Pro",
    hasFaceId: true,
    size: "medium",
    screenPrice: "£219",
    batteryPrice: "£69",
  },
  {
    id: "iphone-13",
    name: "iPhone 13",
    hasFaceId: true,
    size: "medium",
    screenPrice: "£179",
    batteryPrice: "£59",
  },
  {
    id: "iphone-12-pro",
    name: "iPhone 12 Pro",
    hasFaceId: true,
    size: "medium",
    screenPrice: "£169",
    batteryPrice: "£55",
  },
  {
    id: "iphone-12",
    name: "iPhone 12",
    hasFaceId: true,
    size: "medium",
    screenPrice: "£149",
    batteryPrice: "£55",
  },
  {
    id: "iphone-11-pro",
    name: "iPhone 11 Pro",
    hasFaceId: true,
    size: "medium",
    screenPrice: "£149",
    batteryPrice: "£49",
  },
  {
    id: "iphone-11",
    name: "iPhone 11",
    hasFaceId: true,
    size: "medium",
    screenPrice: "£99",
    batteryPrice: "£49",
  },
  {
    id: "iphone-xs",
    name: "iPhone XS",
    hasFaceId: true,
    size: "medium",
    screenPrice: "£129",
    batteryPrice: "£45",
  },
  {
    id: "iphone-x",
    name: "iPhone X",
    hasFaceId: true,
    size: "medium",
    screenPrice: "£119",
    batteryPrice: "£45",
  },
  // Face ID - Small (Mini)
  {
    id: "iphone-13-mini",
    name: "iPhone 13 Mini",
    hasFaceId: true,
    size: "small",
    screenPrice: "£169",
    batteryPrice: "£59",
  },
  {
    id: "iphone-12-mini",
    name: "iPhone 12 Mini",
    hasFaceId: true,
    size: "small",
    screenPrice: "£139",
    batteryPrice: "£55",
  },
  // Home Button models
  {
    id: "iphone-se-3",
    name: "iPhone SE (3rd Gen)",
    hasFaceId: false,
    size: "small",
    screenPrice: "£89",
    batteryPrice: "£49",
  },
  {
    id: "iphone-se-2",
    name: "iPhone SE (2nd Gen)",
    hasFaceId: false,
    size: "small",
    screenPrice: "£69",
    batteryPrice: "£45",
  },
  {
    id: "iphone-8-plus",
    name: "iPhone 8 Plus",
    hasFaceId: false,
    size: "large",
    screenPrice: "£79",
    batteryPrice: "£45",
  },
  {
    id: "iphone-8",
    name: "iPhone 8",
    hasFaceId: false,
    size: "small",
    screenPrice: "£59",
    batteryPrice: "£39",
  },
  {
    id: "iphone-7-plus",
    name: "iPhone 7 Plus",
    hasFaceId: false,
    size: "large",
    screenPrice: "£69",
    batteryPrice: "£39",
  },
  {
    id: "iphone-7",
    name: "iPhone 7",
    hasFaceId: false,
    size: "small",
    screenPrice: "£49",
    batteryPrice: "£35",
  },
  {
    id: "iphone-6s-plus",
    name: "iPhone 6S Plus",
    hasFaceId: false,
    size: "large",
    screenPrice: "£59",
    batteryPrice: "£35",
  },
  {
    id: "iphone-6s",
    name: "iPhone 6S",
    hasFaceId: false,
    size: "small",
    screenPrice: "£49",
    batteryPrice: "£35",
  },
];

/**
 * Get iPhone models matching criteria
 */
export function getMatchingIPhones(
  hasFaceId: boolean | null,
  size: "small" | "medium" | "large" | null
): iPhoneModel[] {
  return IPHONE_MODELS.filter((model) => {
    if (hasFaceId !== null && model.hasFaceId !== hasFaceId) return false;
    if (size !== null && model.size !== size) return false;
    return true;
  });
}

/**
 * Get iPhone model by ID
 */
export function getIPhoneModel(modelId: string): iPhoneModel | null {
  return IPHONE_MODELS.find((m) => m.id === modelId) || null;
}

/**
 * Parse symptom description to issue type
 */
export function parseSymptomToIssue(symptom: string): string {
  const lower = symptom.toLowerCase();

  // Screen issues
  if (
    lower.includes("crack") ||
    lower.includes("smash") ||
    lower.includes("broken screen") ||
    lower.includes("black screen") ||
    lower.includes("lines") ||
    lower.includes("display")
  ) {
    return "screen";
  }

  // Battery issues
  if (
    lower.includes("battery") ||
    lower.includes("dies") ||
    lower.includes("drain") ||
    lower.includes("won't hold charge") ||
    lower.includes("percentage")
  ) {
    return "battery";
  }

  // Charging issues
  if (
    lower.includes("charg") ||
    lower.includes("won't turn on") ||
    lower.includes("dead") ||
    lower.includes("power") ||
    lower.includes("plug")
  ) {
    return "charging";
  }

  // Water damage
  if (
    lower.includes("water") ||
    lower.includes("wet") ||
    (lower.includes("drop") && lower.includes("liquid")) ||
    lower.includes("toilet") ||
    lower.includes("pool") ||
    lower.includes("rain")
  ) {
    return "water";
  }

  // Camera
  if (
    lower.includes("camera") ||
    lower.includes("photo") ||
    lower.includes("blur")
  ) {
    return "camera";
  }

  // Speaker/sound
  if (
    lower.includes("speaker") ||
    lower.includes("sound") ||
    lower.includes("audio") ||
    lower.includes("hear") ||
    lower.includes("volume") ||
    lower.includes("mic")
  ) {
    return "speaker";
  }

  return "other";
}

/**
 * Check if issue requires diagnostic (can't give exact price)
 */
export function needsDiagnostic(
  issue: string,
  deviceModel: string | null
): boolean {
  // Water damage always needs diagnostic
  if (issue === "water" || issue === "symptom_water") return true;

  // Unknown model needs diagnostic for accurate pricing
  if (
    !deviceModel ||
    deviceModel === "unknown" ||
    deviceModel.includes("other")
  )
    return true;

  // "Other" issues need diagnostic
  if (issue === "other" || issue === "describe_issue") return true;

  // Power issues often need diagnostic
  if (issue === "symptom_no_power") return true;

  return false;
}

// Business contact info
export const BUSINESS_INFO = {
  phone: "07410 381247",
  address: "5a New Street, Lymington",
  name: "New Forest Device Repairs",
};
