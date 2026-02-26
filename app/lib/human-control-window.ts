/**
 * Human Control Window System
 * Manages AI muting when John is actively handling a conversation
 */

import { createServiceClient } from "@/lib/supabase/service";

export const CONTROL_WINDOW_HOURS = 2; // Configurable: 2-4 hours
export const SINGLE_SHOT_COOLDOWN_HOURS = 6; // AI can only respond once per 6 hours

export type AIControlMode = 'auto' | 'human_control' | 'permanently_muted' | 'safe_faq_only';

export interface HumanControlStatus {
  isActive: boolean;
  aiMutedUntil: Date | null;
  muteReason: string | null;
  controlMode: AIControlMode;
  lastAIResponseAt: Date | null;
  hoursRemaining: number;
  canAIRespond: boolean;
}

/**
 * Get current Human Control Window status for a conversation
 */
export async function getHumanControlStatus(
  conversationId: string
): Promise<HumanControlStatus> {
  const supabase = createServiceClient();

  const { data: conversation, error } = await supabase
    .from("conversations")
    .select("ai_muted_until, ai_mute_reason, ai_control_mode, human_control_active, last_ai_response_at")
    .eq("id", conversationId)
    .single();

  if (error || !conversation) {
    console.error("[Human Control] Error fetching conversation:", error);
    return {
      isActive: false,
      aiMutedUntil: null,
      muteReason: null,
      controlMode: 'auto',
      lastAIResponseAt: null,
      hoursRemaining: 0,
      canAIRespond: true,
    };
  }

  const aiMutedUntil = conversation.ai_muted_until 
    ? new Date(conversation.ai_muted_until) 
    : null;
  
  const lastAIResponseAt = conversation.last_ai_response_at
    ? new Date(conversation.last_ai_response_at)
    : null;

  const now = Date.now();
  const isActive = conversation.human_control_active && 
                   aiMutedUntil && 
                   aiMutedUntil.getTime() > now;

  const hoursRemaining = aiMutedUntil 
    ? Math.max(0, (aiMutedUntil.getTime() - now) / (1000 * 60 * 60))
    : 0;

  // Check if AI is in cooldown (single-shot behavior)
  const inCooldown = lastAIResponseAt && 
    (now - lastAIResponseAt.getTime()) < (SINGLE_SHOT_COOLDOWN_HOURS * 60 * 60 * 1000);

  return {
    isActive,
    aiMutedUntil,
    muteReason: conversation.ai_mute_reason,
    controlMode: conversation.ai_control_mode || 'auto',
    lastAIResponseAt,
    hoursRemaining,
    canAIRespond: !isActive && !inCooldown,
  };
}

/**
 * Activate Human Control Window (called when staff sends message)
 */
export async function activateHumanControlWindow(
  conversationId: string,
  reason?: string
): Promise<void> {
  const supabase = createServiceClient();

  const muteUntil = new Date(Date.now() + CONTROL_WINDOW_HOURS * 60 * 60 * 1000);

  const { error } = await supabase
    .from("conversations")
    .update({
      human_control_active: true,
      ai_muted_until: muteUntil.toISOString(),
      ai_mute_reason: reason || 'Human Control Window - staff is handling conversation',
      ai_control_mode: 'human_control',
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  if (error) {
    console.error("[Human Control] Error activating window:", error);
  } else {
    console.log(`[Human Control] ✅ Activated for ${CONTROL_WINDOW_HOURS}h until ${muteUntil.toISOString()}`);
  }
}

/**
 * Deactivate Human Control Window (manual override)
 */
export async function deactivateHumanControlWindow(
  conversationId: string
): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("conversations")
    .update({
      human_control_active: false,
      ai_muted_until: null,
      ai_mute_reason: null,
      ai_control_mode: 'auto',
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  if (error) {
    console.error("[Human Control] Error deactivating window:", error);
  } else {
    console.log("[Human Control] ✅ Deactivated - AI can respond normally");
  }
}

/**
 * Permanently mute AI for a conversation
 */
export async function permanentlyMuteAI(
  conversationId: string
): Promise<void> {
  const supabase = createServiceClient();

  // Set mute until far in future (10 years)
  const muteUntil = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000);

  const { error } = await supabase
    .from("conversations")
    .update({
      human_control_active: true,
      ai_muted_until: muteUntil.toISOString(),
      ai_mute_reason: 'Permanently muted - human only mode',
      ai_control_mode: 'permanently_muted',
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  if (error) {
    console.error("[Human Control] Error permanently muting:", error);
  } else {
    console.log("[Human Control] ✅ AI permanently muted for this conversation");
  }
}

/**
 * Set conversation to safe FAQ only mode
 */
export async function setSafeFAQOnlyMode(
  conversationId: string
): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("conversations")
    .update({
      human_control_active: false,
      ai_muted_until: null,
      ai_mute_reason: 'Safe FAQ only mode - AI responds to hours/location only',
      ai_control_mode: 'safe_faq_only',
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  if (error) {
    console.error("[Human Control] Error setting safe FAQ mode:", error);
  } else {
    console.log("[Human Control] ✅ Set to safe FAQ only mode");
  }
}

/**
 * Check if AI should respond based on Human Control Window and single-shot behavior
 */
export async function shouldAIRespondWithControl(
  conversationId: string,
  allowSafeFAQ: boolean = false
): Promise<{
  shouldRespond: boolean;
  reason: string;
  status: HumanControlStatus;
}> {
  const status = await getHumanControlStatus(conversationId);

  // Permanently muted
  if (status.controlMode === 'permanently_muted') {
    return {
      shouldRespond: false,
      reason: "AI permanently muted - human only mode",
      status,
    };
  }

  // Safe FAQ only mode
  if (status.controlMode === 'safe_faq_only') {
    return {
      shouldRespond: allowSafeFAQ,
      reason: allowSafeFAQ 
        ? "Safe FAQ mode - AI can respond to this query"
        : "Safe FAQ only mode - AI cannot respond to this query",
      status,
    };
  }

  // Human Control Window active
  if (status.isActive) {
    return {
      shouldRespond: allowSafeFAQ,
      reason: allowSafeFAQ
        ? `Human Control Window active (${status.hoursRemaining.toFixed(1)}h remaining) but safe FAQ allowed`
        : `Human Control Window active (${status.hoursRemaining.toFixed(1)}h remaining) - ${status.muteReason}`,
      status,
    };
  }

  // Single-shot cooldown check
  if (status.lastAIResponseAt) {
    const hoursSinceLastResponse = 
      (Date.now() - status.lastAIResponseAt.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLastResponse < SINGLE_SHOT_COOLDOWN_HOURS) {
      return {
        shouldRespond: false,
        reason: `AI cooldown active - last response ${hoursSinceLastResponse.toFixed(1)}h ago (${(SINGLE_SHOT_COOLDOWN_HOURS - hoursSinceLastResponse).toFixed(1)}h remaining)`,
        status,
      };
    }
  }

  // AI can respond
  return {
    shouldRespond: true,
    reason: "No restrictions - AI can respond",
    status,
  };
}

/**
 * Extend Human Control Window (if John sends another message)
 */
export async function extendHumanControlWindow(
  conversationId: string
): Promise<void> {
  const status = await getHumanControlStatus(conversationId);

  // Only extend if already active
  if (status.isActive) {
    await activateHumanControlWindow(
      conversationId,
      "Human Control Window extended - staff sent another message"
    );
  }
}
