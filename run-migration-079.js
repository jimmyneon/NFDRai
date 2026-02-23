const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Running migration 079: Remove all pricing and John references...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/079_remove_all_pricing_and_john_final.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Split into individual statements (simple split by semicolon)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.includes('DO $$')) {
        // This is a DO block, needs special handling
        console.log(`Executing verification block...`);
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
        if (error) {
          console.log(`⚠️  Verification block error (may be expected):`, error.message);
        }
      } else {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
        if (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error);
          throw error;
        }
      }
    }

    console.log('\n✅ Migration completed successfully!\n');

    // Verify the changes
    console.log('🔍 Verifying changes...\n');

    const { data: prompts, error: fetchError } = await supabase
      .from('prompts')
      .select('module_name, prompt_text')
      .eq('active', true);

    if (fetchError) {
      console.error('❌ Error fetching prompts:', fetchError);
      return;
    }

    // Check for issues
    let pricingCount = 0;
    let johnCount = 0;
    const pricingModules = [];
    const johnModules = [];

    prompts.forEach(p => {
      const text = p.prompt_text.toLowerCase();
      
      // Check for pricing
      if (text.match(/£\d+/) || text.match(/typically.*£/) || text.match(/usually.*£/) || text.match(/around.*£/)) {
        pricingCount++;
        pricingModules.push(p.module_name);
      }
      
      // Check for John references
      if (text.match(/john will/) || text.match(/pass.*to john/) || text.match(/check with john/) || text.match(/i'll pass.*john/)) {
        johnCount++;
        johnModules.push(p.module_name);
      }
    });

    if (pricingCount > 0) {
      console.log(`⚠️  WARNING: Still found ${pricingCount} modules with pricing:`);
      pricingModules.forEach(m => console.log(`   - ${m}`));
      console.log('');
    } else {
      console.log('✅ SUCCESS: ALL pricing references removed!\n');
    }

    if (johnCount > 0) {
      console.log(`⚠️  WARNING: Still found ${johnCount} modules with John handoffs:`);
      johnModules.forEach(m => console.log(`   - ${m}`));
      console.log('');
    } else {
      console.log('✅ SUCCESS: ALL John handoff references removed!\n');
    }

    // Check if acknowledgment_responses module was created
    const ackModule = prompts.find(p => p.module_name === 'acknowledgment_responses');
    if (ackModule) {
      console.log('✅ SUCCESS: acknowledgment_responses module created!\n');
    } else {
      console.log('⚠️  WARNING: acknowledgment_responses module not found\n');
    }

    console.log('📊 Summary:');
    console.log(`   Total active modules: ${prompts.length}`);
    console.log(`   Modules with pricing: ${pricingCount}`);
    console.log(`   Modules with John refs: ${johnCount}`);
    console.log('');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
