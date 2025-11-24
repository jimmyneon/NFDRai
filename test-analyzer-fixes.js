/**
 * Test Enhanced Unified Analyzer - Payment Reminders & Direct Messages
 */

// Import the functions (mock for testing)
function isAutoresponder(message, phoneNumber) {
  const lowerMessage = message.toLowerCase();

  // Banking/financial patterns
  if (/card\s+ending\s+(in\s+)?\d{4}/i.test(message)) return true;
  if (/payment\s+(reminder|due|overdue)/i.test(lowerMessage)) return true;
  if (/minimum\s+payment/i.test(lowerMessage)) return true;
  if (/reply\s+yes\s+to\s+pay/i.test(lowerMessage)) return true;
  if (/debit\s+card\s+ending/i.test(lowerMessage)) return true;
  if (/vanquis/i.test(lowerMessage)) return true;
  if (/barclaycard/i.test(lowerMessage)) return true;

  return false;
}

function quickAnalysis(message, recentMessages) {
  const lowerMessage = message.toLowerCase().trim();

  // Physical person patterns
  const physicalPersonPatterns = [
    // Direct address to John
    /^(hi|hey|hello|h)\s+john/i,
    /john[,:]\s+/i,
    /^john\s/i,

    // Location/meeting context
    /(i'm|im)\s+(at|in)\s+(the\s+)?(airport|arrivals|departures|terminal|station)/i,
    /(waiting|here)\s+(at|in)\s+(the\s+)?(airport|arrivals|car\s+park)/i,
    /border\s+control/i,
    /just\s+(landed|arrived)/i,
  ];

  for (const pattern of physicalPersonPatterns) {
    if (pattern.test(message)) {
      return {
        shouldAIRespond: false,
        reasoning: "Message directed at John or physical person - not for AI",
        intent: "unclear",
        sentiment: "neutral",
      };
    }
  }

  return null; // Needs AI analysis
}

// Test cases
const testCases = [
  {
    name: "Payment Reminder - Vanquis",
    message:
      "PAYMENT REMINDER: Vanquis card ending 1562. If not already paid, the minimum payment of £65.43 is due to reach us by 28/11/2025. To pay this amount using debit card ending 0204, reply Yes.",
    phoneNumber: "+447123456789",
    expectedAutoresponder: true,
    expectedShouldRespond: false,
    reason: "Payment reminder with card details",
  },
  {
    name: "Direct message to John - Airport",
    message: "H John, I'm in the arrivals hall. JB",
    phoneNumber: "+447123456789",
    expectedAutoresponder: false,
    expectedShouldRespond: false,
    reason: "Direct address to John with location context",
  },
  {
    name: "Border control message",
    message:
      "Hi there James. We're just at border control now in Bournemouth... Shouldn't be too long. Many thanks John",
    phoneNumber: "+447123456789",
    expectedAutoresponder: false,
    expectedShouldRespond: false,
    reason: 'Contains "border control" - physical meeting context',
  },
  {
    name: 'Direct "Hi John" greeting',
    message: "Hi John, are you available?",
    phoneNumber: "+447123456789",
    expectedAutoresponder: false,
    expectedShouldRespond: false,
    reason: 'Starts with "Hi John" - directed at person',
  },
  {
    name: 'Short "H John" greeting',
    message: "H John, I'm here",
    phoneNumber: "+447123456789",
    expectedAutoresponder: false,
    expectedShouldRespond: false,
    reason: 'Starts with "H John" - directed at person',
  },
  {
    name: "Airport arrivals",
    message: "I'm at the airport arrivals waiting for you",
    phoneNumber: "+447123456789",
    expectedAutoresponder: false,
    expectedShouldRespond: false,
    reason: "Airport/arrivals context - physical meeting",
  },
  {
    name: "Normal repair question",
    message: "How much for iPhone screen repair?",
    phoneNumber: "+447123456789",
    expectedAutoresponder: false,
    expectedShouldRespond: true,
    reason: "Legitimate repair question - AI should respond",
  },
  {
    name: "Business hours question",
    message: "When are you open?",
    phoneNumber: "+447123456789",
    expectedAutoresponder: false,
    expectedShouldRespond: true,
    reason: "Simple question - AI should respond",
  },
  {
    name: "Payment reminder - Barclaycard",
    message:
      "Barclaycard: Your minimum payment of £45.00 is due. Reply YES to pay with card ending 1234.",
    phoneNumber: "+447123456789",
    expectedAutoresponder: true,
    expectedShouldRespond: false,
    reason: "Barclaycard payment reminder",
  },
  {
    name: "Delivery notification",
    message: "Your parcel is out for delivery today",
    phoneNumber: "DPD",
    expectedAutoresponder: true,
    expectedShouldRespond: false,
    reason: "Delivery notification from short code",
  },
];

// Run tests
console.log("🧪 Testing Enhanced Unified Analyzer\n");
console.log("=".repeat(70));

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  console.log(`\n📋 Test ${index + 1}: ${test.name}`);
  console.log("─".repeat(70));
  console.log(
    `Message: "${test.message.substring(0, 80)}${
      test.message.length > 80 ? "..." : ""
    }"`
  );
  console.log(`Phone: ${test.phoneNumber}`);
  console.log("");

  // Test autoresponder detection
  const isAuto = isAutoresponder(test.message, test.phoneNumber);
  const autoMatch = isAuto === test.expectedAutoresponder;

  console.log(
    `Autoresponder: ${isAuto ? "✅ YES" : "❌ NO"} (expected: ${
      test.expectedAutoresponder ? "YES" : "NO"
    })`
  );

  if (!autoMatch) {
    console.log(`❌ AUTORESPONDER MISMATCH`);
    failed++;
    return;
  }

  // If autoresponder, skip further analysis
  if (isAuto) {
    console.log(`✅ Correctly identified as autoresponder`);
    console.log(`Reason: ${test.reason}`);
    passed++;
    return;
  }

  // Test quick analysis
  const analysis = quickAnalysis(test.message, []);
  const shouldRespond = analysis ? analysis.shouldAIRespond : true; // null = needs AI = might respond

  const respondMatch = shouldRespond === test.expectedShouldRespond;

  console.log(
    `Should AI Respond: ${shouldRespond ? "✅ YES" : "❌ NO"} (expected: ${
      test.expectedShouldRespond ? "YES" : "NO"
    })`
  );

  if (analysis && !analysis.shouldAIRespond) {
    console.log(`Reasoning: ${analysis.reasoning}`);
  }

  if (autoMatch && respondMatch) {
    console.log(`\n✅ Test ${index + 1} PASSED`);
    console.log(`Reason: ${test.reason}`);
    passed++;
  } else {
    console.log(`\n❌ Test ${index + 1} FAILED`);
    console.log(`Reason: ${test.reason}`);
    failed++;
  }
});

console.log("\n" + "=".repeat(70));
console.log(`\n📊 Test Results: ${passed}/${testCases.length} passed`);

if (failed > 0) {
  console.log(`❌ ${failed} test(s) failed`);
  process.exit(1);
} else {
  console.log("✅ All tests passed!");
  console.log("\n🎉 Unified analyzer now correctly handles:");
  console.log("  ✅ Payment reminders (Vanquis, Barclaycard, etc.)");
  console.log('  ✅ Direct messages to John ("H John", "Hi John")');
  console.log(
    "  ✅ Physical meeting context (airport, arrivals, border control)"
  );
  console.log("  ✅ Legitimate repair questions (still responds)");
  process.exit(0);
}
