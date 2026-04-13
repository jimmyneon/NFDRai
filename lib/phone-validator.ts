/**
 * Phone Number Validator
 * Validates phone numbers and checks if they are UK numbers to avoid international SMS costs
 */

/**
 * Check if a phone number is a UK MOBILE number
 * UK mobiles start with 07 (national) or +447/00447 (international)
 * This BLOCKS landlines (01/02), 0800 numbers, and other non-mobile UK numbers
 */
export function isUKMobileNumber(phone: string): boolean {
  if (!phone) return false;

  // Remove all spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");

  // UK MOBILE number patterns ONLY:
  // +447... (international format)
  // 00447... (alternative international format)
  // 07... (national format)
  // 7... (mobile without leading 0 - edge case)

  if (cleaned.startsWith("+447")) return true;
  if (cleaned.startsWith("00447")) return true;
  if (cleaned.startsWith("07") && cleaned.length >= 10) return true;
  if (cleaned.startsWith("7") && cleaned.length === 10) return true; // Mobile without 0

  return false;
}

/**
 * Check if a phone number is a UK number (mobile OR landline)
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
  if (
    cleaned.length > 11 &&
    !cleaned.startsWith("44") &&
    !cleaned.startsWith("0")
  ) {
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
 * ONLY allows UK MOBILE numbers (07/+447/00447)
 * BLOCKS: landlines (01/02), 0800 numbers, international numbers
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

  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  const country = getPhoneCountry(phone);
  const isUKMobile = isUKMobileNumber(phone);
  const isInternational = isInternationalNumber(phone);

  // ONLY allow UK mobile numbers
  if (isUKMobile) {
    return {
      allowed: true,
      reason: "UK mobile number - SMS allowed",
      country: "UK",
    };
  }

  // Block international numbers
  if (isInternational) {
    return {
      allowed: false,
      reason: `International number (${country}) - SMS blocked to avoid costs`,
      country,
    };
  }

  // Block UK landlines and 0800 numbers
  if (
    cleaned.startsWith("+4401") ||
    cleaned.startsWith("+4402") ||
    cleaned.startsWith("004401") ||
    cleaned.startsWith("004402") ||
    cleaned.startsWith("01") ||
    cleaned.startsWith("02")
  ) {
    return {
      allowed: false,
      reason: "UK landline - SMS blocked (landlines cannot receive SMS)",
      country: "UK",
    };
  }

  if (
    cleaned.startsWith("+44800") ||
    cleaned.startsWith("00448") ||
    cleaned.startsWith("0800") ||
    cleaned.startsWith("08")
  ) {
    return {
      allowed: false,
      reason: "0800/freephone number - SMS blocked",
      country: "UK",
    };
  }

  // If we can't determine, be cautious and block
  return {
    allowed: false,
    reason: "Unable to verify UK mobile number - SMS blocked for safety",
    country: "unknown",
  };
}
