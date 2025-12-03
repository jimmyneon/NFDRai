#!/usr/bin/env node
/**
 * Test device model extraction improvements
 */

// Simulate the extractDeviceModel function
function extractDeviceModel(text) {
  // iPhone models - with optional Pro/Pro Max/Plus/Mini suffix
  const iphoneMatch = text.match(
    /iphone\s*(1[0-6]|[6-9]|x[rs]?|se)(\s*(pro\s*max|pro|plus|mini))?/i
  );
  if (iphoneMatch) return iphoneMatch[0];

  // iPad models
  const ipadMatch = text.match(/ipad\s+(pro|air|mini|\d)/i);
  if (ipadMatch) return ipadMatch[0];

  // Samsung Galaxy models - broader detection with Ultra/Plus/FE variants
  const samsungMatch = text.match(
    /galaxy\s*(s\d+\s*(ultra|plus|\+|fe)?|a\d+\s*(ultra|plus|\+)?|note\s*\d+|z?\s*fold\s*\d*|z?\s*flip\s*\d*)/i
  );
  if (samsungMatch) return samsungMatch[0];

  // Google Pixel models
  const pixelMatch = text.match(/pixel\s*(\d+[a]?|pro|fold)/i);
  if (pixelMatch) return `Pixel ${pixelMatch[1]}`;

  // Motorola/Moto models
  const motoMatch = text.match(
    /(?:motorola\s*)?moto\s*([gex]\s*\d+|g\s*power|g\s*stylus|edge|razr)/i
  );
  if (motoMatch) return `Moto ${motoMatch[1]}`;

  // OnePlus models
  const oneplusMatch = text.match(/oneplus\s*(\d+[t]?|nord|open)/i);
  if (oneplusMatch) return `OnePlus ${oneplusMatch[1]}`;

  // Huawei models
  const huaweiMatch = text.match(/huawei\s*(p\d+|mate\s*\d+|nova\s*\d+)/i);
  if (huaweiMatch) return `Huawei ${huaweiMatch[1]}`;

  // Xiaomi/Redmi models
  const xiaomiMatch = text.match(
    /(xiaomi|redmi)\s*(note\s*\d+|mi\s*\d+|\d+[a-z]*)/i
  );
  if (xiaomiMatch) return `${xiaomiMatch[1]} ${xiaomiMatch[2]}`;

  // MacBook models
  const macbookMatch = text.match(/macbook\s*(pro|air)?(\s*(13|14|15|16))?/i);
  if (macbookMatch && (macbookMatch[1] || macbookMatch[2]))
    return macbookMatch[0];

  // Generic laptop brands
  const laptopMatch = text.match(
    /(dell|hp|lenovo|asus|acer)\s*([\w\d]+\s*[\w\d]*)/i
  );
  if (laptopMatch) return `${laptopMatch[1]} ${laptopMatch[2]}`.trim();

  return undefined;
}

// Test cases
const testCases = [
  // Motorola - THE BUG CASE
  { input: "Motorola Moto g 10, cracked screen", expected: "Moto g 10" },
  { input: "moto g10 screen replacement", expected: "Moto g10" },
  { input: "Moto G Power battery issue", expected: "Moto g power" },
  { input: "motorola moto edge screen", expected: "Moto edge" },

  // Pixel
  { input: "Pixel 7a screen replacement", expected: "Pixel 7a" },
  { input: "Google Pixel 8 Pro", expected: "Pixel 8" },
  { input: "pixel fold screen", expected: "Pixel fold" },

  // Samsung
  { input: "Galaxy S23 Ultra screen", expected: "Galaxy S23 Ultra" },
  { input: "Samsung Galaxy A54", expected: "Galaxy A54" },
  { input: "Galaxy Z Fold 5", expected: "Galaxy Z Fold 5" },

  // iPhone
  { input: "iPhone 14 Pro Max screen", expected: "iPhone 14 Pro Max" },
  { input: "iphone 12 battery", expected: "iPhone 12" },
  { input: "iPhone SE screen", expected: "iPhone SE" },

  // Other brands
  { input: "OnePlus 12 screen", expected: "OnePlus 12" },
  { input: "Huawei P40 battery", expected: "Huawei P40" },
  { input: "Redmi Note 12", expected: "Redmi Note 12" },
  { input: "MacBook Pro 14 screen", expected: "MacBook Pro 14" },
  { input: "Dell XPS 15 keyboard", expected: "Dell XPS 15" },

  // Should NOT match (no specific model)
  { input: "iPhone screen repair", expected: undefined },
  { input: "Samsung phone battery", expected: undefined },
  { input: "my phone is broken", expected: undefined },
];

console.log("=== Device Model Extraction Tests ===\n");

let passed = 0;
let failed = 0;

testCases.forEach((test, i) => {
  const result = extractDeviceModel(test.input);
  const matches = result?.toLowerCase() === test.expected?.toLowerCase();

  if (matches) {
    console.log(`✅ ${i + 1}. "${test.input}" → "${result}"`);
    passed++;
  } else {
    console.log(`❌ ${i + 1}. "${test.input}"`);
    console.log(`   Expected: "${test.expected}"`);
    console.log(`   Got: "${result}"`);
    failed++;
  }
});

console.log(`\n=== Results: ${passed}/${testCases.length} passed ===`);

if (failed > 0) {
  console.log(`\n⚠️  ${failed} tests failed - review the regex patterns`);
  process.exit(1);
} else {
  console.log("\n✅ All tests passed!");
}
