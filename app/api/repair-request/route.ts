import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/repair-request
 * Receives notification from MacroDroid when a repair request comes in
 * Expected body: URL to the repair request (e.g., "https://example.com/repair/123")
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const repairUrl = rawBody.trim();

    console.log("[Repair Request] Notification received:", repairUrl);

    if (!repairUrl || !repairUrl.startsWith("http")) {
      return NextResponse.json(
        { success: false, error: "Invalid URL provided" },
        { status: 400 }
      );
    }

    // Extract repair request ID from URL
    // Assuming URL format: https://example.com/repair/[id] or similar
    const urlParts = repairUrl.split("/");
    const repairId = urlParts[urlParts.length - 1];

    if (!repairId) {
      return NextResponse.json(
        { success: false, error: "Could not extract repair ID from URL" },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Store the notification URL in the quote_requests table
    const { data: quoteRequest, error } = await supabase
      .from("quote_requests")
      .select("*")
      .eq("id", repairId)
      .single();

    if (error || !quoteRequest) {
      console.error("[Repair Request] Quote request not found:", repairId);
      return NextResponse.json(
        { success: false, error: "Quote request not found" },
        { status: 404 }
      );
    }

    // Update the quote request with the notification URL
    await supabase
      .from("quote_requests")
      .update({
        notification_url: repairUrl,
        notification_received_at: new Date().toISOString(),
      })
      .eq("id", repairId);

    console.log(
      `[Repair Request] Notification processed for quote ${repairId}`
    );

    return NextResponse.json({
      success: true,
      quote_id: repairId,
      quote_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/quotes/${repairId}`,
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
