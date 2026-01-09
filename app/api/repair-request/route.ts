import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/repair-request
 * Receives notification from MacroDroid when a repair request comes in
 * Expected body: Plain text URL (e.g., "https://nfd-rai.vercel.app/dashboard/quotes/abc-123")
 *
 * Usage: curl -X POST https://nfd-rai.vercel.app/api/repair-request -d "https://nfd-rai.vercel.app/dashboard/quotes/abc-123"
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const quoteUrl = rawBody.trim();

    console.log("[Repair Request] Notification received:", quoteUrl);

    if (!quoteUrl || !quoteUrl.startsWith("http")) {
      return NextResponse.json(
        { success: false, error: "Invalid URL provided" },
        { status: 400 }
      );
    }

    // Extract quote ID from URL
    // URL format: https://nfd-rai.vercel.app/dashboard/quotes/[quote_id]
    const urlParts = quoteUrl.split("/");
    const quoteId = urlParts[urlParts.length - 1];

    if (!quoteId || quoteId.length < 10) {
      return NextResponse.json(
        { success: false, error: "Could not extract quote ID from URL" },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the quote exists
    const { data: quoteRequest, error } = await supabase
      .from("quote_requests")
      .select("id, name, device_make, device_model, issue")
      .eq("id", quoteId)
      .single();

    if (error || !quoteRequest) {
      console.error("[Repair Request] Quote request not found:", quoteId);
      return NextResponse.json(
        { success: false, error: "Quote request not found" },
        { status: 404 }
      );
    }

    // Update the quote request with notification timestamp
    await supabase
      .from("quote_requests")
      .update({
        notification_url: quoteUrl,
        notification_received_at: new Date().toISOString(),
      })
      .eq("id", quoteId);

    console.log(
      `[Repair Request] ✅ Notification processed for ${quoteRequest.name} - ${quoteRequest.device_make} ${quoteRequest.device_model}`
    );

    return NextResponse.json({
      success: true,
      quote_id: quoteId,
      quote_url: quoteUrl,
      customer: quoteRequest.name,
      device: `${quoteRequest.device_make} ${quoteRequest.device_model}`,
    });
  } catch (error) {
    console.error("[Repair Request] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process notification" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
