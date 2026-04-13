/**
 * Test Phone Validation Logic
 * Tests that we ONLY send SMS to UK mobile numbers (07/+447/00447)
 * and BLOCK landlines, 0800 numbers, and international numbers
 */

// Import the phone validator functions
const { shouldSendSMS, isUKMobileNumber } = require('./lib/phone-validator.ts');

console.log('🧪 Testing Phone Validation Logic\n');
console.log('=' .repeat(80));

// Test cases
const testCases = [
  // ✅ SHOULD ALLOW - UK Mobile Numbers
  { phone: '07123456789', expected: true, description: 'UK mobile (07)' },
  { phone: '+447123456789', expected: true, description: 'UK mobile (+447)' },
  { phone: '00447123456789', expected: true, description: 'UK mobile (00447)' },
  { phone: '07 1234 56789', expected: true, description: 'UK mobile with spaces' },
  { phone: '+44 7123 456789', expected: true, description: 'UK mobile +44 with spaces' },
  { phone: '0044 7123 456789', expected: true, description: 'UK mobile 0044 with spaces' },
  
  // ❌ SHOULD BLOCK - UK Landlines
  { phone: '01202123456', expected: false, description: 'UK landline (01)' },
  { phone: '02012345678', expected: false, description: 'UK landline (02)' },
  { phone: '+441202123456', expected: false, description: 'UK landline (+4401)' },
  { phone: '+442012345678', expected: false, description: 'UK landline (+4402)' },
  { phone: '00441202123456', expected: false, description: 'UK landline (004401)' },
  { phone: '00442012345678', expected: false, description: 'UK landline (004402)' },
  
  // ❌ SHOULD BLOCK - 0800 Numbers
  { phone: '08001234567', expected: false, description: '0800 freephone' },
  { phone: '08081234567', expected: false, description: '0808 freephone' },
  { phone: '+448001234567', expected: false, description: '0800 with +44' },
  { phone: '00448001234567', expected: false, description: '0800 with 0044' },
  
  // ❌ SHOULD BLOCK - International Numbers
  { phone: '+1234567890', expected: false, description: 'US number' },
  { phone: '+33123456789', expected: false, description: 'France number' },
  { phone: '+353123456789', expected: false, description: 'Ireland number' },
  { phone: '+61123456789', expected: false, description: 'Australia number' },
  
  // ❌ SHOULD BLOCK - Invalid/Unknown
  { phone: '', expected: false, description: 'Empty string' },
  { phone: '123', expected: false, description: 'Too short' },
  { phone: 'abc', expected: false, description: 'Non-numeric' },
];

let passed = 0;
let failed = 0;

console.log('\n📋 Test Results:\n');

testCases.forEach((test, index) => {
  const result = shouldSendSMS(test.phone);
  const success = result.allowed === test.expected;
  
  if (success) {
    passed++;
    console.log(`✅ Test ${index + 1}: ${test.description}`);
    console.log(`   Phone: "${test.phone}"`);
    console.log(`   Expected: ${test.expected ? 'ALLOW' : 'BLOCK'}`);
    console.log(`   Result: ${result.allowed ? 'ALLOW' : 'BLOCK'} - ${result.reason}`);
  } else {
    failed++;
    console.log(`❌ Test ${index + 1}: ${test.description}`);
    console.log(`   Phone: "${test.phone}"`);
    console.log(`   Expected: ${test.expected ? 'ALLOW' : 'BLOCK'}`);
    console.log(`   Got: ${result.allowed ? 'ALLOW' : 'BLOCK'} - ${result.reason}`);
  }
  console.log('');
});

console.log('=' .repeat(80));
console.log(`\n📊 Summary: ${passed}/${testCases.length} tests passed`);

if (failed === 0) {
  console.log('✅ All tests passed! Phone validation is working correctly.\n');
  process.exit(0);
} else {
  console.log(`❌ ${failed} test(s) failed. Please review the validation logic.\n`);
  process.exit(1);
}
