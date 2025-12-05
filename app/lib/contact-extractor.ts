/**
 * Extract contact details (name, mobile, email) from customer messages
 * Used primarily for webchat to capture contact info for follow-up quotes
 */

interface ExtractedContact {
  name: string | null;
  mobile: string | null;
  email: string | null;
  isLandline: boolean;
  confidence: number;
}

/**
 * Check if a UK phone number is a mobile (starts with 07)
 */
function isUKMobile(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, "");
  // UK mobile starts with 07 and has 11 digits, or +447 with 12 digits
  return /^(07\d{9}|(\+44|0044)7\d{9})$/.test(cleaned);
}

/**
 * Check if a UK phone number is a landline (starts with 01, 02, 03)
 */
function isUKLandline(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, "");
  // UK landline starts with 01, 02, 03
  return /^(0[123]\d{8,10}|(\+44|0044)[123]\d{8,10})$/.test(cleaned);
}

/**
 * Extract and validate phone number from text
 */
function extractPhone(text: string): {
  number: string | null;
  isLandline: boolean;
} {
  // Match various phone formats
  const phonePatterns = [
    // UK format: 07xxx xxxxxx or 07xxxxxxxxx
    /\b(07\d{3}[\s\-]?\d{3}[\s\-]?\d{3})\b/,
    /\b(07\d{9})\b/,
    // International UK: +44 7xxx or 0044 7xxx
    /\b(\+44[\s\-]?7\d{3}[\s\-]?\d{3}[\s\-]?\d{3})\b/,
    /\b(0044[\s\-]?7\d{3}[\s\-]?\d{3}[\s\-]?\d{3})\b/,
    // Landline patterns (to detect and reject)
    /\b(0[123]\d{2,4}[\s\-]?\d{3,6}[\s\-]?\d{0,4})\b/,
    /\b(\+44[\s\-]?[123]\d{2,4}[\s\-]?\d{3,6}[\s\-]?\d{0,4})\b/,
  ];

  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match) {
      const number = match[1];
      const cleaned = number.replace(/[\s\-\(\)\.]/g, "");

      if (isUKMobile(cleaned)) {
        return { number: cleaned, isLandline: false };
      }
      if (isUKLandline(cleaned)) {
        return { number: cleaned, isLandline: true };
      }
    }
  }

  return { number: null, isLandline: false };
}

/**
 * Extract email from text
 */
function extractEmail(text: string): string | null {
  const emailPattern = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/i;
  const match = text.match(emailPattern);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Extract name from text (basic patterns)
 */
function extractName(text: string): string | null {
  const lowerText = text.toLowerCase();

  // Common patterns for giving name
  const namePatterns = [
    // "My name is John" or "I'm John" or "It's John"
    /(?:my name is|i'?m|it'?s|i am|this is|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    // "John here" or "John speaking"
    /^([A-Z][a-z]+)\s+(?:here|speaking)/i,
    // Just a name at the start of message (if short)
    /^([A-Z][a-z]+)$/,
  ];

  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match) {
      const name = match[1].trim();
      // Filter out common words that aren't names
      const notNames = [
        "hi",
        "hello",
        "hey",
        "yes",
        "no",
        "ok",
        "okay",
        "thanks",
        "thank",
        "please",
        "sure",
        "great",
        "good",
        "fine",
      ];
      if (!notNames.includes(name.toLowerCase())) {
        return name;
      }
    }
  }

  return null;
}

/**
 * Extract contact details from a customer message
 */
export function extractContactDetails(message: string): ExtractedContact {
  const phone = extractPhone(message);
  const email = extractEmail(message);
  const name = extractName(message);

  // Calculate confidence based on what was found
  let confidence = 0;
  if (phone.number && !phone.isLandline) confidence += 0.5;
  if (email) confidence += 0.4;
  if (name) confidence += 0.1;

  return {
    name,
    mobile: phone.isLandline ? null : phone.number,
    email,
    isLandline: phone.isLandline,
    confidence,
  };
}

/**
 * Check if message contains contact details worth saving
 */
export function hasContactDetails(message: string): boolean {
  const extracted = extractContactDetails(message);
  return !!(extracted.mobile || extracted.email);
}

/**
 * Format phone number for display/storage
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, "");

  // Convert +44 to 0
  let normalized = cleaned;
  if (normalized.startsWith("+44")) {
    normalized = "0" + normalized.slice(3);
  } else if (normalized.startsWith("0044")) {
    normalized = "0" + normalized.slice(4);
  }

  // Format as 07xxx xxxxxx
  if (normalized.length === 11 && normalized.startsWith("07")) {
    return `${normalized.slice(0, 5)} ${normalized.slice(5)}`;
  }

  return normalized;
}
