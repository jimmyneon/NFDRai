import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/quotes/[id]
 * Update a quote request status and price
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status, quoted_price } = body;

    const supabase = await createClient();

    const updates: Record<string, any> = {};
    if (status) updates.status = status;
    if (quoted_price !== undefined) {
      updates.quoted_price = quoted_price;
      updates.quoted_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("quote_requests")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[Quotes API] Update error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[Quotes API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update quote request" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/quotes/[id]
 * Get a single quote request
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("quote_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch quote request" },
      { status: 500 }
    );
  }
}
