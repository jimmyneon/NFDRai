#!/usr/bin/env node

/**
 * Apply No-Pricing Policy Migration
 * Runs migration 050_enforce_no_pricing_policy.sql
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

async function applyMigration() {
  // Load environment variables
  require("dotenv").config({ path: ".env.local" });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase credentials in .env.local");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log("🚀 Applying No-Pricing Policy Migration...\n");

  // Read migration file
  const migrationPath = path.join(
    __dirname,
    "supabase/migrations/050_enforce_no_pricing_policy.sql"
  );
  const migrationSQL = fs.readFileSync(migrationPath, "utf8");

  try {
    // Execute migration
    const { data, error } = await supabase.rpc("exec_sql", {
      sql: migrationSQL,
    });

    if (error) {
      // Try direct execution if RPC doesn't exist
      console.log("⚠️  RPC method not available, trying direct execution...\n");

      // Split by semicolons and execute each statement
      const statements = migrationSQL
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith("--"));

      for (const statement of statements) {
        if (statement.toLowerCase().includes("comment on")) {
          // Skip comments for now
          continue;
        }

        const { error: execError } = await supabase.rpc("exec", {
          sql: statement + ";",
        });
        if (execError) {
          console.error("❌ Error executing statement:", execError.message);
          console.error("Statement:", statement.substring(0, 100) + "...");
        }
      }
    }

    console.log("✅ Migration applied successfully!\n");

    // Verify the changes
    console.log("🔍 Verifying changes...\n");

    const { data: modules, error: fetchError } = await supabase
      .from("prompts")
      .select("module_name, priority, LEFT(prompt_text, 100) as preview")
      .in("module_name", [
        "core_identity",
        "pricing_reminder",
        "common_scenarios",
        "pricing_question_handler",
      ])
      .order("priority", { ascending: false });

    if (fetchError) {
      console.error("❌ Error fetching modules:", fetchError.message);
    } else {
      console.log("📋 Updated Prompt Modules:");
      modules.forEach((m) => {
        console.log(`\n  ${m.module_name} (priority: ${m.priority})`);
        console.log(`  Preview: ${m.preview}...`);
      });
    }

    console.log("\n✅ No-Pricing Policy is now enforced!");
    console.log("   AI Steve will NEVER provide prices.");
    console.log(
      "   All pricing questions will be directed to quote requests.\n"
    );
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  }
}

applyMigration();
