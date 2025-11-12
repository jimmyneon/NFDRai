/**
 * Test name extraction with titles (Mr, Mrs, Ms, Miss, Dr)
 * 
 * Run: node test-title-extraction.js
 */

const { extractNameWithRegex } = require('./app/lib/ai-name-extractor.ts')

const testCases = [
  // Should extract name AFTER title
  { message: 'Hi Mrs Smith, your iPhone is ready', expected: 'Smith', description: 'Mrs + name' },
  { message: 'Hi Mr Jones, your phone is ready', expected: 'Jones', description: 'Mr + name' },
  { message: 'Hi Ms Brown, it\'s £149', expected: 'Brown', description: 'Ms + name' },
  { message: 'Hi Miss Taylor, your device is fixed', expected: 'Taylor', description: 'Miss + name' },
  { message: 'Hi Dr Wilson, your laptop is ready', expected: 'Wilson', description: 'Dr + name' },
  { message: 'Hello Mrs. Johnson, your phone is ready', expected: 'Johnson', description: 'Mrs. with period' },
  { message: 'Hey Mr. Davis, it\'s done', expected: 'Davis', description: 'Mr. with period' },
  
  // Should NOT extract title as name
  { message: 'Hi Mrs, your phone is ready', expected: null, description: 'Title only, no name' },
  { message: 'Hi Mr, it\'s ready', expected: null, description: 'Title only, no name' },
  
  // Regular names (no title)
  { message: 'Hi Carol, your iPhone is ready', expected: 'Carol', description: 'Regular name' },
  { message: 'Hi there Sarah, it\'s £149', expected: 'Sarah', description: 'Hi there + name' },
  
  // Edge cases
  { message: 'Ready for Mrs Smith', expected: 'Smith', description: 'for + title + name' },
  { message: 'Mrs Smith, your phone is ready', expected: 'Smith', description: 'Title at start' },
  { message: 'Mr Jones, it\'s £99', expected: 'Jones', description: 'Title at start' },
]

console.log('🧪 Testing Name Extraction with Titles\n')

let passed = 0
let failed = 0

for (const test of testCases) {
  const result = extractNameWithRegex(test.message)
  const success = result.name === test.expected
  
  if (success) {
    passed++
    console.log(`✅ ${test.description}`)
    console.log(`   Message: "${test.message}"`)
    console.log(`   Expected: ${test.expected} | Got: ${result.name} | Confidence: ${result.confidence}`)
  } else {
    failed++
    console.log(`❌ ${test.description}`)
    console.log(`   Message: "${test.message}"`)
    console.log(`   Expected: ${test.expected} | Got: ${result.name}`)
  }
  console.log()
}

console.log(`\n📊 Results: ${passed}/${testCases.length} tests passed`)

if (failed > 0) {
  console.log(`⚠️  ${failed} tests failed`)
  process.exit(1)
} else {
  console.log('✅ All tests passed!')
  process.exit(0)
}
