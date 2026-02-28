/**
 * Phone Number Validator
 * Validates phone numbers and checks if they are UK numbers to avoid international SMS costs
 */

/**
 * Check if a phone number is a UK number
 * UK numbers start with +44 or 44 or 0
 */
export function isUKNumber(phone: string): boolean {
  if (!phone) return false;

  // Remove all spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");

  // UK number patterns:
  // +44... (international format)
  // 44... (international without +)
  // 0... (national format)
  // 7... (mobile without leading 0)
  
  if (cleaned.startsWith("+44")) return true;
  if (cleaned.startsWith("44") && cleaned.length >= 12) return true;
  if (cleaned.startsWith("0") && cleaned.length >= 10) return true;
  if (cleaned.startsWith("7") && cleaned.length === 10) return true; // Mobile without 0

  return false;
}

/**
 * Check if a phone number is international (non-UK)
 */
export function isInternationalNumber(phone: string): boolean {
  if (!phone) return false;

  // Remove all spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");

  // If it starts with + and is NOT +44, it's international
  if (cleaned.startsWith("+") && !cleaned.startsWith("+44")) {
    return true;
  }

  // If it's a long number starting with a country code (not 44)
  if (cleaned.length > 11 && !cleaned.startsWith("44") && !cleaned.startsWith("0")) {
    return true;
  }

  return false;
}

/**
 * Get the country from a phone number (basic detection)
 */
export function getPhoneCountry(phone: string): string {
  if (!phone) return "unknown";

  const cleaned = phone.replace(/[\s\-\(\)]/g, "");

  if (isUKNumber(cleaned)) return "UK";
  
  // Common international prefixes
  if (cleaned.startsWith("+1") || cleaned.startsWith("1")) return "US/Canada";
  if (cleaned.startsWith("+33")) return "France";
  if (cleaned.startsWith("+34")) return "Spain";
  if (cleaned.startsWith("+49")) return "Germany";
  if (cleaned.startsWith("+353")) return "Ireland";
  if (cleaned.startsWith("+91")) return "India";
  if (cleaned.startsWith("+86")) return "China";
  if (cleaned.startsWith("+61")) return "Australia";
  if (cleaned.startsWith("+64")) return "New Zealand";

  return "international";
}

/**
 * Validate if we should send SMS to this number (cost control)
 */
export function shouldSendSMS(phone: string): {
  allowed: boolean;
  reason: string;
  country: string;
} {
  if (!phone) {
    return {
      allowed: false,
      reason: "No phone number provided",
      country: "unknown",
    };
  }

  const country = getPhoneCountry(phone);
  const isUK = isUKNumber(phone);
  const isInternational = isInternationalNumber(phone);

  if (isUK) {
    return {
      allowed: true,
      reason: "UK number - SMS allowed",
      country: "UK",
    };
  }

  if (isInternational) {
    return {
      allowed: false,
      reason: `International number (${country}) - SMS blocked to avoid costs`,
      country,
    };
  }

  // If we can't determine, be cautious and block
  return {
    allowed: false,
    reason: "Unable to verify UK number - SMS blocked for safety",
    country: "unknown",
  };
}
