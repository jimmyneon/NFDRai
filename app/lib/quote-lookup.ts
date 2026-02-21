import { createClient } from "@/lib/supabase/server";

/**
 * Look up active quotes for a customer by phone number
 * Returns the most recent quoted (not expired/declined) quote
 */
export async function getActiveQuoteByPhone(phone: string) {
  const supabase = await createClient();

  // Get the most recent active quote for this phone number
  const { data: quote, error } = await supabase
    .from("quote_requests")
    .select("*")
    .eq("phone", phone)
    .in("status", ["quoted", "pending"])
    .order("quoted_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !quote) {
    return null;
  }

  // Check if quote has expired
  if (quote.expires_at && new Date(quote.expires_at) < new Date()) {
    // Mark as expired
    await supabase
      .from("quote_requests")
      .update({ status: "expired" })
      .eq("id", quote.id);
    return null;
  }

  return quote;
}

/**
 * Mark a quote as accepted by the customer
 */
export async function acceptQuote(quoteId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quote_requests")
    .update({
      status: "accepted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", quoteId)
    .select()
    .single();

  if (error) {
    console.error("[Quote Lookup] Error accepting quote:", error);
    return null;
  }

  return data;
}

/**
 * Get quote details formatted for AI context
 */
export function formatQuoteForAI(quote: any): string {
  if (!quote) return "";

  const parts = [
    `Device: ${quote.device_make} ${quote.device_model}`,
    `Issue: ${quote.issue}`,
  ];

  if (quote.description) {
    parts.push(`Description: ${quote.description}`);
  }

  if (quote.additional_issues && Array.isArray(quote.additional_issues) && quote.additional_issues.length > 0) {
    const additionalIssues = quote.additional_issues
      .map((repair: any) => `${repair.issue}${repair.description ? ` (${repair.description})` : ""}`)
      .join(", ");
    parts.push(`Additional repairs: ${additionalIssues}`);
  }

  if (quote.quoted_price) {
    parts.push(`Quote: £${quote.quoted_price}`);
  }

  if (quote.expires_at) {
    const expiryDate = new Date(quote.expires_at);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    parts.push(`Expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`);
  }

  return parts.join(" | ");
}
