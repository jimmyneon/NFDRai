/**
 * Device Configuration for Repair Flow
 *
 * Static configuration for devices and their common repairs.
 * Prices shown are "From £X" - actual prices come from the prices table.
 */

import { DeviceConfig, DeviceType, QuickAction, RepairJob } from "./types";

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
