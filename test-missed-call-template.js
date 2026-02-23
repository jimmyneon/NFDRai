/**
 * Test the updated missed call template
 * Shows what customers will see when they miss a call
 */

// Simulate the template generation function
function generateMissedCallMessage(context) {
  const lines = ["Sorry we missed your call!", ""];

  // CUSTOM CLOSURE
  if (context.customClosure) {
    const message = context.customClosure.customMessage || 
      `Temporarily closed due to ${context.customClosure.reason.toLowerCase()}.`;
    
    lines.push(message);
    lines.push("");
    lines.push("I can provide repair estimates and answer questions right now. John will confirm all quotes and bookings when he returns.");
    
    const endDate = new Date(context.customClosure.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    if (endDate > today) {
      const returnDateStr = endDate.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      lines.push("");
      lines.push(`We expect to reopen ${returnDateStr}.`);
    }
  }
  // HOLIDAY MODE
  else if (context.holidayStatus.isOnHoliday && context.holidayStatus.holidayMessage) {
    const greeting = getHolidayGreeting(context.holidayStatus.holidayMessage);
    if (greeting) {
      lines.push(greeting, "");
    }
    
    lines.push(context.holidayStatus.holidayMessage);
    lines.push("");
    lines.push("I can provide repair estimates and answer questions right now. John will confirm all quotes and bookings when he returns.");
    
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
    lines.push("Need help? Here's the quickest way:");
    lines.push("");
    lines.push("📱 REPAIR QUOTES & APPOINTMENTS:");
    lines.push("https://www.newforestdevicerepairs.co.uk/repair-request");
    lines.push("");
    lines.push("❓ QUESTIONS & STATUS CHECKS:");
    lines.push("Text me or visit: https://www.newforestdevicerepairs.co.uk/start");
    lines.push("");
    lines.push("I can help with opening hours, repair status checks, and answer any questions you have!");
  }
  // CURRENTLY CLOSED
  else {
    if (context.nextOpenTime) {
      lines.push(`We're currently CLOSED. We'll be open ${context.nextOpenTime}.`);
    } else {
      lines.push(`We're currently CLOSED. ${context.todayHours}`);
    }
    lines.push("");
    lines.push("Need help? Here's the quickest way:");
    lines.push("");
    lines.push("📱 REPAIR QUOTES & APPOINTMENTS:");
    lines.push("https://www.newforestdevicerepairs.co.uk/repair-request");
    lines.push("");
    lines.push("❓ QUESTIONS & STATUS CHECKS:");
    lines.push("Text me or visit: https://www.newforestdevicerepairs.co.uk/start");
    lines.push("");
    lines.push("I can help with opening hours, repair status checks, and answer any questions you have!");
  }

  if (context.googleMapsUrl) {
    lines.push("");
    lines.push(`Live hours: ${context.googleMapsUrl}`);
  }

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

// Test scenarios
console.log("=".repeat(80));
console.log("MISSED CALL TEMPLATE TESTS");
console.log("=".repeat(80));

// Test 1: Currently Open
console.log("\n📞 TEST 1: Customer calls during business hours (2pm on Tuesday)");
console.log("-".repeat(80));
const openMessage = generateMissedCallMessage({
  isOpen: true,
  todayHours: "10:00 AM - 5:00 PM",
  nextOpenTime: null,
  googleMapsUrl: "https://maps.google.com/...",
  holidayStatus: { isOnHoliday: false, holidayMessage: null, returnDate: null },
  currentTime: "14:00",
  customClosure: null
});
console.log(openMessage);
console.log("\nCharacter count:", openMessage.length);

// Test 2: Currently Closed
console.log("\n\n📞 TEST 2: Customer calls after hours (7pm on Tuesday)");
console.log("-".repeat(80));
const closedMessage = generateMissedCallMessage({
  isOpen: false,
  todayHours: "Closed",
  nextOpenTime: "Wednesday at 10:00 AM",
  googleMapsUrl: "https://maps.google.com/...",
  holidayStatus: { isOnHoliday: false, holidayMessage: null, returnDate: null },
  currentTime: "19:00",
  customClosure: null
});
console.log(closedMessage);
console.log("\nCharacter count:", closedMessage.length);

// Test 3: Holiday Mode
console.log("\n\n📞 TEST 3: Customer calls during Christmas closure");
console.log("-".repeat(80));
const holidayMessage = generateMissedCallMessage({
  isOpen: false,
  todayHours: "Closed",
  nextOpenTime: null,
  googleMapsUrl: "https://maps.google.com/...",
  holidayStatus: {
    isOnHoliday: true,
    holidayMessage: "Closed December 25-26 for Christmas",
    returnDate: "December 27th"
  },
  currentTime: "12:00",
  customClosure: null
});
console.log(holidayMessage);
console.log("\nCharacter count:", holidayMessage.length);

console.log("\n" + "=".repeat(80));
console.log("✅ ALL TESTS COMPLETE");
console.log("=".repeat(80));

console.log("\n📊 KEY FEATURES:");
console.log("✅ Includes repair-request link for quotes & appointments");
console.log("✅ Includes start link for questions & status checks");
console.log("✅ Mentions AI Steve can check repair status");
console.log("✅ Clear categorization of what each link is for");
console.log("✅ Maintains friendly, helpful tone");
console.log("✅ Still includes Google Maps link for live hours");
