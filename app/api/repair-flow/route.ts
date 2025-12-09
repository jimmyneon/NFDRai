import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { handleRepairFlowWithSession } from "@/app/lib/repair-flow/session-handler";
import crypto from "crypto";

/**
 * Dedicated Repair Flow API
 *
 * This endpoint handles the guided repair journey separately from webchat.
 * It uses LLM-generated responses for natural conversation.
 *
 * POST /api/repair-flow
 * {
 *   "session_id": "optional-existing-session-id",
 *   "message": "User's text message or selection",
 *   "context": {
 *     "step": "greeting | device_selected | issue_selected | ai_takeover | etc",
 *     "device_type": "iphone | ipad | samsung | macbook | laptop | etc | null",
 *     "device_model": "iphone-14-pro | null",
 *     "issue": "screen | battery | charging | water | etc | null"
 *   }
 * }
 */

// CORS headers for widget
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key, Authorization",
  "Access-Control-Max-Age": "86400",
  "Content-Type": "application/json; charset=utf-8",
};

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// Debug endpoint
export async function GET(request: NextRequest) {
  const debug = request.nextUrl.searchParams.get("debug");
  if (debug) {
    return NextResponse.json(
      {
        version: "1.0.0",
        name: "repair-flow-api",
        description: "Dedicated API for guided repair flow with LLM responses",
        timestamp: new Date().toISOString(),
      },
      { headers: corsHeaders }
    );
  }
  return NextResponse.json(
    { error: "Use POST for repair flow" },
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
      console.log("[Repair Flow API] Invalid API key:", keyPrefix);
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

    console.log("[Repair Flow API] Request:", {
      hasMessage: !!body.message,
      hasContext: !!body.context,
      session_id: body.session_id,
      step: body.context?.step,
    });

    // Generate session ID if not provided
    const sessionId =
      body.session_id ||
      `repair_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

    // Accept both "context" and "state" from frontend
    const contextOverride = body.context || body.state || undefined;

    // Call repair flow handler
    const repairResponse = await handleRepairFlowWithSession(
      sessionId,
      body.message || "",
      contextOverride
    );

    const duration = Date.now() - startTime;
    console.log("[Repair Flow API] Response in", duration, "ms");

    return NextResponse.json(repairResponse, { headers: corsHeaders });
  } catch (error) {
    console.error("[Repair Flow API] Error:", error);

    // Return structured error for debugging
    return NextResponse.json(
      {
        type: "repair_flow_error",
        error: error instanceof Error ? error.message : "Unknown error",
        error_code:
          error instanceof Error && error.message.startsWith("LLM_")
            ? error.message.split(":")[0]
            : "UNKNOWN_ERROR",
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
