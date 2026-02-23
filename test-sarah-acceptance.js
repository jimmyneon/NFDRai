/**
 * Test if Sarah's message would be detected as quote acceptance
 */

function detectQuoteAcceptance(message) {
  const lowerMessage = message.toLowerCase().trim();

  // High confidence acceptance patterns
  const highConfidencePatterns = [
    /^yes\s*please$/i,
    /^yes$/i,
    /^yeah$/i,
    /^yep$/i,
    /^sure$/i,
    /^ok$/i,
    /^okay$/i,
    /^please\s+go\s+ahead$/i,
    /^please\s+book\s+(me\s+)?in$/i,
    /go\s+ahead/i,
    /proceed/i,
    /book\s+(it\s+)?in/i,
    /book\s+me\s+in/i,
    /get\s+it\s+booked/i,
    /let'?s\s+do\s+it/i,
    /i'?ll\s+take\s+it/i,
    /sounds\s+good/i,
    /that'?s\s+fine/i,
    /accept/i,
    /confirmed?/i,
    /i\s+want\s+to\s+(go\s+ahead|proceed|book)/i,
    /when\s+can\s+(i\s+)?(drop\s+it\s+off|bring\s+it\s+in)/i,
    /i'?ll\s+bring\s+it\s+in/i,
    /i'?ll\s+drop\s+it\s+off/i,
    /yes\s+i\s+want/i,
    /yes\s+i'?d\s+like/i,
  ];

  // Check high confidence patterns
  for (const pattern of highConfidencePatterns) {
    if (pattern.test(lowerMessage)) {
      return {
        isAcceptance: true,
        confidence: 0.9,
        needsConfirmation: false,
        matchedPattern: pattern.toString(),
      };
    }
  }

  return {
    isAcceptance: false,
    confidence: 0,
    needsConfirmation: false,
    matchedPattern: null,
  };
}

// Test Sarah's actual message
const sarahMessage = "Thanks John. It is a pixel 6a Yes to battery replacement, pls go ahead";

console.log("Testing Sarah's message:");
console.log(`Message: "${sarahMessage}"`);
console.log("");

const result = detectQuoteAcceptance(sarahMessage);

console.log("Detection Result:");
console.log(`  isAcceptance: ${result.isAcceptance}`);
console.log(`  confidence: ${result.confidence}`);
console.log(`  needsConfirmation: ${result.needsConfirmation}`);
console.log(`  matchedPattern: ${result.matchedPattern}`);
console.log("");

if (result.isAcceptance) {
  console.log("✅ DETECTED - Quote acceptance found!");
  console.log(`   Pattern matched: ${result.matchedPattern}`);
} else {
  console.log("❌ NOT DETECTED - No acceptance pattern matched");
  console.log("");
  console.log("Checking what patterns might match:");
  
  // Check individual parts
  const parts = [
    "go ahead",
    "yes to battery replacement",
    "pls go ahead",
  ];
  
  parts.forEach(part => {
    const partResult = detectQuoteAcceptance(part);
    if (partResult.isAcceptance) {
      console.log(`  ✅ "${part}" would match: ${partResult.matchedPattern}`);
    } else {
      console.log(`  ❌ "${part}" would NOT match`);
    }
  });
}

console.log("");
console.log("ISSUE:");
console.log("The message contains 'go ahead' which should match /go\\s+ahead/i");
console.log("But it's in the middle of a longer message with other text.");
console.log("");
console.log("The pattern /go\\s+ahead/i should match anywhere in the message,");
console.log("not just at the start (no ^ anchor), so this SHOULD work.");
console.log("");

// Double check the pattern
const goAheadPattern = /go\s+ahead/i;
console.log("Direct pattern test:");
console.log(`  Pattern: ${goAheadPattern}`);
console.log(`  Test result: ${goAheadPattern.test(sarahMessage)}`);
console.log(`  Match: ${sarahMessage.match(goAheadPattern)}`);
