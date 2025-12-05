import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import crypto from "crypto";

/**
 * Get chat history for a webchat session
 *
 * GET /api/webchat/history?session_id=xxx
 *
 * Headers:
 *   X-API-Key: your-api-key
 *
 * Response:
 * {
 *   "success": true,
 *   "messages": [
 *     { "sender": "customer", "text": "...", "created_at": "..." },
 *     { "sender": "ai", "text": "...", "created_at": "..." }
 *   ]
 * }
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
  "Content-Type": "application/json; charset=utf-8",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    // Get API key
    const apiKey =
      request.headers.get("X-API-Key") ||
      request.nextUrl.searchParams.get("api_key");

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing API key" },
        { status: 401, headers: corsHeaders }
      );
    }

    const supabase = createServiceClient();

    // Validate API key
    const keyPrefix = apiKey.substring(0, 12);
    const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

    const { data: apiKeyRecord } = await supabase
      .from("api_keys")
      .select("*")
      .eq("key_prefix", keyPrefix)
      .eq("key_hash", keyHash)
      .eq("active", true)
      .single();

    if (!apiKeyRecord) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Get session ID
    const sessionId = request.nextUrl.searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "session_id is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Find session
    const { data: session } = await supabase
      .from("web_sessions")
      .select("customer_id")
      .eq("session_token", sessionId)
      .single();

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Get conversation
    const { data: conversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("customer_id", session.customer_id)
      .eq("channel", "webchat")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!conversation) {
      return NextResponse.json(
        {
          success: true,
          messages: [],
        },
        { headers: corsHeaders }
      );
    }

    // Get messages
    const { data: messages } = await supabase
      .from("messages")
      .select("sender, text, created_at")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true })
      .limit(100);

    return NextResponse.json(
      {
        success: true,
        messages: messages || [],
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[Webchat History] Error:", error);
    return NextResponse.json(
      { error: "Failed to get history" },
      { status: 500, headers: corsHeaders }
    );
  }
}
