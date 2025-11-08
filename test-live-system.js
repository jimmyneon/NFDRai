#!/usr/bin/env node

/**
 * Live System Test - Tests actual API endpoints
 * Run this to verify the AI system is working with database modules
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.VERCEL_URL || 'http://localhost:3000';
const TEST_PHONE = '+447700900000'; // Test phone number

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║          LIVE SYSTEM TEST                                  ║');
console.log('║          Testing AI with Database Modules                  ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log(`📡 Testing against: ${BASE_URL}\n`);

// Test cases
const tests = [
  {
    name: 'Device Model Detection',
    message: 'I have a broken phone but I don\'t know the model',
    expectedInResponse: ['Settings', 'General', 'About'],
    notExpectedInResponse: ['bring it in'],
    description: 'Should help customer find model before suggesting visit'
  },
  {
    name: 'Screen Repair Query',
    message: 'How much for iPhone 12 screen?',
    expectedInResponse: ['OLED', '£100', 'genuine', 'warranty'],
    notExpectedInResponse: ['turnaround', 'how long'],
    description: 'Should provide pricing without mentioning turnaround'
  },
  {
    name: 'Business Hours Query',
    message: 'What are your opening hours?',
    expectedInResponse: ['Monday', 'Friday'],
    notExpectedInResponse: ['£', 'repair', 'screen'],
    description: 'Should only provide hours info, not repair details'
  }
];

// Function to make API request
function makeRequest(message) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      phone: TEST_PHONE,
      message: message,
      timestamp: new Date().toISOString()
    });

    const url = new URL(`${BASE_URL}/api/messages/incoming`);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = lib.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Run tests
async function runTests() {
  console.log('🧪 Running tests...\n');
  
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`TEST: ${test.name}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📤 Message: "${test.message}"`);
    console.log(`📝 ${test.description}\n`);

    try {
      const result = await makeRequest(test.message);
      
      if (result.status !== 200) {
        console.log(`❌ FAILED - HTTP ${result.status}`);
        console.log(`Response: ${JSON.stringify(result.data, null, 2)}`);
        failed++;
        continue;
      }

      const response = result.data.response || result.data.message || '';
      console.log(`📥 Response: "${response.substring(0, 200)}${response.length > 200 ? '...' : ''}"\n`);

      // Check expected phrases
      let testPassed = true;
      
      if (test.expectedInResponse) {
        console.log('✓ Checking for expected phrases:');
        for (const phrase of test.expectedInResponse) {
          const found = response.toLowerCase().includes(phrase.toLowerCase());
          console.log(`  ${found ? '✓' : '✗'} "${phrase}" ${found ? 'found' : 'NOT FOUND'}`);
          if (!found) testPassed = false;
        }
      }

      if (test.notExpectedInResponse) {
        console.log('\n✗ Checking phrases should NOT appear:');
        for (const phrase of test.notExpectedInResponse) {
          const found = response.toLowerCase().includes(phrase.toLowerCase());
          console.log(`  ${!found ? '✓' : '✗'} "${phrase}" ${!found ? 'not found (good)' : 'FOUND (bad)'}`);
          if (found) testPassed = false;
        }
      }

      // Check sign-off
      const hasSignOff = response.includes('Many Thanks') && 
                        response.includes('AI Steve') && 
                        response.includes('New Forest Device Repairs');
      console.log(`\n${hasSignOff ? '✓' : '✗'} Sign-off present: ${hasSignOff ? 'YES' : 'NO'}`);
      if (!hasSignOff) testPassed = false;

      if (testPassed) {
        console.log(`\n✅ TEST PASSED`);
        passed++;
      } else {
        console.log(`\n❌ TEST FAILED`);
        failed++;
      }

      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.log(`❌ FAILED - Error: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n\n${'='.repeat(60)}`);
  console.log('RESULTS');
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ Passed: ${passed}/${tests.length}`);
  console.log(`❌ Failed: ${failed}/${tests.length}`);
  console.log(`${'='.repeat(60)}\n`);

  if (failed === 0) {
    console.log('🎉 All tests passed! System is working correctly.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Check the output above.\n');
    process.exit(1);
  }
}

// Check if server is reachable
console.log('🔍 Checking if server is reachable...\n');

const url = new URL(BASE_URL);
const isHttps = url.protocol === 'https:';
const lib = isHttps ? https : http;

const healthCheck = lib.request({
  hostname: url.hostname,
  port: url.port || (isHttps ? 443 : 80),
  path: '/',
  method: 'GET'
}, (res) => {
  console.log(`✓ Server reachable (HTTP ${res.statusCode})\n`);
  runTests();
});

healthCheck.on('error', (error) => {
  console.log(`❌ Cannot reach server: ${error.message}`);
  console.log(`\nMake sure your server is running at: ${BASE_URL}`);
  console.log(`Or set VERCEL_URL environment variable to your deployment URL\n`);
  process.exit(1);
});

healthCheck.end();
