import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendMessageViaProvider } from "@/app/lib/messaging/provider";
import { checkRateLimit } from "@/app/lib/rate-limiter";
import { getBusinessHoursStatus } from "@/lib/business-hours";
import { detectHolidayMode } from "@/app/lib/holiday-mode-detector";

/**
 * POST /api/messages/missed-call
 * Handle missed call notifications from MacroDroid
 * Generate AI response with business info, opening hours, services
 *
 * Expected payload:
 * {
 *   "from": "+1234567890",
 *   "channel": "sms"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body with explicit UTF-8 handling
    const rawBody = await request.text();
    const payload = JSON.parse(rawBody);
    const { from, channel = "sms" } = payload;

    if (!from) {
      return NextResponse.json(
        { error: "Missing required field: from" },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        }
      );
    }

    // Rate limiting: Max 1 missed call response per 2 minutes per phone number
    const rateLimit = checkRateLimit(from, "missed-call", {
      windowMs: 2 * 60 * 1000, // 2 minutes
      maxRequests: 1,
    });

    if (!rateLimit.allowed) {
      console.log(
        `[Missed Call] Rate limited: ${from} (retry after ${rateLimit.retryAfter}s)`
      );
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded",
          message: "Please wait before calling again",
          retryAfter: rateLimit.retryAfter,
        },
        {
          status: 429,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        }
      );
    }

    const supabase = await createClient();

    // Find or create customer
    let { data: customer } = await supabase
      .from("customers")
      .select("*")
      .eq("phone", from)
      .single();

    if (!customer) {
      const { data: newCustomer } = await supabase
        .from("customers")
        .insert({
          phone: from,
        })
        .select()
        .single();

      customer = newCustomer;
    }

    // Find or create conversation
    let { data: conversation } = await supabase
      .from("conversations")
      .select("*, messages(*)")
      .eq("customer_id", customer?.id || "")
      .eq("channel", channel)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!conversation) {
      const { data: newConversation } = await supabase
        .from("conversations")
        .insert({
          customer_id: customer.id,
          channel,
          status: "auto",
        })
        .select("*, messages(*)")
        .single();

      conversation = newConversation;
    }

    // Log the missed call as a system message
    if (conversation) {
      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        sender: "system",
        text: `Missed call from ${from}`,
      });
    }

    // Generate context-aware missed call message
    // Checks: business hours, holiday mode, next opening time
    const hoursStatus = await getBusinessHoursStatus();
    const holidayStatus = detectHolidayMode(hoursStatus.specialHoursNote);

    const apologyMessage = generateMissedCallMessage({
      isOpen: hoursStatus.isOpen,
      todayHours: hoursStatus.todayHours,
      nextOpenTime: hoursStatus.nextOpenTime,
      googleMapsUrl: hoursStatus.googleMapsUrl,
      holidayStatus: holidayStatus,
      currentTime: hoursStatus.currentTime,
    });

    if (conversation) {
      // Log the AI response
      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        sender: "ai",
        text: apologyMessage,
        ai_provider: "system",
        ai_model: "missed-call-template",
        ai_confidence: 1.0,
      });

      // Send via MacroDroid webhook
      await sendMessageViaProvider({
        channel: "sms",
        to: from,
        text: apologyMessage,
      });
    }

    console.log(`[Missed Call] Missed-call template sent successfully`);

    return NextResponse.json(
      {
        success: true,
        message: apologyMessage,
        messages: [apologyMessage],
        messageCount: 1,
        delivered: true,
        deliveryProvider: "macrodroid",
      },
      {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    );
  } catch (error) {
    console.error("Missed call handler error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate missed call response",
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    );
  }
}

/**
 * Generate context-aware missed call message
 * Adapts based on: open/closed status, holiday mode, next opening time
 */
function generateMissedCallMessage(context: {
  isOpen: boolean;
  todayHours: string;
  nextOpenTime: string | null;
  googleMapsUrl: string | null;
  holidayStatus: {
    isOnHoliday: boolean;
    holidayMessage: string | null;
    returnDate: string | null;
  };
  currentTime: string;
}): string {
  const lines: string[] = ["Sorry we missed your call!", ""];

  // HOLIDAY MODE - Takes priority
  if (
    context.holidayStatus.isOnHoliday &&
    context.holidayStatus.holidayMessage
  ) {
    // Add festive greeting if it's a recognized holiday
    const greeting = getHolidayGreeting(context.holidayStatus.holidayMessage);
    if (greeting) {
      lines.push(greeting, "");
    }

    lines.push(context.holidayStatus.holidayMessage);
    lines.push("");
    lines.push(
      "I can provide repair estimates and answer questions right now. John will confirm all quotes and bookings when he returns."
    );

    if (context.holidayStatus.returnDate) {
      lines.push("");
      lines.push(`We'll be back ${context.holidayStatus.returnDate}.`);
    }
  }
  // CURRENTLY OPEN
  else if (context.isOpen) {
    const closeTime = extractCloseTime(context.todayHours);
    lines.push(`We're currently OPEN until ${closeTime}.`);
    lines.push("");
    lines.push("TEXT ME for instant help with:");
    lines.push("• Repair quotes (no need to call!)");
    lines.push("• Opening hours");
    lines.push("• Booking appointments");
    lines.push("• Any device questions");
    lines.push("");
    lines.push("I'll reply straight away - much faster than waiting on hold!");
  }
  // CURRENTLY CLOSED
  else {
    if (context.nextOpenTime) {
      lines.push(
        `We're currently CLOSED. We'll be open ${context.nextOpenTime}.`
      );
    } else {
      lines.push(`We're currently CLOSED. ${context.todayHours}`);
    }
    lines.push("");
    lines.push("TEXT ME now for instant help with:");
    lines.push("• Repair quotes (no need to call back!)");
    lines.push("• Opening hours");
    lines.push("• Booking appointments");
    lines.push("• Any questions");
    lines.push("");
    lines.push("I'll reply straight away - saves you calling back!");
  }

  // Add Google Maps link (if available)
  if (context.googleMapsUrl) {
    lines.push("");
    lines.push(`Live hours: ${context.googleMapsUrl}`);
  }

  // Signature
  lines.push("");
  lines.push("Many thanks, AI Steve");
  lines.push("New Forest Device Repairs");

  return lines.join("\n");
}

/**
 * Extract closing time from hours string (e.g., "10:00 AM - 5:00 PM" → "5:00 PM")
 */
function extractCloseTime(hoursString: string): string {
  const match = hoursString.match(/-(\s*\d{1,2}:\d{2}\s*[AP]M)/i);
  return match ? match[1].trim() : hoursString;
}

/**
 * Get festive greeting based on holiday type
 */
function getHolidayGreeting(holidayMessage: string): string | null {
  const lower = holidayMessage.toLowerCase();

  if (lower.includes("christmas") || lower.includes("xmas")) {
    return "🎄 Merry Christmas!";
  }
  if (lower.includes("new year")) {
    return "🎉 Happy New Year!";
  }
  if (lower.includes("easter")) {
    return "🐰 Happy Easter!";
  }

  return null;
}
