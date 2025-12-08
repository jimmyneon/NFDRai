/**
 * Test script for Repair Flow API
 *
 * Tests the guided repair flow for the website widget.
 * Run: node test-repair-flow.js
 */

// Import the repair flow handler directly for unit testing
const {
  handleRepairFlow,
  isRepairFlowRequest,
  DEVICE_CONFIGS,
} = require("./app/lib/repair-flow");

// Test cases
const testCases = [
  {
    name: "Step 1: Greeting (Initial Load)",
    request: {
      type: "repair_flow",
      message: "__init__",
      context: { step: "greeting", device_type: null },
    },
    expected: {
      hasMessages: true,
      hasQuickActions: true,
      morphLayout: false,
      sceneNull: true,
    },
  },
  {
    name: "Step 2: iPhone Selected",
    request: {
      type: "repair_flow",
      message: "iPhone",
      context: { step: "device_selected", device_type: "iphone" },
    },
    expected: {
      hasMessages: true,
      hasQuickActions: true,
      morphLayout: true,
      sceneNotNull: true,
      deviceType: "iphone",
    },
  },
  {
    name: "Step 2: Samsung Selected",
    request: {
      type: "repair_flow",
      message: "Samsung",
      context: { step: "device_selected", device_type: "samsung" },
    },
    expected: {
      hasMessages: true,
      hasQuickActions: true,
      morphLayout: true,
      sceneNotNull: true,
      deviceType: "samsung",
    },
  },
  {
    name: "Step 2: PlayStation Selected",
    request: {
      type: "repair_flow",
      message: "PlayStation",
      context: { step: "device_selected", device_type: "ps5" },
    },
    expected: {
      hasMessages: true,
      hasQuickActions: true,
      morphLayout: true,
      sceneNotNull: true,
      deviceType: "ps5",
    },
  },
  {
    name: "Step 3: Screen Issue Selected",
    request: {
      type: "repair_flow",
      message: "Screen Repair",
      context: {
        step: "issue_selected",
        device_type: "iphone",
        issue: "screen",
      },
    },
    expected: {
      hasMessages: true,
      hasQuickActions: true,
      morphLayout: true,
      sceneNotNull: true,
      selectedJob: "screen",
      showBookCta: true,
    },
  },
  {
    name: "Step 3: Battery Issue Selected",
    request: {
      type: "repair_flow",
      message: "Battery",
      context: {
        step: "issue_selected",
        device_type: "iphone",
        issue: "battery",
      },
    },
    expected: {
      hasMessages: true,
      hasQuickActions: true,
      morphLayout: true,
      sceneNotNull: true,
      selectedJob: "battery",
      showBookCta: true,
    },
  },
  {
    name: "Type Guard: Valid repair_flow request",
    request: {
      type: "repair_flow",
      message: "test",
      context: { step: "greeting", device_type: null },
    },
    isTypeGuardTest: true,
    expected: true,
  },
  {
    name: "Type Guard: Standard chat request (not repair_flow)",
    request: {
      message: "Hello",
      session_id: "abc123",
    },
    isTypeGuardTest: true,
    expected: false,
  },
  {
    name: "Type Guard: Missing context",
    request: {
      type: "repair_flow",
      message: "test",
    },
    isTypeGuardTest: true,
    expected: false,
  },
];

async function runTests() {
  console.log("🔧 Testing Repair Flow API\n");
  console.log("=".repeat(60));

  let passed = 0;
  let failed = 0;

  for (const test of testCases) {
    try {
      if (test.isTypeGuardTest) {
        // Test type guard
        const result = isRepairFlowRequest(test.request);
        if (result === test.expected) {
          console.log(`✅ ${test.name}`);
          passed++;
        } else {
          console.log(`❌ ${test.name}`);
          console.log(`   Expected: ${test.expected}, Got: ${result}`);
          failed++;
        }
      } else {
        // Test handler
        const response = await handleRepairFlow(test.request);

        let testPassed = true;
        const errors = [];

        // Check expected conditions
        if (
          test.expected.hasMessages &&
          (!response.messages || response.messages.length === 0)
        ) {
          testPassed = false;
          errors.push("Expected messages but got none");
        }

        if (
          test.expected.hasQuickActions &&
          (!response.quick_actions || response.quick_actions.length === 0)
        ) {
          testPassed = false;
          errors.push("Expected quick_actions but got none");
        }

        if (
          test.expected.morphLayout !== undefined &&
          response.morph_layout !== test.expected.morphLayout
        ) {
          testPassed = false;
          errors.push(
            `Expected morph_layout=${test.expected.morphLayout}, got ${response.morph_layout}`
          );
        }

        if (test.expected.sceneNull && response.scene !== null) {
          testPassed = false;
          errors.push("Expected scene to be null");
        }

        if (test.expected.sceneNotNull && response.scene === null) {
          testPassed = false;
          errors.push("Expected scene to not be null");
        }

        if (
          test.expected.deviceType &&
          response.scene?.device_type !== test.expected.deviceType
        ) {
          testPassed = false;
          errors.push(
            `Expected device_type=${test.expected.deviceType}, got ${response.scene?.device_type}`
          );
        }

        if (
          test.expected.selectedJob &&
          response.scene?.selected_job !== test.expected.selectedJob
        ) {
          testPassed = false;
          errors.push(
            `Expected selected_job=${test.expected.selectedJob}, got ${response.scene?.selected_job}`
          );
        }

        if (test.expected.showBookCta && !response.scene?.show_book_cta) {
          testPassed = false;
          errors.push("Expected show_book_cta=true");
        }

        if (testPassed) {
          console.log(`✅ ${test.name}`);
          passed++;
        } else {
          console.log(`❌ ${test.name}`);
          errors.forEach((e) => console.log(`   - ${e}`));
          failed++;
        }
      }
    } catch (error) {
      console.log(`❌ ${test.name}`);
      console.log(`   Error: ${error.message}`);
      failed++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`Results: ${passed} passed, ${failed} failed`);

  // Show device configs
  console.log("\n📱 Available Device Configs:");
  Object.keys(DEVICE_CONFIGS).forEach((key) => {
    const config = DEVICE_CONFIGS[key];
    console.log(`   - ${config.name}: ${config.jobs.length} repair types`);
  });

  return failed === 0;
}

// Run tests
runTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Test runner error:", error);
    process.exit(1);
  });
