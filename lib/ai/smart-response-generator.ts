/**
 * Smart Response Generator with State Awareness and Learning
 * Fixes AI confusion by tracking conversation state and learning from interactions
 */

import { createClient } from "@/lib/supabase/server";
import { getProvider } from "./providers";
import {
  getBusinessHoursStatus,
  formatBusinessHoursMessage,
} from "@/lib/business-hours";
import {
  analyzeConversationState,
  getPromptForState,
  validateResponseForState,
  type ConversationContext,
} from "./conversation-state";
import { classifyIntent, type IntentClassification } from "./intent-classifier";
import { getCustomerHistory, updateCustomerHistory } from "./smart-handoff";
import {
  detectHolidayMode,
  generateHolidayGreeting,
  getHolidaySystemPrompt,
} from "@/app/lib/holiday-mode-detector";

interface SmartResponseParams {
  customerMessage: string;
  conversationId?: string | null; // Optional for stateless flows like repair flow
  customerPhone?: string;
  channel?: "sms" | "whatsapp" | "messenger" | "webchat"; // Channel type for context-aware responses
  modules?: string[]; // NEW: Specific modules to load (from unified analyzer)
  unifiedAnalysis?: {
    // NEW: Pass analysis from unified analyzer to avoid duplicate classification
    intent: string;
    contentType: string;
    sentiment: string;
    urgency: string;
    intentConfidence: number;
  };
  customerContactStatus?: {
    // For webchat - whether we have contact details for follow-up
    hasPhone: boolean;
    hasEmail: boolean;
    hasName: boolean;
  };
  conversationHistory?: Array<{
    sender: string;
    text: string;
    created_at?: string;
  }>; // Optional: Pass conversation history directly (for webchat)
  userJourney?: {
    // Optional: User journey context from frontend (for webchat)
    currentPage?: { path: string; type: string; timestamp: number };
    pageHistory?: Array<{ path: string; type: string }>;
    deviceType?: string;
    issueType?: string;
    interactions?: any[];
    contextSummary?: string;
  };
}

function normalizeAiOutgoingMessage(message: string, signOff: string): string {
  const signatureStartPattern =
    /^\s*(many\s+thanks|best\s+regards|kind\s+regards|regards|thanks|cheers)[,!\s]*\n?\s*(ai\s+steve|john)\b[\s\S]*?(new\s+forest\s+device\s+repairs)?\b[\s,!]*\n*/i;

  const signatureEndPattern =
    /\n*\s*(many\s+thanks|best\s+regards|kind\s+regards|regards|thanks|cheers)[,!\s]*\n?\s*(ai\s+steve|john)\b[\s\S]*?(new\s+forest\s+device\s+repairs)?\b\s*$/i;

  let out = (message || "").trim();

  while (signatureStartPattern.test(out)) {
    out = out.replace(signatureStartPattern, "").trim();
  }

  while (signatureEndPattern.test(out)) {
    out = out.replace(signatureEndPattern, "").trim();
  }

  if (out.length === 0) {
    out =
      "No worries - could you tell me a bit more about what you need help with?";
  }

  if (!out.toLowerCase().includes("many thanks")) {
    out = out + "\n\n" + signOff;
  } else {
    out = out.replace(/\n\s*many\s+thanks[\s\S]*$/i, "").trim();
    out = out + "\n\n" + signOff;
  }

  return out;
}

interface SmartResponseResult {
  response: string;
  responses: string[];
  confidence: number;
  provider: string;
  model: string;
  shouldFallback: boolean;
  context: ConversationContext;
  analytics: {
    intent: string;
    state: string;
    intentConfidence: number;
    classificationTimeMs: number;
    responseTimeMs: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    costUsd: number;
    validationPassed: boolean;
    validationIssues: string[];
    promptModulesUsed: string[];
  };
}

/**
 * Generate AI response with state awareness and learning
 */
export async function generateSmartResponse(
  params: SmartResponseParams
): Promise<SmartResponseResult> {
  const startTime = Date.now();
  const supabase = await createClient();

  // Get active AI settings
  const { data: settings, error: settingsError } = await supabase
    .from("ai_settings")
    .select("*")
    .eq("active", true)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (settingsError || !settings) {
    throw new Error("No active AI settings found");
  }

  // Get conversation history FIRST (needed for intent classification)
  // Use provided history if available (for webchat), otherwise fetch from database
  let messages: Array<{
    sender: "customer" | "ai" | "staff";
    text: string;
    created_at: string;
  }> = [];

  if (params.conversationHistory) {
    // Use conversation history passed from frontend (webchat)
    // Add timestamps if not present (for compatibility with conversation state analyzer)
    messages = params.conversationHistory.map((msg, index) => ({
      sender: (msg.sender === "user" ? "customer" : msg.sender) as
        | "customer"
        | "ai"
        | "staff",
      text: msg.text,
      created_at:
        msg.created_at ||
        new Date(
          Date.now() - (params.conversationHistory!.length - index) * 1000
        ).toISOString(),
    }));
    console.log("[Smart AI] Using provided conversation history:", {
      messageCount: messages.length,
      source: "frontend",
    });
  } else if (params.conversationId) {
    // Fetch from database (SMS/WhatsApp/Messenger)
    const { data: messagesDesc } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", params.conversationId)
      .order("created_at", { ascending: false })
      .limit(10);

    messages = (messagesDesc?.reverse() || []).map((m) => ({
      sender: m.sender as "customer" | "ai" | "staff",
      text: m.text,
      created_at: m.created_at,
    }));
    console.log("[Smart AI] Fetched conversation history from database:", {
      messageCount: messages.length,
      source: "database",
    });
  }

  // STEP 0: Use unified analysis if provided, otherwise classify intent
  const classificationStartTime = Date.now();
  let intentClassification: IntentClassification;

  if (params.unifiedAnalysis) {
    // Use analysis from unified analyzer - NO DUPLICATE AI CALL!
    console.log(
      "[Smart AI] Using unified analysis (skipping duplicate classification)"
    );
    intentClassification = {
      intent: params.unifiedAnalysis.contentType as any, // contentType is more specific than intent
      confidence: params.unifiedAnalysis.intentConfidence,
      reasoning: `From unified analyzer: ${params.unifiedAnalysis.intent}`,
    };
    console.log("[Smart AI] Unified analysis:", {
      intent: intentClassification.intent,
      confidence: intentClassification.confidence,
      sentiment: params.unifiedAnalysis.sentiment,
      urgency: params.unifiedAnalysis.urgency,
    });
  } else {
    // Fallback: Classify intent (only if unified analysis not provided)
    console.log("[Smart AI] No unified analysis - running intent classifier");
    try {
      intentClassification = await classifyIntent({
        customerMessage: params.customerMessage,
        conversationHistory: messages.slice(-5).map((m) => ({
          // Last 5 messages for context
          sender: m.sender,
          text: m.text,
        })),
        apiKey: settings.api_key,
      });
      console.log("[Smart AI] Intent classified:", {
        intent: intentClassification.intent,
        confidence: intentClassification.confidence,
        device:
          intentClassification.deviceModel || intentClassification.deviceType,
      });
    } catch (error) {
      console.error("[Smart AI] Classification failed, using fallback");
      intentClassification = {
        intent: "general_info",
        confidence: 0.5,
        reasoning: "Classification failed",
      };
    }
  }

  const classificationTimeMs = Date.now() - classificationStartTime;

  // Check confidence threshold - if too low, default to unknown
  if (intentClassification.confidence < 0.7) {
    console.warn(
      "[Smart AI] Low confidence classification:",
      intentClassification.confidence,
      "- defaulting to unknown"
    );
    intentClassification.intent = "unknown";
  }

  // STEP 1: Analyze conversation state
  const context = analyzeConversationState(messages);

  // STEP 1.5: Merge intent classifier results with state analysis
  // Intent classifier is more accurate for device detection
  if (intentClassification.deviceType && !context.deviceType) {
    context.deviceType = intentClassification.deviceType;
    console.log(
      "[Smart AI] Using classifier device type:",
      intentClassification.deviceType
    );
  }
  if (intentClassification.deviceModel && !context.deviceModel) {
    context.deviceModel = intentClassification.deviceModel;
    console.log(
      "[Smart AI] Using classifier device model:",
      intentClassification.deviceModel
    );
  }

  // Use classifier intent if state analyzer returned 'unknown'
  if (
    context.intent === "unknown" &&
    intentClassification.intent !== "unknown"
  ) {
    context.intent = intentClassification.intent;
    console.log(
      "[Smart AI] Using classifier intent:",
      intentClassification.intent
    );
  }

  console.log("[Smart AI] Conversation State:", {
    state: context.state,
    intent: context.intent,
    device: context.deviceModel || context.deviceType,
    customerName: context.customerName,
    classifierConfidence: intentClassification.confidence,
  });

  // STEP 1.5: Load customer history for personalization
  let customerHistory = null;
  if (params.customerPhone) {
    try {
      customerHistory = await getCustomerHistory(params.customerPhone);
      console.log("[Customer History]", {
        isReturning: customerHistory.isReturning,
        totalConversations: customerHistory.totalConversations,
        customerType: customerHistory.customerType,
      });
    } catch (error) {
      console.log("[Customer History] Not found or error:", error);
    }
  }

  // STEP 2: Get or create conversation context in DB
  const { data: existingContext } = await supabase
    .from("conversation_context")
    .select("*")
    .eq("conversation_id", params.conversationId)
    .single();

  if (existingContext) {
    // Update existing context
    await supabase
      .from("conversation_context")
      .update({
        state: context.state,
        intent: context.intent,
        device_type: context.deviceType,
        device_model: context.deviceModel,
        customer_name: context.customerName,
        state_history: [
          ...(existingContext.state_history || []),
          { state: context.state, timestamp: new Date().toISOString() },
        ],
      })
      .eq("id", existingContext.id);
  } else {
    // Create new context
    await supabase.from("conversation_context").insert({
      conversation_id: params.conversationId,
      state: context.state,
      intent: context.intent,
      device_type: context.deviceType,
      device_model: context.deviceModel,
      customer_name: context.customerName,
      state_history: [
        { state: context.state, timestamp: new Date().toISOString() },
      ],
    });
  }

  // STEP 3: Load prompt modules from database
  // Use specific modules from unified analyzer if provided, otherwise use intent-based loading
  const { modules: promptModules, moduleNames } = await loadPromptModules(
    supabase,
    context.intent || "unknown",
    params.modules // NEW: Pass specific modules from unified analyzer
  );

  // STEP 4: Build focused prompt based on state
  const stateGuidance = getPromptForState(context);

  // Get only relevant data (not everything)
  const relevantData = await getRelevantData(supabase, context);

  // STEP 5: Build compact, focused prompt (with database modules and customer history)
  const focusedPrompt = buildFocusedPrompt({
    context,
    stateGuidance,
    relevantData,
    customerMessage: params.customerMessage,
    recentMessages: messages.slice(-5), // Only last 5 messages
    promptModules, // Pass database modules
    customerHistory, // Pass customer history for personalization
    channel: params.channel, // Pass channel for context-aware responses
    customerContactStatus: params.customerContactStatus, // Pass contact status for webchat
    userJourney: params.userJourney, // Pass user journey context from frontend
  });

  // STEP 5: Build conversation messages for API
  const conversationMessages = buildConversationMessages({
    systemPrompt: focusedPrompt,
    messages: messages.slice(-15), // Last 15 messages for better context (increased from 5)
    currentMessage: params.customerMessage,
  });

  console.log("[Smart AI] Prompt size:", focusedPrompt.length, "characters");
  console.log(
    "[Smart AI] Message history:",
    conversationMessages.length,
    "messages"
  );

  // STEP 6: Generate response
  const provider = getProvider(settings.provider);
  console.log(
    "[Smart AI] Calling provider:",
    settings.provider,
    "with model:",
    settings.model_name
  );

  let result;
  try {
    result = await provider.generateResponse({
      prompt: focusedPrompt,
      systemPrompt: focusedPrompt,
      temperature: settings.temperature,
      maxTokens: settings.max_tokens,
      apiKey: settings.api_key,
      model: settings.model_name,
      conversationMessages,
    });

    console.log("[Smart AI] Provider response:", {
      hasResponse: !!result.response,
      responseLength: result.response?.length || 0,
      confidence: result.confidence,
      responsePreview: result.response?.substring(0, 100) || "EMPTY",
    });

    // Check if response is empty or undefined
    if (!result.response || result.response.trim().length === 0) {
      console.error("[Smart AI] Provider returned empty response!");
      throw new Error("AI provider returned empty response");
    }
  } catch (error) {
    console.error("[Smart AI] Provider error:", error);
    throw error;
  }

  // STEP 7: Validate response against state
  const validation = validateResponseForState(result.response, context);

  if (!validation.valid) {
    console.warn("[Smart AI] Validation issues:", validation.issues);
  }

  // Apply lightweight auto-fixes to invalid responses BEFORE disclosure/sign-off
  let adjustedResponse = result.response;
  if (!validation.valid) {
    adjustedResponse = applyResponseFixes(
      result.response,
      context,
      validation.issues
    );
  }

  // STEP 8: Calculate costs and metrics
  const responseTimeMs = Date.now() - startTime;
  const promptTokens = Math.ceil(focusedPrompt.length / 4); // Rough estimate
  const completionTokens = Math.ceil(adjustedResponse.length / 4);
  const totalTokens = promptTokens + completionTokens;

  // Cost calculation (GPT-4o pricing)
  const costUsd =
    (promptTokens * 0.0025) / 1000 + (completionTokens * 0.01) / 1000;

  // STEP 9: Store analytics (only if we have a conversation ID)
  if (params.conversationId) {
    const { data: insertedMessage } = await supabase
      .from("messages")
      .select("id")
      .eq("conversation_id", params.conversationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    await supabase.from("ai_analytics").insert({
      conversation_id: params.conversationId,
      message_id: insertedMessage?.id,
      intent: context.intent,
      intent_confidence: result.confidence / 100,
      state: context.state,
      response_time_ms: responseTimeMs,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
      cost_usd: costUsd,
      validation_passed: validation.valid,
      validation_issues: validation.issues,
      handoff_to_staff:
        result.response?.toLowerCase().includes("john will") ||
        result.response?.toLowerCase().includes("pass this to") ||
        false,
    });
  }

  // STEP 10: Learn from patterns (async, don't wait) - only if we have a conversation
  if (params.conversationId) {
    learnFromInteraction(
      supabase,
      params.conversationId,
      context,
      result.response
    ).catch((err) => console.error("[Learning] Error:", err));
  }

  // STEP 10.5: Update customer history (async, don't wait)
  if (params.customerPhone) {
    updateCustomerHistory({
      phone: params.customerPhone,
      name: context.customerName,
      device: context.deviceModel,
    }).catch((err) => console.error("[Customer History] Update error:", err));
  }

  const shouldFallback = result.confidence < settings.confidence_threshold;
  let finalResponse = shouldFallback
    ? settings.fallback_message
    : adjustedResponse;

  const signOff =
    params.channel === "webchat"
      ? "Many Thanks, AI Steve"
      : "Many Thanks,\nAI Steve,\nNew Forest Device Repairs";

  finalResponse = normalizeAiOutgoingMessage(finalResponse, signOff);

  // Check if this is the first AI message to this customer
  // IMPORTANT: Check ALL messages in the conversation, not just recent ones
  let isFirstAIMessage = true;

  if (params.conversationId) {
    const { data: allMessages } = await supabase
      .from("messages")
      .select("sender")
      .eq("conversation_id", params.conversationId)
      .eq("sender", "ai")
      .limit(1);

    isFirstAIMessage = !allMessages || allMessages.length === 0;
  }

  console.log("[AI Disclosure] First AI message check:", {
    isFirstAIMessage,
    conversationId: params.conversationId,
    recentMessagesCount: messages.length,
    hasAIInRecent: messages.some((m) => m.sender === "ai"),
  });

  // FORCE sign-off if not present (critical for message tracking)
  // Use shorter sign-off for webchat
  if (!finalResponse.toLowerCase().includes("many thanks")) {
    // Add sign-off to end of response with proper spacing
    finalResponse = finalResponse.trim() + "\n\n" + signOff;
  }

  // CRITICAL: If first AI message, send disclosure as SEPARATE message using |||
  // This ensures disclosure is always its own message, not appended to response
  // SKIP for webchat - the widget already shows the intro
  if (isFirstAIMessage && params.channel !== "webchat") {
    const disclosure =
      "Hi! I'm AI Steve, your automated assistant for New Forest Device Repairs.\n\nI can help with pricing, bookings, and questions.\n\n" +
      signOff;

    console.log(
      "[AI Disclosure] Sending disclosure as SEPARATE message (using |||)"
    );

    // Remove any greeting from the main response since disclosure has one
    // Handle: "Hi!", "Hi there!", "Hello!", "Hey!", "Hi there, we...", etc.
    if (finalResponse.match(/^(hi|hello|hey)(\s+there)?[!,.\s]/i)) {
      const withoutGreeting = finalResponse
        .replace(/^(hi|hello|hey)(\s+there)?[!,.\s]*/i, "")
        .trim();

      // CRITICAL: Check if response becomes empty after removing greeting
      // If so, skip the second message entirely (disclosure is enough)
      const contentWithoutSignature = withoutGreeting
        .replace(/many thanks[\s\S]*/i, "")
        .trim();

      if (contentWithoutSignature.length > 0) {
        // There's actual content, use it
        finalResponse = withoutGreeting;
        // Re-add sign-off if it was removed
        if (!finalResponse.toLowerCase().includes("many thanks")) {
          finalResponse = finalResponse + "\n\n" + signOff;
        }
        // Send disclosure + main response
        finalResponse = disclosure + "|||" + finalResponse;
      } else {
        // Response was just a greeting, only send disclosure
        console.log(
          "[AI Disclosure] Response was only greeting - sending disclosure only"
        );
        finalResponse = disclosure;
      }
    } else {
      // No greeting to remove, send both messages
      finalResponse = disclosure + "|||" + finalResponse;
    }
  }

  const responses = finalResponse
    .split("|||")
    .map((msg: string) => normalizeAiOutgoingMessage(msg, signOff));

  finalResponse = responses.join("|||");

  return {
    response: finalResponse,
    responses,
    confidence: result.confidence,
    provider: settings.provider,
    model: settings.model_name,
    shouldFallback,
    context,
    analytics: {
      intent: context.intent,
      state: context.state,
      intentConfidence: intentClassification.confidence,
      classificationTimeMs,
      responseTimeMs,
      promptTokens,
      completionTokens,
      totalTokens,
      costUsd,
      validationPassed: validation.valid,
      validationIssues: validation.issues,
      promptModulesUsed: moduleNames,
    },
  };
}

/**
 * Get only relevant data based on conversation context
 */
async function getRelevantData(supabase: any, context: ConversationContext) {
  // Get business hours and check for holiday mode
  const hoursStatus = await getBusinessHoursStatus();
  const businessHoursMessage = formatBusinessHoursMessage(hoursStatus);

  // Check if on holiday and get price ranges
  const { data: businessInfo } = await supabase
    .from("business_info")
    .select("special_hours_note, price_ranges, use_exact_prices")
    .single();

  const holidayStatus = detectHolidayMode(businessInfo?.special_hours_note);

  const data: any = {
    businessHours: businessHoursMessage,
    holidayStatus,
    holidayGreeting: holidayStatus.isOnHoliday
      ? generateHolidayGreeting(holidayStatus)
      : null,
    priceRanges: businessInfo?.price_ranges || [],
    useExactPrices: businessInfo?.use_exact_prices || false,
  };

  // ALWAYS fetch pricing for repair conversations (don't rely on intent classification)
  // Intent classifier might miss repair intent, so load pricing if device is mentioned
  const shouldLoadPricing =
    ["screen_repair", "battery_replacement", "diagnostic", "unknown"].includes(
      context.intent
    ) ||
    context.deviceType || // If device mentioned, likely repair
    context.deviceModel; // If model mentioned, likely repair

  if (shouldLoadPricing) {
    const { data: prices } = await supabase
      .from("prices")
      .select("*")
      .or(`expiry.is.null,expiry.gt.${new Date().toISOString()}`);

    // Filter to relevant device type if known
    if (context.deviceType) {
      data.prices = prices?.filter((p: any) =>
        p.device.toLowerCase().includes(context.deviceType || "")
      );

      // Log if no prices found for this device type
      if (!data.prices || data.prices.length === 0) {
        console.warn(
          "[Pricing] No prices found for device type:",
          context.deviceType,
          {
            deviceModel: context.deviceModel,
            intent: context.intent,
            totalPricesInDb: prices?.length || 0,
          }
        );
      } else {
        console.log(
          "[Pricing] Loaded",
          data.prices.length,
          "prices for",
          context.deviceType
        );
      }
    } else {
      // Load all pricing if device type not yet known
      data.prices = prices;
      console.log(
        "[Pricing] Loaded all prices (device type unknown):",
        prices?.length || 0
      );
    }
  }

  // Only fetch FAQs if intent is general inquiry
  if (context.intent === "general_info") {
    const { data: faqs } = await supabase.from("faqs").select("*").limit(5); // Only top 5 FAQs
    data.faqs = faqs;
  }

  return data;
}

/**
 * Load modular prompts from database
 */
async function loadPromptModules(
  supabase: any,
  intent: string,
  specificModules?: string[] // NEW: Load only these specific modules
): Promise<{
  modules: Array<{
    module_name: string;
    prompt_text: string;
    priority: number;
  }>;
  moduleNames: string[];
}> {
  try {
    // If specific modules provided (from unified analyzer), load only those
    if (specificModules && specificModules.length > 0) {
      console.log(
        "[Prompt Modules] Loading specific modules from unified analyzer:",
        specificModules
      );

      const { data: modules, error } = await supabase
        .from("prompts")
        .select("module_name, prompt_text, priority")
        .in("module_name", specificModules)
        .eq("active", true)
        .order("priority", { ascending: false });

      if (error) {
        console.error(
          "[Prompt Modules] Error loading specific modules:",
          error
        );
        throw new Error(`Failed to load specific modules: ${error.message}`);
      }

      if (!modules || modules.length === 0) {
        console.error(
          "[Prompt Modules] No modules found for:",
          specificModules
        );
        throw new Error("No modules found for specified module names");
      }

      console.log(
        "[Prompt Modules] Loaded specific modules:",
        modules.map((m: any) => m.module_name)
      );

      // Update usage stats for each module (async, don't wait)
      modules.forEach((m: any) => {
        supabase
          .rpc("update_prompt_usage", { p_module_name: m.module_name })
          .then(() => {})
          .catch((err: any) =>
            console.error("[Prompt Modules] Usage update failed:", err)
          );
      });

      return {
        modules,
        moduleNames: modules.map((m: any) => m.module_name),
      };
    }

    // Otherwise, use intent-based loading (legacy behavior)
    console.log(
      "[Prompt Modules] Calling get_prompt_modules with intent:",
      intent
    );
    const { data: modules, error } = await supabase.rpc("get_prompt_modules", {
      p_intent: intent,
    });

    console.log("[Prompt Modules] RPC response:", {
      hasError: !!error,
      error: error?.message,
      modulesCount: modules?.length,
      modules: modules?.map((m: any) => m.module_name),
    });

    if (error) {
      console.error("[Prompt Modules] RPC error:", error);
      throw new Error(`RPC call failed: ${error.message}`);
    }

    if (!modules || modules.length === 0) {
      console.error("[Prompt Modules] No modules returned from RPC");
      throw new Error("No modules returned from get_prompt_modules RPC");
    }

    console.log(
      "[Prompt Modules] Loaded from database:",
      modules.map((m: any) => m.module_name)
    );

    // Update usage stats for each module (async, don't wait)
    modules.forEach((m: any) => {
      supabase
        .rpc("update_prompt_usage", { p_module_name: m.module_name })
        .then(() => {})
        .catch((err: any) =>
          console.error("[Prompt Modules] Usage update failed:", err)
        );
    });

    return {
      modules,
      moduleNames: modules.map((m: any) => m.module_name),
    };
  } catch (error) {
    console.error("[Prompt Modules] Database load FAILED:", error);
    throw error;
  }
}

/**
 * Build focused prompt based on current state
 */
function buildFocusedPrompt(params: {
  context: ConversationContext;
  stateGuidance: string;
  relevantData: any;
  customerMessage: string;
  recentMessages: any[];
  promptModules?: Array<{
    module_name: string;
    prompt_text: string;
    priority: number;
  }>;
  customerHistory?: any;
  channel?: "sms" | "whatsapp" | "messenger" | "webchat";
  customerContactStatus?: {
    hasPhone: boolean;
    hasEmail: boolean;
    hasName: boolean;
  };
  userJourney?: {
    currentPage?: { path: string; type: string; timestamp: number };
    pageHistory?: Array<{ path: string; type: string }>;
    deviceType?: string;
    issueType?: string;
    interactions?: any[];
    contextSummary?: string;
  };
}) {
  const {
    context,
    stateGuidance,
    relevantData,
    customerMessage,
    recentMessages,
    promptModules = [],
    customerHistory,
    channel,
    customerContactStatus,
    userJourney,
  } = params;

  // Determine what context is relevant based on conversation
  const conversationText = recentMessages
    .map((m) => m.text.toLowerCase())
    .join(" ");
  const needsScreenInfo =
    context.intent === "screen_repair" || conversationText.includes("screen");
  const needsBatteryInfo =
    context.intent === "battery_replacement" ||
    conversationText.includes("battery");
  const needsWaterDamageInfo =
    conversationText.includes("water") ||
    conversationText.includes("wet") ||
    conversationText.includes("sea");
  const needsBuybackInfo =
    context.intent === "buyback" ||
    conversationText.includes("sell") ||
    conversationText.includes("sold") ||
    conversationText.includes("selling") ||
    conversationText.includes("trade") ||
    conversationText.includes("buy") ||
    conversationText.includes("valuation") ||
    conversationText.includes("old tech");
  const needsWarrantyInfo =
    conversationText.includes("warranty") ||
    conversationText.includes("guarantee");
  const needsDiagnosticInfo =
    conversationText.includes("diagnostic") ||
    conversationText.includes("check") ||
    conversationText.includes("won't turn on");
  const needsTroubleshooting =
    conversationText.includes("black screen") ||
    conversationText.includes("won't turn on") ||
    conversationText.includes("not working") ||
    conversationText.includes("dead") ||
    conversationText.includes("broken") ||
    conversationText.includes("not responding") ||
    conversationText.includes("display") ||
    context.intent === "diagnostic";
  const needsDifferenceInfo =
    /what'?s the difference|difference between|what is the difference/i.test(
      conversationText
    );

  // Webchat contact status for AI context
  const contactStatusInfo =
    channel === "webchat" && customerContactStatus
      ? `
CUSTOMER CONTACT STATUS:
- Has mobile number: ${
          customerContactStatus.hasPhone ? "YES ✓" : "NO - need to collect"
        }
- Has email: ${customerContactStatus.hasEmail ? "YES ✓" : "NO"}
- Has name: ${customerContactStatus.hasName ? "YES ✓" : "NO"}
${
  !customerContactStatus.hasPhone && !customerContactStatus.hasEmail
    ? "⚠️ NO CONTACT DETAILS YET - Ask for mobile or email when giving quotes!"
    : customerContactStatus.hasPhone || customerContactStatus.hasEmail
    ? "✓ Have contact details - can follow up with quote"
    : ""
}
`
      : "";

  // Webchat-specific instructions
  const webchatInstructions =
    channel === "webchat"
      ? `
WEBCHAT CHANNEL CONTEXT:
- This is a WEBSITE CHAT widget visitor (not SMS/WhatsApp)
- You DON'T have their phone number or name unless they provide it
- DON'T call them by the business name - they're a website visitor
- DON'T include the AI disclosure intro ("Hi! I'm AI Steve, your automated assistant...") - the widget already shows this
- You CAN use emojis sparingly if appropriate (webchat supports them)
- Keep responses conversational and helpful
- Be welcoming - they found you through the website!

🚨 CRITICAL: WEBCHAT BOOKING FLOW 🚨

When you know BOTH device AND issue:
1. DON'T ask for contact details
2. DON'T say "Could I grab your mobile number"
3. INSTEAD say: "Click the button below when you're ready to start your repair!"
4. The frontend will show a booking button

EXAMPLE:
Customer: "iPhone 13 screen broken"
You: "Got it - iPhone 13 with broken screen! Click the button below when you're ready to start your repair!"

NEVER ASK FOR CONTACT DETAILS IN WEBCHAT - The booking system handles that!

CONVERSATION MEMORY - CRITICAL:
- ALWAYS check what customer already told you
- If they said "iPhone 13" DON'T ask "What model?"
- If they said "screen broken" DON'T ask "What's wrong?"
- Build on what they've said, don't repeat questions!

WALK-IN ONLY (NO BOOKINGS):
- We do NOT take bookings or appointments
- Say: "We're walk-in only - no appointment needed! Just pop in during opening hours."
- NEVER suggest "booking in" or "making an appointment"
`
      : "";

  // Core identity (always included)
  const coreIdentity = `You are AI Steve, friendly assistant for New Forest Device Repairs.
${webchatInstructions}
${
  relevantData.holidayStatus?.isOnHoliday
    ? getHolidaySystemPrompt(relevantData.holidayStatus)
    : ""
}

🚨 CRITICAL: WHAT YOU ALREADY KNOW 🚨
${
  context.deviceModel
    ? `✅ DEVICE: ${context.deviceModel} - NEVER ASK AGAIN!`
    : ""
}
${
  context.deviceType && !context.deviceModel
    ? `✅ DEVICE TYPE: ${context.deviceType} - Ask for specific model`
    : ""
}
${context.customerName ? `✅ NAME: ${context.customerName}` : ""}
${
  customerHistory?.isReturning
    ? `✅ RETURNING CUSTOMER (${customerHistory.totalConversations} previous conversations) - Greet warmly!`
    : ""
}
${
  customerHistory?.name && !context.customerName
    ? `✅ Customer name from history: ${customerHistory.name}`
    : ""
}
${
  userJourney?.contextSummary
    ? `\n📍 USER JOURNEY:\n${userJourney.contextSummary}`
    : ""
}
${
  userJourney?.deviceType && !context.deviceModel && !context.deviceType
    ? `✅ Device from page: ${userJourney.deviceType} - SKIP asking what device!`
    : ""
}
${userJourney?.issueType ? `✅ Issue from page: ${userJourney.issueType}` : ""}
${
  userJourney?.currentPage?.type &&
  !context.deviceModel &&
  !context.deviceType &&
  !userJourney?.deviceType
    ? `📍 On ${userJourney.currentPage.type} page - Ask which specific ${userJourney.currentPage.type} model`
    : userJourney?.currentPage?.type
    ? `📍 On ${userJourney.currentPage.type} page`
    : ""
}

🚨 CONVERSATION SUMMARY - WHAT CUSTOMER ALREADY TOLD YOU 🚨
${(() => {
  const customerMessages = messages
    .filter((m) => m.sender === "customer")
    .map((m) => m.text)
    .join(" ");
  const summary = [];

  // Extract what they told us about device
  if (context.deviceModel) {
    summary.push(
      `✅ DEVICE: ${context.deviceModel} (they already told you this!)`
    );
  } else if (context.deviceType) {
    summary.push(
      `✅ DEVICE TYPE: ${context.deviceType} (they told you this - now ask for specific model)`
    );
  }

  // Extract what they told us about issue
  const issueKeywords = {
    screen: /\b(screen|crack|smash|shatter|broken screen)\b/i,
    battery: /\b(battery|drain|charge|won't hold)\b/i,
    charging: /\b(charging|won't charge|not charging)\b/i,
    water: /\b(water|wet|dropped in water)\b/i,
    power: /\b(won't turn on|dead|not working)\b/i,
  };

  for (const [issue, pattern] of Object.entries(issueKeywords)) {
    if (pattern.test(customerMessages)) {
      summary.push(`✅ ISSUE: ${issue} (they already told you this!)`);
      break;
    }
  }

  return summary.length > 0
    ? summary.join("\n") +
        "\n\n🚨 DO NOT ASK ABOUT ANYTHING LISTED ABOVE - THEY ALREADY TOLD YOU! 🚨"
    : "No device/issue info provided yet - ask for it";
})()}

🚨 NEVER REPEAT QUESTIONS 🚨
- If you see ✅ DEVICE above, you ALREADY KNOW the device - DON'T ASK!
- If customer said "iPhone 13" in previous messages, you KNOW it's iPhone 13
- If customer said "screen" in previous messages, you KNOW the issue
- ALWAYS reference what they already told you: "Got it - iPhone 13 with screen issue!"
- NEVER ask "What model?" if you already know the model
- NEVER ask "What's wrong?" if you already know the issue

${stateGuidance}

DEVICE MODEL DETECTION (CRITICAL):
If customer doesn't know their device model, HELP THEM FIND IT:
- For iPhones: "No worries! On your iPhone, go to Settings > General > About and look for 'Model Name' - it'll say something like iPhone 12 or iPhone 13. What does yours say?"
- For Android phones: "No problem! Go to Settings > About Phone (usually near the bottom) and look for the model name. What does it show?"
- For laptops: "Check the logo on the lid - is it Apple, Dell, HP, or Lenovo? There's usually a model sticker on the bottom too"
- For tablets: "Is it an iPad or Android tablet? If iPad, go to Settings > General > About. If Android, go to Settings > About Tablet"
- ONLY suggest "bring it in" if they've tried and still can't find it
- ALWAYS try to help them find it themselves FIRST

TONE & STYLE:
- Warm and conversational - like a helpful friend
- Use natural language: "Ah, that sounds like..." not "This indicates..."
- Show empathy: "That must be frustrating!"
- Vary phrases: "pop in", "bring it in", "come by", "drop in"
- Use casual language: "No worries!", "Just a heads-up!", "Perfect!"

CRITICAL RULES:
1. ${
    channel === "webchat"
      ? "Emojis OK sparingly"
      : "NO EMOJIS - SMS doesn't display them"
  }
2. Keep responses 2-3 sentences max per message
3. Use SHORT PARAGRAPHS - break up text
4. ${
    channel === "webchat"
      ? "Use customer name if they provided it"
      : `ALWAYS use customer name if known: ${
          context.customerName || "unknown"
        }`
  }
5. ${
    channel === "webchat"
      ? 'Sign off: "Many Thanks, AI Steve" (shorter for webchat)'
      : 'Sign off: "Many Thanks,\\nAI Steve,\\nNew Forest Device Repairs" (each on new line)'
  }
6. ${
    channel === "webchat"
      ? "Keep responses in single messages (no ||| splitting needed)"
      : "Split multiple topics with ||| for separate messages"
  }
7. IF CUSTOMER IS FRUSTRATED WITH AI (says "AI failure", "not helping", "useless", etc) - IMMEDIATELY say: "I understand this isn't working for you. Let me pass you to John who'll message you back ASAP." Then STOP responding.

PRICING POLICY (CRITICAL):
- ALWAYS give PRICE RANGES, never exact prices
- Use the price ranges from the data context below
- ALWAYS say: "John will confirm the exact price when he assesses it"
- NEVER quote exact prices like "£89" - always use ranges like "£80-120"
- Example: "For an iPhone screen repair, it's typically around £80-120 depending on the model. John will confirm the exact price when he sees it."
- Be helpful with estimates but make it clear John confirms final price
- EXCEPTION: If John already quoted a specific price in this conversation, you may reference it: "As John mentioned, it's £X"
- But for NEW inquiries, always use ranges until John confirms

${
  relevantData.priceRanges && relevantData.priceRanges.length > 0
    ? `
AVAILABLE PRICE RANGES:
${relevantData.priceRanges
  .map((r: any) => `- ${r.category}: £${r.min}-${r.max} ${r.description}`)
  .join("\n")}
`
    : ""
}

BUDGET CONSTRAINTS (CRITICAL):
- If customer mentions a budget or says price is too high:
  * Be empathetic: "I understand budget is important"
  * Offer flexibility: "We try to work with all budgets - let me see what John can do for you"
  * NEVER say "unfortunately we can't" or "the price is fixed"
  * ALWAYS offer to check with John for options
  * Example: "I understand you're working with a budget of £35. We try to meet all budgets where we can - let me pass this to John and he'll see what options he can offer you. He'll be in touch shortly!"
- Be helpful and solution-focused, not rigid
- John can offer payment plans, discounts, or alternative solutions

MULTIPLE MESSAGES:
- If response has multiple parts, BREAK INTO SEPARATE MESSAGES with |||
- Example: "Main answer|||By the way, battery combo is £20 off!"
- Each message needs its own signature
- Feels more natural and conversational`;

  // Add relevant context based on conversation
  let contextualInfo = "";

  // Try to load from database modules first
  if (promptModules && promptModules.length > 0) {
    console.log(
      "[Prompt Builder] Database modules available:",
      promptModules.map((m) => m.module_name)
    );

    const modulesUsed: string[] = [];

    // Add relevant modules based on conversation context (SELECTIVE)
    promptModules.forEach((module) => {
      const moduleName = module.module_name.toLowerCase();
      let shouldInclude = false;

      // CRITICAL: Always include high-priority modules (priority >= 99)
      if (module.priority >= 99) {
        shouldInclude = true;
        console.log(
          `[Prompt Builder] Including high-priority module: ${moduleName} (priority ${module.priority})`
        );
      }

      // Context-specific modules (only when relevant)
      if (
        needsScreenInfo &&
        (moduleName.includes("pricing_flow") || moduleName.includes("screen"))
      ) {
        shouldInclude = true;
      }
      if (
        needsDifferenceInfo &&
        (moduleName.includes("genuine") ||
          moduleName.includes("aftermarket") ||
          moduleName.includes("difference"))
      ) {
        shouldInclude = true;
      }
      if (needsBatteryInfo && moduleName.includes("battery")) {
        shouldInclude = true;
      }
      if (needsWarrantyInfo && moduleName.includes("warranty")) {
        shouldInclude = true;
      }
      if (
        needsWaterDamageInfo &&
        (moduleName.includes("water") ||
          moduleName.includes("common_scenarios"))
      ) {
        shouldInclude = true;
      }
      if (
        needsBuybackInfo &&
        (moduleName.includes("buyback") ||
          moduleName.includes("common_scenarios"))
      ) {
        shouldInclude = true;
      }
      if (needsDiagnosticInfo && moduleName.includes("common_scenarios")) {
        shouldInclude = true;
      }
      if (
        needsTroubleshooting &&
        moduleName.includes("proactive_troubleshooting")
      ) {
        shouldInclude = true;
      }

      // Tone modules (always include for consistency)
      if (
        moduleName.includes("friendly_tone") ||
        moduleName.includes("context_awareness")
      ) {
        shouldInclude = true;
      }

      // Handoff rules (only if conversation is getting complex or customer asking for John)
      if (
        conversationText.includes("john") ||
        conversationText.includes("owner") ||
        conversationText.includes("manager")
      ) {
        if (moduleName.includes("handoff_rules")) {
          shouldInclude = true;
        }
      }

      // Services info (only if general inquiry or no specific intent)
      if (
        !needsScreenInfo &&
        !needsBatteryInfo &&
        !needsWaterDamageInfo &&
        !needsBuybackInfo
      ) {
        if (moduleName.includes("services_comprehensive")) {
          shouldInclude = true;
        }
      }

      if (shouldInclude) {
        contextualInfo += `\n\n${module.prompt_text}`;
        modulesUsed.push(moduleName);
      }
    });

    console.log("[Prompt Builder] Context-aware modules used:", modulesUsed);
  } else {
    // NO FALLBACK - Database must work!
    console.error(
      "[Prompt Builder] No database modules provided - this is a critical error!"
    );
    throw new Error(
      "Database prompt modules not loaded - check RLS policies and database connection"
    );
  }

  // Add relevant data only
  let dataContext = "";

  // Include exact prices if toggle is enabled
  if (relevantData.useExactPrices && relevantData.prices) {
    dataContext += `\n\nAVAILABLE PRICING (USE THESE EXACT PRICES):\n${relevantData.prices
      .map((p: any) => `- ${p.device} ${p.repair_type}: £${p.cost}`)
      .join("\n")}`;
  }

  if (relevantData.businessHours) {
    dataContext += `\n\nBUSINESS HOURS:\n${relevantData.businessHours}`;
  }

  // Recent conversation (compact format)
  const conversationSummary =
    recentMessages.length > 0
      ? `\n\nRECENT CONVERSATION:\n${recentMessages
          .map(
            (m) =>
              `${
                m.sender === "customer"
                  ? "Customer"
                  : m.sender === "ai"
                  ? "You"
                  : "John"
              }: ${m.text}`
          )
          .join("\n")}`
      : "";

  return `${coreIdentity}${contextualInfo}${dataContext}${conversationSummary}

CURRENT MESSAGE: ${customerMessage}

RESPOND NOW (remember your state and don't repeat yourself):`;
}

/**
 * Build conversation messages array for API
 */
function buildConversationMessages(params: {
  systemPrompt: string;
  messages: any[];
  currentMessage: string;
}) {
  const { systemPrompt, messages, currentMessage } = params;

  const conversationMessages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }> = [{ role: "system", content: systemPrompt }];

  // Add recent message history
  messages.forEach((m) => {
    if (m.sender === "customer") {
      conversationMessages.push({ role: "user", content: m.text });
    } else if (m.sender === "ai") {
      conversationMessages.push({ role: "assistant", content: m.text });
    } else if (m.sender === "staff") {
      conversationMessages.push({ role: "user", content: `[John]: ${m.text}` });
    }
  });

  // Add current message
  conversationMessages.push({ role: "user", content: currentMessage });

  return conversationMessages;
}

function applyResponseFixes(
  response: string,
  context: ConversationContext,
  issues: string[]
): string {
  let out = response;

  const hasModel = !!context.deviceModel;
  const hasName = !!context.customerName;

  if (
    issues.some((i) =>
      i.toLowerCase().includes("quote price without knowing specific model")
    )
  ) {
    const lines = out.split("\n").filter((l) => !l.match(/£|price|cost/i));
    const ask = "What seems to be the problem, and which model is it?";
    if (!hasModel) lines.push(ask);
    out = lines.join("\n");
  }

  // Remove model questions if we already have the model
  if (hasModel) {
    // Remove various forms of "what model" questions
    const modelQuestionPatterns = [
      /what\s+model\s+is\s+it\??/gi,
      /which\s+model\s+is\s+it\??/gi,
      /what\s+make\s+and\s+model/gi,
      /what\s+model\s+do\s+you\s+have\??/gi,
      /which\s+model\s+do\s+you\s+have\??/gi,
      /what\s+model\s+\w+\s+is\s+it\??/gi,
      /,?\s*and\s+which\s+model\s+is\s+it\??/gi,
    ];

    for (const pattern of modelQuestionPatterns) {
      out = out.replace(pattern, "");
    }

    // Also remove full lines that are just asking for model
    out = out.replace(/^.*what\s+(model|make).*\??\s*$/gim, "");

    console.log(
      "[Response Fix] Removed model questions (already have:",
      context.deviceModel,
      ")"
    );
  }

  // Remove name questions if we already have the name
  if (hasName && /what'?s\s+your\s+name|your\s+name\??/i.test(out)) {
    out = out.replace(/.*(what'?s\s+your\s+name|your\s+name\??).*\n?/gi, "");
  }

  // Clean up extra whitespace
  out = out.replace(/\n{3,}/g, "\n\n").trim();

  // If response became empty, provide a sensible fallback
  if (!out || out.length < 20) {
    if (hasModel) {
      out = `Thanks for that! What seems to be the problem with your ${context.deviceModel}?`;
    } else {
      out = "What seems to be the problem, and which model is it?";
    }
  }

  return out;
}

/**
 * Learn from interaction (async)
 */
async function learnFromInteraction(
  supabase: any,
  conversationId: string,
  context: ConversationContext,
  response: string
) {
  // Store intent classification for accuracy tracking
  await supabase.from("intent_classifications").insert({
    conversation_id: conversationId,
    message_text: response,
    predicted_intent: context.intent,
    predicted_confidence: 0.85, // Would come from classifier
    conversation_history: { state: context.state },
  });

  // Extract and store useful patterns (simplified)
  // In production, this would use NLP to extract patterns
  if (context.deviceModel) {
    await supabase.from("learned_patterns").upsert(
      {
        pattern_type: "device_mention",
        pattern_text: context.deviceModel,
        intent: context.intent,
        learned_from_count: 1,
        last_seen: new Date().toISOString(),
      },
      {
        onConflict: "pattern_text",
        ignoreDuplicates: false,
      }
    );
  }
}
