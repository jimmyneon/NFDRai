/**
 * Quote Acceptance Handler
 * Integrates quote lookup and acceptance into incoming message flow
 */

import { createClient } from "@/lib/supabase/server";
import { getActiveQuoteByPhone, acceptQuote, formatQuoteForAI } from "./quote-lookup";
import { detectQuoteAcceptance } from "./quote-acceptance-detector";

export interface QuoteAcceptanceResult {
  hasActiveQuote: boolean;
  quote: any | null;
  isAcceptance: boolean;
  confidence: number;
  needsConfirmation: boolean;
  quoteContext: string; // Formatted for AI
}

/**
 * Check if customer has active quote and if they're accepting it
 */
export async function checkQuoteAcceptance(
  phone: string,
  message: string
): Promise<QuoteAcceptanceResult> {
  // Look up active quote
  const quote = await getActiveQuoteByPhone(phone);

  if (!quote) {
    return {
      hasActiveQuote: false,
      quote: null,
      isAcceptance: false,
      confidence: 0,
      needsConfirmation: false,
      quoteContext: "",
    };
  }

  // Check if message indicates acceptance
  const acceptance = detectQuoteAcceptance(message);

  // Format quote details for AI context
  const quoteContext = formatQuoteForAI(quote);

  return {
    hasActiveQuote: true,
    quote,
    isAcceptance: acceptance.isAcceptance,
    confidence: acceptance.confidence,
    needsConfirmation: acceptance.needsConfirmation,
    quoteContext,
  };
}

/**
 * Process quote acceptance - mark as accepted in database
 */
export async function processQuoteAcceptance(quoteId: string): Promise<boolean> {
  const acceptedQuote = await acceptQuote(quoteId);
  
  if (acceptedQuote) {
    console.log("[Quote Acceptance] ✅ Quote marked as accepted:", quoteId);
    return true;
  }
  
  console.error("[Quote Acceptance] ❌ Failed to mark quote as accepted:", quoteId);
  return false;
}

/**
 * Build context string for AI about active quote
 */
export function buildQuoteContextForAI(result: QuoteAcceptanceResult): string {
  if (!result.hasActiveQuote) {
    return "";
  }

  let context = `\n\n[ACTIVE QUOTE FOR THIS CUSTOMER]\n${result.quoteContext}\n`;
  
  if (result.isAcceptance && result.confidence > 0.8) {
    context += `[CUSTOMER APPEARS TO BE ACCEPTING THIS QUOTE - High confidence]\n`;
  } else if (result.isAcceptance && result.needsConfirmation) {
    context += `[CUSTOMER MAY BE ACCEPTING - Ask for confirmation: "Just to confirm - would you like to proceed with this repair?"]\n`;
  }
  
  context += `\nFollow the QUOTE ACCEPTANCE WORKFLOW from your prompt modules.`;
  
  return context;
}
