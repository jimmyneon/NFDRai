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

    // Check for special hours (holidays, closures)
    const specialHoursNote = info.special_hours_note;
    const hasSpecialHours = !!(
      specialHoursNote && specialHoursNote.trim().length > 0
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
