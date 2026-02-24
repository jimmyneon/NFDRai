const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  console.log('🚀 Applying migration 082: Staff context awareness...\n');
  
  const { error } = await supabase
    .from('prompts')
    .upsert({
      module_name: 'staff_context_awareness',
      prompt_text: `STAFF CONTEXT AWARENESS:

When you see a message from "John (Owner)" in the conversation history, you MUST acknowledge and use that context in your response.

CRITICAL RULES:
1. ALWAYS reference what John said if relevant to customer's question
2. NEVER contradict or override John's information
3. Build on John's message, don't ignore it
4. If customer asks something John already answered, refer back to his message

EXAMPLES:

Conversation:
John: "Your iPhone is ready, £149.99"
Customer: "Great! Do you do Samsung repairs?"

CORRECT RESPONSE:
"Yes, we do Samsung repairs! We can fix screens, batteries, charging ports, and more.

For a quote on your Samsung, visit:
https://www.newforestdevicerepairs.co.uk/repair-request

Your iPhone is ready to collect whenever you're ready (£149.99 as John mentioned)."

WRONG RESPONSE:
❌ "Yes, we do Samsung repairs! What model do you have?" (ignores John's message about iPhone)

---

Conversation:
John: "Your quote for the Pixel 6 battery is £65"
Customer: "Can you fix the screen too?"

CORRECT RESPONSE:
"Yes, we can fix your Pixel 6 screen as well! 

For a combined quote (battery + screen), I'll need John to send you an updated quote with both repairs included.

He'll get that over to you shortly. The battery alone is £65 as mentioned."

WRONG RESPONSE:
❌ "Yes, screen repairs are £X" (should get John to quote, not give price)

---

Conversation:
John: "Your Samsung is ready for collection"
Customer: "What were the opening hours again?"

CORRECT RESPONSE:
"We're open:
Monday-Friday: 10am-5pm
Saturday: 10am-2pm
Sunday: Closed

Your Samsung is ready to collect whenever suits you during those hours!"

WRONG RESPONSE:
❌ Just gives hours without mentioning the ready device

---

KEY PRINCIPLES:
1. Staff message = Important context, use it
2. Customer question after staff message = Build on staff's info
3. Never ignore or contradict staff
4. Reference staff's message when relevant
5. Provide additional help while respecting staff's info

This ensures smooth handoff between staff and AI without confusing the customer.`,
      active: true,
      priority: 90,
      category: 'conversation_management',
      version: 1,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'module_name'
    });
  
  if (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
  
  console.log('✅ Migration 082 applied successfully!\n');
  console.log('Added staff_context_awareness prompt module (priority 90)');
  console.log('\nAI will now use staff messages as context when responding.');
})();
