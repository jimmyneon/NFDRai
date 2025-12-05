import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generateSmartResponse } from "@/lib/ai/smart-response-generator";
import { checkRateLimit } from "@/app/lib/rate-limiter";
import { analyzeMessage } from "@/app/lib/unified-message-analyzer";
import { getModulesForAnalysis } from "@/app/lib/module-selector";
import crypto from "crypto";

/**
 * Web Chat API for website widget integration
 *
 * This endpoint handles chat messages from your website widget.
 * It creates sessions for anonymous visitors and uses AI Steve to respond.
 *
 * Authentication: API key in header (X-API-Key) or query param (?api_key=xxx)
 *
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
 * Response:
 * {
 *   "success": true,
 *   "session_id": "session-uuid",
 *   "response": "AI Steve's response",
 *   "conversation_id": "conv-uuid"
 * }
 */

// CORS headers for widget
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Will be restricted by domain validation
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
  "Content-Type": "application/json; charset=utf-8",
};

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
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
    const {
      message,
      session_id,
      visitor_name,
      visitor_email,
      page_url,
      referrer,
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

    // Get recent messages for context
    const { data: contextMessages } = await supabase
      .from("messages")
      .select("sender, text")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: false })
      .limit(10);

    // Get AI settings
    const { data: aiSettings } = await supabase
      .from("ai_settings")
      .select("api_key")
      .eq("active", true)
      .single();

    // Analyze message
    const analysis = await analyzeMessage(
      message,
      contextMessages || [],
      aiSettings?.api_key
    );

    console.log("[Webchat] Analysis:", {
      sentiment: analysis.sentiment,
      intent: analysis.intent,
      shouldRespond: analysis.shouldAIRespond,
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
    const aiResult = await generateSmartResponse({
      customerMessage: message,
      conversationId: conversation.id,
      channel: "webchat", // Tell AI this is webchat for context-aware responses
      modules: modulesToLoad,
      unifiedAnalysis: {
        intent: analysis.intent,
        contentType: analysis.contentType,
        sentiment: analysis.sentiment,
        urgency: analysis.urgency,
        intentConfidence: analysis.intentConfidence,
      },
    });

    console.log("[Webchat] AI Response generated:", {
      confidence: aiResult.confidence,
      responseLength: aiResult.response.length,
    });

    // Save AI response
    await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender: "ai",
      text: aiResult.response,
      ai_provider: aiResult.provider,
      ai_model: aiResult.model,
      ai_confidence: aiResult.confidence,
    });

    // Return response
    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        session_id: session.session_token,
        conversation_id: conversation.id,
        response: aiResult.response,
        metadata: {
          confidence: aiResult.confidence,
          response_time_ms: responseTime,
          requires_attention: analysis.requiresStaffAttention,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[Webchat] Error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500, headers: corsHeaders }
    );
  }
}
