/**
 * Comprehensive AI Steve Test Suite
 * Tests all critical behaviors to prevent "daft stuff"
 */

const testScenarios = {
  // CATEGORY 1: GREETING TESTS
  greeting: [
    {
      name: "Should say 'Hi [name]!' not '[name]!'",
      customerName: "Edita",
      message: "Hello, I need help",
      mustInclude: ["Hi Edita", "Hi there"],
      mustNotInclude: ["Edita!"],
      mustNotStartWith: ["Edita!"],
      severity: "CRITICAL"
    },
    {
      name: "Should greet warmly without name",
      customerName: null,
      message: "Hello",
      mustInclude: ["Hi!", "Hi there!"],
      mustNotInclude: ["Hi [name]"],
      severity: "HIGH"
    }
  ],

  // CATEGORY 2: TIMESTAMP AWARENESS
  timestampAwareness: [
    {
      name: "Should ignore 'ready for collection' from 15 days ago",
      message: "Is my iPad ready?",
      conversationHistory: [
        { sender: "staff", text: "Your devices are ready for collection", daysAgo: 15 }
      ],
      apiResponse: { jobs: [], success: true },
      mustNotInclude: ["ready for collection", "it's ready", "you can collect"],
      mustInclude: ["don't see any active repairs", "check current status"],
      severity: "CRITICAL"
    },
    {
      name: "Should use recent message from today",
      message: "Is my phone ready?",
      conversationHistory: [
        { sender: "staff", text: "Your device is ready for collection", daysAgo: 0 }
      ],
      mustInclude: ["ready for collection", "John sent a message"],
      severity: "HIGH"
    },
    {
      name: "Should prefer API data over old messages",
      message: "How's my repair going?",
      conversationHistory: [
        { sender: "staff", text: "Your device is ready", daysAgo: 10 }
      ],
      apiResponse: { 
        jobs: [{ status: "In progress", jobRef: "#12345" }], 
        success: true 
      },
      mustInclude: ["in progress", "#12345"],
      mustNotInclude: ["ready for collection"],
      severity: "CRITICAL"
    }
  ],

  // CATEGORY 3: API ACCESS
  apiAccess: [
    {
      name: "Should NOT say 'I don't have access to repair statuses'",
      message: "Is my Samsung S22 done?",
      apiResponse: { 
        jobs: [{ status: "Ready for collection", jobRef: "#12345" }], 
        success: true 
      },
      mustNotInclude: [
        "I don't have access",
        "I can't check repair status",
        "I don't have that information"
      ],
      mustInclude: ["ready", "#12345"],
      severity: "CRITICAL"
    },
    {
      name: "Should use API data when available",
      message: "Where's my repair?",
      apiResponse: { 
        jobs: [{ status: "Parts ordered", jobRef: "#67890" }], 
        success: true 
      },
      mustInclude: ["parts", "#67890"],
      severity: "HIGH"
    },
    {
      name: "Should handle no jobs found gracefully",
      message: "Is my phone ready?",
      apiResponse: { jobs: [], success: true },
      mustNotInclude: ["ready for collection"],
      mustInclude: ["don't see any active repairs"],
      severity: "HIGH"
    }
  ],

  // CATEGORY 4: CONVERSATION HISTORY AWARENESS
  conversationHistory: [
    {
      name: "Should reference John's recent quote",
      message: "Can I get the cheaper option?",
      conversationHistory: [
        { sender: "staff", text: "£130 for OLED or £110 for LCD", daysAgo: 0 }
      ],
      mustInclude: ["£110", "LCD", "John mentioned"],
      mustNotInclude: ["get a quote here"],
      severity: "CRITICAL"
    },
    {
      name: "Should see John's 'ready' message from earlier today",
      message: "Is my phone ready?",
      conversationHistory: [
        { sender: "staff", text: "Your device is repaired and ready for collection", daysAgo: 0 }
      ],
      mustInclude: ["ready", "John"],
      severity: "HIGH"
    },
    {
      name: "Should NOT reference stale quotes from 2 weeks ago",
      message: "How much for screen repair?",
      conversationHistory: [
        { sender: "staff", text: "Your quote is £150", daysAgo: 14 }
      ],
      mustNotInclude: ["£150"],
      mustInclude: ["repair-request", "quote"],
      severity: "CRITICAL"
    }
  ],

  // CATEGORY 5: PRICING POLICY
  pricing: [
    {
      name: "Should NEVER give pricing estimates",
      message: "How much for iPhone 13 screen?",
      mustNotInclude: [
        "£", "typically", "around", "usually", "roughly", 
        "between", "ranges from", "costs about"
      ],
      mustInclude: ["repair-request"],
      severity: "CRITICAL"
    },
    {
      name: "Should NOT mention John for pricing",
      message: "What's the cost for battery replacement?",
      mustNotInclude: ["John will", "I'll let John", "ask John"],
      mustInclude: ["repair-request"],
      severity: "CRITICAL"
    },
    {
      name: "Should reference existing quote if available",
      message: "How much will it cost?",
      quoteContext: { amount: "£65", device: "Pixel 6a", issue: "Battery" },
      mustInclude: ["£65", "Pixel 6a"],
      mustNotInclude: ["I'll get you a quote"],
      severity: "HIGH"
    }
  ],

  // CATEGORY 6: WALK-IN ALTERNATIVES (FORBIDDEN)
  walkInAlternatives: [
    {
      name: "Should NEVER suggest walk-in for device identification",
      message: "I don't know what model my phone is",
      mustNotInclude: [
        "pop in", "bring it in", "come by", "drop in", 
        "visit us", "stop by", "walk in"
      ],
      mustInclude: ["repair-request"],
      severity: "CRITICAL"
    },
    {
      name: "Should NEVER suggest walk-in for pricing",
      message: "How much for screen repair?",
      mustNotInclude: ["pop in", "bring it in", "come by"],
      mustInclude: ["repair-request"],
      severity: "CRITICAL"
    }
  ],

  // CATEGORY 7: DUAL-VOICE PROTECTION
  dualVoice: [
    {
      name: "Should NOT respond within 30 min of John's message (complex query)",
      message: "How much for iPhone screen?",
      conversationHistory: [
        { sender: "staff", text: "I'll check on that for you", minutesAgo: 15 }
      ],
      shouldRespond: false,
      severity: "CRITICAL"
    },
    {
      name: "Should respond to simple query even if John replied recently",
      message: "When are you open?",
      conversationHistory: [
        { sender: "staff", text: "I'll check on that", minutesAgo: 15 }
      ],
      shouldRespond: true,
      mustInclude: ["open"],
      severity: "HIGH"
    },
    {
      name: "Should respond after 30 minutes",
      message: "How much for screen?",
      conversationHistory: [
        { sender: "staff", text: "I'll check on that", minutesAgo: 35 }
      ],
      shouldRespond: true,
      severity: "HIGH"
    }
  ],

  // CATEGORY 8: DEVICE IDENTIFICATION (ROUTE TO WEBSITE)
  deviceIdentification: [
    {
      name: "Should NOT help find device in Settings",
      message: "How do I find my phone model?",
      mustNotInclude: [
        "Settings", "About", "tap", "go to", "open", 
        "navigate", "find it in"
      ],
      mustInclude: ["repair-request"],
      severity: "CRITICAL"
    },
    {
      name: "Should route to website for device help",
      message: "I don't know what iPhone I have",
      mustInclude: ["repair-request"],
      mustNotInclude: ["Settings > General > About"],
      severity: "CRITICAL"
    }
  ],

  // CATEGORY 9: ACKNOWLEDGMENTS
  acknowledgments: [
    {
      name: "Should NOT respond to pure acknowledgment",
      message: "Thanks John",
      shouldRespond: false,
      severity: "HIGH"
    },
    {
      name: "Should NOT respond to 'Ok'",
      message: "Ok",
      shouldRespond: false,
      severity: "HIGH"
    },
    {
      name: "Should respond to acknowledgment with question",
      message: "Thanks John! When are you open?",
      shouldRespond: true,
      mustInclude: ["open"],
      severity: "HIGH"
    }
  ],

  // CATEGORY 10: SIGN-OFF
  signOff: [
    {
      name: "Should always sign as AI Steve",
      message: "When are you open?",
      mustInclude: ["AI Steve", "New Forest Device Repairs"],
      severity: "CRITICAL"
    },
    {
      name: "Should use proper sign-off format",
      message: "Hello",
      mustInclude: ["Many Thanks", "AI Steve"],
      severity: "HIGH"
    }
  ],

  // CATEGORY 11: READY FOR COLLECTION GUARDRAILS
  readyForCollection: [
    {
      name: "Should ONLY say ready if API confirms",
      message: "Is my phone ready?",
      apiResponse: { jobs: [], success: true },
      conversationHistory: [
        { sender: "staff", text: "Your device is ready", daysAgo: 5 }
      ],
      mustNotInclude: ["ready for collection", "it's ready"],
      severity: "CRITICAL"
    },
    {
      name: "Should say ready if API shows ready",
      message: "Can I collect my phone?",
      apiResponse: { 
        jobs: [{ status: "Ready for collection", jobRef: "#12345" }], 
        success: true 
      },
      mustInclude: ["ready", "#12345"],
      severity: "HIGH"
    }
  ]
};

// Test result tracking
const results = {
  passed: 0,
  failed: 0,
  critical: 0,
  high: 0,
  medium: 0,
  failures: []
};

console.log("=== AI STEVE COMPREHENSIVE TEST SUITE ===\n");
console.log("Testing all critical behaviors to prevent 'daft stuff'\n");

// Count total tests
let totalTests = 0;
Object.values(testScenarios).forEach(category => {
  totalTests += category.length;
});

console.log(`Total test scenarios: ${totalTests}\n`);

// Display test categories
console.log("TEST CATEGORIES:");
Object.keys(testScenarios).forEach((category, index) => {
  const count = testScenarios[category].length;
  console.log(`${index + 1}. ${category}: ${count} tests`);
});

console.log("\n" + "=".repeat(80));
console.log("INSTRUCTIONS FOR MANUAL TESTING:");
console.log("=".repeat(80));
console.log(`
1. Run migrations first:
   cd /Users/johnhopwood/NFDRAIRESPONDER
   supabase migration up

2. For each test scenario below:
   - Send the test message via SMS/webchat
   - Check the AI response against the criteria
   - Mark as PASS ✅ or FAIL ❌

3. Priority levels:
   - CRITICAL: Must pass - breaks core functionality
   - HIGH: Should pass - causes customer confusion
   - MEDIUM: Nice to have - minor issues

4. Focus on CRITICAL tests first

5. Log any failures and patterns
`);

console.log("\n" + "=".repeat(80));
console.log("TEST SCENARIOS:");
console.log("=".repeat(80) + "\n");

// Output all test scenarios
Object.entries(testScenarios).forEach(([categoryName, tests], catIndex) => {
  console.log(`\n${"#".repeat(80)}`);
  console.log(`CATEGORY ${catIndex + 1}: ${categoryName.toUpperCase()}`);
  console.log(`${"#".repeat(80)}\n`);

  tests.forEach((test, testIndex) => {
    console.log(`\nTest ${catIndex + 1}.${testIndex + 1}: ${test.name}`);
    console.log(`Severity: ${test.severity}`);
    console.log("-".repeat(80));
    
    if (test.customerName) {
      console.log(`Customer Name: ${test.customerName}`);
    }
    
    console.log(`Message: "${test.message}"`);
    
    if (test.conversationHistory) {
      console.log("\nConversation History:");
      test.conversationHistory.forEach(msg => {
        const timeAgo = msg.daysAgo !== undefined 
          ? `${msg.daysAgo} days ago` 
          : `${msg.minutesAgo} minutes ago`;
        console.log(`  - [${msg.sender}] (${timeAgo}): "${msg.text}"`);
      });
    }
    
    if (test.apiResponse) {
      console.log("\nAPI Response:");
      console.log(`  Success: ${test.apiResponse.success}`);
      console.log(`  Jobs: ${test.apiResponse.jobs.length}`);
      if (test.apiResponse.jobs.length > 0) {
        test.apiResponse.jobs.forEach(job => {
          console.log(`    - Status: ${job.status}, Ref: ${job.jobRef || 'N/A'}`);
        });
      }
    }
    
    if (test.quoteContext) {
      console.log("\nQuote Context:");
      console.log(`  Amount: ${test.quoteContext.amount}`);
      console.log(`  Device: ${test.quoteContext.device}`);
      console.log(`  Issue: ${test.quoteContext.issue}`);
    }
    
    if (test.shouldRespond !== undefined) {
      console.log(`\nShould AI Respond: ${test.shouldRespond ? "YES" : "NO"}`);
    }
    
    if (test.mustInclude && test.mustInclude.length > 0) {
      console.log("\n✅ MUST INCLUDE:");
      test.mustInclude.forEach(phrase => {
        console.log(`  - "${phrase}"`);
      });
    }
    
    if (test.mustNotInclude && test.mustNotInclude.length > 0) {
      console.log("\n❌ MUST NOT INCLUDE:");
      test.mustNotInclude.forEach(phrase => {
        console.log(`  - "${phrase}"`);
      });
    }
    
    if (test.mustNotStartWith && test.mustNotStartWith.length > 0) {
      console.log("\n❌ MUST NOT START WITH:");
      test.mustNotStartWith.forEach(phrase => {
        console.log(`  - "${phrase}"`);
      });
    }
    
    console.log("\nResult: [ ] PASS  [ ] FAIL");
    console.log("Notes: _________________________________");
    console.log("-".repeat(80));
  });
});

console.log("\n\n" + "=".repeat(80));
console.log("AUTOMATED VALIDATION CHECKLIST");
console.log("=".repeat(80) + "\n");

const validationChecklist = [
  {
    category: "Database Migrations",
    checks: [
      "085_fix_ai_steve_critical_issues.sql applied",
      "086_fix_stale_message_context.sql applied",
      "All prompt modules loaded correctly",
      "No SQL errors in migration logs"
    ]
  },
  {
    category: "Greeting Policy",
    checks: [
      "greeting_policy module active (priority 99)",
      "No responses starting with just '[name]!'",
      "All greetings include 'Hi' or 'Hi there'"
    ]
  },
  {
    category: "Timestamp Awareness",
    checks: [
      "timestamp_awareness module active (priority 100)",
      "Staff messages labeled with age (RECENT/STALE)",
      "Messages >7 days marked as STALE",
      "No status claims from stale messages"
    ]
  },
  {
    category: "API Access",
    checks: [
      "repair_status_api module updated",
      "No 'I don't have access' responses",
      "API checked for status inquiries",
      "[REPAIR STATUS INFORMATION] marker used"
    ]
  },
  {
    category: "Ready for Collection",
    checks: [
      "ready_for_collection_guardrails module active (priority 100)",
      "Only says 'ready' if API confirms",
      "Never uses old messages for ready status",
      "Mentions date if referencing old messages"
    ]
  },
  {
    category: "Pricing Policy",
    checks: [
      "No pricing estimates given",
      "No mentions of John for pricing",
      "Always routes to repair-request form",
      "References existing quotes when available"
    ]
  },
  {
    category: "Walk-in Alternatives",
    checks: [
      "No 'pop in' suggestions for device ID",
      "No 'bring it in' for pricing",
      "Always routes to website workflow"
    ]
  },
  {
    category: "Dual-Voice Protection",
    checks: [
      "30-minute pause after John's message",
      "Simple queries allowed during pause",
      "Complex queries blocked during pause",
      "Auto-resume after 30 minutes"
    ]
  }
];

validationChecklist.forEach((section, index) => {
  console.log(`${index + 1}. ${section.category}`);
  section.checks.forEach(check => {
    console.log(`   [ ] ${check}`);
  });
  console.log();
});

console.log("\n" + "=".repeat(80));
console.log("MONITORING & LOGGING");
console.log("=".repeat(80) + "\n");

console.log("Check Vercel logs for these patterns:\n");

const logPatterns = [
  {
    pattern: "[Conversation History] ✅ Added X staff message(s) to context (X recent, X stale)",
    meaning: "Conversation history loaded with timestamp awareness"
  },
  {
    pattern: "[Repair Status] Customer asking about repair - FORCING API check...",
    meaning: "API check triggered for status inquiry"
  },
  {
    pattern: "[Repair Status] ✅ Found X job(s) - added to AI context",
    meaning: "API data successfully added to context"
  },
  {
    pattern: "[Routing Validator] ⚠️ Violations found",
    meaning: "Response validation caught forbidden content"
  },
  {
    pattern: "[Staff Activity Check] Should AI respond? false",
    meaning: "Dual-voice protection active"
  },
  {
    pattern: "[International Block] ❌",
    meaning: "International number blocked (cost control)"
  }
];

logPatterns.forEach((log, index) => {
  console.log(`${index + 1}. Pattern: "${log.pattern}"`);
  console.log(`   Meaning: ${log.meaning}\n`);
});

console.log("\n" + "=".repeat(80));
console.log("SUMMARY");
console.log("=".repeat(80) + "\n");

console.log(`Total Test Scenarios: ${totalTests}`);
console.log(`Critical Tests: ${Object.values(testScenarios).flat().filter(t => t.severity === 'CRITICAL').length}`);
console.log(`High Priority Tests: ${Object.values(testScenarios).flat().filter(t => t.severity === 'HIGH').length}`);
console.log(`Medium Priority Tests: ${Object.values(testScenarios).flat().filter(t => t.severity === 'MEDIUM').length}`);

console.log("\n📋 NEXT STEPS:");
console.log("1. Run database migrations");
console.log("2. Test CRITICAL scenarios first");
console.log("3. Monitor Vercel logs for patterns");
console.log("4. Document any failures");
console.log("5. Iterate and refine based on results");

console.log("\n✅ This test suite covers:");
console.log("- Greeting behavior");
console.log("- Timestamp awareness");
console.log("- API access and usage");
console.log("- Conversation history awareness");
console.log("- Pricing policy enforcement");
console.log("- Walk-in alternative prevention");
console.log("- Dual-voice protection");
console.log("- Device identification routing");
console.log("- Acknowledgment detection");
console.log("- Sign-off format");
console.log("- Ready for collection guardrails");

console.log("\n" + "=".repeat(80));
console.log("END OF TEST SUITE");
console.log("=".repeat(80));
