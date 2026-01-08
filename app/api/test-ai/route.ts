import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generateSmartResponse } from "@/lib/ai/smart-response-generator";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json; charset=utf-8",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    console.log("[Test AI] Starting test...");

    const supabase = createServiceClient();

    // Get AI settings
    const { data: aiSettings, error: aiError } = await supabase
      .from("ai_settings")
      .select("*")
      .eq("active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (aiError || !aiSettings) {
      return NextResponse.json(
        {
          error: "No AI settings found",
          details: aiError?.message || "No active AI settings",
        },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log("[Test AI] AI settings found:", {
      provider: aiSettings.provider,
      model: aiSettings.model_name,
      hasApiKey: !!aiSettings.api_key,
      apiKeyLength: aiSettings.api_key?.length || 0,
    });

    // Try to generate a simple response
    const result = await generateSmartResponse({
      customerMessage: "What are your opening hours?",
      conversationId: null,
      channel: "webchat",
      conversationHistory: [],
    });

    console.log("[Test AI] Response generated:", {
      hasResponse: !!result.response,
      responseLength: result.response?.length || 0,
      confidence: result.confidence,
    });

    return NextResponse.json(
      {
        success: true,
        hasResponse: !!result.response,
        responseLength: result.response?.length || 0,
        confidence: result.confidence,
        responsePreview: result.response?.substring(0, 100),
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[Test AI] Error:", error);
    return NextResponse.json(
      {
        error: "Test failed",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
