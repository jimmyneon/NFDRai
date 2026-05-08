/**
 * Comprehensive AI Behavior Test
 * Tests all the issues John identified
 */

const { shouldAIRespond } = require('./app/lib/simple-query-detector');
const { shouldSwitchToAutoMode } = require('./app/lib/conversation-mode-analyzer');
const { isAcknowledgment } = require('./app/lib/simple-query-detector');

console.log('=== COMPREHENSIVE AI BEHAVIOR TEST ===\n');

// Test scenarios from John's examples
const testCases = [
  {
    name: 'ISSUE 1: Customer responding to John\'s question',
    staffMessage: 'Hi there Sara. The iPhone mini is showing as needing the battery serviced. Would you like me to proceed with that?',
    customerMessage: 'Yes please 😊',
    minutesSinceStaff: 2,
    expectedBehavior: 'STAY QUIET (customer answering John)',
    shouldRespond: false
  },
  {
    name: 'ISSUE 2: Parts inquiry (not in status keywords)',
    staffMessage: null,
    customerMessage: 'Hi, any idea when my parts will be in please?',
    minutesSinceStaff: null,
    expectedBehavior: 'RESPOND with API check',
    shouldRespond: true,
    note: 'Should trigger repair status API check'
  },
  {
    name: 'ISSUE 3: Acknowledgment after John\'s update',
    staffMessage: 'Hi there, sorry for the delay. I\'ve just checked and it looks like its stuck at the delivery depot. I\'ll reorder for tomorrow.',
    customerMessage: 'No problems thanks for the update',
    minutesSinceStaff: 1,
    expectedBehavior: 'STAY QUIET (acknowledging John)',
    shouldRespond: false
  },
  {
    name: 'ISSUE 4: Customer asking price after John quoted',
    staffMessage: 'Hi Sara, Good news - your Apple iPhone 12 mini is ready to collect',
    customerMessage: 'Perfect will be there 4ish - how much is it and I will make sure I have the cash ready',
    minutesSinceStaff: 1,
    expectedBehavior: 'STAY QUIET (John should answer pricing)',
    shouldRespond: false
  },
  {
    name: 'ISSUE 5: Simple acknowledgment with emoji',
    staffMessage: 'Your phone is ready, £45 in total',
    customerMessage: 'Thanks John 👍',
    minutesSinceStaff: 1,
    expectedBehavior: 'STAY QUIET (pure acknowledgment)',
    shouldRespond: false
  },
  {
    name: 'VALID: New question after John\'s message',
    staffMessage: 'Your phone is ready to collect',
    customerMessage: 'Great! When are you open tomorrow?',
    minutesSinceStaff: 5,
    expectedBehavior: 'RESPOND (new question, simple query)',
    shouldRespond: true
  },
  {
    name: 'VALID: Question after 30+ minutes',
    staffMessage: 'Let me know when you want to collect',
    customerMessage: 'Is it ready?',
    minutesSinceStaff: 35,
    expectedBehavior: 'RESPOND (30min pause expired)',
    shouldRespond: true
  },
  {
    name: 'EDGE: "Yes please" after John asks question',
    staffMessage: 'Would you like me to proceed with the battery replacement?',
    customerMessage: 'Yes please',
    minutesSinceStaff: 2,
    expectedBehavior: 'STAY QUIET (answering John\'s yes/no question)',
    shouldRespond: false
  },
  {
    name: 'EDGE: "No thanks" after John offers',
    staffMessage: 'I can also replace the battery while I have it open. Would you like that?',
    customerMessage: 'No thanks, just the screen please',
    minutesSinceStaff: 1,
    expectedBehavior: 'STAY QUIET (responding to John\'s offer)',
    shouldRespond: false
  },
  {
    name: 'EDGE: "Thanks for the update" variations',
    staffMessage: 'Parts are ordered, should arrive tomorrow',
    customerMessage: 'Thanks for letting me know',
    minutesSinceStaff: 2,
    expectedBehavior: 'STAY QUIET (acknowledging update)',
    shouldRespond: false
  }
];

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  console.log(`\n--- Test ${index + 1}: ${test.name} ---`);
  console.log(`Customer: "${test.customerMessage}"`);
  if (test.staffMessage) {
    console.log(`John said (${test.minutesSinceStaff} min ago): "${test.staffMessage.substring(0, 60)}..."`);
  }
  
  // Test acknowledgment detection
  const isAck = isAcknowledgment(test.customerMessage);
  console.log(`Acknowledgment check: ${isAck ? 'YES' : 'NO'}`);
  
  // Test auto mode switch
  const shouldSwitch = shouldSwitchToAutoMode(test.customerMessage);
  console.log(`Should switch to auto: ${shouldSwitch ? 'YES' : 'NO'}`);
  
  // Test AI response decision
  let aiDecision;
  if (test.minutesSinceStaff !== null) {
    aiDecision = shouldAIRespond(test.minutesSinceStaff, test.customerMessage);
    console.log(`AI should respond: ${aiDecision.shouldRespond ? 'YES' : 'NO'}`);
    console.log(`Reason: ${aiDecision.reason}`);
  }
  
  // Determine actual behavior
  let actualShouldRespond;
  if (isAck) {
    actualShouldRespond = false;
  } else if (test.minutesSinceStaff !== null) {
    actualShouldRespond = aiDecision.shouldRespond;
  } else {
    actualShouldRespond = true; // No staff message, AI can respond
  }
  
  // Check result
  const testPassed = actualShouldRespond === test.shouldRespond;
  if (testPassed) {
    console.log(`✅ PASS: ${test.expectedBehavior}`);
    passed++;
  } else {
    console.log(`❌ FAIL: Expected ${test.shouldRespond ? 'RESPOND' : 'STAY QUIET'}, got ${actualShouldRespond ? 'RESPOND' : 'STAY QUIET'}`);
    console.log(`   Expected: ${test.expectedBehavior}`);
    failed++;
  }
  
  if (test.note) {
    console.log(`   Note: ${test.note}`);
  }
});

console.log(`\n\n=== RESULTS ===`);
console.log(`Passed: ${passed}/${testCases.length}`);
console.log(`Failed: ${failed}/${testCases.length}`);
console.log(`Success rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);

if (failed > 0) {
  console.log(`\n⚠️  ${failed} test(s) failed - AI behavior needs fixes`);
  process.exit(1);
} else {
  console.log(`\n✅ All tests passed!`);
  process.exit(0);
}
