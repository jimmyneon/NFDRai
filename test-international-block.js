/**
 * Test International Number Blocking
 * Verifies that non-UK numbers are blocked to avoid international SMS costs
 */

const { shouldSendSMS, isUKNumber, isInternationalNumber, getPhoneCountry } = require('./lib/phone-validator');

console.log('=== INTERNATIONAL NUMBER BLOCKING TESTS ===\n');

const testCases = [
  // UK numbers (should be allowed)
  { phone: '+447123456789', expected: true, description: 'UK mobile (+44)' },
  { phone: '447123456789', expected: true, description: 'UK mobile (44)' },
  { phone: '07123456789', expected: true, description: 'UK mobile (0)' },
  { phone: '7123456789', expected: true, description: 'UK mobile (7)' },
  { phone: '+442012345678', expected: true, description: 'UK landline (+44)' },
  { phone: '02012345678', expected: true, description: 'UK landline (0)' },
  
  // International numbers (should be blocked)
  { phone: '+1234567890', expected: false, description: 'US/Canada number' },
  { phone: '+33123456789', expected: false, description: 'France number' },
  { phone: '+34123456789', expected: false, description: 'Spain number' },
  { phone: '+49123456789', expected: false, description: 'Germany number' },
  { phone: '+353123456789', expected: false, description: 'Ireland number' },
  { phone: '+91123456789', expected: false, description: 'India number' },
  { phone: '+86123456789', expected: false, description: 'China number' },
  { phone: '+61123456789', expected: false, description: 'Australia number' },
  
  // Edge cases
  { phone: '', expected: false, description: 'Empty string' },
  { phone: 'invalid', expected: false, description: 'Invalid format' },
  { phone: '+44', expected: false, description: 'Incomplete UK number' },
];

let passed = 0;
let failed = 0;

console.log('Testing shouldSendSMS():\n');

testCases.forEach(({ phone, expected, description }) => {
  const result = shouldSendSMS(phone);
  const success = result.allowed === expected;
  
  if (success) {
    console.log(`✅ PASS: ${description}`);
    console.log(`   Phone: ${phone}`);
    console.log(`   Result: ${result.allowed ? 'ALLOWED' : 'BLOCKED'}`);
    console.log(`   Reason: ${result.reason}`);
    console.log(`   Country: ${result.country}\n`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${description}`);
    console.log(`   Phone: ${phone}`);
    console.log(`   Expected: ${expected ? 'ALLOWED' : 'BLOCKED'}`);
    console.log(`   Got: ${result.allowed ? 'ALLOWED' : 'BLOCKED'}`);
    console.log(`   Reason: ${result.reason}`);
    console.log(`   Country: ${result.country}\n`);
    failed++;
  }
});

console.log('\n=== HELPER FUNCTION TESTS ===\n');

console.log('Testing isUKNumber():\n');
console.log('✅', isUKNumber('+447123456789'), '- UK mobile');
console.log('✅', isUKNumber('07123456789'), '- UK mobile (national)');
console.log('❌', isUKNumber('+1234567890'), '- US number');
console.log('❌', isUKNumber('+33123456789'), '- France number');

console.log('\nTesting isInternationalNumber():\n');
console.log('❌', isInternationalNumber('+447123456789'), '- UK mobile');
console.log('✅', isInternationalNumber('+1234567890'), '- US number');
console.log('✅', isInternationalNumber('+33123456789'), '- France number');

console.log('\nTesting getPhoneCountry():\n');
console.log('UK:', getPhoneCountry('+447123456789'));
console.log('US/Canada:', getPhoneCountry('+1234567890'));
console.log('France:', getPhoneCountry('+33123456789'));
console.log('Spain:', getPhoneCountry('+34123456789'));
console.log('Germany:', getPhoneCountry('+49123456789'));

console.log('\n=== TEST SUMMARY ===');
console.log(`Total: ${testCases.length}`);
console.log(`Passed: ${passed} ✅`);
console.log(`Failed: ${failed} ❌`);
console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n🎉 ALL TESTS PASSED! International blocking working correctly.');
} else {
  console.log('\n⚠️ SOME TESTS FAILED - Review implementation');
  process.exit(1);
}
