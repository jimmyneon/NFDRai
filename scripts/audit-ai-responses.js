#!/usr/bin/env node
/**
 * AI Response Audit Script
 * Analyzes AI responses from the database to identify improvement opportunities
 */

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://xvojwsxlqlqsmnsfimwa.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2b2p3c3hscWxxc21uc2ZpbXdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTkyMjEwNiwiZXhwIjoyMDc1NDk4MTA2fQ.iN59GRDCj-TE6LSOcsZwXObGr5RleMovOkYCpvdHKyQ"
);

async function audit() {
  console.log("=== AI RESPONSE AUDIT ===\n");

  // Get recent AI messages
  const { data: aiMessages, error } = await supabase
    .from("messages")
    .select("id, text, created_at, ai_confidence, conversation_id")
    .eq("sender", "ai")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    console.log("Error fetching messages:", error.message);
    return;
  }

  console.log(`Found ${aiMessages.length} recent AI messages\n`);

  // Analyze patterns
  const issues = {
    tooLong: [],
    missingSignoff: [],
    hasEmojis: [],
    lowConfidence: [],
    handoffs: [],
    exactPrices: [],
    askingForModel: [],
    repetitive: [],
  };

  for (const msg of aiMessages) {
    const text = msg.text;
    const chars = text.length;

    if (chars > 600) {
      issues.tooLong.push({ chars, preview: text.substring(0, 80) });
    }

    if (!text.toLowerCase().includes("many thanks")) {
      issues.missingSignoff.push({ preview: text.substring(0, 80) });
    }

    if (/[\u{1F300}-\u{1F9FF}]/u.test(text)) {
      issues.hasEmojis.push({ preview: text.substring(0, 80) });
    }

    if (msg.ai_confidence && msg.ai_confidence < 70) {
      issues.lowConfidence.push({
        confidence: msg.ai_confidence,
        preview: text.substring(0, 80),
      });
    }

    if (/pass.*john|john will|check with john/i.test(text)) {
      issues.handoffs.push({ preview: text.substring(0, 80) });
    }

    // Check for exact prices (should use ranges)
    if (/£\d+(?!\s*-\s*£?\d+)/.test(text) && !/£\d+-\d+/.test(text)) {
      issues.exactPrices.push({ preview: text.substring(0, 120) });
    }

    if (/what model|which model|what device/i.test(text)) {
      issues.askingForModel.push({ preview: text.substring(0, 80) });
    }
  }

  // Print analysis
  console.log("=== ISSUE SUMMARY ===\n");
  console.log(
    `📏 Too Long (>600 chars): ${issues.tooLong.length}/${aiMessages.length}`
  );
  console.log(
    `✍️  Missing Sign-off: ${issues.missingSignoff.length}/${aiMessages.length}`
  );
  console.log(`😀 Has Emojis: ${issues.hasEmojis.length}/${aiMessages.length}`);
  console.log(
    `⚠️  Low Confidence (<70%): ${issues.lowConfidence.length}/${aiMessages.length}`
  );
  console.log(
    `🔄 Handoffs to John: ${issues.handoffs.length}/${aiMessages.length}`
  );
  console.log(
    `💰 Exact Prices (should use ranges): ${issues.exactPrices.length}/${aiMessages.length}`
  );
  console.log(
    `❓ Asking for Model: ${issues.askingForModel.length}/${aiMessages.length}`
  );

  // Show examples of issues
  if (issues.exactPrices.length > 0) {
    console.log("\n--- Exact Price Examples (should use ranges) ---");
    issues.exactPrices
      .slice(0, 3)
      .forEach((i) => console.log(`  "${i.preview}..."`));
  }

  if (issues.tooLong.length > 0) {
    console.log("\n--- Too Long Examples ---");
    issues.tooLong
      .slice(0, 2)
      .forEach((i) => console.log(`  [${i.chars} chars] "${i.preview}..."`));
  }

  // Get sample conversations
  console.log("\n\n=== SAMPLE CONVERSATIONS ===\n");

  const { data: convs } = await supabase
    .from("conversations")
    .select("id")
    .order("updated_at", { ascending: false })
    .limit(5);

  for (const conv of (convs || []).slice(0, 3)) {
    const { data: msgs } = await supabase
      .from("messages")
      .select("sender, text")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true })
      .limit(8);

    if (msgs && msgs.length > 0) {
      console.log(`--- Conversation ${conv.id.substring(0, 8)} ---`);
      msgs.forEach((m) => {
        const label =
          m.sender === "customer"
            ? "CUST"
            : m.sender === "ai"
            ? "AI  "
            : "JOHN";
        const text = m.text.substring(0, 100).replace(/\n/g, " ");
        console.log(`${label}: ${text}${m.text.length > 100 ? "..." : ""}`);
      });
      console.log("");
    }
  }

  // Get AI analytics
  console.log("\n=== AI ANALYTICS ===\n");

  const { data: analytics } = await supabase
    .from("ai_analytics")
    .select(
      "intent, state, validation_passed, handoff_to_staff, validation_issues"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (analytics && analytics.length > 0) {
    const intents = {};
    const states = {};
    let validationFails = 0;
    let handoffs = 0;
    const allIssues = [];

    analytics.forEach((a) => {
      intents[a.intent] = (intents[a.intent] || 0) + 1;
      states[a.state] = (states[a.state] || 0) + 1;
      if (!a.validation_passed) {
        validationFails++;
        if (a.validation_issues) allIssues.push(...a.validation_issues);
      }
      if (a.handoff_to_staff) handoffs++;
    });

    console.log("Intent Distribution:");
    Object.entries(intents)
      .sort((a, b) => b[1] - a[1])
      .forEach(([k, v]) => {
        console.log(`  ${k}: ${v}`);
      });

    console.log("\nState Distribution:");
    Object.entries(states)
      .sort((a, b) => b[1] - a[1])
      .forEach(([k, v]) => {
        console.log(`  ${k}: ${v}`);
      });

    console.log(
      `\nValidation Failures: ${validationFails}/${analytics.length} (${(
        (validationFails / analytics.length) *
        100
      ).toFixed(1)}%)`
    );
    console.log(
      `Handoffs to Staff: ${handoffs}/${analytics.length} (${(
        (handoffs / analytics.length) *
        100
      ).toFixed(1)}%)`
    );

    if (allIssues.length > 0) {
      console.log("\nCommon Validation Issues:");
      const issueCounts = {};
      allIssues.forEach((i) => {
        issueCounts[i] = (issueCounts[i] || 0) + 1;
      });
      Object.entries(issueCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([k, v]) => {
          console.log(`  [${v}x] ${k}`);
        });
    }
  }

  console.log("\n=== AUDIT COMPLETE ===");
}

audit().catch((e) => console.error("Audit failed:", e.message));
