/**
 * Normalize phone numbers to consistent format
 * Prevents duplicate conversations from phone format mismatches
 */

export function normalizePhoneNumber(phone: string | null | undefined): string | null {
  if (!phone) return null
  
  // Remove all whitespace, hyphens, parentheses, and other non-digit chars except +
  let clean = phone.replace(/[\s\-()]/g, '')
  
  // Remove any remaining non-digit/non-+ characters
  clean = clean.replace(/[^\d+]/g, '')
  
  // If empty after cleaning, return null
  if (!clean) return null
  
  // UK number normalization
  // Convert various UK formats to +44 format
  
  // If starts with 00, replace with +
  if (clean.startsWith('00')) {
    clean = '+' + clean.substring(2)
  }
  
  // If starts with 44 but no +, add it
  if (clean.startsWith('44') && !clean.startsWith('+')) {
    clean = '+' + clean
  }
  
  // If starts with 0 (UK local format), convert to +44
  if (clean.startsWith('0') && !clean.startsWith('00')) {
    clean = '+44' + clean.substring(1)
  }
  
  // If doesn't start with +, assume it needs +44 (UK default)
  if (!clean.startsWith('+') && clean.length >= 10) {
    clean = '+44' + clean
  }
  
  return clean
}

/**
 * Check if two phone numbers are the same after normalization
 */
export function arePhoneNumbersEqual(phone1: string | null | undefined, phone2: string | null | undefined): boolean {
  const normalized1 = normalizePhoneNumber(phone1)
  const normalized2 = normalizePhoneNumber(phone2)
  
  if (!normalized1 || !normalized2) return false
  
  return normalized1 === normalized2
}

/**
 * Format phone number for display (UK format)
 */
export function formatPhoneForDisplay(phone: string | null | undefined): string {
  const normalized = normalizePhoneNumber(phone)
  if (!normalized) return 'Unknown'
  
  // Convert +447123456789 to 07123 456789
  if (normalized.startsWith('+44')) {
    const local = '0' + normalized.substring(3)
    // Add space after first 5 digits
    if (local.length === 11) {
      return local.substring(0, 5) + ' ' + local.substring(5)
    }
    return local
  }
  
  return normalized
}
