import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendMessageViaProvider } from "@/app/lib/messaging/provider";

/**
 * POST /api/quotes/unable
 * Send "Unable to Quote" message when in-store assessment is required
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
    const { quote_id } = body;

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

    // Get business info for Google Maps link
    const { data: businessInfo } = await supabase
      .from("business_info")
      .select("google_maps_url")
      .single();

    const googleMapsUrl =
      businessInfo?.google_maps_url ||
      "https://www.google.com/maps/search/?api=1&query=New+Forest+Device+Repairs";

    // Build the SMS message
    const smsMessage = buildUnableToQuoteSms({
      name: quoteRequest.name,
      device_make: quoteRequest.device_make,
      device_model: quoteRequest.device_model,
      issue: quoteRequest.issue,
      google_maps_url: googleMapsUrl,
    });

    console.log("[Quote Unable] Sending SMS to", quoteRequest.phone);
    console.log("[Quote Unable] Message:", smsMessage);

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
        status: "declined",
        quote_sent_at: new Date().toISOString(),
        quote_sent_by: user.id,
      })
      .eq("id", quote_id);

    if (updateError) {
      console.error(
        "[Quote Unable] Error updating quote request:",
        updateError
      );
    }

    console.log(
      `[Quote Unable] Unable to quote message sent successfully for ${quote_id}`
    );

    return NextResponse.json({
      success: true,
      quote_id,
      sms_sent: true,
    });
  } catch (error) {
    console.error("[Quote Unable] Error:", error);
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
 * Build the "Unable to Quote" SMS message
 */
function buildUnableToQuoteSms(details: {
  name: string;
  device_make: string;
  device_model: string;
  issue: string;
  google_maps_url: string;
}): string {
  const { name, device_make, device_model, issue, google_maps_url } = details;

  const firstName = name.split(" ")[0];

  // Avoid duplicate device type (e.g., "iPhone iPhone 14" -> "iPhone 14")
  const deviceDescription = device_model
    .toLowerCase()
    .includes(device_make.toLowerCase())
    ? device_model
    : `${device_make} ${device_model}`;

  let message = `Hi ${firstName},\n\n`;
  message += `Thanks for the information provided about your ${deviceDescription} (${issue}).\n\n`;
  message += `This type of issue requires a brief in-store assessment before we can diagnose the fault and provide an exact price.\n\n`;
  message += `You're welcome to bring the device in during opening hours and we'll take a look. If diagnostics are required, we'll confirm that with you before proceeding.\n\n`;
  message += `Find us here: ${google_maps_url}\n\n`;
  message += `Many thanks, John\nNew Forest Device Repairs`;

  return message;
}
