#!/usr/bin/env node

/**
 * AI System Test Script
 * Tests the hybrid context-aware prompting system
 */

const testCases = [
  {
    name: "Test 1: Business Hours Query (Context-Aware)",
    message: "What are your opening hours?",
    expectedInPrompt: ["business_hours", "operational"],
    notExpectedInPrompt: ["pricing", "screen_repair"],
    expectedInResponse: ["Monday", "Friday", "Saturday"],
    notExpectedInResponse: ["£", "screen", "repair"]
  },
  {
    name: "Test 2: Screen Repair Query (Context-Aware)",
    message: "How much for iPhone 12 screen?",
    expectedInPrompt: ["pricing", "screen", "warranty"],
    notExpectedInPrompt: ["business_hours"],
    expectedInResponse: ["OLED", "genuine", "£100", "£150", "warranty"],
    notExpectedInResponse: ["Monday", "opening hours"]
  },
  {
    name: "Test 3: Water Damage Query (Context-Aware)",
    message: "My phone got wet",
    expectedInPrompt: ["water damage", "diagnostic"],
    notExpectedInPrompt: ["screen pricing"],
    expectedInResponse: ["diagnostic", "sooner", "better"],
    notExpectedInResponse: ["£100", "OLED"]
  },
  {
    name: "Test 4: Conversation Memory",
    conversation: [
      { role: "customer", text: "Hi, I'm Sarah and I have an iPhone 12" },
      { role: "ai", text: "Hi Sarah! How can I help with your iPhone 12?" },
      { role: "customer", text: "The screen is cracked, how much to fix?" }
    ],
    expectedInResponse: ["Sarah", "iPhone 12"],
    notExpectedInResponse: ["What device", "What model"]
  },
  {
    name: "Test 5: Multi-Message Split",
    message: "How much for iPhone 12 screen?",
    expectedMultiMessage: true,
    expectedDelimiter: "|||",
    expectedMessages: 2
  },
  {
    name: "Test 6: Forced Sign-off",
    message: "What are your hours?",
    expectedSignOff: "Many Thanks,\nAI Steve,\nNew Forest Device Repairs"
  },
  {
    name: "Test 7: Turnaround NOT Mentioned",
    message: "How much for iPhone 12 screen?",
    notExpectedInResponse: ["turnaround", "how long", "same day"]
  },
  {
    name: "Test 8: Turnaround When Asked",
    message: "How long will the repair take?",
    expectedInResponse: ["quicker", "guideline"]
  },
  {
    name: "Test 9: Express Service for Urgent",
    message: "I need my MacBook fixed urgently",
    expectedInResponse: ["express", "£30", "accommodate"]
  },
  {
    name: "Test 10: Device Detection",
    message: "My phone is broken",
    expectedInResponse: ["What make", "model"]
  }
];

console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║          AI SYSTEM TEST SUITE                              ║");
console.log("║          Hybrid Context-Aware Prompting                    ║");
console.log("╚════════════════════════════════════════════════════════════╝\n");

console.log("📋 TEST PLAN:");
console.log("   • Context-aware prompting (only relevant modules)");
console.log("   • Conversation memory (15 messages)");
console.log("   • Multi-message splitting (|||)");
console.log("   • Forced sign-off formatting");
console.log("   • Turnaround strategy (only when asked)");
console.log("   • Friendly tone & diagnosis");
console.log("   • Device detection");
console.log("   • Cost reduction (~75%)\n");

console.log("═".repeat(60));
console.log("\n🧪 MANUAL TESTING REQUIRED\n");
console.log("This script provides test cases. You need to:");
console.log("1. Send test messages via SMS/WhatsApp");
console.log("2. Check console logs for prompt size");
console.log("3. Verify AI responses match expectations\n");

console.log("═".repeat(60));
console.log("\n📝 TEST CASES:\n");

testCases.forEach((test, index) => {
  console.log(`\n${index + 1}. ${test.name}`);
  console.log("─".repeat(60));
  
  if (test.message) {
    console.log(`   📤 Send: "${test.message}"`);
  }
  
  if (test.conversation) {
    console.log(`   💬 Conversation:`);
    test.conversation.forEach(msg => {
      console.log(`      ${msg.role}: "${msg.text}"`);
    });
  }
  
  if (test.expectedInPrompt) {
    console.log(`   ✓ Prompt should include: ${test.expectedInPrompt.join(", ")}`);
  }
  
  if (test.notExpectedInPrompt) {
    console.log(`   ✗ Prompt should NOT include: ${test.notExpectedInPrompt.join(", ")}`);
  }
  
  if (test.expectedInResponse) {
    console.log(`   ✓ Response should mention: ${test.expectedInResponse.join(", ")}`);
  }
  
  if (test.notExpectedInResponse) {
    console.log(`   ✗ Response should NOT mention: ${test.notExpectedInResponse.join(", ")}`);
  }
  
  if (test.expectedMultiMessage) {
    console.log(`   ✓ Should send ${test.expectedMessages} separate messages`);
    console.log(`   ✓ Should use "${test.expectedDelimiter}" delimiter`);
  }
  
  if (test.expectedSignOff) {
    console.log(`   ✓ Should end with proper sign-off`);
  }
});

console.log("\n\n═".repeat(60));
console.log("\n🔍 HOW TO CHECK:\n");
console.log("1. Console Logs:");
console.log("   • Look for: 'Prompt size: ~2000-3000 chars'");
console.log("   • Old system was: ~50,000 chars");
console.log("   • Check for: 'Context-aware modules loaded: [...]'\n");

console.log("2. Response Quality:");
console.log("   • Friendly, human tone (not robotic)");
console.log("   • Uses paragraphs (not chunked)");
console.log("   • Remembers conversation context");
console.log("   • Only mentions relevant information\n");

console.log("3. Multi-Message:");
console.log("   • Watch for 2 separate message bubbles");
console.log("   • ~2 second delay between them");
console.log("   • Each has its own sign-off\n");

console.log("4. Sign-off Format:");
console.log("   • Blank line before sign-off");
console.log("   • 'Many Thanks,' on first line");
console.log("   • 'AI Steve,' on second line");
console.log("   • 'New Forest Device Repairs' on third line\n");

console.log("═".repeat(60));
console.log("\n✅ QUICK SMOKE TEST:\n");
console.log('   Send: "How much for iPhone 12 screen?"\n');
console.log("   Expected:");
console.log("   • Message 1: OLED vs genuine options, warranty");
console.log("   • 2 second delay");
console.log("   • Message 2: Battery upsell");
console.log("   • Both have proper sign-off");
console.log("   • NO turnaround time mentioned");
console.log("   • Prompt size ~2000-3000 chars (check console)\n");

console.log("═".repeat(60));
console.log("\n📊 SUCCESS CRITERIA:\n");
console.log("   ✓ All test responses are relevant and focused");
console.log("   ✓ Prompt size reduced by ~75% (2-3k vs 50k chars)");
console.log("   ✓ AI remembers conversation (15 messages)");
console.log("   ✓ Multi-message splitting works");
console.log("   ✓ Sign-off always present and formatted");
console.log("   ✓ Turnaround only mentioned when asked");
console.log("   ✓ Friendly, human tone throughout");
console.log("   ✓ No console errors\n");

console.log("═".repeat(60));
console.log("\n🚀 READY TO TEST!\n");
console.log("Start with the Quick Smoke Test, then work through");
console.log("the other test cases. Check console logs after each test.\n");
console.log("Good luck! 🎯\n");
