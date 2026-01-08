import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generateSmartResponse } from "@/lib/ai/smart-response-generator";
import { checkRateLimit } from "@/app/lib/rate-limiter";
import { analyzeMessage } from "@/app/lib/unified-message-analyzer";
import { getModulesForAnalysis } from "@/app/lib/module-selector";
import {
  extractContactDetails,
  formatPhoneNumber,
} from "@/app/lib/contact-extractor";
import { extractQuoteInfoSmart } from "@/app/lib/webchat-quote-extractor";
import { handleRepairFlow, isRepairFlowRequest } from "@/app/lib/repair-flow";
import { handleRepairFlowWithSession } from "@/app/lib/repair-flow/session-handler";
import {
  detectRepairIntent,
  getSuggestedAction,
} from "@/app/lib/repair-intent-detector";
import crypto from "crypto";

/**
 * Web Chat API for website widget integration (v2.1.1)
 *
 * This endpoint handles chat messages from your website widget.
 * It creates sessions for anonymous visitors and uses AI Steve to respond.
 *
 * Authentication: API key in header (X-API-Key) or query param (?api_key=xxx)
 *
 * STANDARD CHAT:
 * POST /api/webchat
 * {
 *   "message": "Customer message text",
 *   "session_id": "optional-existing-session-id",
 *   "visitor_name": "Optional name",
 *   "visitor_email": "optional@email.com",
 *   "page_url": "https://yoursite.com/page",
 *   "referrer": "https://google.com"
 * }
 *
 * REPAIR FLOW (Guided repair journey):
 * POST /api/webchat
 * {
 *   "type": "repair_flow",
 *   "session_id": "optional-existing-session-id",
 *   "message": "User's text message or selection",
 *   "context": {
 *     "step": "greeting | device_selected | issue_selected | final",
 *     "device_type": "iphone | ipad | samsung | macbook | laptop | ps5 | ps4 | xbox | switch | null",
 *     "device_model": "iPhone 14 Pro | null",
 *     "issue": "screen | battery | charging | water | etc | null",
 *     "selected_job": "screen_repair | null"
 *   }
 * }
 */

// CORS headers for widget
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key, Authorization",
  "Access-Control-Max-Age": "86400", // Cache preflight for 24 hours
  "Content-Type": "application/json; charset=utf-8",
};

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// Debug endpoint - GET /api/webchat?debug=1
export async function GET(request: NextRequest) {
  const debug = request.nextUrl.searchParams.get("debug");
  if (debug) {
    return NextResponse.json(
      {
        version: "2.1.0-repair-flow-sessions",
        timestamp: new Date().toISOString(),
        features: ["repair_flow", "session_persistence", "error_on_failure"],
      },
      { headers: corsHeaders }
    );
  }
  return NextResponse.json(
    { error: "Use POST for chat" },
    { status: 405, headers: corsHeaders }
  );
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Get API key from header or query param
    const apiKey =
      request.headers.get("X-API-Key") ||
      request.nextUrl.searchParams.get("api_key");

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Missing API key. Include X-API-Key header or api_key query param.",
        },
        { status: 401, headers: corsHeaders }
      );
    }

    const supabase = createServiceClient();

    // Validate API key
    const keyPrefix = apiKey.substring(0, 12);
    const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

    const { data: apiKeyRecord, error: keyError } = await supabase
      .from("api_keys")
      .select("*")
      .eq("key_prefix", keyPrefix)
      .eq("key_hash", keyHash)
      .eq("active", true)
      .single();

    if (keyError || !apiKeyRecord) {
      console.log("[Webchat] Invalid API key:", keyPrefix);
      return NextResponse.json(
        { error: "Invalid or inactive API key" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Check if key has expired
    if (
      apiKeyRecord.expires_at &&
      new Date(apiKeyRecord.expires_at) < new Date()
    ) {
      return NextResponse.json(
        { error: "API key has expired" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Update last used timestamp
    await supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", apiKeyRecord.id);

    // Parse request body
    const body = await request.json();

    console.log("[Webchat] Request body:", {
      type: body.type,
      hasMessage: !!body.message,
      messageType: typeof body.message,
      hasContext: !!body.context,
      hasState: !!(body as any).state,
      session_id: body.session_id,
    });

    const isRepairFlow = isRepairFlowRequest(body);
    console.log("[Webchat] isRepairFlowRequest result:", isRepairFlow);

    // Check if this is a repair flow request
    if (isRepairFlow) {
      console.log(
        "[Webchat] Repair flow request detected - routing to repair handler"
      );

      // Generate session ID if not provided
      const sessionId = body.session_id || `rf_${crypto.randomUUID()}`;

      // Accept both "context" and "state" from frontend
      const contextOverride = body.context || (body as any).state || undefined;

      // Use session-aware handler for persistence
      try {
        const repairResponse = await handleRepairFlowWithSession(
          sessionId,
          body.message,
          contextOverride
        );
        return NextResponse.json(repairResponse, { headers: corsHeaders });
      } catch (sessionError) {
        console.error("[Webchat] Repair flow session error:", sessionError);
        return NextResponse.json(
          {
            error: "Repair flow session failed",
            details:
              sessionError instanceof Error
                ? sessionError.message
                : "Unknown error",
            session_id: sessionId,
          },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // Standard chat flow
    const {
      message,
      session_id,
      visitor_name,
      visitor_email,
      page_url,
      referrer,
      context,
    } = body;

    if (
      !message ||
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get client info
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const origin = request.headers.get("origin") || "";

    // Validate domain if restrictions are set
    const { data: webchatSettings } = await supabase
      .from("webchat_settings")
      .select("*")
      .eq("active", true)
      .single();

    if (webchatSettings?.allowed_domains?.length > 0) {
      const originDomain = origin.replace(/^https?:\/\//, "").split("/")[0];
      const isAllowed = webchatSettings.allowed_domains.some(
        (domain: string) =>
          originDomain === domain || originDomain.endsWith(`.${domain}`)
      );

      if (!isAllowed) {
        console.log("[Webchat] Domain not allowed:", originDomain);
        return NextResponse.json(
          { error: "Domain not authorized for this API key" },
          { status: 403, headers: corsHeaders }
        );
      }
    }

    // Rate limiting per IP
    const rateLimit = checkRateLimit(clientIp, "webchat", {
      windowMs: 60 * 1000,
      maxRequests: apiKeyRecord.rate_limit_per_minute || 60,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please slow down." },
        { status: 429, headers: corsHeaders }
      );
    }

    // Find or create session
    let session;
    let customer;
    let conversation;

    if (session_id) {
      // Try to find existing session
      const { data: existingSession } = await supabase
        .from("web_sessions")
        .select("*, customer:customers(*)")
        .eq("session_token", session_id)
        .single();

      if (existingSession) {
        session = existingSession;
        customer = existingSession.customer;

        // Update session activity
        await supabase
          .from("web_sessions")
          .update({
            last_activity_at: new Date().toISOString(),
            page_url: page_url || existingSession.page_url,
          })
          .eq("id", session.id);

        console.log("[Webchat] Found existing session:", {
          sessionId: session.id,
          customerId: customer?.id,
        });
      }
    }

    // If no session found, try to find existing customer by IP + user agent (same browser)
    if (!session && clientIp !== "unknown") {
      const { data: existingSessionByIp } = await supabase
        .from("web_sessions")
        .select("*, customer:customers(*)")
        .eq("ip_address", clientIp)
        .eq("user_agent", userAgent)
        .order("last_activity_at", { ascending: false })
        .limit(1)
        .single();

      // Only reuse if session was active in last 24 hours
      if (existingSessionByIp) {
        const lastActivity = new Date(existingSessionByIp.last_activity_at);
        const hoursSinceActivity =
          (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60);

        if (hoursSinceActivity < 24) {
          session = existingSessionByIp;
          customer = existingSessionByIp.customer;

          // Update session activity
          await supabase
            .from("web_sessions")
            .update({
              last_activity_at: new Date().toISOString(),
              page_url: page_url || existingSessionByIp.page_url,
            })
            .eq("id", session.id);

          console.log("[Webchat] Reusing session by IP/UA:", {
            sessionId: session.id,
            customerId: customer?.id,
            hoursSinceActivity,
          });
        }
      }
    }

    // Create new session if needed
    if (!session) {
      const sessionToken = crypto.randomBytes(32).toString("hex");

      // Create customer record for this visitor
      const customerData: any = {
        name: visitor_name || null,
        email: visitor_email || null,
        notes: `Web visitor from ${origin || "unknown origin"}`,
      };

      const { data: newCustomer, error: customerError } = await supabase
        .from("customers")
        .insert(customerData)
        .select()
        .single();

      if (customerError) {
        console.error("[Webchat] Failed to create customer:", customerError);
        return NextResponse.json(
          { error: "Failed to create session" },
          { status: 500, headers: corsHeaders }
        );
      }

      customer = newCustomer;

      // Create session
      const { data: newSession, error: sessionError } = await supabase
        .from("web_sessions")
        .insert({
          session_token: sessionToken,
          customer_id: customer.id,
          ip_address: clientIp,
          user_agent: userAgent,
          referrer: referrer || null,
          page_url: page_url || null,
          metadata: { origin },
        })
        .select()
        .single();

      if (sessionError) {
        console.error("[Webchat] Failed to create session:", sessionError);
        return NextResponse.json(
          { error: "Failed to create session" },
          { status: 500, headers: corsHeaders }
        );
      }

      session = newSession;
      console.log("[Webchat] Created new session:", {
        sessionId: session.id,
        customerId: customer.id,
      });
    }

    // Find or create conversation for webchat channel
    const { data: existingConversation } = await supabase
      .from("conversations")
      .select("*")
      .eq("customer_id", customer.id)
      .eq("channel", "webchat")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existingConversation) {
      conversation = existingConversation;
    } else {
      const { data: newConversation, error: convError } = await supabase
        .from("conversations")
        .insert({
          customer_id: customer.id,
          channel: "webchat",
          status: "auto",
        })
        .select()
        .single();

      if (convError) {
        console.error("[Webchat] Failed to create conversation:", convError);
        return NextResponse.json(
          { error: "Failed to create conversation" },
          { status: 500, headers: corsHeaders }
        );
      }

      conversation = newConversation;
    }

    // Insert customer message
    const { error: msgError } = await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender: "customer",
      text: message.trim(),
    });

    if (msgError) {
      console.error("[Webchat] Failed to save message:", msgError);
    }

    // Extract contact details from message and update customer if found
    const contactDetails = extractContactDetails(message);
    if (contactDetails.mobile || contactDetails.email || contactDetails.name) {
      const updateData: any = {};

      if (contactDetails.mobile && !customer.phone) {
        updateData.phone = formatPhoneNumber(contactDetails.mobile);
        console.log("[Webchat] Extracted mobile:", updateData.phone);
      }
      if (contactDetails.email && !customer.email) {
        updateData.email = contactDetails.email;
        console.log("[Webchat] Extracted email:", updateData.email);
      }
      if (contactDetails.name && !customer.name) {
        updateData.name = contactDetails.name;
        console.log("[Webchat] Extracted name:", updateData.name);
      }

      if (Object.keys(updateData).length > 0) {
        await supabase
          .from("customers")
          .update(updateData)
          .eq("id", customer.id);

        // Update local customer object
        customer = { ...customer, ...updateData };

        console.log(
          "[Webchat] Updated customer with contact details:",
          updateData
        );
      }

      // If they gave a landline, we'll let the AI handle asking for mobile
      if (contactDetails.isLandline) {
        console.log(
          "[Webchat] Customer provided landline - AI will ask for mobile"
        );
      }
    }

    // Use conversation history from frontend (not database)
    const contextMessages = context?.conversationHistory || [];

    // Extract user journey context from frontend
    const userJourney = context?.userJourney;

    console.log("[Webchat] 📦 Full context received:", {
      hasContext: !!context,
      contextKeys: context ? Object.keys(context) : [],
      hasConversationHistory: !!context?.conversationHistory,
      conversationHistoryLength: contextMessages.length,
      hasUserJourney: !!userJourney,
    });

    console.log("[Webchat] 💬 Conversation history:", {
      messageCount: contextMessages.length,
      messages: contextMessages.slice(-3).map((m: any) => ({
        sender: m.sender || m.role,
        text: m.text || m.content,
      })),
      source:
        contextMessages.length > 0
          ? "frontend"
          : "NONE - FRONTEND NOT SENDING HISTORY!",
    });

    if (userJourney) {
      console.log("[Webchat] 🗺️ User Journey Context:", {
        currentPage: userJourney.currentPage?.path,
        pageType: userJourney.currentPage?.type,
        deviceType: userJourney.deviceType,
        issueType: userJourney.issueType,
        pageHistory: userJourney.pageHistory
          ?.map((p: any) => p.path)
          .join(" → "),
        contextSummary: userJourney.contextSummary,
      });
    } else {
      console.log("[Webchat] ⚠️ No user journey context received");
    }

    // Get AI settings
    const { data: aiSettings, error: aiSettingsError } = await supabase
      .from("ai_settings")
      .select("api_key")
      .eq("active", true)
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (aiSettingsError) {
      console.error(
        "[Webchat] Failed to load ai_settings api_key:",
        aiSettingsError
      );
    }

    // Analyze message
    const analysis = await analyzeMessage(
      message,
      contextMessages,
      aiSettings?.api_key
    );

    console.log("[Webchat] Analysis:", {
      sentiment: analysis.sentiment,
      intent: analysis.intent,
      shouldRespond: analysis.shouldAIRespond,
    });

    // Detect repair intent and extract structured context
    const repairContext = detectRepairIntent(message, contextMessages);
    const suggestedAction = getSuggestedAction(repairContext);

    console.log("[Webchat] Repair Context:", {
      hasRepairIntent: repairContext.hasRepairIntent,
      deviceType: repairContext.deviceType,
      deviceModel: repairContext.deviceModel,
      issue: repairContext.issue,
      confidence: repairContext.confidence,
    });

    // Check if requires staff attention
    if (analysis.requiresStaffAttention) {
      // Create alert for staff
      await supabase.from("alerts").insert({
        conversation_id: conversation.id,
        type: analysis.urgency === "critical" ? "urgent" : "manual_required",
        message: analysis.reasoning,
      });

      // Still generate a response but note it needs attention
      console.log("[Webchat] Flagged for staff attention");
    }

    // Select modules based on analysis
    const modulesToLoad = getModulesForAnalysis(analysis);

    // Generate AI response
    let aiResult;
    try {
      aiResult = await generateSmartResponse({
        customerMessage: message,
        conversationId: null, // TEMPORARY: Set to null to bypass analytics bug
        channel: "webchat", // Tell AI this is webchat for context-aware responses
        modules: modulesToLoad,
        conversationHistory: contextMessages, // Pass frontend conversation history
        userJourney: userJourney, // Pass user journey context from frontend
        unifiedAnalysis: {
          intent: analysis.intent,
          contentType: analysis.contentType,
          sentiment: analysis.sentiment,
          urgency: analysis.urgency,
          intentConfidence: analysis.intentConfidence,
        },
        customerContactStatus: {
          hasPhone: !!customer.phone,
          hasEmail: !!customer.email,
          hasName: !!customer.name,
        },
      });
    } catch (error) {
      console.error("[Webchat] AI generation failed:", error);
      return NextResponse.json(
        {
          error: "AI generation failed",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log("[Webchat] AI Response generated:", {
      confidence: aiResult.confidence,
      responseLength: aiResult.response?.length || 0,
      hasResponse: !!aiResult.response,
    });

    // Check if response is valid
    if (!aiResult.response) {
      console.error("[Webchat] AI returned undefined response:", aiResult);
      return NextResponse.json(
        {
          error: "AI failed to generate response",
          details: "Response was undefined",
        },
        { status: 500, headers: corsHeaders }
      );
    }

    // Save AI response
    await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender: "ai",
      text: aiResult.response,
      ai_provider: aiResult.provider,
      ai_model: aiResult.model,
      ai_confidence: aiResult.confidence,
    });

    // Extract quote info and create quote_request if we have enough details
    // This makes webchat leads appear in the same Quotes section as website form submissions
    if (customer.phone) {
      const allMessages = [
        ...(contextMessages || []),
        { sender: "customer", text: message },
      ];
      const quoteInfo = await extractQuoteInfoSmart(
        allMessages,
        { name: customer.name, phone: customer.phone, email: customer.email },
        aiSettings?.api_key
      );

      // If we have device/issue info, create or update quote request
      if (
        quoteInfo.isComplete &&
        (quoteInfo.device_make || quoteInfo.device_model || quoteInfo.issue)
      ) {
        // Check if quote request already exists for this conversation
        const { data: existingQuote } = await supabase
          .from("quote_requests")
          .select("id")
          .eq("conversation_id", conversation.id)
          .single();

        if (!existingQuote) {
          // Create new quote request
          const { error: quoteError } = await supabase
            .from("quote_requests")
            .insert({
              name: customer.name || "Webchat Visitor",
              phone: customer.phone,
              email: customer.email,
              device_make: quoteInfo.device_make || "Unknown",
              device_model: quoteInfo.device_model || "Unknown",
              issue: quoteInfo.issue || "Repair enquiry",
              source: "webchat",
              status: "pending",
              customer_id: customer.id,
              conversation_id: conversation.id,
            });

          if (quoteError) {
            console.error(
              "[Webchat] Failed to create quote request:",
              quoteError
            );
          } else {
            console.log("[Webchat] ✅ Created quote request from webchat:", {
              name: customer.name,
              device: `${quoteInfo.device_make} ${quoteInfo.device_model}`,
              issue: quoteInfo.issue,
            });
          }
        } else {
          // Update existing quote request with new info
          const updates: Record<string, any> = {};
          if (quoteInfo.device_make)
            updates.device_make = quoteInfo.device_make;
          if (quoteInfo.device_model)
            updates.device_model = quoteInfo.device_model;
          if (quoteInfo.issue) updates.issue = quoteInfo.issue;

          if (Object.keys(updates).length > 0) {
            await supabase
              .from("quote_requests")
              .update(updates)
              .eq("id", existingQuote.id);

            console.log("[Webchat] Updated quote request:", updates);
          }
        }
      }
    }

    // Return response with structured repair context
    const responseTime = Date.now() - startTime;

    // Detect if AI is ready for booking handoff
    const responseText = aiResult.response?.toLowerCase() || "";
    const isReadyForBooking =
      responseText.includes("click the button below") ||
      responseText.includes("ready to start your repair");

    return NextResponse.json(
      {
        success: true,
        session_id: session.session_token,
        conversation_id: conversation.id,
        response: aiResult.response,
        handoff: isReadyForBooking, // Signal frontend to show booking button
        detectedContext: repairContext.hasRepairIntent
          ? {
              hasRepairIntent: repairContext.hasRepairIntent,
              deviceType: repairContext.deviceType,
              deviceModel: repairContext.deviceModel,
              issue: repairContext.issue,
              issueLabel: repairContext.issueLabel,
              confidence: repairContext.confidence,
            }
          : null,
        suggestedAction: suggestedAction,
        metadata: {
          confidence: aiResult.confidence,
          response_time_ms: responseTime,
          requires_attention: analysis.requiresStaffAttention,
          sentiment: analysis.sentiment,
          intent: analysis.intent,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[Webchat] Error:", error);
    console.error(
      "[Webchat] Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    console.error(
      "[Webchat] Error message:",
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json(
      {
        error: "Failed to process message",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
