import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendMessageViaProvider } from "@/app/lib/messaging/provider";
import { buildQuoteRequestConfirmationSms } from "@/app/lib/quote-request-sms";

// Use service role for public access (no auth required)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/public/start-repair
 * Public API endpoint for external websites - No authentication required
 * Receive repair quote request from external source (website form, etc)
 * Store in quote_requests table and send SMS confirmation
 *
 * Expected payload:
 * {
 *   "name": "John Smith",
 *   "phone": "+447123456789",
 *   "email": "john@example.com",  // optional
 *   "device_make": "Apple",
 *   "device_model": "iPhone 14 Pro",
 *   "issue": "Cracked screen"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const rawBody = await request.text();
    const payload = JSON.parse(rawBody);

    const {
      name,
      phone,
      email,
      device_make,
      device_model,
      issue,
      type,
      page,
      source,
    } = payload;
    const requestType: "repair" | "sell" = type === "sell" ? "sell" : "repair";

    // Validate required fields
    const missingFields: string[] = [];
    if (!name) missingFields.push("name");
    if (!phone) missingFields.push("phone");
    if (!device_make) missingFields.push("device_make");
    if (!device_model) missingFields.push("device_model");
    if (requestType === "repair" && !issue) missingFields.push("issue");

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(", ")}`,
        },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json; charset=utf-8",
          },
        }
      );
    }

    // Normalize phone number
    const normalizedPhone = normalizePhone(phone);

    const normalizedIssue =
      requestType === "sell" ? issue || "Device sell enquiry" : issue;

    // Create Supabase client with service role for public access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find or create customer
    let { data: customer } = await supabase
      .from("customers")
      .select("*")
      .eq("phone", normalizedPhone)
      .single();

    if (!customer) {
      const { data: newCustomer, error: customerError } = await supabase
        .from("customers")
        .insert({
          phone: normalizedPhone,
          name: name,
          email: email || null,
        })
        .select()
        .single();

      if (customerError) {
        console.error("[Start Repair] Error creating customer:", customerError);
      }
      customer = newCustomer;
    } else {
      // Update customer name/email if provided and not already set
      const updates: Record<string, string> = {};
      if (name && !customer.name) updates.name = name;
      if (email && !customer.email) updates.email = email;

      if (Object.keys(updates).length > 0) {
        await supabase.from("customers").update(updates).eq("id", customer.id);
      }
    }

    // Create quote request record
    // Backward-compatible: if the DB migration adding quote_requests.type hasn't been applied yet,
    // retry insert without the type field.
    const baseQuoteInsert: Record<string, any> = {
      name,
      phone: normalizedPhone,
      email: email || null,
      device_make,
      device_model,
      issue: normalizedIssue,
      customer_id: customer?.id || null,
      source:
        typeof source === "string" && source.length > 0 ? source : "website",
      status: "pending",
    };

    if (typeof page === "string" && page.length > 0) {
      baseQuoteInsert.page = page;
    }

    let quoteRequest: any = null;
    let quoteError: any = null;

    const insertWithType = await supabase
      .from("quote_requests")
      .insert({ ...baseQuoteInsert, type: requestType })
      .select()
      .single();

    quoteRequest = insertWithType.data;
    quoteError = insertWithType.error;

    if (quoteError && typeof quoteError.message === "string") {
      const lower = quoteError.message.toLowerCase();

      // Retry without type if the column doesn't exist yet
      if (
        lower.includes("column") &&
        lower.includes("type") &&
        lower.includes("quote_requests")
      ) {
        const insertWithoutType = await supabase
          .from("quote_requests")
          .insert(baseQuoteInsert)
          .select()
          .single();
        quoteRequest = insertWithoutType.data;
        quoteError = insertWithoutType.error;
      }

      // Retry without page if the column doesn't exist yet
      if (
        quoteError &&
        typeof quoteError.message === "string" &&
        quoteError.message.toLowerCase().includes("column") &&
        quoteError.message.toLowerCase().includes("page") &&
        quoteError.message.toLowerCase().includes("quote_requests")
      ) {
        const { page: _page, ...withoutPage } = baseQuoteInsert;
        const insertWithoutPage = await supabase
          .from("quote_requests")
          .insert({ ...withoutPage, type: requestType })
          .select()
          .single();

        quoteRequest = insertWithoutPage.data;
        quoteError = insertWithoutPage.error;

        if (
          quoteError &&
          typeof quoteError.message === "string" &&
          quoteError.message.toLowerCase().includes("column") &&
          quoteError.message.toLowerCase().includes("type") &&
          quoteError.message.toLowerCase().includes("quote_requests")
        ) {
          const insertWithoutPageAndType = await supabase
            .from("quote_requests")
            .insert(withoutPage)
            .select()
            .single();
          quoteRequest = insertWithoutPageAndType.data;
          quoteError = insertWithoutPageAndType.error;
        }
      }
    }

    if (quoteError) {
      console.error("[Start Repair] Error creating quote request:", quoteError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to save quote request",
        },
        {
          status: 500,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json; charset=utf-8",
          },
        }
      );
    }

    // Build confirmation SMS
    const smsMessage = buildConfirmationSms({
      name,
      device_make,
      device_model,
      issue: normalizedIssue,
      type: requestType,
    });

    // Send SMS via MacroDroid
    const smsResult = await sendMessageViaProvider({
      channel: "sms",
      to: normalizedPhone,
      text: smsMessage,
    });

    // Update quote request with SMS status
    if (quoteRequest) {
      await supabase
        .from("quote_requests")
        .update({
          sms_sent: smsResult.sent,
          sms_sent_at: smsResult.sent ? new Date().toISOString() : null,
        })
        .eq("id", quoteRequest.id);
    }

    console.log(
      `[Start Repair] Quote request created for ${name} (${normalizedPhone}) - ${device_make} ${device_model}`
    );
    console.log(`[Start Repair] SMS sent: ${smsResult.sent}`);

    // Build quote URL for dashboard
    const quoteUrl = `${
      process.env.NEXT_PUBLIC_APP_URL || "https://nfd-rai.vercel.app"
    }/dashboard/quotes/${quoteRequest?.id}`;

    // Send notification to MacroDroid webhook
    const macrodroidBase = process.env.MACRODROID_WEBHOOK_URL;
    if (macrodroidBase) {
      try {
        const notificationUrl = `${macrodroidBase}/repair-request`;
        console.log(
          `[Start Repair] Sending notification to: ${notificationUrl}`
        );
        console.log(`[Start Repair] Notification payload:`, {
          url: quoteUrl,
        });

        const response = await fetch(notificationUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: quoteUrl,
          }),
        });

        console.log(
          `[Start Repair] Notification response status: ${response.status}`
        );
        if (!response.ok) {
          const responseText = await response.text();
          console.error(
            `[Start Repair] Notification failed: ${response.status} - ${responseText}`
          );
        } else {
          console.log(`[Start Repair] ✅ Notification sent successfully`);
        }
      } catch (error) {
        console.error("[Start Repair] Failed to send notification:", error);
      }
    } else {
      console.log(
        "[Start Repair] No MACRODROID_WEBHOOK_URL configured - skipping notification"
      );
    }

    return NextResponse.json(
      {
        success: true,
        quote_id: quoteRequest?.id,
        quote_url: quoteUrl,
        sms_sent: smsResult.sent,
        message: "Quote request received. SMS confirmation sent.",
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    );
  } catch (error) {
    console.error("[Start Repair] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process quote request",
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    );
  }
}

/**
 * Handle CORS preflight requests
 */
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

/**
 * Build confirmation SMS message
 */
function buildConfirmationSms(details: {
  name: string;
  device_make: string;
  device_model: string;
  issue: string;
  type: "repair" | "sell";
}): string {
  return buildQuoteRequestConfirmationSms(details);
}

/**
 * Normalize phone number to consistent format
 */
function normalizePhone(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, "");

  // If starts with 0, assume UK and convert to +44
  if (cleaned.startsWith("0")) {
    cleaned = "+44" + cleaned.substring(1);
  }

  // If no + prefix and looks like UK number, add +44
  if (!cleaned.startsWith("+") && cleaned.length === 10) {
    cleaned = "+44" + cleaned;
  }

  return cleaned;
}
