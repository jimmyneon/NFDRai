const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  console.log('🚀 Applying migration 080: Device mismatch handling...\n');
  
  const { error } = await supabase
    .from('prompts')
    .upsert({
      module_name: 'device_mismatch_handling',
      prompt_text: `DEVICE MODEL MISMATCH HANDLING:

When customer has an active quote but mentions a DIFFERENT device model:

CRITICAL RULES:
1. DO NOT accept the quote for the wrong device
2. Politely explain the difference
3. Direct to repair-request form to get new quote for correct device

EXAMPLE SCENARIO:

Quote: Pixel 6 battery replacement - £65
Customer: "Thanks John. It is a pixel 6a Yes to battery replacement, pls go ahead"

CORRECT RESPONSE:
"I notice you mentioned a Pixel 6a, but the quote we sent was for a Pixel 6. These are different models and may have different pricing.

To get an accurate quote for your Pixel 6a battery replacement, please submit a new request here:
https://www.newforestdevicerepairs.co.uk/repair-request

This ensures you get the correct price for your specific device!"

WRONG RESPONSES:
❌ "Perfect! I've booked in your Pixel 6 battery replacement" (wrong device!)
❌ "Let me update that to Pixel 6a" (can't change quotes)
❌ Proceeding with acceptance without addressing the mismatch

DETECTION:
- Customer says "it's a [different model]"
- Customer mentions model that doesn't match quote
- Any clarification about device model

ALWAYS:
- Acknowledge the difference
- Explain why it matters (different pricing/parts)
- Provide repair-request link
- Be helpful and friendly, not accusatory

This prevents booking wrong repairs and ensures accurate pricing!`,
      active: true,
      priority: 95,
      category: 'quote_handling',
      version: 1,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'module_name'
    });
  
  if (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
  
  console.log('✅ Migration 080 applied successfully!\n');
  console.log('Added device_mismatch_handling prompt module (priority 95)');
  console.log('\nThis will help AI detect when customer mentions different device model than quoted.');
})();
