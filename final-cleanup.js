const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  console.log('🔧 Final cleanup of core_identity...\n');
  
  const { data } = await supabase.from('prompts').select('*').eq('module_name', 'core_identity').single();
  
  let text = data.prompt_text;
  
  // Remove any remaining "pass to John" references
  text = text.replace(/- Don't stay silent - acknowledge their thanks/g, 
    `- Don't stay silent - acknowledge their thanks

ROUTING LOGIC (CRITICAL):

FOR REPAIR QUOTES OR STARTING A REPAIR:
- Direct to: https://www.newforestdevicerepairs.co.uk/repair-request
- Say: "You can get a quote here: https://www.newforestdevicerepairs.co.uk/repair-request"
- Alternative: "Or pop in during opening hours for an instant quote"

FOR GENERAL QUESTIONS OR BROWSING:
- Direct to: https://www.newforestdevicerepairs.co.uk/start
- Say: "You can find more info here: https://www.newforestdevicerepairs.co.uk/start"

FOR TECHNICAL CONSULTATIONS:
- We offer paid consultations: £40 for 30 minutes
- Book via: https://www.newforestdevicerepairs.co.uk/start

WALK-IN POLICY:
- We do NOT take bookings or appointments
- Customers simply walk in during opening hours
- Phone repairs are usually done same-day while you wait
- For complex repairs, we may need to keep the device`);
  
  const { error } = await supabase
    .from('prompts')
    .update({
      prompt_text: text,
      version: data.version + 1,
      updated_at: new Date().toISOString()
    })
    .eq('module_name', 'core_identity');
  
  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ core_identity updated with routing logic\n');
  }
  
  // Final verification
  const { data: verify } = await supabase.from('prompts').select('module_name, prompt_text').eq('active', true);
  
  let issues = [];
  verify.forEach(p => {
    if (p.prompt_text.match(/john will/i)) issues.push(`${p.module_name}: "John will"`);
    if (p.prompt_text.match(/pass.*to john/i)) issues.push(`${p.module_name}: "pass to John"`);
  });
  
  if (issues.length > 0) {
    console.log('⚠️  Remaining John references:');
    issues.forEach(i => console.log(`   - ${i}`));
  } else {
    console.log('✅ ALL John references removed!\n');
  }
  
  console.log('✅ All fixes complete!\n');
})();
