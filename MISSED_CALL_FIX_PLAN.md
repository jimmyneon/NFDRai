# Missed Call Message - Comprehensive Fix Plan

## Problem Statement

Missed call auto-response is currently:

1. ❌ Static (always the same message)
2. ❌ Doesn't check if business is open/closed
3. ❌ Doesn't mention hours or next opening time
4. ❌ No Google Maps link for live hours
5. ❌ Ignores holiday mode (says "I can help" even when closed for Christmas)
6. ❌ Vague prompts (doesn't encourage specific responses)

## Current Message (Bad)

```
Sorry we missed your call!

I can help with pricing, bookings, or any questions you have. Just text back and I'll get you sorted straight away.

Many thanks, AI Steve
New Forest Device Repairs
```

**Problems:**

- Customer calls at 8pm (closed) → Gets "I can help with bookings"
- Customer texts back: "Can I book for tomorrow?"
- AI responds: "We're closed, John will confirm when back"
- Customer: **WTF?! Why didn't you say that first?!** 😤

## Solution: Context-Aware Missed Call Messages

### Scenario A: Currently OPEN

```
Sorry we missed your call!

We're currently OPEN until 5:00 PM today.

I can help you right now with:
• Screen repair pricing (iPhone, Samsung, etc.)
• Battery replacement quotes
• Booking you in for today or tomorrow
• Any device repair questions

Just text back with what you need, or call us back!

Live hours & directions: [Google Maps link]

Many thanks, AI Steve
New Forest Device Repairs
```

### Scenario B: Currently CLOSED (Normal Hours)

```
Sorry we missed your call!

We're currently CLOSED. We'll be open tomorrow (Tuesday) at 10:00 AM.

I can help you right now with:
• Repair quotes (screen, battery, etc.)
• Booking you in for tomorrow
• Questions about our services

Just text back and I'll get you sorted!

Live hours: [Google Maps link]

Many thanks, AI Steve
New Forest Device Repairs
```

### Scenario C: CLOSED - Weekend

```
Sorry we missed your call!

We're currently CLOSED for the weekend. We'll be open Monday at 10:00 AM.

I can help you right now with:
• Repair estimates
• Booking you in for Monday
• Any questions you have

Just text back!

Live hours: [Google Maps link]

Many thanks, AI Steve
New Forest Device Repairs
```

### Scenario D: HOLIDAY CLOSURE

```
Sorry we missed your call!

🎄 We're closed December 25-26 for Christmas, back on December 27th.

I can provide repair estimates and answer questions right now. John will confirm all quotes and bookings when he returns.

Hope you're having a wonderful festive season!

Live hours: [Google Maps link]

Many thanks, AI Steve
New Forest Device Repairs
```

## Implementation Changes

### File: `/app/api/messages/missed-call/route.ts`

**Current (lines 114-124):**

```typescript
const apologyMessage = [
  "Sorry we missed your call!",
  "",
  "I can help with pricing, bookings, or any questions you have...",
  // ... static message
].join("\n");
```

**New (dynamic):**

```typescript
// 1. Load business hours status
const hoursStatus = await getBusinessHoursStatus();

// 2. Check holiday mode
const holidayStatus = detectHolidayMode(hoursStatus.specialHoursNote);

// 3. Generate context-aware message
const apologyMessage = generateMissedCallMessage({
  isOpen: hoursStatus.isOpen,
  todayHours: hoursStatus.todayHours,
  nextOpenTime: hoursStatus.nextOpenTime,
  googleMapsUrl: hoursStatus.googleMapsUrl,
  holidayStatus: holidayStatus,
  currentTime: hoursStatus.currentTime,
});
```

### New Function: `generateMissedCallMessage()`

```typescript
function generateMissedCallMessage(context: {
  isOpen: boolean;
  todayHours: string;
  nextOpenTime: string | null;
  googleMapsUrl: string | null;
  holidayStatus: HolidayStatus;
  currentTime: string;
}): string {
  const lines: string[] = ["Sorry we missed your call!", ""];

  // HOLIDAY MODE - Takes priority
  if (context.holidayStatus.isOnHoliday) {
    const greeting = getHolidayGreeting(context.holidayStatus.holidayMessage);
    if (greeting) lines.push(greeting, "");

    lines.push(
      context.holidayStatus.holidayMessage || "We're currently closed"
    );
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
    lines.push(
      `We're currently OPEN until ${extractCloseTime(context.todayHours)}.`
    );
    lines.push("");
    lines.push("I can help you right now with:");
    lines.push("• Screen repair pricing (iPhone, Samsung, etc.)");
    lines.push("• Battery replacement quotes");
    lines.push("• Booking you in for today or tomorrow");
    lines.push("• Any device repair questions");
    lines.push("");
    lines.push("Just text back with what you need, or call us back!");
  }
  // CURRENTLY CLOSED
  else {
    lines.push(
      `We're currently CLOSED. ${
        context.nextOpenTime
          ? `We'll be open ${context.nextOpenTime}.`
          : "Check our hours below."
      }`
    );
    lines.push("");
    lines.push("I can help you right now with:");
    lines.push("• Repair quotes (screen, battery, etc.)");
    lines.push("• Booking you in");
    lines.push("• Questions about our services");
    lines.push("");
    lines.push("Just text back and I'll get you sorted!");
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
```

## Benefits

✅ **Clear expectations** - Customer knows immediately if you're open/closed
✅ **No false hope** - Holiday closures mentioned upfront
✅ **Specific prompts** - Lists exact services (screen, battery, booking)
✅ **Next opening time** - Customer knows when to expect response
✅ **Google Maps link** - Can check live hours and find location
✅ **Holiday personality** - Warm, festive tone for Christmas/New Year
✅ **Encourages engagement** - Specific examples make it easier to respond

## Testing Scenarios

1. **Call during business hours** → "We're OPEN until 5:00 PM"
2. **Call after hours (weekday)** → "CLOSED. Open tomorrow at 10:00 AM"
3. **Call on Saturday evening** → "CLOSED. Open Monday at 10:00 AM"
4. **Call during Christmas** → "🎄 Closed Dec 25-26, back Dec 27th"
5. **Call during New Year** → "Happy New Year! Closed Jan 1st, back Jan 2nd"

## Cost Impact

**No additional cost!**

- Business hours check: Database query (free)
- Holiday detection: Regex (free)
- Message generation: String concatenation (free)

## Files to Modify

1. `/app/api/messages/missed-call/route.ts` - Main logic
2. `/app/lib/holiday-mode-detector.ts` - Export helper functions
3. `/lib/business-hours.ts` - Already has everything we need

## Implementation Time

~30 minutes to implement and test all scenarios.
