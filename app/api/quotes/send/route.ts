import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendMessageViaProvider } from "@/app/lib/messaging/provider";

/**
 * POST /api/quotes/send
 * Send a quote via SMS to the customer
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
        { status: 401 },
      );
    }

    const body = await request.json();
    const { quote_id, quote_amount, additional_notes, requires_parts_order } =
      body;

    if (!quote_id || !quote_amount) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
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
        { status: 404 },
      );
    }

    // Build the SMS message (different template if parts need ordering)
    const smsMessage = requires_parts_order
      ? buildPartsOrderQuoteSms({
          name: quoteRequest.name,
          device_make: quoteRequest.device_make,
          device_model: quoteRequest.device_model,
          issue: quoteRequest.issue,
          description: quoteRequest.description,
          additional_issues: quoteRequest.additional_issues,
          quote_amount,
          additional_notes,
        })
      : buildQuoteSms({
          name: quoteRequest.name,
          device_make: quoteRequest.device_make,
          device_model: quoteRequest.device_model,
          issue: quoteRequest.issue,
          description: quoteRequest.description,
          additional_issues: quoteRequest.additional_issues,
          quote_amount,
          additional_notes,
        });

    console.log("[Quote Send] Sending SMS to", quoteRequest.phone);
    console.log("[Quote Send] Message:", smsMessage);

    // Send SMS via MacroDroid
    const smsResult = await sendMessageViaProvider({
      channel: "sms",
      to: quoteRequest.phone,
      text: smsMessage,
    });

    if (!smsResult.sent) {
      throw new Error("Failed to send SMS");
    }

    // Update the quote request
    const { error: updateError } = await supabase
      .from("quote_requests")
      .update({
        status: "quoted",
        quoted_price: quote_amount,
        quoted_at: new Date().toISOString(),
        quoted_by: user.id,
        requires_parts_order: requires_parts_order || false,
        quote_sent_at: new Date().toISOString(),
        quote_sent_by: user.id,
      })
      .eq("id", quote_id);

    if (updateError) {
      console.error("[Quote Send] Error updating quote request:", updateError);
    }

    console.log(`[Quote Send] Quote sent successfully for ${quote_id}`);

    return NextResponse.json({
      success: true,
      quote_id,
      sms_sent: true,
    });
  } catch (error) {
    console.error("[Quote Send] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send quote",
      },
      { status: 500 },
    );
  }
}

/**
 * Build the SMS message for the quote
 */
function buildQuoteSms(details: {
  name: string;
  device_make: string;
  device_model: string;
  issue: string;
  description?: string | null;
  additional_issues?: Array<{ issue: string; description: string }> | null;
  quote_amount: number;
  additional_notes?: string;
}): string {
  const {
    name,
    device_make,
    device_model,
    issue,
    description,
    additional_issues,
    quote_amount,
    additional_notes,
  } = details;

  const firstName = name.split(" ")[0];

  let message = `Hi ${firstName},\n\n`;

  // Check if there are multiple repairs
  const hasAdditionalIssues = additional_issues && additional_issues.length > 0;

  // Build device name - avoid duplication (e.g., "iPhone iPhone 13")
  const deviceName = device_model
    .toLowerCase()
    .includes(device_make.toLowerCase())
    ? device_model
    : `${device_make} ${device_model}`;

  if (hasAdditionalIssues) {
    // Multiple repairs - use bullet list format
    message += `Your quote for the ${deviceName}:\n`;

    // Main repair
    message += `• ${issue}`;
    if (description) message += ` - ${description}`;
    message += `\n`;

    // Additional repairs
    additional_issues.forEach((repair) => {
      message += `• ${repair.issue}`;
      if (repair.description) message += ` - ${repair.description}`;
      message += `\n`;
    });

    message += `\nTotal: £${quote_amount.toFixed(2)}`;
  } else {
    // Single repair - original format
    message += `Your quote for the ${deviceName} (${issue}`;
    if (description) message += ` - ${description}`;
    message += `) is £${quote_amount.toFixed(2)}.`;
  }

  message += `\n\nThis quote is valid for 7 days.`;

  message += `\n\n⚠️ Please check the device model and repair details above are correct before accepting.`;

  message += `\n\nJust reply to this message if you'd like to book in, or if you have any questions.`;
  message += `\n\nMany thanks, John\nNew Forest Device Repairs`;

  return message;
}

/**
 * Build the SMS message for quotes that require parts ordering
 */
function buildPartsOrderQuoteSms(details: {
  name: string;
  device_make: string;
  device_model: string;
  issue: string;
  description?: string | null;
  additional_issues?: Array<{ issue: string; description: string }> | null;
  quote_amount: number;
  additional_notes?: string;
}): string {
  const {
    name,
    device_make,
    device_model,
    issue,
    description,
    additional_issues,
    quote_amount,
    additional_notes,
  } = details;

  const firstName = name.split(" ")[0];

  let message = `Hi ${firstName},\n\n`;

  // Check if there are multiple repairs
  const hasAdditionalIssues = additional_issues && additional_issues.length > 0;

  // Build device name - avoid duplication (e.g., "iPhone iPhone 13")
  const deviceName = device_model
    .toLowerCase()
    .includes(device_make.toLowerCase())
    ? device_model
    : `${device_make} ${device_model}`;

  if (hasAdditionalIssues) {
    // Multiple repairs - use bullet list format
    message += `Your quote for the ${deviceName}:\n`;

    // Main repair
    message += `• ${issue}`;
    if (description) message += ` - ${description}`;
    message += `\n`;

    // Additional repairs
    additional_issues.forEach((repair) => {
      message += `• ${repair.issue}`;
      if (repair.description) message += ` - ${repair.description}`;
      message += `\n`;
    });

    message += `\nTotal: £${quote_amount.toFixed(2)}`;
  } else {
    // Single repair - original format
    message += `Your quote for the ${deviceName} (${issue}`;
    if (description) message += ` - ${description}`;
    message += `) is £${quote_amount.toFixed(2)}.`;
  }

  message += `\n\nWe will need to order parts for this job. Normally next day delivery, excluding weekends.`;
  message += `\n\nThis quote is valid for 7 days.`;

  message += `\n\n⚠️ Please check the device model and repair details above are correct before accepting.`;

  message += `\n\nJust reply to this message if you'd like to book in, or if you have any questions.`;
  message += `\n\nMany thanks, John\nNew Forest Device Repairs`;

  return message;
}
