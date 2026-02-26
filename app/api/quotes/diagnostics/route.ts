import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendMessageViaProvider } from "@/app/lib/messaging/provider";

/**
 * POST /api/quotes/diagnostics
 * Send "Diagnostics Required" message asking customer to bring device in
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    const { data: businessInfo } = await supabase
      .from("business_info")
      .select("google_maps_url")
      .single();

    const googleMapsUrl =
      businessInfo?.google_maps_url ||
      "https://www.google.com/maps/search/?api=1&query=New+Forest+Device+Repairs";

    const smsMessage = buildDiagnosticsSms({
      name: quoteRequest.name,
      device_make: quoteRequest.device_make,
      device_model: quoteRequest.device_model,
      issue: quoteRequest.issue,
      google_maps_url: googleMapsUrl,
    });

    console.log("[Quote Diagnostics] Sending SMS to", quoteRequest.phone);
    console.log("[Quote Diagnostics] Message:", smsMessage);

    const smsResult = await sendMessageViaProvider({
      channel: "sms",
      to: quoteRequest.phone,
      text: smsMessage,
    });

    if (!smsResult.sent) {
      throw new Error("Failed to send SMS");
    }

    const { error: updateError } = await supabase
      .from("quote_requests")
      .update({
        status: "diagnostics_required",
        quote_sent_at: new Date().toISOString(),
        quote_sent_by: user.id,
      })
      .eq("id", quote_id);

    if (updateError) {
      console.error(
        "[Quote Diagnostics] Error updating quote request:",
        updateError
      );
    }

    console.log(
      `[Quote Diagnostics] Diagnostics message sent successfully for ${quote_id}`
    );

    return NextResponse.json({
      success: true,
      quote_id,
      sms_sent: true,
    });
  } catch (error) {
    console.error("[Quote Diagnostics] Error:", error);
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
 * Build the diagnostics required SMS message
 */
function buildDiagnosticsSms(details: {
  name: string;
  device_make: string;
  device_model: string;
  issue: string;
  google_maps_url: string;
}): string {
  const { name, device_make, device_model, issue, google_maps_url } = details;

  const firstName = name.split(" ")[0];

  const deviceDescription = device_model
    .toLowerCase()
    .includes(device_make.toLowerCase())
    ? device_model
    : `${device_make} ${device_model}`;

  let message = `Hi ${firstName},\n\n`;
  message += `Thanks for your enquiry about your ${deviceDescription} (${issue}).\n\n`;
  message += `To give you an accurate quote, we'll need to run diagnostics on the device first.\n\n`;
  message += `There's a £40 diagnostic fee, which is fully deducted from the final bill if you go ahead with the repair.\n\n`;
  message += `Please bring your device in during opening hours and we'll get it checked for you.\n\n`;
  message += `Find us here: ${google_maps_url}\n\n`;
  message += `Many thanks, John\nNew Forest Device Repairs`;

  return message;
}
