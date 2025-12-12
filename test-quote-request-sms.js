#!/usr/bin/env node

/**
 * Test script for quote request confirmation SMS
 * Ensures repair vs sell enquiry confirmations are distinct.
 */

const {
  buildQuoteRequestConfirmationSms,
} = require("./app/lib/quote-request-sms.ts");

function assertIncludes(haystack, needle, label) {
  if (!haystack.includes(needle)) {
    throw new Error(`${label}: expected to include "${needle}"`);
  }
}

function assertNotIncludes(haystack, needle, label) {
  if (haystack.includes(needle)) {
    throw new Error(`${label}: expected NOT to include "${needle}"`);
  }
}

console.log("\n=== TESTING QUOTE REQUEST CONFIRMATION SMS ===\n");

try {
  const repair = buildQuoteRequestConfirmationSms({
    name: "Sarah Smith",
    device_make: "Apple",
    device_model: "iPhone 14",
    issue: "cracked screen",
    type: "repair",
  });

  assertIncludes(repair, "Thanks for your repair enquiry", "Repair SMS");
  assertIncludes(repair, "quote for your Apple iPhone 14", "Repair SMS");
  assertIncludes(repair, "(cracked screen)", "Repair SMS");
  assertNotIncludes(repair, "selling your", "Repair SMS");

  const sell = buildQuoteRequestConfirmationSms({
    name: "Sarah Smith",
    device_make: "Apple",
    device_model: "iPhone 14",
    issue: "Device sell enquiry",
    type: "sell",
  });

  assertIncludes(sell, "selling your Apple iPhone 14", "Sell SMS");
  assertIncludes(sell, "storage size", "Sell SMS");
  assertIncludes(sell, "condition", "Sell SMS");
  assertNotIncludes(sell, "repair enquiry", "Sell SMS");

  console.log("✅ All tests passed\n");
  process.exit(0);
} catch (err) {
  console.error("❌ Test failed:\n", err.message || err);
  process.exit(1);
}
