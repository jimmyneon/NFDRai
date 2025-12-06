import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendMessageViaProvider } from "@/app/lib/messaging/provider";

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

    const { name, phone, email, device_make, device_model, issue } = payload;

    // Validate required fields
    const missingFields: string[] = [];
    if (!name) missingFields.push("name");
    if (!phone) missingFields.push("phone");
    if (!device_make) missingFields.push("device_make");
    if (!device_model) missingFields.push("device_model");
    if (!issue) missingFields.push("issue");

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
    const { data: quoteRequest, error: quoteError } = await supabase
      .from("quote_requests")
      .insert({
        name,
        phone: normalizedPhone,
        email: email || null,
        device_make,
        device_model,
        issue,
        customer_id: customer?.id || null,
        source: "website",
        status: "pending",
      })
      .select()
      .single();

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
      issue,
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

    return NextResponse.json(
      {
        success: true,
        quote_id: quoteRequest?.id,
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
}): string {
  const { name, device_make, device_model, issue } = details;
  const firstName = name.split(" ")[0];

  return `Hi ${firstName},

Thanks for your repair enquiry!

John will get back to you ASAP with a quote for your ${device_make} ${device_model} (${issue}).

If you have any questions in the meantime, just reply to this message.

Many thanks,
New Forest Device Repairs`;
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
