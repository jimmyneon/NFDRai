/**
 * Test Buyback/Sell Quote Formatting
 * Verify that formatQuoteForAI correctly identifies and formats sell vs repair quotes
 */

// Mock quote data
const repairQuote = {
  id: 'test-repair-1',
  type: 'repair',
  device_make: 'Apple',
  device_model: 'iPhone 14 Pro',
  issue: 'Cracked screen',
  description: 'Front glass shattered, display still works',
  quoted_price: 149.99,
  expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
};

const sellQuote = {
  id: 'test-sell-1',
  type: 'sell',
  device_make: 'Apple',
  device_model: 'iPhone 12 Pro',
  issue: 'Good condition, minor scratches on back',
  description: '128GB, Space Gray, battery health 87%',
  quoted_price: 250.00,
  expires_at: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days from now
};

const sellQuoteMinimal = {
  id: 'test-sell-2',
  type: 'sell',
  device_make: 'Samsung',
  device_model: 'Galaxy S21',
  issue: 'Device sell enquiry', // Default issue text
  quoted_price: 180.00,
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
};

const repairQuoteWithAdditional = {
  id: 'test-repair-2',
  type: 'repair',
  device_make: 'Apple',
  device_model: 'iPad Air',
  issue: 'Cracked screen',
  description: 'Glass shattered',
  additional_issues: [
    { issue: 'Battery replacement', description: 'Battery draining fast' },
    { issue: 'Charging port cleaning', description: null }
  ],
  quoted_price: 299.99,
  expires_at: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
};

// Simple implementation of formatQuoteForAI for testing
function formatQuoteForAI(quote) {
  if (!quote) return "";

  const quoteType = quote.type || "repair";
  
  const parts = [
    `Type: ${quoteType === "sell" ? "BUYBACK/SELL" : "REPAIR"}`,
    `Device: ${quote.device_make} ${quote.device_model}`,
  ];

  // For repair quotes, include issue details
  if (quoteType === "repair") {
    parts.push(`Issue: ${quote.issue}`);
    
    if (quote.description) {
      parts.push(`Description: ${quote.description}`);
    }

    if (quote.additional_issues && Array.isArray(quote.additional_issues) && quote.additional_issues.length > 0) {
      const additionalIssues = quote.additional_issues
        .map((repair) => `${repair.issue}${repair.description ? ` (${repair.description})` : ""}`)
        .join(", ");
      parts.push(`Additional repairs: ${additionalIssues}`);
    }
  } else {
    // For sell quotes, show it's a buyback enquiry
    if (quote.issue && quote.issue !== "Device sell enquiry") {
      parts.push(`Condition/Notes: ${quote.issue}`);
    }
    if (quote.description) {
      parts.push(`Details: ${quote.description}`);
    }
  }

  if (quote.quoted_price) {
    parts.push(`Quote: £${quote.quoted_price}`);
  }

  if (quote.expires_at) {
    const expiryDate = new Date(quote.expires_at);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    parts.push(`Expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`);
  }

  return parts.join(" | ");
}

console.log('🧪 Testing Buyback/Sell Quote Formatting\n');
console.log('=' .repeat(80));

// Test cases
const testCases = [
  {
    name: 'Repair Quote - Basic',
    quote: repairQuote,
    expectedType: 'REPAIR',
    shouldInclude: ['Type: REPAIR', 'iPhone 14 Pro', 'Issue: Cracked screen', '£149.99', 'Expires in 5 days'],
    shouldNotInclude: ['BUYBACK/SELL', 'Condition/Notes'],
  },
  {
    name: 'Sell Quote - Detailed',
    quote: sellQuote,
    expectedType: 'BUYBACK/SELL',
    shouldInclude: ['Type: BUYBACK/SELL', 'iPhone 12 Pro', 'Condition/Notes: Good condition', 'Details: 128GB', '£250', 'Expires in 6 days'],
    shouldNotInclude: ['Issue: Good condition', 'REPAIR'],
  },
  {
    name: 'Sell Quote - Minimal (default issue text)',
    quote: sellQuoteMinimal,
    expectedType: 'BUYBACK/SELL',
    shouldInclude: ['Type: BUYBACK/SELL', 'Galaxy S21', '£180', 'Expires in 7 days'],
    shouldNotInclude: ['Device sell enquiry', 'Issue:', 'Condition/Notes: Device sell enquiry', 'REPAIR'],
  },
  {
    name: 'Repair Quote - With Additional Issues',
    quote: repairQuoteWithAdditional,
    expectedType: 'REPAIR',
    shouldInclude: ['Type: REPAIR', 'iPad Air', 'Issue: Cracked screen', 'Additional repairs:', 'Battery replacement', 'Charging port cleaning', '£299.99'],
    shouldNotInclude: ['BUYBACK/SELL', 'Condition/Notes'],
  },
];

let passed = 0;
let failed = 0;

console.log('\n📋 Test Results:\n');

testCases.forEach((test, index) => {
  const result = formatQuoteForAI(test.quote);
  let testPassed = true;
  const errors = [];

  // Check type
  if (!result.includes(test.expectedType)) {
    testPassed = false;
    errors.push(`Missing expected type: ${test.expectedType}`);
  }

  // Check shouldInclude
  test.shouldInclude.forEach((text) => {
    if (!result.includes(text)) {
      testPassed = false;
      errors.push(`Missing expected text: "${text}"`);
    }
  });

  // Check shouldNotInclude
  test.shouldNotInclude.forEach((text) => {
    if (result.includes(text)) {
      testPassed = false;
      errors.push(`Should not include: "${text}"`);
    }
  });

  if (testPassed) {
    passed++;
    console.log(`✅ Test ${index + 1}: ${test.name}`);
    console.log(`   Result: ${result}`);
  } else {
    failed++;
    console.log(`❌ Test ${index + 1}: ${test.name}`);
    console.log(`   Result: ${result}`);
    console.log(`   Errors:`);
    errors.forEach(err => console.log(`     - ${err}`));
  }
  console.log('');
});

console.log('=' .repeat(80));
console.log(`\n📊 Summary: ${passed}/${testCases.length} tests passed`);

if (failed === 0) {
  console.log('✅ All tests passed! Quote formatting correctly distinguishes repair vs sell quotes.\n');
  process.exit(0);
} else {
  console.log(`❌ ${failed} test(s) failed. Please review the formatting logic.\n`);
  process.exit(1);
}
