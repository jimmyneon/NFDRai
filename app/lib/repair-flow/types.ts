/**
 * Repair Flow Types
 *
 * Defines the request/response structure for the guided repair flow
 * used by the website widget to walk customers through device selection,
 * issue identification, and booking.
 */

// ============================================
// REQUEST TYPES
// ============================================

export type RepairFlowStep =
  | "greeting"
  | "device_selected"
  | "model_selected"
  | "model_unknown"
  | "identify_device"
  | "identify_model"
  | "issue_selected"
  | "diagnose_issue"
  | "final"
  | "question";

export type DeviceType =
  | "iphone"
  | "ipad"
  | "samsung"
  | "macbook"
  | "laptop"
  | "ps5"
  | "ps4"
  | "xbox"
  | "switch"
  | "watch"
  | "other"
  | null;

export type DeviceCategory =
  | "phone"
  | "tablet"
  | "laptop"
  | "console"
  | "watch"
  | "unknown";

export type IssueType =
  | "screen"
  | "battery"
  | "charging"
  | "water"
  | "camera"
  | "back-glass"
  | "speaker"
  | "button"
  | "keyboard"
  | "hdmi"
  | "disc-drive"
  | "overheating"
  | "joycon"
  | "other"
  | null;

export type SymptomType =
  | "no_power"
  | "screen_issues"
  | "battery_issues"
  | "sound_issues"
  | "camera_issues"
  | "water_damage"
  | "other";

export interface RepairFlowContext {
  page?: string;
  step: RepairFlowStep;
  device_type: DeviceType;
  device_category?: DeviceCategory | null;
  device_model?: string | null;
  issue?: IssueType | null;
  symptom?: SymptomType | null;
  selected_job?: string | null;
  // For device identification flow
  has_face_id?: boolean | null;
  screen_size?: "small" | "medium" | "large" | null;
}

export interface RepairFlowRequest {
  type: "repair_flow";
  session_id?: string;
  message: string;
  context: RepairFlowContext;
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface RepairJob {
  id: string;
  label: string;
  price: string;
  time?: string;
}

export interface RepairScene {
  device_type: DeviceType;
  device_name: string;
  device_image: string;
  device_summary: string;
  jobs: RepairJob[] | null;
  selected_job: string | null;
  price_estimate: string | null;
  show_book_cta: boolean;
  needs_diagnostic?: boolean;
}

export interface QuickAction {
  icon: string;
  label: string;
  value: string;
}

export interface RepairFlowResponse {
  type: "repair_flow_response";
  session_id?: string;
  messages: string[];
  scene: RepairScene | null;
  quick_actions: QuickAction[] | null;
  morph_layout: boolean;
}

// ============================================
// DEVICE CONFIGURATION
// ============================================

export interface DeviceConfig {
  type: DeviceType;
  name: string;
  icon: string;
  image: string;
  jobs: RepairJob[];
}

// ============================================
// TYPE GUARDS
// ============================================

export function isRepairFlowRequest(body: any): body is RepairFlowRequest {
  return (
    body &&
    body.type === "repair_flow" &&
    typeof body.message === "string" &&
    body.context &&
    typeof body.context.step === "string"
  );
}
