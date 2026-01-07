#!/usr/bin/env node

/**
 * Verify No-Pricing Policy is Active
 */

const { createClient } = require("@supabase/supabase-js");

async function verify() {
  require("dotenv").config({ path: ".env.local" });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log("🔍 Verifying No-Pricing Policy...\n");

  const { data: modules, error } = await supabase
    .from("prompts")
    .select("module_name, priority, prompt_text")
    .in("module_name", [
      "core_identity",
      "pricing_reminder",
      "pricing_question_handler",
    ])
    .order("priority", { ascending: false });

  if (error) {
    console.error("❌ Error:", error.message);
    return;
  }

  modules.forEach((m) => {
    console.log(`\n${"=".repeat(70)}`);
    console.log(`📋 ${m.module_name.toUpperCase()} (Priority: ${m.priority})`);
    console.log("=".repeat(70));

    // Check for pricing mentions
    const hasPricing = m.prompt_text.match(
      /£\d+|typically.*£|usually.*£|around.*£|costs.*£/i
    );
    const hasNoPricingRule =
      m.prompt_text.includes("NEVER PROVIDE PRICING") ||
      m.prompt_text.includes("NEVER provide pricing") ||
      m.prompt_text.includes("DO NOT PROVIDE PRICING");

    if (hasPricing) {
      console.log("❌ WARNING: Still contains pricing references!");
    } else {
      console.log("✅ No pricing references found");
    }

    if (hasNoPricingRule) {
      console.log("✅ Contains no-pricing enforcement rule");
    } else {
      console.log("⚠️  No explicit no-pricing rule found");
    }

    // Show first 500 characters
    console.log("\nPreview:");
    console.log(m.prompt_text.substring(0, 500) + "...\n");
  });

  console.log("\n" + "=".repeat(70));
  console.log("✅ Verification Complete!");
  console.log("=".repeat(70) + "\n");
}

verify();
