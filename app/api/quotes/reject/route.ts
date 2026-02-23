import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendMessageViaProvider } from "@/app/lib/messaging/provider";

/**
 * POST /api/quotes/reject
 * Send rejection message when unable to fix device (low value, low repair odds, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { quote_id, reason } = body;

    if (!quote_id) {
      return NextResponse.json(
        { success: false, error: "Missing quote_id" },
        { status: 400 }
      );
    }

    // Get the quote request
    const { data: quoteRequest, error: fetchError } = await supabase
      .from("quote_requests")
      .select("*")
      .eq("id", quote_id)
      .single();

    if (fetchError || !quoteRequest) {
      return NextResponse.json(
        { success: false, error: "Quote request not found" },
        { status: 404 }
      );
    }

    // Build the SMS message
    const smsMessage = buildRejectQuoteSms({
      name: quoteRequest.name,
      device_make: quoteRequest.device_make,
      device_model: quoteRequest.device_model,
      issue: quoteRequest.issue,
      reason: reason || "general",
    });

    console.log("[Quote Reject] Sending SMS to", quoteRequest.phone);
    console.log("[Quote Reject] Message:", smsMessage);

    // Send SMS via MacroDroid
    const smsResult = await sendMessageViaProvider({
      channel: "sms",
      to: quoteRequest.phone,
      text: smsMessage,
    });

    if (!smsResult.sent) {
      throw new Error("Failed to send SMS");
    }

    // Update the quote request status
    const { error: updateError } = await supabase
      .from("quote_requests")
      .update({
        status: "rejected",
        quote_sent_at: new Date().toISOString(),
        quote_sent_by: user.id,
      })
      .eq("id", quote_id);

    if (updateError) {
      console.error(
        "[Quote Reject] Error updating quote request:",
        updateError
      );
    }

    console.log(
      `[Quote Reject] Rejection message sent successfully for ${quote_id}`
    );

    return NextResponse.json({
      success: true,
      quote_id,
      sms_sent: true,
    });
  } catch (error) {
    console.error("[Quote Reject] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to send message",
      },
      { status: 500 }
    );
  }
}

/**
 * Build the rejection SMS message
 */
function buildRejectQuoteSms(details: {
  name: string;
  device_make: string;
  device_model: string;
  issue: string;
  reason?: string;
}): string {
  const { name, device_make, device_model, issue, reason } = details;

  const firstName = name.split(" ")[0];

  // Avoid duplicate device type (e.g., "iPhone iPhone 14" -> "iPhone 14")
  const deviceDescription = device_model
    .toLowerCase()
    .includes(device_make.toLowerCase())
    ? device_model
    : `${device_make} ${device_model}`;

  let message = `Hi ${firstName},\n\n`;
  message += `Thanks for getting in touch about your ${deviceDescription} (${issue}).\n\n`;
  message += `Unfortunately, we're currently unable to take on this repair. This may be due to the device's age, repair complexity, or the cost-effectiveness of the repair compared to replacement options.\n\n`;
  message += `We appreciate you thinking of us, and if you have any other devices that need attention or questions about our services, please don't hesitate to get in touch.\n\n`;
  message += `Many thanks, John\nNew Forest Device Repairs`;

  return message;
}
