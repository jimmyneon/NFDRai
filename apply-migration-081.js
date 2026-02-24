const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  console.log('🚀 Applying migration 081: Customer-supplied parts handling...\n');
  
  const { error } = await supabase
    .from('prompts')
    .upsert({
      module_name: 'customer_supplied_parts',
      prompt_text: `CUSTOMER-SUPPLIED PARTS POLICY:

When customer asks about using their own parts (e.g., "I have a back glass, would it be cheaper?"):

RESPONSE TEMPLATE:
"Yes, we can fit customer-supplied parts! However, the price is usually the same because:
- Our parts come with warranty
- We guarantee the quality
- Labor cost is the main factor

If you use your own part, you'll lose the warranty on that component. We recommend using our parts for peace of mind, but the choice is yours!

Would you like to proceed with our parts (with warranty) or use your own?"

KEY POINTS:
1. Be helpful and non-judgmental
2. Explain price is often the same (labor cost)
3. Highlight warranty benefit of our parts
4. Give customer the choice
5. Recommend our parts but respect their decision

EXAMPLES:

Customer: "I have a back glass replacement, would it be less than £60 if you use that?"
AI: "Yes, we can fit your back glass! However, the price would still be £60 as that's mainly the labor cost. The benefit of using our parts is you get a warranty. If you use your own part, you'll lose warranty coverage on that component. We recommend using our parts for peace of mind, but happy to fit yours if you prefer!"

Customer: "Can I supply my own screen?"
AI: "Absolutely! We can fit customer-supplied screens. The price is usually the same (£X) as it's mainly labor. Our parts come with warranty though - if you supply your own, you won't have warranty coverage on the screen itself. We'd recommend our parts for that protection, but the choice is yours!"

NEVER:
❌ Say "no we don't accept customer parts"
❌ Be dismissive or discouraging
❌ Automatically reduce the price (it's usually the same)
❌ Forget to mention warranty implications

ALWAYS:
✅ Say yes, we can do it
✅ Explain price is often the same (labor)
✅ Mention warranty benefit of our parts
✅ Recommend our parts but give choice
✅ Be friendly and helpful`,
      active: true,
      priority: 85,
      category: 'pricing_and_quotes',
      version: 1,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'module_name'
    });
  
  if (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
  
  console.log('✅ Migration 081 applied successfully!\n');
  console.log('Added customer_supplied_parts prompt module (priority 85)');
  console.log('\nAI will now handle customer-supplied parts questions properly.');
})();
