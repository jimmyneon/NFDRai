/**
 * Test Smart AI System
 * Tests the new state-aware response generator
 */

const testConversations = [
  {
    name: "Screen Repair - Complete Flow",
    messages: [
      { from: "customer", text: "Hi, my iPhone screen is broken" },
      { from: "ai", text: "Hi! I can help with that. What model iPhone is it?" },
      { from: "customer", text: "iPhone 12" },
      { from: "ai", text: "We have genuine Apple screens from £150, or our high-quality OLED option at £100..." },
      { from: "customer", text: "The OLED one please" },
    ],
    expectedState: "confirming_choice",
    expectedIntent: "screen_repair",
    shouldNotRepeat: ["what model", "which device"],
  },
  
  {
    name: "Battery Inquiry",
    messages: [
      { from: "customer", text: "How much for iPhone 13 battery?" },
    ],
    expectedState: "new_inquiry",
    expectedIntent: "battery_replacement",
    shouldMention: ["£", "battery"],
  },
  
  {
    name: "Repeated Question Test",
    messages: [
      { from: "customer", text: "My phone screen is cracked" },
      { from: "ai", text: "I can help! What make and model is your phone?" },
      { from: "customer", text: "iPhone 12" },
      { from: "ai", text: "Perfect! We have OLED screens at £100..." },
      { from: "customer", text: "Sounds good" },
    ],
    expectedState: "confirming_choice",
    shouldNotRepeat: ["what model", "what make", "which device"],
    shouldKnow: "iPhone 12",
  },
  
  {
    name: "Customer Name Recognition",
    messages: [
      { from: "customer", text: "Hi, I'm Sarah. My iPad screen is broken" },
    ],
    expectedState: "gathering_device_info",
    shouldMention: ["Sarah"],
    shouldNotAsk: ["what's your name"],
  },
];

async function testSmartAI() {
  console.log('🧪 Testing Smart AI System\n');
  console.log('=' .repeat(60));
  
  for (const test of testConversations) {
    console.log(`\n📋 Test: ${test.name}`);
    console.log('-'.repeat(60));
    
    // Display conversation
    console.log('\n💬 Conversation:');
    test.messages.forEach((msg, i) => {
      const prefix = msg.from === 'customer' ? '👤 Customer' : '🤖 AI';
      console.log(`${i + 1}. ${prefix}: ${msg.text.substring(0, 80)}...`);
    });
    
    // Expected results
    console.log('\n✅ Expected Results:');
    if (test.expectedState) {
      console.log(`   State: ${test.expectedState}`);
    }
    if (test.expectedIntent) {
      console.log(`   Intent: ${test.expectedIntent}`);
    }
    if (test.shouldNotRepeat) {
      console.log(`   Should NOT repeat: ${test.shouldNotRepeat.join(', ')}`);
    }
    if (test.shouldMention) {
      console.log(`   Should mention: ${test.shouldMention.join(', ')}`);
    }
    if (test.shouldKnow) {
      console.log(`   Should know: ${test.shouldKnow}`);
    }
    if (test.shouldNotAsk) {
      console.log(`   Should NOT ask: ${test.shouldNotAsk.join(', ')}`);
    }
    
    console.log('\n' + '='.repeat(60));
  }
  
  console.log('\n\n📊 How to Test:');
  console.log('1. Run the learning migration (see RUN_LEARNING_MIGRATION.md)');
  console.log('2. Start your dev server: npm run dev');
  console.log('3. Send test messages via your webhook endpoint');
  console.log('4. Check console logs for [Smart AI] output');
  console.log('5. Verify in Supabase:');
  console.log('   - conversation_context table shows correct state/intent');
  console.log('   - ai_analytics table tracks performance');
  console.log('   - AI responses don\'t repeat questions');
  console.log('\n');
  
  console.log('📝 SQL Queries to Check Results:\n');
  console.log('-- View conversation states');
  console.log('SELECT c.id, c.phone, ctx.state, ctx.intent, ctx.device_model, ctx.customer_name');
  console.log('FROM conversations c');
  console.log('JOIN conversation_context ctx ON c.id = ctx.conversation_id');
  console.log('ORDER BY ctx.created_at DESC');
  console.log('LIMIT 10;\n');
  
  console.log('-- View AI analytics');
  console.log('SELECT intent, state, response_time_ms, total_tokens, cost_usd,');
  console.log('       validation_passed, handoff_to_staff');
  console.log('FROM ai_analytics');
  console.log('ORDER BY created_at DESC');
  console.log('LIMIT 10;\n');
  
  console.log('-- Check for validation issues');
  console.log('SELECT conversation_id, validation_issues, created_at');
  console.log('FROM ai_analytics');
  console.log('WHERE validation_passed = false');
  console.log('ORDER BY created_at DESC;\n');
}

// Run tests
testSmartAI().catch(console.error);
