/**
 * Repair Flow Session Handler
 *
 * Wraps the repair flow handler with database session persistence.
 * Sessions are stored in repair_flow_sessions table.
 */

import { createServiceClient } from "@/lib/supabase/service";
import { handleRepairFlow } from "./handler";
import {
  RepairFlowRequest,
  RepairFlowResponse,
  RepairFlowContext,
} from "./types";

// ============================================
// TYPES
// ============================================

interface RepairFlowSession {
  id: string;
  session_id: string;
  step: string;
  device_type: string | null;
  device_category: string | null;
  device_model: string | null;
  device_model_label: string | null;
  issue: string | null;
  symptom: string | null;
  selected_job: string | null;
  identification: Record<string, any>;
  price_estimate: string | null;
  turnaround: string | null;
  needs_diagnostic: boolean;
  scene: Record<string, any> | null;
  messages: Array<{ role: string; content: string; timestamp: string }>;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  outcome: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Get or create a repair flow session
 */
async function getOrCreateSession(
  sessionId: string
): Promise<RepairFlowSession> {
  const supabase = createServiceClient();

  // Try to get existing session
  const { data: existing } = await supabase
    .from("repair_flow_sessions")
    .select("*")
    .eq("session_id", sessionId)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (existing) {
    return existing as RepairFlowSession;
  }

  // Create new session
  const { data: newSession, error } = await supabase
    .from("repair_flow_sessions")
    .insert({ session_id: sessionId })
    .select()
    .single();

  if (error) {
    console.error("[Repair Flow] Failed to create session:", error);
    throw new Error("Failed to create session");
  }

  return newSession as RepairFlowSession;
}

/**
 * Update session with new state
 */
async function updateSession(
  sessionId: string,
  updates: Partial<RepairFlowSession>,
  newMessage?: { role: string; content: string }
): Promise<void> {
  const supabase = createServiceClient();

  const updateData: Record<string, any> = { ...updates };

  // If there's a new message, append it
  if (newMessage) {
    const { data: current } = await supabase
      .from("repair_flow_sessions")
      .select("messages")
      .eq("session_id", sessionId)
      .single();

    const messages = current?.messages || [];
    messages.push({
      ...newMessage,
      timestamp: new Date().toISOString(),
    });
    updateData.messages = messages;
  }

  const { error } = await supabase
    .from("repair_flow_sessions")
    .update(updateData)
    .eq("session_id", sessionId);

  if (error) {
    console.error("[Repair Flow] Failed to update session:", error);
  }
}

/**
 * Reset session to initial state (for "start again")
 */
async function resetSession(sessionId: string): Promise<void> {
  const supabase = createServiceClient();

  await supabase
    .from("repair_flow_sessions")
    .update({
      step: "greeting",
      device_type: null,
      device_category: null,
      device_model: null,
      device_model_label: null,
      issue: null,
      symptom: null,
      selected_job: null,
      identification: {},
      price_estimate: null,
      turnaround: null,
      needs_diagnostic: false,
      scene: null,
      // Keep messages for history, just add a separator
      messages: [],
    })
    .eq("session_id", sessionId);

  console.log("[Repair Flow] Session reset:", sessionId);
}

/**
 * Convert session to context for handler
 */
function sessionToContext(session: RepairFlowSession): RepairFlowContext {
  return {
    step: session.step as any,
    device_type: session.device_type as any,
    device_category: session.device_category as any,
    device_model: session.device_model,
    issue: session.issue as any,
    symptom: session.symptom as any,
    selected_job: session.selected_job,
    identification: session.identification || {},
  };
}

// ============================================
// MAIN SESSION-AWARE HANDLER
// ============================================

/**
 * Handle repair flow with session persistence
 *
 * @param sessionId - Unique session identifier (from frontend)
 * @param message - User's message/selection
 * @param contextOverride - Optional context override (for backwards compatibility)
 */
export async function handleRepairFlowWithSession(
  sessionId: string,
  message: string,
  contextOverride?: Partial<RepairFlowContext>
): Promise<RepairFlowResponse> {
  const msgLower = message.toLowerCase().trim();

  // Handle reset/start over - clear session state
  if (
    msgLower === "start_again" ||
    msgLower === "reset" ||
    msgLower === "start_over" ||
    msgLower === "start"
  ) {
    await resetSession(sessionId);
    const context: RepairFlowContext = { step: "greeting", device_type: null };
    const request: RepairFlowRequest = {
      type: "repair_flow",
      session_id: sessionId,
      message,
      context,
    };
    const response = await handleRepairFlow(request, sessionId);
    return { ...response, session_id: sessionId };
  }

  // Get or create session
  const session = await getOrCreateSession(sessionId);

  // Build context from session (with optional override)
  const context: RepairFlowContext = {
    ...sessionToContext(session),
    ...contextOverride,
  };

  // Log user message
  await updateSession(sessionId, {}, { role: "user", content: message });

  // Build request for handler
  const request: RepairFlowRequest = {
    type: "repair_flow",
    session_id: sessionId,
    message,
    context,
  };

  // Process with existing handler
  const response = await handleRepairFlow(request, sessionId);

  // Extract state updates from response
  const stateUpdates: Partial<RepairFlowSession> = {};

  // Update step based on quick_actions or scene
  if (response.scene?.device_type) {
    stateUpdates.device_type = response.scene.device_type;
  }
  if (response.scene?.device_name) {
    stateUpdates.device_model_label = response.scene.device_name;
  }
  if (response.scene?.selected_job) {
    stateUpdates.selected_job = response.scene.selected_job;
  }
  if (response.scene?.price_estimate) {
    stateUpdates.price_estimate = response.scene.price_estimate;
  }
  if (response.scene?.needs_diagnostic) {
    stateUpdates.needs_diagnostic = response.scene.needs_diagnostic;
  }
  if (response.scene) {
    stateUpdates.scene = response.scene as any;
  }

  // Update identification from next_context
  if (response.next_context?.identification) {
    stateUpdates.identification = {
      ...session.identification,
      ...response.next_context.identification,
    };
  }

  // Infer step from context/response
  if (response.scene?.show_book_cta) {
    stateUpdates.step = "final";
  } else if (response.scene?.device_type && !response.scene?.selected_job) {
    stateUpdates.step = "issue_selected";
  }

  // Update from message value (button clicks)
  const messageLower = message.toLowerCase();
  if (context.step === "greeting" && !messageLower.includes("unknown")) {
    stateUpdates.step = "device_selected";
    stateUpdates.device_type = messageLower;
  }
  if (
    context.step === "device_selected" &&
    messageLower.startsWith("iphone-")
  ) {
    stateUpdates.step = "model_selected";
    stateUpdates.device_model = messageLower;
  }
  if (
    ["screen", "battery", "charging", "water", "camera", "other"].includes(
      messageLower
    )
  ) {
    stateUpdates.step = "issue_selected";
    stateUpdates.issue = messageLower;
  }

  // Save state updates
  if (Object.keys(stateUpdates).length > 0) {
    await updateSession(sessionId, stateUpdates);
  }

  // Log AI response
  await updateSession(
    sessionId,
    {},
    {
      role: "assistant",
      content: response.messages.join("\n"),
    }
  );

  // Add session_id to response
  return {
    ...response,
    session_id: sessionId,
  };
}

/**
 * Complete a session with outcome
 */
export async function completeRepairSession(
  sessionId: string,
  outcome: "booked" | "called" | "directions" | "abandoned" | "completed",
  customerInfo?: {
    name?: string;
    phone?: string;
    email?: string;
  }
): Promise<void> {
  const supabase = createServiceClient();

  await supabase
    .from("repair_flow_sessions")
    .update({
      outcome,
      outcome_at: new Date().toISOString(),
      customer_name: customerInfo?.name,
      customer_phone: customerInfo?.phone,
      customer_email: customerInfo?.email,
    })
    .eq("session_id", sessionId);
}

/**
 * Get session history (for debugging/admin)
 */
export async function getSessionHistory(
  sessionId: string
): Promise<RepairFlowSession | null> {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("repair_flow_sessions")
    .select("*")
    .eq("session_id", sessionId)
    .single();

  return data as RepairFlowSession | null;
}
