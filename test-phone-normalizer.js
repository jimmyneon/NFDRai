// Test phone normalization
const { normalizePhoneNumber, arePhoneNumbersEqual, formatPhoneForDisplay } = require('./app/lib/phone-normalizer.ts')

const testCases = [
  // Input formats that should all normalize to +447833454000
  { input: '+447833454000', expected: '+447833454000' },
  { input: '447833454000', expected: '+447833454000' },
  { input: '07833454000', expected: '+447833454000' },
  { input: '0044 7833 454000', expected: '+447833454000' },
  { input: '0044-7833-454000', expected: '+447833454000' },
  { input: '+44 7833 454000', expected: '+447833454000' },
  { input: '+44 (0) 7833 454000', expected: '+447833454000' },
  { input: '07833 454000', expected: '+447833454000' },
  
  // Edge cases
  { input: null, expected: null },
  { input: '', expected: null },
  { input: '   ', expected: null },
]

console.log('\n=== TESTING PHONE NORMALIZATION ===\n')

let passed = 0
let failed = 0

testCases.forEach((test, i) => {
  const result = normalizePhoneNumber(test.input)
  const status = result === test.expected ? '✅' : '❌'
  
  if (result === test.expected) {
    passed++
  } else {
    failed++
  }
  
  console.log(`${i + 1}. ${status} Input: "${test.input}"`)
  console.log(`   Expected: ${test.expected}`)
  console.log(`   Got: ${result}`)
  console.log('')
})

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`Results: ${passed} passed, ${failed} failed`)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

// Test equality
console.log('=== TESTING PHONE EQUALITY ===\n')

const equalityTests = [
  { phone1: '+447833454000', phone2: '447833454000', shouldMatch: true },
  { phone1: '+447833454000', phone2: '07833454000', shouldMatch: true },
  { phone1: '07833454000', phone2: '447833454000', shouldMatch: true },
  { phone1: '+447833454000', phone2: '+447833454001', shouldMatch: false },
]

equalityTests.forEach((test, i) => {
  const result = arePhoneNumbersEqual(test.phone1, test.phone2)
  const status = result === test.shouldMatch ? '✅' : '❌'
  
  console.log(`${i + 1}. ${status} "${test.phone1}" vs "${test.phone2}"`)
  console.log(`   Should match: ${test.shouldMatch}, Got: ${result}`)
  console.log('')
})

// Test display formatting
console.log('=== TESTING DISPLAY FORMATTING ===\n')

const displayTests = [
  { input: '+447833454000', expected: '07833 454000' },
  { input: '447833454000', expected: '07833 454000' },
  { input: '07833454000', expected: '07833 454000' },
]

displayTests.forEach((test, i) => {
  const result = formatPhoneForDisplay(test.input)
  const status = result === test.expected ? '✅' : '❌'
  
  console.log(`${i + 1}. ${status} Input: "${test.input}"`)
  console.log(`   Expected: "${test.expected}"`)
  console.log(`   Got: "${result}"`)
  console.log('')
})
