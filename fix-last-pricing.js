const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  console.log('🔍 Finding remaining pricing reference...\n');
  
  // Find the module with pricing
  const { data: modules } = await supabase
    .from('prompts')
    .select('module_name, prompt_text, version')
    .eq('active', true);
  
  const modulesWithPricing = modules.filter(m => m.prompt_text.match(/£\d+/));
  
  if (modulesWithPricing.length === 0) {
    console.log('✅ No pricing found!');
    return;
  }
  
  console.log(`Found ${modulesWithPricing.length} module(s) with pricing:\n`);
  
  modulesWithPricing.forEach(m => {
    console.log(`📌 ${m.module_name}`);
    
    // Find all £ references
    const matches = m.prompt_text.match(/£\d+(-£?\d+)?/g);
    if (matches) {
      console.log(`   Pricing found: ${matches.join(', ')}`);
      
      // Show context
      matches.forEach(match => {
        const index = m.prompt_text.indexOf(match);
        const context = m.prompt_text.substring(Math.max(0, index - 50), Math.min(m.prompt_text.length, index + 100));
        console.log(`   Context: ...${context}...`);
      });
    }
    console.log('');
  });
  
  // Fix it
  console.log('🔧 Removing pricing references...\n');
  
  for (const module of modulesWithPricing) {
    let text = module.prompt_text;
    
    // Remove all £ price patterns
    text = text.replace(/£\d+(-£?\d+)?/g, '[see website for quote]');
    
    const { error } = await supabase
      .from('prompts')
      .update({
        prompt_text: text,
        version: module.version + 1,
        updated_at: new Date().toISOString()
      })
      .eq('module_name', module.module_name);
    
    if (error) {
      console.error(`❌ Error updating ${module.module_name}:`, error);
    } else {
      console.log(`✅ Fixed ${module.module_name}`);
    }
  }
  
  // Verify
  console.log('\n🔍 Verifying...\n');
  
  const { data: verify } = await supabase
    .from('prompts')
    .select('module_name')
    .eq('active', true);
  
  const remaining = verify.filter(m => {
    const { data: mod } = supabase.from('prompts').select('prompt_text').eq('module_name', m.module_name).single();
    return mod?.prompt_text?.match(/£\d+/);
  });
  
  // Simpler verification
  const { data: allModules } = await supabase
    .from('prompts')
    .select('module_name, prompt_text')
    .eq('active', true);
  
  const stillHasPricing = allModules.filter(m => m.prompt_text.match(/£\d+/));
  
  if (stillHasPricing.length === 0) {
    console.log('✅ ALL pricing references removed!\n');
  } else {
    console.log(`⚠️  Still ${stillHasPricing.length} module(s) with pricing:`);
    stillHasPricing.forEach(m => console.log(`   - ${m.module_name}`));
  }
})();
