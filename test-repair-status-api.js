/**
 * Test script to verify repair status API is working
 * This tests the actual API endpoint that AI Steve uses
 */

const REPAIR_APP_STATUS_API_URL =
  "https://nfd-repairs-app.vercel.app/api/jobs/check-status";

// Test phone numbers - replace with real numbers from your system
// Use a phone number that has actual repairs in the system to verify the API returns data
const TEST_PHONE_NUMBERS = [
  // TODO: Replace with a real phone number from your system that has repairs
  // Example: "07123456789"
  // Example: "+447123456789"
];

async function testRepairStatusAPI(phone) {
  console.log(`\n=== Testing repair status for phone: ${phone} ===`);

  try {
    const url = `${REPAIR_APP_STATUS_API_URL}?phone=${encodeURIComponent(phone)}`;
    console.log(`Calling: ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API error: ${response.status}`);
      console.error(`Error text: ${errorText}`);
      return {
        success: false,
        phone,
        error: `API returned ${response.status}`,
      };
    }

    const data = await response.json();
    console.log(`✅ API call successful`);
    console.log(`Jobs found: ${data.jobs?.length || 0}`);

    if (data.jobs && data.jobs.length > 0) {
      console.log(`\n--- Job Details ---`);
      data.jobs.forEach((job, index) => {
        console.log(`\nJob ${index + 1}:`);
        console.log(`  ID: ${job.id}`);
        console.log(`  Job Ref: ${job.job_ref}`);
        console.log(`  Customer: ${job.customer_name}`);
        console.log(`  Device: ${job.device_make} ${job.device_model}`);
        console.log(`  Issue: ${job.issue}`);
        console.log(`  Status: ${job.status_label}`);
        console.log(`  Quoted Price: ${job.quoted_price || "N/A"}`);
        console.log(`  Total Price: ${job.price_total || "N/A"}`);
        console.log(`  Tracking URL: ${job.tracking_url || "N/A"}`);
        console.log(`  Created: ${job.created_at}`);
        console.log(`  Updated: ${job.updated_at}`);
      });
    } else {
      console.log(`\n⚠️ No jobs found for this phone number`);
      console.log(`This is expected if no repairs exist for this number`);
    }

    return {
      success: true,
      phone,
      jobs: data.jobs || [],
    };
  } catch (error) {
    console.error(`❌ Exception: ${error.message}`);
    return {
      success: false,
      phone,
      error: error.message,
    };
  }
}

async function runTests() {
  console.log("=== REPAIR STATUS API TEST ===");
  console.log(`API Endpoint: ${REPAIR_APP_STATUS_API_URL}`);
  console.log(`\nTesting ${TEST_PHONE_NUMBERS.length} phone number(s)...`);

  const results = [];

  for (const phone of TEST_PHONE_NUMBERS) {
    const result = await testRepairStatusAPI(phone);
    results.push(result);
  }

  console.log("\n=== SUMMARY ===");
  results.forEach((result, index) => {
    console.log(`\nTest ${index + 1}: ${result.phone}`);
    console.log(`  Success: ${result.success}`);
    if (result.success) {
      console.log(`  Jobs found: ${result.jobs.length}`);
    } else {
      console.log(`  Error: ${result.error}`);
    }
  });

  const successCount = results.filter((r) => r.success).length;
  const totalJobs = results.reduce((sum, r) => sum + (r.jobs?.length || 0), 0);

  console.log(`\n=== OVERALL RESULTS ===`);
  console.log(`Tests passed: ${successCount}/${results.length}`);
  console.log(`Total jobs found: ${totalJobs}`);

  if (successCount === results.length) {
    console.log(`\n✅ All API calls successful`);
    if (totalJobs === 0) {
      console.log(
        `⚠️ No jobs found - you may need to use a phone number that has actual repairs`,
      );
    }
  } else {
    console.log(`\n❌ Some API calls failed - check the errors above`);
  }
}

// Run the tests
runTests().catch(console.error);
