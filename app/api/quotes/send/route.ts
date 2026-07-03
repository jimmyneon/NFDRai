import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendMessageViaProvider } from "@/app/lib/messaging/provider";
import { syncQuoteToRepairApp } from "@/app/lib/repair-app-sync";
import { shouldSendSMS } from "@/lib/phone-validator";
import {
  buildQuoteSms,
  buildPartsOrderQuoteSms,
  buildTechnicalSupportSms,
  buildDontKnowSms,
  buildQuoteAcceptedSms,
} from "@/app/lib/sms-templates";
import { sendQuoteEmail } from "@/app/lib/messaging/email-provider";

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

    // Check if this is a UK mobile number (block landlines, 0800, international)
    const smsCheck = shouldSendSMS(quoteRequest.phone);
    const canSendSMS = smsCheck.allowed;

    if (!canSendSMS) {
      console.log(
        "[Quote Send - Phone Block] ❌ SMS not possible:",
        smsCheck.reason,
      );
      console.log("[Quote Send - Phone Block] Number:", quoteRequest.phone);

      // Try email fallback if customer has an email address
      if (quoteRequest.email) {
        console.log(
          "[Quote Send] Attempting email fallback to:",
          quoteRequest.email,
        );
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "Cannot send quote - not a UK mobile and no email on file",
            reason: smsCheck.reason,
            country: smsCheck.country,
            message: `Cannot send via SMS (${smsCheck.reason}) and no email address on file. Please contact the customer directly.`,
          },
          { status: 400 },
        );
      }
    } else {
      console.log(
        "[Quote Send - UK Mobile] ✅ Verified UK mobile - SMS allowed",
      );
    }

    // Build the SMS message based on request type
    let smsMessage: string;

    const requestType = quoteRequest.request_type || "quote";

    if (requestType === "technical_support") {
      smsMessage = buildTechnicalSupportSms(quoteRequest.name);
    } else if (requestType === "dont_know") {
      smsMessage = buildDontKnowSms(quoteRequest.name, additional_notes);
    } else {
      // Quote request - use existing logic
      smsMessage = requires_parts_order
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
    }

    // Send via SMS if possible, otherwise fall back to email
    let smsSent = false;
    let emailSent = false;
    let sendError: string | undefined;

    if (canSendSMS) {
      console.log("[Quote Send] Sending SMS to", quoteRequest.phone);
      const smsResult = await sendMessageViaProvider({
        channel: "sms",
        to: quoteRequest.phone,
        text: smsMessage,
      });

      if (smsResult.sent) {
        smsSent = true;
      } else {
        console.error("[Quote Send] SMS failed:", smsResult.error);
        sendError = smsResult.error;
        // Try email fallback if SMS fails
        if (quoteRequest.email) {
          console.log("[Quote Send] SMS failed, trying email fallback");
        }
      }
    }

    // Send via email if SMS wasn't possible or failed, and we have an email
    if (!smsSent && quoteRequest.email) {
      const emailSubject = `Your quote from New Forest Device Repairs`;
      const emailResult = await sendQuoteEmail({
        to: quoteRequest.email,
        subject: emailSubject,
        text: smsMessage,
      });

      if (emailResult.sent) {
        emailSent = true;
        console.log("[Quote Send] ✅ Quote sent via email fallback");
      } else {
        console.error(
          "[Quote Send] Email fallback also failed:",
          emailResult.error,
        );
        sendError = `SMS: ${sendError || "not possible"}; Email: ${emailResult.error}`;
      }
    }

    if (!smsSent && !emailSent) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send quote via SMS or email",
          reason: sendError,
          message:
            "Could not send via SMS or email. Please contact the customer directly.",
        },
        { status: 500 },
      );
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

    // CLOSED LOOP: Switch conversation to auto mode after sending quote
    // This ensures AI handles all quote-related responses automatically
    if (quoteRequest.conversation_id) {
      console.log(
        "[Quote Send] Switching conversation to auto mode for closed loop quote handling",
      );
      await supabase
        .from("conversations")
        .update({
          status: "auto",
          updated_at: new Date().toISOString(),
        })
        .eq("id", quoteRequest.conversation_id);
    }

    console.log(`[Quote Send] Quote sent successfully for ${quote_id}`);

    // Sync updated quote to Repair App
    await syncQuoteToRepairApp({
      id: quoteRequest.id,
      name: quoteRequest.name,
      phone: quoteRequest.phone,
      email: quoteRequest.email,
      device_make: quoteRequest.device_make,
      device_model: quoteRequest.device_model,
      issue: quoteRequest.issue,
      description: quoteRequest.description,
      additional_issues: quoteRequest.additional_issues,
      quoted_price: quote_amount,
      status: "quoted",
      type: quoteRequest.type,
      page: quoteRequest.page,
      source: quoteRequest.source,
      requires_parts_order: requires_parts_order || false,
      conversation_id: quoteRequest.conversation_id,
      created_at: quoteRequest.created_at,
    });

    return NextResponse.json({
      success: true,
      quote_id,
      sms_sent: smsSent,
      email_sent: emailSent,
      method: smsSent ? "sms" : "email",
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
