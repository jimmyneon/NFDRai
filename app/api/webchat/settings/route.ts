import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import crypto from "crypto";

/**
 * Get webchat widget settings
 *
 * GET /api/webchat/settings
 *
 * Headers:
 *   X-API-Key: your-api-key
 *
 * Response:
 * {
 *   "success": true,
 *   "settings": {
 *     "widget_title": "Chat with AI Steve",
 *     "welcome_message": "Hi! How can I help?",
 *     "primary_color": "#2563eb",
 *     ...
 *   }
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

    // Get webchat settings
    const { data: settings } = await supabase
      .from("webchat_settings")
      .select(
        `
        widget_title,
        welcome_message,
        placeholder_text,
        primary_color,
        position,
        show_branding,
        collect_email,
        collect_name,
        auto_open_delay_seconds,
        offline_message
      `
      )
      .eq("active", true)
      .single();

    if (!settings) {
      // Return defaults if no settings found
      return NextResponse.json(
        {
          success: true,
          settings: {
            widget_title: "Chat with AI Steve",
            welcome_message:
              "Hi! I'm AI Steve from New Forest Device Repairs. How can I help you today?",
            placeholder_text: "Type your message...",
            primary_color: "#2563eb",
            position: "bottom-right",
            show_branding: true,
            collect_email: false,
            collect_name: false,
            auto_open_delay_seconds: 0,
            offline_message:
              "Thanks for your message! We'll get back to you as soon as possible.",
          },
        },
        { headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        settings,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[Webchat Settings] Error:", error);
    return NextResponse.json(
      { error: "Failed to get settings" },
      { status: 500, headers: corsHeaders }
    );
  }
}
