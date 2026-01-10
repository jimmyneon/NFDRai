import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Get OpenAI usage statistics
 * Note: OpenAI API doesn't provide a direct usage/billing endpoint
 * We track usage from our own database logs
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Get current month's date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    // Get AI settings to know which provider is being used
    const { data: settings } = await supabase
      .from("ai_settings")
      .select("provider, model")
      .limit(1)
      .single();

    // Count AI messages this month (as a proxy for usage)
    const { count: monthlyMessages } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("sender", "ai")
      .gte("created_at", startOfMonth.toISOString());

    // Count AI messages today
    const { count: dailyMessages } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("sender", "ai")
      .gte("created_at", startOfToday.toISOString());

    // Estimate cost based on model
    // These are rough estimates - actual costs vary by token count
    const costPerMessage = getCostPerMessage(
      settings?.provider,
      settings?.model
    );

    const totalUsage = (monthlyMessages || 0) * costPerMessage;
    const dailyUsage = (dailyMessages || 0) * costPerMessage;

    return NextResponse.json({
      totalUsage,
      dailyUsage,
      monthlyMessages,
      dailyMessages,
      provider: settings?.provider || "unknown",
      model: settings?.model || "unknown",
      lastUpdated: new Date().toISOString(),
      note: "Estimated costs based on message count. For exact usage, check your provider dashboard.",
    });
  } catch (error) {
    console.error("[OpenAI Usage] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage data" },
      { status: 500 }
    );
  }
}

/**
 * Estimate cost per message based on provider and model
 * These are rough averages - actual costs vary significantly
 */
function getCostPerMessage(provider?: string, model?: string): number {
  // Average message is ~500 tokens (input + output)
  // These are rough estimates based on typical usage

  if (provider === "openai") {
    if (model?.includes("gpt-4o")) return 0.005; // ~$0.005 per message
    if (model?.includes("gpt-4")) return 0.01; // ~$0.01 per message
    if (model?.includes("gpt-3.5")) return 0.001; // ~$0.001 per message
  }

  if (provider === "anthropic") {
    if (model?.includes("claude-3-opus")) return 0.015;
    if (model?.includes("claude-3-sonnet")) return 0.003;
    if (model?.includes("claude-3-haiku")) return 0.0003;
  }

  if (provider === "deepseek") {
    return 0.0001; // Very cheap
  }

  if (provider === "mistral") {
    return 0.002;
  }

  // Default estimate
  return 0.005;
}
