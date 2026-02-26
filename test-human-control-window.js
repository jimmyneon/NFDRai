/**
 * Test suite for Human Control Window system
 * Tests intent classification, control window logic, and manual overrides
 */

const { classifyIntent, shouldAIRespondWithIntent } = require('./app/lib/intent-classifier');

// Test colors
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`${GREEN}✓${RESET} ${name}`);
    passCount++;
  } catch (error) {
    console.log(`${RED}✗${RESET} ${name}`);
    console.log(`  ${RED}${error.message}${RESET}`);
    failCount++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

console.log('\n=== INTENT CLASSIFICATION TESTS ===\n');

// SAFE_FAQ Tests
test('Classifies "when are you open?" as SAFE_FAQ', () => {
  const result = classifyIntent("when are you open?");
  assert(result.intent === 'SAFE_FAQ', `Expected SAFE_FAQ, got ${result.intent}`);
  assert(result.allowAIDuringHumanControl === true, 'Should allow AI during control');
});

test('Classifies "what time do you close?" as SAFE_FAQ', () => {
  const result = classifyIntent("what time do you close?");
  assert(result.intent === 'SAFE_FAQ', `Expected SAFE_FAQ, got ${result.intent}`);
  assert(result.allowAIDuringHumanControl === true, 'Should allow AI during control');
});

test('Classifies "where are you located?" as SAFE_FAQ', () => {
  const result = classifyIntent("where are you located?");
  assert(result.intent === 'SAFE_FAQ', `Expected SAFE_FAQ, got ${result.intent}`);
  assert(result.allowAIDuringHumanControl === true, 'Should allow AI during control');
});

test('Classifies "is there parking?" as SAFE_FAQ', () => {
  const result = classifyIntent("is there parking?");
  assert(result.intent === 'SAFE_FAQ', `Expected SAFE_FAQ, got ${result.intent}`);
  assert(result.allowAIDuringHumanControl === true, 'Should allow AI during control');
});

test('Classifies "how do I book?" as SAFE_FAQ', () => {
  const result = classifyIntent("how do I book?");
  assert(result.intent === 'SAFE_FAQ', `Expected SAFE_FAQ, got ${result.intent}`);
  assert(result.allowAIDuringHumanControl === true, 'Should allow AI during control');
});

// CONTEXTUAL_QUERY / JOB_SPECIFIC Tests
test('Classifies "how much for iPhone screen?" as JOB_SPECIFIC', () => {
  const result = classifyIntent("how much for iPhone screen?");
  assert(result.intent === 'JOB_SPECIFIC', `Expected JOB_SPECIFIC, got ${result.intent}`);
  assert(result.allowAIDuringHumanControl === false, 'Should NOT allow AI during control');
});

test('Classifies "is my phone ready?" as JOB_SPECIFIC', () => {
  const result = classifyIntent("is my phone ready?");
  assert(result.intent === 'JOB_SPECIFIC', `Expected JOB_SPECIFIC, got ${result.intent}`);
  assert(result.allowAIDuringHumanControl === false, 'Should NOT allow AI during control');
});

test('Classifies "can you fix my laptop?" as CONTEXTUAL_QUERY', () => {
  const result = classifyIntent("can you fix my laptop?");
  assert(result.intent === 'CONTEXTUAL_QUERY', `Expected CONTEXTUAL_QUERY, got ${result.intent}`);
  assert(result.allowAIDuringHumanControl === false, 'Should NOT allow AI during control');
});

test('Classifies "can I book in tomorrow?" as CONTEXTUAL_QUERY', () => {
  const result = classifyIntent("can I book in tomorrow?");
  assert(result.intent === 'CONTEXTUAL_QUERY', `Expected CONTEXTUAL_QUERY, got ${result.intent}`);
  assert(result.allowAIDuringHumanControl === false, 'Should NOT allow AI during control');
});

// ACKNOWLEDGMENT Tests
test('Classifies "thanks" as ACKNOWLEDGMENT', () => {
  const result = classifyIntent("thanks");
  assert(result.intent === 'ACKNOWLEDGMENT', `Expected ACKNOWLEDGMENT, got ${result.intent}`);
  assert(result.allowAIDuringHumanControl === false, 'Should NOT respond to acknowledgments');
});

test('Classifies "ok" as ACKNOWLEDGMENT', () => {
  const result = classifyIntent("ok");
  assert(result.intent === 'ACKNOWLEDGMENT', `Expected ACKNOWLEDGMENT, got ${result.intent}`);
  assert(result.allowAIDuringHumanControl === false, 'Should NOT respond to acknowledgments');
});

test('Classifies "see you soon" as ACKNOWLEDGMENT', () => {
  const result = classifyIntent("see you soon");
  assert(result.intent === 'ACKNOWLEDGMENT', `Expected ACKNOWLEDGMENT, got ${result.intent}`);
  assert(result.allowAIDuringHumanControl === false, 'Should NOT respond to acknowledgments');
});

// COMPLAINT Tests
test('Classifies "this is ridiculous" as COMPLAINT', () => {
  const result = classifyIntent("this is ridiculous");
  assert(result.intent === 'COMPLAINT', `Expected COMPLAINT, got ${result.intent}`);
  assert(result.allowAIDuringHumanControl === false, 'Should NOT allow AI during control');
});

test('Classifies "AI failure" as COMPLAINT', () => {
  const result = classifyIntent("AI failure");
  assert(result.intent === 'COMPLAINT', `Expected COMPLAINT, got ${result.intent}`);
  assert(result.allowAIDuringHumanControl === false, 'Should NOT allow AI during control');
});

test('Classifies "speak to a human" as COMPLAINT', () => {
  const result = classifyIntent("speak to a human");
  assert(result.intent === 'COMPLAINT', `Expected COMPLAINT, got ${result.intent}`);
  assert(result.allowAIDuringHumanControl === false, 'Should NOT allow AI during control');
});

console.log('\n=== HUMAN CONTROL WINDOW LOGIC TESTS ===\n');

// Test shouldAIRespondWithIntent function
test('AI responds to SAFE_FAQ when control window inactive', () => {
  const classification = { intent: 'SAFE_FAQ', allowAIDuringHumanControl: true };
  const result = shouldAIRespondWithIntent(classification, false, null);
  assert(result.shouldRespond === true, 'Should respond to safe FAQ');
});

test('AI responds to SAFE_FAQ even when control window active', () => {
  const classification = { intent: 'SAFE_FAQ', allowAIDuringHumanControl: true };
  const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
  const result = shouldAIRespondWithIntent(classification, true, futureDate);
  assert(result.shouldRespond === true, 'Should respond to safe FAQ even during control');
});

test('AI does NOT respond to JOB_SPECIFIC when control window active', () => {
  const classification = { intent: 'JOB_SPECIFIC', allowAIDuringHumanControl: false };
  const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
  const result = shouldAIRespondWithIntent(classification, true, futureDate);
  assert(result.shouldRespond === false, 'Should NOT respond to job-specific during control');
});

test('AI responds to JOB_SPECIFIC when control window expired', () => {
  const classification = { intent: 'JOB_SPECIFIC', allowAIDuringHumanControl: false };
  const pastDate = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago
  const result = shouldAIRespondWithIntent(classification, false, pastDate);
  assert(result.shouldRespond === true, 'Should respond when control window expired');
});

test('AI does NOT respond to ACKNOWLEDGMENT ever', () => {
  const classification = { intent: 'ACKNOWLEDGMENT', allowAIDuringHumanControl: false };
  const result = shouldAIRespondWithIntent(classification, false, null);
  assert(result.shouldRespond === false, 'Should never respond to acknowledgments');
});

test('AI does NOT respond when permanently muted', () => {
  const classification = { intent: 'SAFE_FAQ', allowAIDuringHumanControl: true };
  const farFuture = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000); // 10 years
  const result = shouldAIRespondWithIntent(classification, true, farFuture);
  assert(result.shouldRespond === false, 'Should NOT respond when permanently muted');
});

console.log('\n=== EDGE CASES ===\n');

test('Handles empty message', () => {
  const result = classifyIntent("");
  assert(result.intent === 'UNKNOWN', `Expected UNKNOWN, got ${result.intent}`);
});

test('Handles very long conversational message', () => {
  const longMessage = "Hi there, I was wondering if you could help me with my phone. It's been acting really strange lately and I'm not sure what's wrong with it. The screen keeps flickering and sometimes it just turns off by itself.";
  const result = classifyIntent(longMessage);
  assert(result.intent === 'CONVERSATION', `Expected CONVERSATION, got ${result.intent}`);
  assert(result.allowAIDuringHumanControl === false, 'Should NOT allow AI during control');
});

test('Handles question with unclear intent', () => {
  const result = classifyIntent("what about that thing?");
  assert(result.intent === 'UNKNOWN', `Expected UNKNOWN, got ${result.intent}`);
  assert(result.allowAIDuringHumanControl === false, 'Should default to NOT allowing AI');
});

test('Handles mixed intent (acknowledgment + question)', () => {
  const result = classifyIntent("Thanks! When are you open?");
  // Should NOT be classified as acknowledgment because it has a question
  assert(result.intent === 'SAFE_FAQ', `Expected SAFE_FAQ, got ${result.intent}`);
});

console.log('\n=== REAL-WORLD SCENARIOS ===\n');

test('Scenario: Customer asks hours during active control window', () => {
  const classification = classifyIntent("what time are you open today?");
  const futureDate = new Date(Date.now() + 90 * 60 * 1000); // 90 minutes from now
  const result = shouldAIRespondWithIntent(classification, true, futureDate);
  
  assert(classification.intent === 'SAFE_FAQ', 'Should classify as SAFE_FAQ');
  assert(result.shouldRespond === true, 'AI should respond to hours query');
  console.log(`  Reason: ${result.reason}`);
});

test('Scenario: Customer asks pricing during active control window', () => {
  const classification = classifyIntent("how much for Samsung screen repair?");
  const futureDate = new Date(Date.now() + 90 * 60 * 1000); // 90 minutes from now
  const result = shouldAIRespondWithIntent(classification, true, futureDate);
  
  assert(classification.intent === 'JOB_SPECIFIC', 'Should classify as JOB_SPECIFIC');
  assert(result.shouldRespond === false, 'AI should NOT respond to pricing during control');
  console.log(`  Reason: ${result.reason}`);
});

test('Scenario: Customer says "thanks John" after staff helps', () => {
  const classification = classifyIntent("thanks John");
  const result = shouldAIRespondWithIntent(classification, false, null);
  
  assert(classification.intent === 'ACKNOWLEDGMENT', 'Should classify as ACKNOWLEDGMENT');
  assert(result.shouldRespond === false, 'AI should NOT respond to acknowledgment');
  console.log(`  Reason: ${result.reason}`);
});

test('Scenario: Customer frustrated with AI', () => {
  const classification = classifyIntent("this AI is not helping");
  const result = shouldAIRespondWithIntent(classification, false, null);
  
  assert(classification.intent === 'COMPLAINT', 'Should classify as COMPLAINT');
  assert(result.shouldRespond === false, 'AI should NOT respond to complaint');
  console.log(`  Reason: ${result.reason}`);
});

console.log('\n=== TEST SUMMARY ===\n');
console.log(`${GREEN}Passed: ${passCount}${RESET}`);
console.log(`${RED}Failed: ${failCount}${RESET}`);
console.log(`Total: ${passCount + failCount}`);

if (failCount === 0) {
  console.log(`\n${GREEN}All tests passed! ✓${RESET}\n`);
  process.exit(0);
} else {
  console.log(`\n${RED}Some tests failed ✗${RESET}\n`);
  process.exit(1);
}
