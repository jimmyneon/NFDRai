/**
 * AI-Powered Device & Issue Extractor
 *
 * Uses AI to extract structured device and issue information from customer messages.
 * Handles typos, abbreviations, slang, and natural language variations.
 */

import Anthropic from "@anthropic-ai/sdk";

export interface ExtractedRepairInfo {
  deviceType: string | null; // e.g., "iphone", "samsung", "ipad"
  deviceModel: string | null; // e.g., "iPhone 13", "Galaxy S23"
  issue: string | null; // e.g., "screen", "battery", "charging"
  issueLabel: string | null; // e.g., "Screen Repair", "Battery Replacement"
  confidence: number; // 0-1
}

/**
 * Extract device and issue information using AI
 */
export async function extractRepairInfoWithAI(
  message: string,
  conversationHistory?: Array<{ sender: string; text: string }>
): Promise<ExtractedRepairInfo> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Build context from conversation history
  const context = conversationHistory
    ? conversationHistory.map((m) => `${m.sender}: ${m.text}`).join("\n")
    : "";

  const fullContext = context
    ? `${context}\ncustomer: ${message}`
    : `customer: ${message}`;

  const prompt = `Extract device and issue information from this repair inquiry. Handle typos, abbreviations, and natural language.

Conversation:
${fullContext}

Extract and return ONLY a JSON object (no other text):
{
  "deviceType": "iphone|samsung|ipad|macbook|google|huawei|oneplus|sony|xiaomi|oppo|nokia|motorola|ps5|ps4|xbox|switch|laptop|tablet|phone|null",
  "deviceModel": "exact model like 'iPhone 13' or 'Galaxy S23' or null",
  "issue": "screen|battery|charging|water|power|camera|audio|button|back_glass|null",
  "issueLabel": "Screen Repair|Battery Replacement|Charging Port Repair|Water Damage Repair|Power Issue|Camera Repair|Audio Repair|Button Repair|Back Glass Repair|null",
  "confidence": 0.0-1.0
}

Examples:
- "ipone 13 scren" → {"deviceType":"iphone","deviceModel":"iPhone 13","issue":"screen","issueLabel":"Screen Repair","confidence":0.9}
- "my phone screen" (no prior context) → {"deviceType":"phone","deviceModel":null,"issue":"screen","issueLabel":"Screen Repair","confidence":0.6}
- "s23 battery" → {"deviceType":"samsung","deviceModel":"Galaxy S23","issue":"battery","issueLabel":"Battery Replacement","confidence":0.9}
- "iphone 14 pro max display cracked" → {"deviceType":"iphone","deviceModel":"iPhone 14 Pro Max","issue":"screen","issueLabel":"Screen Repair","confidence":1.0}
- "hello" → {"deviceType":null,"deviceModel":null,"issue":null,"issueLabel":null,"confidence":0.0}

Rules:
- Correct typos (ipone→iPhone, scren→screen, batery→battery)
- Expand abbreviations (ip13→iPhone 13, s23→Galaxy S23)
- Normalize device names (always use proper case: "iPhone 13", "Galaxy S23")
- If device mentioned in history but not current message, use history
- confidence: 1.0 = certain, 0.8 = likely, 0.5 = uncertain, 0.0 = no repair intent
- Return null for fields you cannot determine

Return ONLY the JSON object, no explanation:`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 200,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from AI");
    }

    // Parse JSON response
    const extracted = JSON.parse(content.text.trim());

    return {
      deviceType: extracted.deviceType || null,
      deviceModel: extracted.deviceModel || null,
      issue: extracted.issue || null,
      issueLabel: extracted.issueLabel || null,
      confidence: extracted.confidence || 0,
    };
  } catch (error) {
    console.error("[AI Extractor] Error:", error);
    // Return empty result on error
    return {
      deviceType: null,
      deviceModel: null,
      issue: null,
      issueLabel: null,
      confidence: 0,
    };
  }
}
