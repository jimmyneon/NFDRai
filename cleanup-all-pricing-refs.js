const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupAllPricing() {
  console.log('🧹 Cleaning up ALL pricing and John references...\n');

  try {
    // Get all active prompts
    const { data: prompts, error: fetchError } = await supabase
      .from('prompts')
      .select('*')
      .eq('active', true);

    if (fetchError) throw fetchError;

    console.log(`📊 Found ${prompts.length} active modules\n`);

    let updatedCount = 0;

    for (const prompt of prompts) {
      let text = prompt.prompt_text;
      let needsUpdate = false;

      // Remove price patterns
      const pricePatterns = [
        { pattern: /£\d+(-£?\d+)?/g, replacement: '[see website for quote]' },
        { pattern: /typically (around|costs?) £?\d+/gi, replacement: 'get a quote at https://www.newforestdevicerepairs.co.uk/repair-request' },
        { pattern: /usually (around|costs?) £?\d+/gi, replacement: 'get a quote at https://www.newforestdevicerepairs.co.uk/repair-request' },
        { pattern: /around £?\d+/gi, replacement: 'get a quote at https://www.newforestdevicerepairs.co.uk/repair-request' },
        { pattern: /ranges? from £?\d+/gi, replacement: 'get a quote at https://www.newforestdevicerepairs.co.uk/repair-request' },
      ];

      for (const { pattern, replacement } of pricePatterns) {
        if (pattern.test(text)) {
          text = text.replace(pattern, replacement);
          needsUpdate = true;
        }
      }

      // Remove John references
      const johnPatterns = [
        { pattern: /John will (confirm|get back|assess|check)/gi, replacement: 'you can get more info at https://www.newforestdevicerepairs.co.uk/start' },
        { pattern: /I'll pass (this )?to John/gi, replacement: 'you can get help at https://www.newforestdevicerepairs.co.uk/start' },
        { pattern: /pass (this )?to John/gi, replacement: 'get help at https://www.newforestdevicerepairs.co.uk/start' },
        { pattern: /check with John/gi, replacement: 'check our website at https://www.newforestdevicerepairs.co.uk/start' },
      ];

      for (const { pattern, replacement } of johnPatterns) {
        if (pattern.test(text)) {
          text = text.replace(pattern, replacement);
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        console.log(`🔧 Updating ${prompt.module_name}...`);
        
        const { error: updateError } = await supabase
          .from('prompts')
          .update({
            prompt_text: text,
            version: prompt.version + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', prompt.id);

        if (updateError) {
          console.error(`❌ Error updating ${prompt.module_name}:`, updateError);
        } else {
          updatedCount++;
        }
      }
    }

    console.log(`\n✅ Updated ${updatedCount} modules\n`);

    // Verify
    console.log('🔍 Verifying...\n');
    
    const { data: verifyPrompts } = await supabase
      .from('prompts')
      .select('module_name, prompt_text')
      .eq('active', true);

    let remainingIssues = [];
    verifyPrompts.forEach(p => {
      const text = p.prompt_text;
      if (text.match(/£\d+/)) remainingIssues.push(`${p.module_name}: contains price`);
      if (text.match(/john will/i)) remainingIssues.push(`${p.module_name}: mentions "John will"`);
      if (text.match(/pass.*to john/i)) remainingIssues.push(`${p.module_name}: mentions passing to John`);
    });

    if (remainingIssues.length > 0) {
      console.log('⚠️  Remaining issues:');
      remainingIssues.forEach(i => console.log(`   - ${i}`));
      console.log('\n💡 These may be in examples or documentation - review manually if needed\n');
    } else {
      console.log('✅ ALL pricing and John references removed!\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupAllPricing();
