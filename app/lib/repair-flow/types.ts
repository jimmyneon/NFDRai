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
  | "model" // Frontend step: asking which model
  | "model_selected"
  | "model_unknown"
  | "identify_device"
  | "identify_model"
  | "identify_macbook"
  | "other_device"
  | "ai_takeover"
  | "issue" // Frontend step: asking what's wrong
  | "issue_selected"
  | "issue_unknown" // User described unusual issue
  | "diagnose_issue"
  | "outcome_price" // Showing price estimate
  | "outcome_assessment" // Needs in-person assessment
  | "collect_contact" // Getting user contact info
  | "confirmation" // Confirming before submit
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
  device_model_label?: string | null;
  device_name?: string | null;
  issue?: IssueType | null;
  issue_label?: string | null;
  symptom?: SymptomType | null;
  selected_job?: string | null;

  // For device identification flow - track what we've already asked
  identification?: {
    asked_usable?: boolean; // Already asked if device is turned on/usable
    device_usable?: boolean | null; // Is device turned on and usable
    asked_settings?: boolean; // Already told them to check Settings
    asked_port?: boolean; // Already asked Lightning vs USB-C
    port_type?: "lightning" | "usbc" | null;
    asked_cameras?: boolean; // Already asked camera count
    camera_count?: 1 | 2 | 3 | null;
    asked_faceid?: boolean; // Already asked Face ID vs Home Button
    has_face_id?: boolean | null;
    asked_size?: boolean; // Already asked screen size
    screen_size?: "small" | "medium" | "large" | null;
    asked_box?: boolean; // Already asked about box/receipt
    attempts?: number; // How many identification attempts
  } | null;

  // Legacy fields (keep for backwards compatibility)
  has_face_id?: boolean | null;
  screen_size?: "small" | "medium" | "large" | null;

  // AI Takeover mode - AI has full conversational control
  ai_takeover?: boolean;
  full_state?: Record<string, any>; // Full frontend state for AI context

  // Context from frontend for smarter parsing
  selected_series?: string; // e.g. "galaxy-s-series" - helps parse "21" as S21
  known_info_summary?: string; // Quick summary like "Samsung Galaxy S Series"
  conversation?: Array<{ role: string; content: string }>; // Last 15 messages

  // AI Instructions - tells backend to take control and gather missing info
  ai_instructions?: {
    action: "gather_info"; // What AI should do
    missing: string[]; // Legacy: simple list of missing fields ["device", "model", "issue"]
    context_summary: string; // Summary of what we know

    // New: more structured guidance for the backend AI
    // Which fields MUST be filled before handing control back
    min_required?: Array<"device" | "model" | "issue">;

    // Optional priority ordering for what to ask about first
    priority?: Array<"device" | "model" | "issue">;

    // New: explicit mode for the frontend to decide what UI to show
    // - 'direct_price': we have enough info to show a price/estimate
    // - 'needs_assessment': needs in-person diagnostic before price
    // - 'insufficient_info': AI could not safely decide; keep asking
    // - 'needs_human_help': AI thinks this should go to a human
    mode?:
      | "direct_price"
      | "needs_assessment"
      | "insufficient_info"
      | "needs_human_help";
  };
}

export interface RepairFlowRequest {
  type: "repair_flow";
  session_id?: string;
  message: string;
  context?: RepairFlowContext; // Optional - session handler loads from DB
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
  device_model?: string | null;
  device_model_label?: string | null;
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

// Hand back control to frontend after AI takeover
export interface HandBackControl {
  device_type?: string;
  device_name?: string;
  device_model?: string | null | undefined;
  device_model_label?: string | null | undefined;
  issue?: string;
  issue_label?: string;
  price?: string;
  needs_assessment?: boolean; // True if device needs in-person assessment
  resume_step?: string; // Where to resume: 'model', 'issue', 'outcome_price', 'collect_contact'
  message?: string; // What to say when resuming

  // New: explicit mode for the frontend to decide what UI to show
  // - 'direct_price': we have enough info to show a price/estimate
  // - 'needs_assessment': needs in-person diagnostic before price
  // - 'insufficient_info': AI could not safely decide; keep asking
  // - 'needs_human_help': AI thinks this should go to a human
  mode?:
    | "direct_price"
    | "needs_assessment"
    | "insufficient_info"
    | "needs_human_help";

  // New: more structured guidance for the backend AI
  // Fields that MUST be filled before handing control back
  min_required?: Array<"device" | "model" | "issue">;

  // Optional priority ordering for what to ask about first
  priority?: Array<"device" | "model" | "issue">;
}

// Model identified from user input
export interface IdentifiedModel {
  device_model: string;
  device_model_label: string;
}

// Price estimate response from price_estimate: command
export interface PriceEstimateData {
  price: string;
  turnaround: string;
  warranty: string;
  breakdown?: string[]; // For multiple issues, shows individual prices
}

export interface RepairFlowResponse {
  type: "repair_flow_response";
  session_id?: string;
  messages: string[];
  scene: RepairScene | null;
  quick_actions: QuickAction[] | null;
  morph_layout: boolean;
  // Tell frontend to change step (e.g. "outcome_price")
  new_step?: RepairFlowStep | string;
  // Model identified - frontend handles model → issue transition
  identified?: IdentifiedModel;
  // Price estimate from price_estimate: command
  price_estimate?: PriceEstimateData;
  // Context updates for frontend to track state
  next_context?: Partial<RepairFlowContext> | null;
  // Outcomes (end the flow)
  outcome?: "book" | "request" | "bring_in" | "diagnostics";
  // AI Takeover - hand back control to frontend
  hand_back_control?: HandBackControl;
  // Handoff to staff - indicates conversation should be passed to human
  handoff?: boolean;
  // Error info for debugging (frontend can log/ignore)
  error?: string;
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

/**
 * Check if request is a repair flow request
 * With session persistence, context is optional - backend gets it from DB
 */
export function isRepairFlowRequest(body: any): body is RepairFlowRequest {
  return (
    body && body.type === "repair_flow" && typeof body.message === "string"
    // context is now optional - session handler will load from DB
  );
}
