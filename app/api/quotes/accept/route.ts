import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processQuoteAcceptance } from "@/app/lib/quote-acceptance-handler";

/**
 * API endpoint to manually accept a quote and trigger repair app handoff
 * This can be called when AI detects quote acceptance or manually by staff
 *
 * POST /api/quotes/accept
 * Body: { quoteId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { quoteId } = await request.json();

    if (!quoteId) {
      return NextResponse.json(
        { error: "Quote ID is required" },
        { status: 400 },
      );
    }

    console.log("[Quote Accept API] Processing quote acceptance:", quoteId);

    // Verify quote exists and is in quoted status
    const supabase = await createClient();
    const { data: quote, error: fetchError } = await supabase
      .from("quote_requests")
      .select("*")
      .eq("id", quoteId)
      .single();

    if (fetchError || !quote) {
      console.error("[Quote Accept API] Quote not found:", quoteId);
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    if (quote.status !== "quoted" && quote.status !== "pending") {
      console.error(
        "[Quote Accept API] Quote not in valid status:",
        quote.status,
      );
      return NextResponse.json(
        { error: `Quote is already ${quote.status}` },
        { status: 400 },
      );
    }

    // Check if expired
    if (quote.expires_at && new Date(quote.expires_at) < new Date()) {
      console.error("[Quote Accept API] Quote has expired");
      return NextResponse.json({ error: "Quote has expired" }, { status: 400 });
    }

    // Process acceptance and send to repair app
    console.log("[Quote Accept API] Calling processQuoteAcceptance...");
    const success = await processQuoteAcceptance(quoteId);
    console.log("[Quote Accept API] processQuoteAcceptance result:", success);

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Quote accepted and sent to repair app",
        quoteId,
      });
    } else {
      console.error("[Quote Accept API] processQuoteAcceptance returned false");
      return NextResponse.json(
        { error: "Failed to process quote acceptance" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("[Quote Accept API] Exception caught:", error);
    console.error(
      "[Quote Accept API] Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
