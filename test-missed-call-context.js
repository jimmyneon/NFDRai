/**
 * Test Context-Aware Missed Call Messages
 * Tests all scenarios: open, closed, weekend, holiday
 */

// Mock business hours scenarios
const scenarios = [
  {
    name: "Currently OPEN",
    hoursStatus: {
      isOpen: true,
      currentTime: "14:30",
      todayHours: "10:00 AM - 5:00 PM",
      nextOpenTime: null,
      googleMapsUrl: "https://maps.google.com/example",
      specialHoursNote: null,
    },
    expectedIncludes: [
      "currently OPEN until 5:00 PM",
      "Screen repair pricing",
      "Battery replacement quotes",
      "Booking you in for today or tomorrow",
      "call us back",
    ],
  },
  {
    name: "Currently CLOSED (weekday)",
    hoursStatus: {
      isOpen: false,
      currentTime: "19:30",
      todayHours: "Closed",
      nextOpenTime: "Tomorrow (Tuesday) at 10:00 AM",
      googleMapsUrl: "https://maps.google.com/example",
      specialHoursNote: null,
    },
    expectedIncludes: [
      "currently CLOSED",
      "open Tomorrow (Tuesday) at 10:00 AM",
      "Repair quotes",
      "Booking you in",
      "Live hours",
    ],
  },
  {
    name: "Currently CLOSED (weekend)",
    hoursStatus: {
      isOpen: false,
      currentTime: "15:00",
      todayHours: "Closed",
      nextOpenTime: "Monday at 10:00 AM",
      googleMapsUrl: "https://maps.google.com/example",
      specialHoursNote: null,
    },
    expectedIncludes: [
      "currently CLOSED",
      "open Monday at 10:00 AM",
      "Repair quotes",
      "Live hours",
    ],
  },
  {
    name: "HOLIDAY - Christmas",
    hoursStatus: {
      isOpen: false,
      currentTime: "12:00",
      todayHours: "Closed",
      nextOpenTime: "December 27th at 10:00 AM",
      googleMapsUrl: "https://maps.google.com/example",
      specialHoursNote:
        "Closed December 25-26 for Christmas, back on December 27th",
    },
    expectedIncludes: [
      "🎄 Merry Christmas!",
      "Closed December 25-26 for Christmas",
      "back December 27th",
      "repair estimates",
      "John will confirm",
    ],
  },
  {
    name: "HOLIDAY - New Year",
    hoursStatus: {
      isOpen: false,
      currentTime: "12:00",
      todayHours: "Closed",
      nextOpenTime: "January 2nd at 10:00 AM",
      googleMapsUrl: "https://maps.google.com/example",
      specialHoursNote: "Closed for New Year, reopening January 2nd",
    },
    expectedIncludes: [
      "🎉 Happy New Year!",
      "Closed for New Year",
      "January 2nd",
      "repair estimates",
      "John will confirm",
    ],
  },
  {
    name: "HOLIDAY - Easter",
    hoursStatus: {
      isOpen: false,
      currentTime: "12:00",
      todayHours: "Closed",
      nextOpenTime: "Tuesday at 10:00 AM",
      googleMapsUrl: "https://maps.google.com/example",
      specialHoursNote: "Closed for Easter Monday",
    },
    expectedIncludes: [
      "🐰 Happy Easter!",
      "Closed for Easter",
      "repair estimates",
      "John will confirm",
    ],
  },
  {
    name: "OPEN with no Google Maps link",
    hoursStatus: {
      isOpen: true,
      currentTime: "11:00",
      todayHours: "10:00 AM - 5:00 PM",
      nextOpenTime: null,
      googleMapsUrl: null,
      specialHoursNote: null,
    },
    expectedIncludes: [
      "currently OPEN until 5:00 PM",
      "Screen repair pricing",
      "Many thanks, AI Steve",
    ],
    expectedNotIncludes: ["Live hours:"],
  },
];

// Mock the detectHolidayMode function
function detectHolidayMode(specialHoursNote) {
  if (!specialHoursNote) {
    return {
      isOnHoliday: false,
      holidayMessage: null,
      returnDate: null,
    };
  }

  const lower = specialHoursNote.toLowerCase();
  const isHoliday = lower.includes("closed") || lower.includes("holiday");

  // Extract return date
  let returnDate = null;
  const returnMatch = specialHoursNote.match(
    /back on ([A-Za-z]+ \d{1,2}(?:st|nd|rd|th)?)|reopening ([A-Za-z]+ \d{1,2}(?:st|nd|rd|th)?)/i
  );
  if (returnMatch) {
    returnDate = returnMatch[1] || returnMatch[2];
  }

  return {
    isOnHoliday: isHoliday,
    holidayMessage: specialHoursNote,
    returnDate: returnDate,
  };
}

// Mock the generateMissedCallMessage function
function generateMissedCallMessage(context) {
  const lines = ["Sorry we missed your call!", ""];

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
    if (context.nextOpenTime) {
      lines.push(
        `We're currently CLOSED. We'll be open ${context.nextOpenTime}.`
      );
    } else {
      lines.push(`We're currently CLOSED. ${context.todayHours}`);
    }
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

function extractCloseTime(hoursString) {
  const match = hoursString.match(/-(\s*\d{1,2}:\d{2}\s*[AP]M)/i);
  return match ? match[1].trim() : hoursString;
}

function getHolidayGreeting(holidayMessage) {
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

// Run tests
console.log("🧪 Testing Context-Aware Missed Call Messages\n");

let passed = 0;
let failed = 0;

scenarios.forEach((scenario, index) => {
  console.log(`\n📋 Test ${index + 1}: ${scenario.name}`);
  console.log("─".repeat(60));

  // Detect holiday mode
  const holidayStatus = detectHolidayMode(
    scenario.hoursStatus.specialHoursNote
  );

  // Generate message
  const message = generateMissedCallMessage({
    ...scenario.hoursStatus,
    holidayStatus,
  });

  console.log("\n📨 Generated Message:");
  console.log(message);
  console.log("\n");

  // Check expected includes
  let testPassed = true;
  const errors = [];

  if (scenario.expectedIncludes) {
    scenario.expectedIncludes.forEach((expected) => {
      if (!message.includes(expected)) {
        testPassed = false;
        errors.push(`❌ Missing: "${expected}"`);
      } else {
        console.log(`✅ Contains: "${expected}"`);
      }
    });
  }

  if (scenario.expectedNotIncludes) {
    scenario.expectedNotIncludes.forEach((notExpected) => {
      if (message.includes(notExpected)) {
        testPassed = false;
        errors.push(`❌ Should not contain: "${notExpected}"`);
      } else {
        console.log(`✅ Correctly excludes: "${notExpected}"`);
      }
    });
  }

  if (testPassed) {
    console.log(`\n✅ Test ${index + 1} PASSED`);
    passed++;
  } else {
    console.log(`\n❌ Test ${index + 1} FAILED`);
    errors.forEach((err) => console.log(`   ${err}`));
    failed++;
  }
});

console.log("\n" + "=".repeat(60));
console.log(`\n📊 Test Results: ${passed}/${scenarios.length} passed`);
if (failed > 0) {
  console.log(`❌ ${failed} test(s) failed`);
  process.exit(1);
} else {
  console.log("✅ All tests passed!");
  process.exit(0);
}
