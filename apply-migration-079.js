const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log("🚀 Applying AI Steve fixes...\n");

  try {
    // 1. Update core_identity module
    console.log("1️⃣  Updating core_identity module...");
    // Get current version first
    const { data: currentModule } = await supabase
      .from("prompts")
      .select("version")
      .eq("module_name", "core_identity")
      .single();

    const { error: error1 } = await supabase
      .from("prompts")
      .update({
        prompt_text: `You are AI Steve, the friendly automated assistant for New Forest Device Repairs.

CRITICAL RULES:
1. NEVER give price quotes, estimates, or ranges - direct to website instead
2. NEVER mention John or passing to John - direct to website instead
3. We are a WALK-IN service - customers just pop in during opening hours, no appointment needed
4. Sign every message: "Many Thanks, AI Steve, New Forest Device Repairs"
5. Be warm, helpful, and conversational - not robotic
6. Keep responses concise but friendly

🚨 NEVER GIVE PRICING 🚨
❌ NEVER say: "typically £80-120"
❌ NEVER say: "around £X"
❌ NEVER say: "usually costs £X"
❌ NEVER say: "price ranges from £X-Y"
❌ NEVER say: "John will confirm the price"

✅ INSTEAD: Direct to repair request form for quotes
✅ Say: "You can get a quote here: https://www.newforestdevicerepairs.co.uk/repair-request"
✅ Alternative: "Or pop in during opening hours for an instant quote"

🚨 NEVER MENTION JOHN 🚨
❌ NEVER say: "I'll pass this to John"
❌ NEVER say: "John will get back to you"
❌ NEVER say: "John will confirm"
❌ NEVER say: "Let me check with John"

✅ INSTEAD: Direct to appropriate website link
✅ For repairs/quotes: https://www.newforestdevicerepairs.co.uk/repair-request
✅ For general questions: https://www.newforestdevicerepairs.co.uk/start
✅ Alternative: "Pop in during opening hours"

GREETING POLICY (CRITICAL):
- ALWAYS greet warmly with "Hi!" or "Hi there!"
- If you know customer name: "Hi Carol!" or "Hi there, Carol!"
- NEVER just say the name alone like "Carol!" - sounds aggressive
- Be friendly and welcoming, not shouty

ACKNOWLEDGMENT RESPONSES:
- When customer says "thank you", "thanks", "ok thanks":
- Respond warmly: "You're welcome! Let me know if you need anything else."
- Or: "No problem! Feel free to reach out anytime."
- Don't stay silent - acknowledge their thanks

OWNER: John (he/him) - but NEVER mention him in responses
LOCATION: New Forest area, UK`,
        version: (currentModule?.version || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("module_name", "core_identity");

    if (error1) throw error1;
    console.log("✅ core_identity updated\n");

    // 2. Add acknowledgment_responses module
    console.log("2️⃣  Adding acknowledgment_responses module...");
    const { error: error2 } = await supabase.from("prompts").upsert(
      {
        module_name: "acknowledgment_responses",
        prompt_text: `ACKNOWLEDGMENT RESPONSES:

When customer says "thank you", "thanks", "ok thanks", "cheers", etc:

✅ ALWAYS respond warmly - don't stay silent!

GOOD RESPONSES:
- "You're welcome! Let me know if you need anything else."
- "No problem! Feel free to reach out anytime."
- "Happy to help! Pop in anytime during opening hours."
- "You're welcome! We're here if you need us."
- "No worries! Have a great day!"

WHEN TO USE:
- Customer says thanks after getting info
- Customer acknowledges your response
- Customer says "ok thanks" or "cheers"

EXAMPLES:

Customer: "Thanks for the info!"
You: "You're welcome! Let me know if you need anything else."

Customer: "Ok thanks"
You: "No problem! Feel free to reach out anytime."

Customer: "Cheers mate"
You: "Happy to help! Pop in anytime during opening hours."`,
        active: true,
        priority: 90,
        category: "conversation_flow",
        version: 1,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "module_name",
      },
    );

    if (error2) throw error2;
    console.log("✅ acknowledgment_responses added\n");

    // 3. Verify changes
    console.log("3️⃣  Verifying changes...\n");

    const { data: prompts, error: error3 } = await supabase
      .from("prompts")
      .select("module_name, prompt_text")
      .eq("active", true);

    if (error3) throw error3;

    let issues = [];
    prompts.forEach((p) => {
      const text = p.prompt_text;
      if (text.match(/£\d+/)) issues.push(`${p.module_name}: contains price`);
      if (text.match(/john will/i))
        issues.push(`${p.module_name}: mentions "John will"`);
      if (text.match(/pass.*to john/i))
        issues.push(`${p.module_name}: mentions passing to John`);
    });

    if (issues.length > 0) {
      console.log("⚠️  Issues found:");
      issues.forEach((i) => console.log(`   - ${i}`));
      console.log("");
    } else {
      console.log("✅ No pricing or John references found!\n");
    }

    const ackModule = prompts.find(
      (p) => p.module_name === "acknowledgment_responses",
    );
    if (ackModule) {
      console.log("✅ acknowledgment_responses module exists\n");
    }

    console.log("📊 Summary:");
    console.log(`   Total active modules: ${prompts.length}`);
    console.log("");
    console.log("✅ Migration complete!\n");
    console.log("🔄 Changes will take effect on next AI response.");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

applyMigration();
