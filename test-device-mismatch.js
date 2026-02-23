/**
 * Test device mismatch detection
 */

function extractDeviceModel(message) {
  const lowerMessage = message.toLowerCase();

  const patterns = [
    /iphone\s*(\d+\s*(?:pro|plus|max|mini)?(?:\s*[a-z])?)/i,
    /iphone\s*([xr|xs|se])/i,
    /samsung\s*(?:galaxy\s*)?([a-z]\d+[a-z]?)/i,
    /galaxy\s*([a-z]\d+[a-z]?)/i,
    /pixel\s*(\d+[a-z]?(?:\s*(?:pro|xl))?)/i,
    /(?:it'?s\s+a\s+)([a-z]+\s*\d+[a-z]?)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1].trim().toLowerCase();
    }
  }

  return null;
}

function detectDeviceMismatch(message, quotedDeviceModel) {
  const mentionedModel = extractDeviceModel(message);

  if (!mentionedModel) {
    return {
      hasMismatch: false,
      mentionedModel: null,
      quotedModel: quotedDeviceModel,
      confidence: 0,
    };
  }

  const normalizedQuoted = quotedDeviceModel.toLowerCase().trim();
  const normalizedMentioned = mentionedModel.toLowerCase().trim();

  const isDifferent = !normalizedQuoted.includes(normalizedMentioned) &&
                      !normalizedMentioned.includes(normalizedQuoted);

  return {
    hasMismatch: isDifferent,
    mentionedModel,
    quotedModel: quotedDeviceModel,
    confidence: isDifferent ? 0.9 : 0,
  };
}

console.log("=".repeat(80));
console.log("DEVICE MISMATCH DETECTION TESTS");
console.log("=".repeat(80));

const tests = [
  {
    name: "Sarah's case: Pixel 6 vs 6a",
    message: "Thanks John. It is a pixel 6a Yes to battery replacement, pls go ahead",
    quotedModel: "Pixel 6",
    expectedMismatch: true,
  },
  {
    name: "Exact match: Pixel 6",
    message: "Yes please go ahead with the Pixel 6",
    quotedModel: "Pixel 6",
    expectedMismatch: false,
  },
  {
    name: "iPhone 12 vs 12 Pro",
    message: "Actually it's an iPhone 12 Pro",
    quotedModel: "iPhone 12",
    expectedMismatch: true,
  },
  {
    name: "iPhone 13 exact match",
    message: "Yes for the iPhone 13",
    quotedModel: "iPhone 13",
    expectedMismatch: false,
  },
  {
    name: "Samsung S21 vs S21+",
    message: "It's actually an S21+",
    quotedModel: "S21",
    expectedMismatch: true,
  },
  {
    name: "No device mentioned",
    message: "Yes please go ahead",
    quotedModel: "iPhone 12",
    expectedMismatch: false,
  },
];

let passed = 0;
let failed = 0;

tests.forEach((test, index) => {
  console.log(`\n${index + 1}. ${test.name}`);
  console.log("-".repeat(80));
  console.log(`Message: "${test.message}"`);
  console.log(`Quoted model: "${test.quotedModel}"`);

  const result = detectDeviceMismatch(test.message, test.quotedModel);

  console.log(`\nResult:`);
  console.log(`  Mentioned model: ${result.mentionedModel || "none"}`);
  console.log(`  Has mismatch: ${result.hasMismatch}`);
  console.log(`  Confidence: ${result.confidence}`);

  const testPassed = result.hasMismatch === test.expectedMismatch;

  if (testPassed) {
    console.log(`\n✅ PASS`);
    passed++;
  } else {
    console.log(`\n❌ FAIL - Expected mismatch: ${test.expectedMismatch}, got: ${result.hasMismatch}`);
    failed++;
  }
});

console.log("\n" + "=".repeat(80));
console.log("TEST SUMMARY");
console.log("=".repeat(80));
console.log(`Total: ${tests.length}`);
console.log(`Passed: ${passed} ✅`);
console.log(`Failed: ${failed} ❌`);

if (failed === 0) {
  console.log("\n🎉 ALL TESTS PASSED!");
  console.log("\nDevice mismatch detection working correctly:");
  console.log("  ✅ Detects Pixel 6 vs 6a");
  console.log("  ✅ Detects iPhone model variations");
  console.log("  ✅ Detects Samsung model variations");
  console.log("  ✅ Ignores messages without device mentions");
  console.log("  ✅ Correctly identifies exact matches");
}
