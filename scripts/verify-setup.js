#!/usr/bin/env node

/**
 * Setup Verification Script
 * Run this to verify your installation is complete
 */

const fs = require('fs');
const path = require('path');

const checks = [];
let passed = 0;
let failed = 0;

function check(name, condition, fix) {
  checks.push({ name, condition, fix });
  if (condition) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}`);
    if (fix) console.log(`   Fix: ${fix}`);
    failed++;
  }
}

console.log('\n🔍 Verifying New Forest Device Repairs AI Responder Setup...\n');

// Check Node version
const nodeVersion = process.version;
const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0]);
check(
  'Node.js version >= 18',
  nodeMajor >= 18,
  `Update Node.js to v18 or higher. Current: ${nodeVersion}`
);

// Check package.json
check(
  'package.json exists',
  fs.existsSync('package.json'),
  'Run npm init or restore package.json'
);

// Check node_modules
check(
  'Dependencies installed',
  fs.existsSync('node_modules'),
  'Run: npm install'
);

// Check .env.local
const hasEnv = fs.existsSync('.env.local');
check(
  '.env.local exists',
  hasEnv,
  'Copy .env.example to .env.local and fill in values'
);

if (hasEnv) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  
  check(
    'NEXT_PUBLIC_SUPABASE_URL set',
    envContent.includes('NEXT_PUBLIC_SUPABASE_URL=') && !envContent.includes('your_supabase'),
    'Add your Supabase project URL'
  );
  
  check(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY set',
    envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=') && !envContent.includes('your_supabase'),
    'Add your Supabase anon key'
  );
  
  // Note: AI keys are managed in the admin dashboard, not in .env
  // This check is removed as keys are stored in the database
}

// Check key directories
check(
  'app directory exists',
  fs.existsSync('app'),
  'Restore app directory from repository'
);

check(
  'components directory exists',
  fs.existsSync('components'),
  'Restore components directory from repository'
);

check(
  'lib directory exists',
  fs.existsSync('lib'),
  'Restore lib directory from repository'
);

// Check key files
check(
  'tailwind.config.ts exists',
  fs.existsSync('tailwind.config.ts'),
  'Restore tailwind.config.ts'
);

check(
  'next.config.js exists',
  fs.existsSync('next.config.js'),
  'Restore next.config.js'
);

check(
  'middleware.ts exists',
  fs.existsSync('middleware.ts'),
  'Restore middleware.ts'
);

// Check Supabase migration
check(
  'Supabase migration exists',
  fs.existsSync('supabase/migrations/001_initial_schema.sql'),
  'Restore supabase/migrations/001_initial_schema.sql'
);

// Check documentation
check(
  'README.md exists',
  fs.existsSync('README.md'),
  'Restore README.md'
);

check(
  'tasks.md exists',
  fs.existsSync('tasks.md'),
  'Restore tasks.md'
);

// Summary
console.log('\n' + '='.repeat(50));
console.log(`\n✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);

if (failed === 0) {
  console.log('\n🎉 All checks passed! Your setup is complete.');
  console.log('\nNext steps:');
  console.log('1. Run: npm run dev');
  console.log('2. Visit: http://localhost:3000');
  console.log('3. Create your first admin user');
  console.log('4. Configure AI settings in dashboard');
  console.log('\nSee tasks.md for detailed setup instructions.');
} else {
  console.log('\n⚠️  Some checks failed. Please fix the issues above.');
  console.log('\nFor help, see:');
  console.log('- README.md for full documentation');
  console.log('- tasks.md for step-by-step setup');
  console.log('- DEPLOYMENT.md for quick start guide');
}

console.log('\n' + '='.repeat(50) + '\n');

process.exit(failed > 0 ? 1 : 0);
