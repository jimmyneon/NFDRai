/**
 * Test AI Steve improvements - Over-promising and staff coordination fixes
 * Run: node test-ai-improvements.js
 */

// Import the functions we need to test
const { shouldAIRespond } = require('./app/lib/simple-query-detector.ts');

console.log('=== Testing AI Steve Improvements ===\n');

// Test cases
const tests = [
  {
    name: 'Acknowledgment - Thanks John',
    message: 'Thanks John',
    minutesSinceStaff: 1,
    expectedRespond: false,
    expectedReason: 'acknowledgment'
  },
  {
    name: 'Responding to John - Monday would be good',
    message: 'Monday would be good',
    minutesSinceStaff: 2,
    expectedRespond: false,
    expectedReason: 'responding to John'
  },
  {
    name: 'Responding to John - Yes, that works',
    message: 'Yes, that works',
    minutesSinceStaff: 3,
    expectedRespond: false,
    expectedReason: 'responding to John'
  },
  {
    name: 'Responding to John - Tomorrow',
    message: 'Tomorrow',
    minutesSinceStaff: 4,
    expectedRespond: false,
    expectedReason: 'responding to John'
  },
  {
    name: 'New question after John message - When are you open?',
    message: 'When are you open tomorrow?',
    minutesSinceStaff: 2,
    expectedRespond: true,
    expectedReason: 'new question'
  },
  {
    name: 'New question - How much for screen?',
    message: 'How much for iPhone screen?',
    minutesSinceStaff: 10,
    expectedRespond: true,
    expectedReason: 'new question'
  },
  {
    name: 'Acknowledgment - Ok thank you',
    message: 'Ok thank you',
    minutesSinceStaff: 1,
    expectedRespond: false,
    expectedReason: 'acknowledgment'
  },
  {
    name: 'Responding to John - Anytime',
    message: 'Anytime',
    minutesSinceStaff: 2,
    expectedRespond: false,
    expectedReason: 'responding to John'
  },
  {
    name: 'Responding to John after 5+ min - Monday (should respond)',
    message: 'Monday',
    minutesSinceStaff: 10,
    expectedRespond: true,
    expectedReason: 'staff message too old'
  },
  {
    name: 'Complex message - not responding to John',
    message: 'I need to get my iPhone screen fixed, when can I bring it in?',
    minutesSinceStaff: 2,
    expectedRespond: true,
    expectedReason: 'complex question'
  }
];

let passed = 0;
let failed = 0;

tests.forEach((test, index) => {
  console.log(`Test ${index + 1}: ${test.name}`);
  console.log(`  Message: "${test.message}"`);
  console.log(`  Minutes since staff: ${test.minutesSinceStaff}`);
  
  const result = shouldAIRespond(test.minutesSinceStaff, test.message);
  
  console.log(`  Result: shouldRespond=${result.shouldRespond}`);
  console.log(`  Reason: ${result.reason}`);
  
  const testPassed = result.shouldRespond === test.expectedRespond;
  
  if (testPassed) {
    console.log(`  ✅ PASS`);
    passed++;
  } else {
    console.log(`  ❌ FAIL - Expected shouldRespond=${test.expectedRespond}`);
    failed++;
  }
  
  console.log('');
});

console.log('=== Test Summary ===');
console.log(`Total: ${tests.length}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log('');

if (failed === 0) {
  console.log('✅ All tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed');
  process.exit(1);
}
