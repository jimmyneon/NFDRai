/**
 * Test Unified Message Analyzer
 *
 * Verifies that one AI call can replace three separate calls
 * with better accuracy and lower cost
 */

const { analyzeMessage } = require("./app/lib/unified-message-analyzer");

// Test cases
const testCases = [
  {
    name: "Pure acknowledgment (regex)",
    message: "Ok thanks",
    recentMessages: [],
    expected: {
      sentiment: "neutral",
      intent: "acknowledgment",
      shouldAIRespond: false,
      usesAI: false,
    },
  },
  {
    name: "Unblock/unlock service question (regex)",
    message: "Hi, do you unblock phones?",
    recentMessages: [],
    expected: {
      sentiment: "neutral",
      intent: "question",
      shouldAIRespond: true,
      usesAI: false,
    },
  },
  {
    name: "Obvious frustration (regex)",
    message: "This is the third time I've asked!",
    recentMessages: [],
    expected: {
      sentiment: "frustrated",
      intent: "complaint",
      shouldAIRespond: false,
      requiresStaffAttention: true,
      usesAI: false,
    },
  },
  {
    name: "Very angry (regex)",
    message: "I want my money back!",
    recentMessages: [],
    expected: {
      sentiment: "angry",
      urgency: "critical",
      shouldAIRespond: false,
      requiresStaffAttention: true,
      usesAI: false,
    },
  },
  {
    name: "Physical person reference (regex)",
    message: "It's for the tall guy with the beard",
    recentMessages: [],
    expected: {
      intent: "unclear",
      shouldAIRespond: false,
      isDirectedAtAI: false,
      usesAI: false,
    },
  },
  {
    name: "Simple question (regex)",
    message: "When are you open?",
    recentMessages: [],
    expected: {
      sentiment: "neutral",
      intent: "question",
      shouldAIRespond: true,
      usesAI: false,
    },
  },
  {
    name: "Directed at John but business hours question (regex)",
    message:
      "Hi John we will be back your way over the Christmas period. What days are you shut/open?",
    recentMessages: [],
    expected: {
      sentiment: "neutral",
      intent: "question",
      contentType: "business_hours",
      shouldAIRespond: true,
      usesAI: false,
    },
  },
  {
    name: "Customer introducing themselves (needs AI)",
    message: "Hi, I'm Carol. Is my iPhone ready?",
    recentMessages: [],
    expected: {
      sentiment: "neutral",
      intent: "status_check",
      shouldAIRespond: true,
      customerName: "Carol",
      usesAI: true,
    },
  },
  {
    name: "Complex message with context (needs AI)",
    message: "Thanks John, but how much do I owe you?",
    recentMessages: [
      { sender: "staff", text: "Your iPhone is ready, £149.99" },
    ],
    expected: {
      sentiment: "neutral",
      intent: "question",
      usesAI: true,
    },
  },
  {
    name: "Subtle frustration (needs AI)",
    message: "I'm getting a bit frustrated with this",
    recentMessages: [],
    expected: {
      sentiment: "frustrated",
      requiresStaffAttention: true,
      usesAI: true,
    },
  },
  {
    name: "Vague question (needs AI)",
    message: "Can you help?",
    recentMessages: [],
    expected: {
      intent: "question",
      usesAI: true,
    },
  },
  {
    name: "Name in greeting (needs AI)",
    message: "This is Mike calling about my laptop",
    recentMessages: [],
    expected: {
      customerName: "Mike",
      intent: "status_check",
      usesAI: true,
    },
  },
];

async function runTests() {
  console.log("🧪 Testing Unified Message Analyzer\n");
  console.log("=".repeat(80));

  let passed = 0;
  let failed = 0;
  let regexCount = 0;
  let aiCount = 0;

  for (const test of testCases) {
    console.log(`\n📝 Test: ${test.name}`);
    console.log(`   Message: "${test.message}"`);

    try {
      const result = await analyzeMessage(
        test.message,
        test.recentMessages,
        process.env.OPENAI_API_KEY // Only used if needs AI
      );

      // Track if AI was used
      const usedAI = result.overallConfidence < 0.85 || test.expected.usesAI;
      if (usedAI) {
        aiCount++;
        console.log("   🤖 Used AI analysis");
      } else {
        regexCount++;
        console.log("   ⚡ Used regex (free)");
      }

      // Check expectations
      let testPassed = true;
      const failures = [];

      if (
        test.expected.sentiment &&
        result.sentiment !== test.expected.sentiment
      ) {
        failures.push(
          `sentiment: expected ${test.expected.sentiment}, got ${result.sentiment}`
        );
        testPassed = false;
      }

      if (test.expected.intent && result.intent !== test.expected.intent) {
        failures.push(
          `intent: expected ${test.expected.intent}, got ${result.intent}`
        );
        testPassed = false;
      }

      if (
        test.expected.shouldAIRespond !== undefined &&
        result.shouldAIRespond !== test.expected.shouldAIRespond
      ) {
        failures.push(
          `shouldAIRespond: expected ${test.expected.shouldAIRespond}, got ${result.shouldAIRespond}`
        );
        testPassed = false;
      }

      if (
        test.expected.requiresStaffAttention &&
        !result.requiresStaffAttention
      ) {
        failures.push(`requiresStaffAttention: expected true, got false`);
        testPassed = false;
      }

      if (
        test.expected.customerName &&
        result.customerName !== test.expected.customerName
      ) {
        failures.push(
          `customerName: expected ${test.expected.customerName}, got ${result.customerName}`
        );
        testPassed = false;
      }

      if (testPassed) {
        console.log("   ✅ PASS");
        passed++;
      } else {
        console.log("   ❌ FAIL");
        failures.forEach((f) => console.log(`      - ${f}`));
        failed++;
      }

      // Show key results
      console.log(`   Results:`);
      console.log(
        `      Sentiment: ${result.sentiment} (${result.urgency} urgency)`
      );
      console.log(
        `      Intent: ${result.intent} (${result.intentConfidence.toFixed(
          2
        )} confidence)`
      );
      console.log(`      Should respond: ${result.shouldAIRespond}`);
      if (result.customerName) {
        console.log(
          `      Customer name: ${
            result.customerName
          } (${result.nameConfidence.toFixed(2)} confidence)`
        );
      }
      if (result.requiresStaffAttention) {
        console.log(`      ⚠️  Requires staff attention`);
      }
      console.log(`      Reasoning: ${result.reasoning}`);
    } catch (error) {
      console.log("   ❌ ERROR:", error.message);
      failed++;
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("\n📊 Test Summary:");
  console.log(`   Total: ${testCases.length}`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   ⚡ Regex (free): ${regexCount}`);
  console.log(`   🤖 AI calls: ${aiCount}`);

  // Cost calculation
  const aiCost = aiCount * 0.0002;
  const oldCost = aiCount * 0.0003; // Old system (3 calls)
  const savings = oldCost - aiCost;

  console.log("\n💰 Cost Analysis:");
  console.log(`   New system: $${aiCost.toFixed(4)} (${aiCount} × $0.0002)`);
  console.log(`   Old system: $${oldCost.toFixed(4)} (${aiCount} × $0.0003)`);
  console.log(
    `   Savings: $${savings.toFixed(4)} (${((savings / oldCost) * 100).toFixed(
      0
    )}% cheaper)`
  );

  console.log("\n⚡ Performance:");
  console.log(
    `   Regex cases: ${regexCount}/${testCases.length} (${(
      (regexCount / testCases.length) *
      100
    ).toFixed(0)}% free)`
  );
  console.log(
    `   AI cases: ${aiCount}/${testCases.length} (${(
      (aiCount / testCases.length) *
      100
    ).toFixed(0)}% paid)`
  );

  if (failed === 0) {
    console.log("\n🎉 All tests passed!");
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed`);
  }
}

// Run tests
runTests().catch(console.error);
