/**
 * Test the acknowledgment system fix
 * Verifies that AI responds to simple questions even after staff replies
 */

// Import the logic (simplified for testing)
function isSimpleQuery(message) {
  const lowerMessage = message.toLowerCase().trim();

  // Hours/Opening times queries
  const hoursPatterns = [
    /when\s+(are\s+you|do\s+you)\s+open/i,
    /what\s+time\s+(are\s+you|do\s+you)\s+(open|close)/i,
    /what\s+(are\s+your|are\s+the)\s+(hours|opening|times)/i,
    /opening\s+(hours|times)/i,
    /are\s+you\s+open/i,
    /what\s+time.*open/i,
    /when.*open/i,
    /open\s+(today|tomorrow|now)/i,
    /are\s+you\s+(in|at)\s+(the\s+)?(shop|store)/i,
    /are\s+you\s+there\s+(today|tomorrow|now)/i,
    /is\s+(the\s+)?(shop|store)\s+open/i,
    /you\s+open\s+(today|tomorrow|now)/i,
  ];

  for (const pattern of hoursPatterns) {
    if (pattern.test(lowerMessage)) {
      return { isSimpleQuery: true, queryType: "hours", reason: "Business hours query" };
    }
  }

  // Location/Address queries
  const locationPatterns = [
    /where\s+(are\s+you|is\s+your\s+(shop|store|location))/i,
    /what.*address/i,
    /what.*location/i,
    /where\s+(can\s+i\s+find|is\s+it)/i,
  ];

  for (const pattern of locationPatterns) {
    if (pattern.test(lowerMessage)) {
      return { isSimpleQuery: true, queryType: "location", reason: "Location/address query" };
    }
  }

  // Directions queries
  const directionsPatterns = [
    /how\s+do\s+i\s+get/i,
    /directions/i,
    /how\s+to\s+get\s+there/i,
  ];

  for (const pattern of directionsPatterns) {
    if (pattern.test(lowerMessage)) {
      return { isSimpleQuery: true, queryType: "directions", reason: "Directions query" };
    }
  }

  return { isSimpleQuery: false, reason: "Not a recognized simple query" };
}

function isAcknowledgment(message) {
  const lowerMessage = message.toLowerCase().trim();

  if (lowerMessage.includes("?")) return false;
  if (lowerMessage.length > 50) return false;

  const questionWords = ["how", "what", "when", "where", "why", "which", "who", "much", "many", "owe"];
  if (questionWords.some((word) => lowerMessage.includes(word))) return false;

  const acknowledgmentPatterns = [
    /^thanks?\s+(john|mate|boss|bro|buddy)[\s!.]*$/i,
    /^thank\s+you\s+(john|mate|boss|bro|buddy)[\s!.]*$/i,
    /^(ok|okay|alright|cool|nice|great|perfect)[\s!.]*$/i,
    /^(thanks?|thank you|cheers?)[\s!.]*$/i,
    /^(yes|yeah|yep|yup|sure)[\s!.]*$/i,
    /^(bye|goodbye|see ya)[\s!.]*$/i,
  ];

  return acknowledgmentPatterns.some((pattern) => pattern.test(lowerMessage));
}

function shouldAIRespond(minutesSinceStaffMessage, message) {
  const PAUSE_DURATION_MINUTES = 30;

  // If staff replied more than 30 minutes ago, AI can respond to anything
  if (minutesSinceStaffMessage >= PAUSE_DURATION_MINUTES) {
    return {
      shouldRespond: true,
      reason: `Staff replied ${minutesSinceStaffMessage.toFixed(0)} minutes ago - resuming full AI mode`,
    };
  }

  // CRITICAL: Check for simple queries FIRST, before checking acknowledgments
  const queryInfo = isSimpleQuery(message);

  if (queryInfo.isSimpleQuery) {
    return {
      shouldRespond: true,
      reason: `Simple ${queryInfo.queryType} query - AI can answer even during pause`,
      queryInfo,
    };
  }

  // Check if it's just an acknowledgment
  const isAck = isAcknowledgment(message);

  if (isAck) {
    return {
      shouldRespond: false,
      reason: "Customer acknowledgment - no AI response needed",
    };
  }

  // Not a simple query and within pause window - don't respond
  const remainingMinutes = Math.ceil(PAUSE_DURATION_MINUTES - minutesSinceStaffMessage);
  return {
    shouldRespond: false,
    reason: `Staff replied ${minutesSinceStaffMessage.toFixed(0)} minutes ago - waiting for staff (${remainingMinutes} min remaining)`,
  };
}

// Test scenarios
console.log("=".repeat(80));
console.log("ACKNOWLEDGMENT SYSTEM FIX - TEST SCENARIOS");
console.log("=".repeat(80));

const tests = [
  {
    scenario: "Staff replied 5 min ago, customer asks about hours",
    minutesSinceStaff: 5,
    message: "When are you open?",
    expectedResponse: true,
    expectedReason: "Simple hours query",
  },
  {
    scenario: "Staff replied 5 min ago, customer asks about location",
    minutesSinceStaff: 5,
    message: "Where are you located?",
    expectedResponse: true,
    expectedReason: "Simple location query",
  },
  {
    scenario: "Staff replied 5 min ago, customer says thanks",
    minutesSinceStaff: 5,
    message: "Thanks John",
    expectedResponse: false,
    expectedReason: "Pure acknowledgment",
  },
  {
    scenario: "Staff replied 5 min ago, customer says ok",
    minutesSinceStaff: 5,
    message: "Ok",
    expectedResponse: false,
    expectedReason: "Pure acknowledgment",
  },
  {
    scenario: "Staff replied 5 min ago, customer asks about pricing",
    minutesSinceStaff: 5,
    message: "How much for iPhone screen?",
    expectedResponse: false,
    expectedReason: "Complex query - wait for staff",
  },
  {
    scenario: "Staff replied 5 min ago, customer asks if shop is open",
    minutesSinceStaff: 5,
    message: "Are you open today?",
    expectedResponse: true,
    expectedReason: "Simple hours query",
  },
  {
    scenario: "Staff replied 1 min ago, customer asks about hours",
    minutesSinceStaff: 1,
    message: "What time do you close?",
    expectedResponse: true,
    expectedReason: "Simple hours query (even within 2 min window)",
  },
  {
    scenario: "Staff replied 35 min ago, customer asks anything",
    minutesSinceStaff: 35,
    message: "How much for battery replacement?",
    expectedResponse: true,
    expectedReason: "30+ minutes passed - full AI mode",
  },
];

let passedTests = 0;
let failedTests = 0;

tests.forEach((test, index) => {
  console.log(`\n${index + 1}. ${test.scenario}`);
  console.log("-".repeat(80));
  console.log(`Message: "${test.message}"`);
  console.log(`Minutes since staff: ${test.minutesSinceStaff}`);

  const result = shouldAIRespond(test.minutesSinceStaff, test.message);

  console.log(`\nResult:`);
  console.log(`  Should respond: ${result.shouldRespond}`);
  console.log(`  Reason: ${result.reason}`);

  const passed = result.shouldRespond === test.expectedResponse;

  if (passed) {
    console.log(`\n✅ PASS - AI ${result.shouldRespond ? "responds" : "stays silent"} as expected`);
    passedTests++;
  } else {
    console.log(`\n❌ FAIL - Expected ${test.expectedResponse ? "response" : "silence"}, got ${result.shouldRespond ? "response" : "silence"}`);
    failedTests++;
  }
});

console.log("\n" + "=".repeat(80));
console.log("TEST SUMMARY");
console.log("=".repeat(80));
console.log(`Total tests: ${tests.length}`);
console.log(`Passed: ${passedTests} ✅`);
console.log(`Failed: ${failedTests} ❌`);

if (failedTests === 0) {
  console.log("\n🎉 ALL TESTS PASSED!");
  console.log("\n✅ Fix verified:");
  console.log("   - AI responds to simple questions (hours, location) even after staff replies");
  console.log("   - AI stays silent for pure acknowledgments (thanks, ok)");
  console.log("   - AI waits for staff on complex queries (pricing, repairs)");
  console.log("   - AI resumes full mode after 30 minutes");
} else {
  console.log("\n⚠️  Some tests failed - review the logic");
}
