/**
 * Extract quote request details from webchat conversations
 * Uses AI to analyze conversation and extract structured repair info
 * Creates quote_request record so webchat leads appear alongside website form submissions
 */

import { OpenAI } from "openai";

export interface ExtractedQuoteInfo {
  name: string | null;
  phone: string | null;
  email: string | null;
  device_make: string | null;
  device_model: string | null;
  issue: string | null;
  confidence: number;
  isComplete: boolean; // Has enough info to create quote request
}

/**
 * Extract quote info from conversation messages using AI
 */
export async function extractQuoteInfoFromConversation(
  messages: Array<{ sender: string; text: string }>,
  customerInfo: {
    name?: string | null;
    phone?: string | null;
    email?: string | null;
  },
  apiKey: string
): Promise<ExtractedQuoteInfo> {
  try {
    // Combine customer messages for context
    const customerMessages = messages
      .filter((m) => m.sender === "customer")
      .map((m) => m.text)
      .join("\n");

    if (!customerMessages || customerMessages.length < 10) {
      return {
        name: customerInfo.name || null,
        phone: customerInfo.phone || null,
        email: customerInfo.email || null,
        device_make: null,
        device_model: null,
        issue: null,
        confidence: 0,
        isComplete: false,
      };
    }

    const openai = new OpenAI({ apiKey });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 200,
      messages: [
        {
          role: "system",
          content: `You are extracting repair quote details from customer chat messages.

Extract the following if mentioned:
- device_make: Brand (Apple, Samsung, Google, Huawei, OnePlus, Sony, etc.)
- device_model: Specific model (iPhone 14 Pro, Galaxy S23, Pixel 8, etc.)
- issue: What's wrong (cracked screen, battery drain, won't charge, water damage, etc.)

OUTPUT FORMAT (JSON only):
{
  "device_make": "Apple" or null,
  "device_model": "iPhone 14 Pro" or null,
  "issue": "cracked screen" or null,
  "confidence": 0.0 to 1.0
}

RULES:
1. Only extract what's explicitly mentioned
2. If they say "iPhone" without model, use device_make: "Apple", device_model: "iPhone"
3. If they say "phone screen" without brand, use device_make: null, device_model: "phone", issue: "screen"
4. Normalize issues: "smashed screen" → "cracked screen", "dead battery" → "battery replacement"
5. Be conservative - only extract if confident

EXAMPLES:
"My iPhone 14 screen is cracked" → {"device_make": "Apple", "device_model": "iPhone 14", "issue": "cracked screen", "confidence": 0.95}
"Samsung phone won't turn on" → {"device_make": "Samsung", "device_model": "phone", "issue": "won't turn on", "confidence": 0.8}
"How much for a screen repair?" → {"device_make": null, "device_model": null, "issue": "screen repair", "confidence": 0.6}
"Hi there" → {"device_make": null, "device_model": null, "issue": null, "confidence": 0.0}`,
        },
        {
          role: "user",
          content: `Customer messages:\n${customerMessages}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      return createEmptyResult(customerInfo);
    }

    const result = JSON.parse(content);

    const extracted: ExtractedQuoteInfo = {
      name: customerInfo.name || null,
      phone: customerInfo.phone || null,
      email: customerInfo.email || null,
      device_make: result.device_make || null,
      device_model: result.device_model || null,
      issue: result.issue || null,
      confidence: result.confidence || 0,
      isComplete: false,
    };

    // Check if we have enough info to create a quote request
    // Need: phone + (device OR issue)
    extracted.isComplete = !!(
      extracted.phone &&
      (extracted.device_make || extracted.device_model || extracted.issue)
    );

    return extracted;
  } catch (error) {
    console.error("[Webchat Quote Extractor] Error:", error);
    return createEmptyResult(customerInfo);
  }
}

/**
 * Regex-based fallback extraction (no AI needed)
 */
export function extractQuoteInfoWithRegex(
  messages: Array<{ sender: string; text: string }>,
  customerInfo: {
    name?: string | null;
    phone?: string | null;
    email?: string | null;
  }
): ExtractedQuoteInfo {
  const customerText = messages
    .filter((m) => m.sender === "customer")
    .map((m) => m.text.toLowerCase())
    .join(" ");

  let device_make: string | null = null;
  let device_model: string | null = null;
  let issue: string | null = null;

  // Device make patterns
  const makePatterns: Array<{ pattern: RegExp; make: string }> = [
    {
      pattern: /\b(iphone|ipad|macbook|apple\s+watch|airpods?)\b/i,
      make: "Apple",
    },
    { pattern: /\b(samsung|galaxy)\b/i, make: "Samsung" },
    { pattern: /\b(google|pixel)\b/i, make: "Google" },
    { pattern: /\b(huawei|honor)\b/i, make: "Huawei" },
    { pattern: /\b(oneplus|one\s+plus)\b/i, make: "OnePlus" },
    { pattern: /\b(sony|xperia)\b/i, make: "Sony" },
    { pattern: /\b(xiaomi|redmi|poco)\b/i, make: "Xiaomi" },
    { pattern: /\b(oppo|realme)\b/i, make: "Oppo" },
    { pattern: /\b(nokia)\b/i, make: "Nokia" },
    { pattern: /\b(motorola|moto)\b/i, make: "Motorola" },
    { pattern: /\b(lg)\b/i, make: "LG" },
  ];

  for (const { pattern, make } of makePatterns) {
    if (pattern.test(customerText)) {
      device_make = make;
      break;
    }
  }

  // Device model patterns
  const modelPatterns = [
    // iPhone models
    /\b(iphone\s*(?:se|\d{1,2}(?:\s*(?:pro|plus|max|mini))*)?)\b/i,
    // iPad models
    /\b(ipad\s*(?:pro|air|mini)?(?:\s*\d{1,2})?)\b/i,
    // Samsung models
    /\b(galaxy\s*(?:s|a|z|note|fold|flip)?\s*\d{1,2}(?:\s*(?:ultra|plus|\+|fe))?)\b/i,
    // Pixel models
    /\b(pixel\s*\d{1,2}(?:\s*(?:pro|a|xl))?)\b/i,
    // MacBook models
    /\b(macbook\s*(?:pro|air)?(?:\s*\d{2})?)\b/i,
    // Generic
    /\b(laptop|phone|tablet)\b/i,
  ];

  for (const pattern of modelPatterns) {
    const match = customerText.match(pattern);
    if (match) {
      device_model = match[1].trim();
      // Capitalize properly
      device_model = device_model.replace(/\b\w/g, (c) => c.toUpperCase());
      break;
    }
  }

  // Issue patterns
  const issuePatterns: Array<{ pattern: RegExp; issue: string }> = [
    {
      pattern: /\b(crack|smash|broken|shatter).*screen\b/i,
      issue: "cracked screen",
    },
    {
      pattern: /\bscreen.*(crack|smash|broken|shatter)\b/i,
      issue: "cracked screen",
    },
    {
      pattern: /\b(battery|won'?t\s+hold\s+charge|dies?\s+quick|drain)\b/i,
      issue: "battery issue",
    },
    {
      pattern: /\b(won'?t\s+charge|not\s+charging|charging\s+port)\b/i,
      issue: "charging issue",
    },
    {
      pattern: /\b(water\s+damage|dropped\s+in\s+water|wet)\b/i,
      issue: "water damage",
    },
    {
      pattern: /\b(won'?t\s+turn\s+on|dead|not\s+working)\b/i,
      issue: "won't turn on",
    },
    {
      pattern: /\b(camera|back\s+camera|front\s+camera)\b/i,
      issue: "camera issue",
    },
    {
      pattern: /\b(speaker|sound|audio|microphone|mic)\b/i,
      issue: "audio issue",
    },
    {
      pattern: /\b(button|power\s+button|volume|home\s+button)\b/i,
      issue: "button issue",
    },
    { pattern: /\bscreen\s*repair\b/i, issue: "screen repair" },
    { pattern: /\bbattery\s*replace?ment?\b/i, issue: "battery replacement" },
  ];

  for (const { pattern, issue: issueText } of issuePatterns) {
    if (pattern.test(customerText)) {
      issue = issueText;
      break;
    }
  }

  // Calculate confidence
  let confidence = 0;
  if (device_make) confidence += 0.3;
  if (device_model) confidence += 0.3;
  if (issue) confidence += 0.4;

  const isComplete = !!(
    customerInfo.phone &&
    (device_make || device_model || issue)
  );

  return {
    name: customerInfo.name || null,
    phone: customerInfo.phone || null,
    email: customerInfo.email || null,
    device_make,
    device_model,
    issue,
    confidence,
    isComplete,
  };
}

/**
 * Smart extraction: regex first, AI for complex cases
 */
export async function extractQuoteInfoSmart(
  messages: Array<{ sender: string; text: string }>,
  customerInfo: {
    name?: string | null;
    phone?: string | null;
    email?: string | null;
  },
  apiKey?: string
): Promise<ExtractedQuoteInfo> {
  // Try regex first
  const regexResult = extractQuoteInfoWithRegex(messages, customerInfo);

  // If regex found good info, use it
  if (regexResult.confidence >= 0.6) {
    console.log("[Webchat Quote Extractor] ✅ Regex extraction:", regexResult);
    return regexResult;
  }

  // If we have API key and regex didn't find much, try AI
  if (apiKey && regexResult.confidence < 0.6) {
    console.log("[Webchat Quote Extractor] 🔍 Trying AI extraction...");
    const aiResult = await extractQuoteInfoFromConversation(
      messages,
      customerInfo,
      apiKey
    );

    if (aiResult.confidence > regexResult.confidence) {
      console.log("[Webchat Quote Extractor] ✅ AI extraction:", aiResult);
      return aiResult;
    }
  }

  return regexResult;
}

function createEmptyResult(customerInfo: {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
}): ExtractedQuoteInfo {
  return {
    name: customerInfo.name || null,
    phone: customerInfo.phone || null,
    email: customerInfo.email || null,
    device_make: null,
    device_model: null,
    issue: null,
    confidence: 0,
    isComplete: false,
  };
}
