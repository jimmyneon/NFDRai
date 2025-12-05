import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role for public access (no auth required)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface BusinessInfo {
  business_name: string;
  google_maps_url: string | null;
  timezone: string;
  monday_open: string | null;
  monday_close: string | null;
  tuesday_open: string | null;
  tuesday_close: string | null;
  wednesday_open: string | null;
  wednesday_close: string | null;
  thursday_open: string | null;
  thursday_close: string | null;
  friday_open: string | null;
  friday_close: string | null;
  saturday_open: string | null;
  saturday_close: string | null;
  sunday_open: string | null;
  sunday_close: string | null;
  special_hours_note: string | null;
}

interface DayHours {
  day: string;
  open: string | null;
  close: string | null;
  isOpen: boolean;
  formatted: string;
}

interface OpeningHoursResponse {
  businessName: string;
  timezone: string;
  currentStatus: {
    isOpen: boolean;
    currentTime: string;
    currentDay: string;
  };
  today: {
    day: string;
    hours: string;
    open: string | null;
    close: string | null;
  };
  nextOpen: string | null;
  weeklySchedule: DayHours[];
  specialHours: {
    active: boolean;
    note: string | null;
  };
  googleMapsUrl: string | null;
}

const DAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/**
 * Check if special hours note contains dates that are still relevant (not in the past)
 * Returns true if the note should be shown, false if all dates have passed
 */
function isSpecialHoursRelevant(
  note: string | null,
  timezone: string
): boolean {
  if (!note || note.trim().length === 0) {
    return false;
  }

  // Get current date in business timezone
  const now = new Date();
  const currentDateStr = now.toLocaleDateString("en-CA", {
    timeZone: timezone,
  }); // YYYY-MM-DD format
  const currentDate = new Date(currentDateStr);

  // Month name patterns (case insensitive)
  const months: Record<string, number> = {
    january: 0,
    february: 1,
    march: 2,
    april: 3,
    may: 4,
    june: 5,
    july: 6,
    august: 7,
    september: 8,
    october: 9,
    november: 10,
    december: 11,
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    sept: 8,
    oct: 9,
    nov: 10,
    dec: 11,
  };

  const monthPattern = Object.keys(months).join("|");

  // Pattern to find dates like "23 November", "November 23", "23rd November", etc.
  const datePatterns = [
    // "23 November" or "23rd November" or "23 Nov"
    new RegExp(`(\\d{1,2})(?:st|nd|rd|th)?\\s+(${monthPattern})`, "gi"),
    // "November 23" or "November 23rd" or "Nov 23"
    new RegExp(`(${monthPattern})\\s+(\\d{1,2})(?:st|nd|rd|th)?`, "gi"),
    // "16/11" or "16/11/2024" or "16-11" or "16-11-2024"
    /\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/gi,
  ];

  const foundDates: Date[] = [];
  const currentYear = now.getFullYear();

  // Try each pattern
  for (const pattern of datePatterns) {
    let match;
    while ((match = pattern.exec(note)) !== null) {
      let day: number;
      let month: number;
      let year = currentYear;

      if (pattern.source.includes(monthPattern)) {
        // Text month pattern
        if (/^\d/.test(match[1])) {
          // Day first: "23 November"
          day = parseInt(match[1], 10);
          month = months[match[2].toLowerCase()];
        } else {
          // Month first: "November 23"
          month = months[match[1].toLowerCase()];
          day = parseInt(match[2], 10);
        }
      } else {
        // Numeric pattern: "16/11" or "16/11/2024"
        day = parseInt(match[1], 10);
        month = parseInt(match[2], 10) - 1; // 0-indexed
        if (match[3]) {
          year = parseInt(match[3], 10);
          if (year < 100) year += 2000; // Handle 2-digit years
        }
      }

      // Validate and create date
      if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
        const date = new Date(year, month, day);
        foundDates.push(date);
      }
    }
  }

  // If no dates found, assume it's a general note (always relevant)
  if (foundDates.length === 0) {
    // Check for keywords that suggest it's time-sensitive but no date
    const timeSensitiveKeywords =
      /\b(today|tomorrow|this week|next week|until|from|starting|ending)\b/i;
    if (timeSensitiveKeywords.test(note)) {
      // Can't determine, show it to be safe
      return true;
    }
    // General note without dates - always show
    return true;
  }

  // Check if ANY date is today or in the future
  const hasRelevantDate = foundDates.some((date) => {
    // Reset time to start of day for comparison
    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    return dateOnly >= currentDate;
  });

  return hasRelevantDate;
}

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Format time from 24h to 12h format
 */
function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

/**
 * Find the next time the business will open
 */
function findNextOpenTime(
  info: BusinessInfo,
  currentDayIndex: number,
  currentTime: string
): string | null {
  const currentMinutes = timeToMinutes(currentTime);

  for (let i = 0; i < 7; i++) {
    const dayIndex = (currentDayIndex + i) % 7;
    const day = DAYS[dayIndex];
    const openKey = `${day}_open` as keyof BusinessInfo;
    const openTime = info[openKey] as string | null;

    if (openTime) {
      if (i === 0) {
        const openMinutes = timeToMinutes(openTime);
        if (openMinutes > currentMinutes) {
          return `Today at ${formatTime(openTime)}`;
        }
      } else {
        const dayName = DAY_NAMES[dayIndex];
        return `${dayName} at ${formatTime(openTime)}`;
      }
    }
  }

  return null;
}

/**
 * Build weekly schedule array
 */
function buildWeeklySchedule(info: BusinessInfo): DayHours[] {
  const schedule: DayHours[] = [];

  for (let i = 0; i < 7; i++) {
    const day = DAYS[i];
    const dayName = DAY_NAMES[i];
    const openKey = `${day}_open` as keyof BusinessInfo;
    const closeKey = `${day}_close` as keyof BusinessInfo;
    const openTime = info[openKey] as string | null;
    const closeTime = info[closeKey] as string | null;

    const hasHours = !!(openTime && closeTime);

    schedule.push({
      day: dayName,
      open: openTime,
      close: closeTime,
      isOpen: hasHours,
      formatted: hasHours
        ? `${formatTime(openTime!)} - ${formatTime(closeTime!)}`
        : "Closed",
    });
  }

  return schedule;
}

/**
 * Public API endpoint for opening hours
 * No authentication required - designed for external website access
 *
 * GET /api/public/opening-hours
 *
 * Returns current open/closed status, today's hours, weekly schedule,
 * and any special hours notes (holidays, closures, etc.)
 */
export async function GET() {
  try {
    // Create Supabase client with service role for public access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch business info
    const { data: businessInfo, error } = await supabase
      .from("business_info")
      .select("*")
      .single();

    if (error || !businessInfo) {
      return NextResponse.json(
        {
          error: "Business hours not configured",
          isOpen: false,
          message: "Please contact us directly for opening hours",
        },
        {
          status: 404,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Content-Type": "application/json; charset=utf-8",
          },
        }
      );
    }

    const info = businessInfo as BusinessInfo;

    // Get current time in business timezone
    const now = new Date();
    const currentTime = now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: info.timezone,
    });

    // Get current day
    const currentDayName = now.toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: info.timezone,
    });
    const currentDay = currentDayName.toLowerCase() as (typeof DAYS)[number];
    const currentDayIndex = DAYS.indexOf(currentDay);

    // Get today's hours
    const openKey = `${currentDay}_open` as keyof BusinessInfo;
    const closeKey = `${currentDay}_close` as keyof BusinessInfo;
    const todayOpen = info[openKey] as string | null;
    const todayClose = info[closeKey] as string | null;

    // Calculate if currently open
    let isOpen = false;
    let todayFormatted = "Closed";

    if (todayOpen && todayClose) {
      todayFormatted = `${formatTime(todayOpen)} - ${formatTime(todayClose)}`;
      const currentMinutes = timeToMinutes(currentTime);
      const openMinutes = timeToMinutes(todayOpen);
      const closeMinutes = timeToMinutes(todayClose);
      isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
    }

    // Find next opening time if closed
    let nextOpen: string | null = null;
    if (!isOpen) {
      nextOpen = findNextOpenTime(info, currentDayIndex, currentTime);
    }

    // Build weekly schedule
    const weeklySchedule = buildWeeklySchedule(info);

    // Check for special hours (holidays, closures) - only if dates are still relevant
    const specialHoursNote = info.special_hours_note;
    const hasSpecialHours = isSpecialHoursRelevant(
      specialHoursNote,
      info.timezone
    );

    const response: OpeningHoursResponse = {
      businessName: info.business_name,
      timezone: info.timezone,
      currentStatus: {
        isOpen,
        currentTime,
        currentDay: currentDayName,
      },
      today: {
        day: currentDayName,
        hours: todayFormatted,
        open: todayOpen,
        close: todayClose,
      },
      nextOpen,
      weeklySchedule,
      specialHours: {
        active: hasSpecialHours,
        note: specialHoursNote,
      },
      googleMapsUrl: info.google_maps_url,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Content-Type": "application/json; charset=utf-8",
        // Cache for 1 minute to reduce load but stay relatively fresh
        "Cache-Control": "public, max-age=60, s-maxage=60",
      },
    });
  } catch (error) {
    console.error("[Opening Hours API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch opening hours" },
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
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
