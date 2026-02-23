/**
 * Device Mismatch Detector
 * Detects when customer mentions a different device model than what was quoted
 */

/**
 * Extract device model mentions from message
 */
export function extractDeviceModel(message: string): string | null {
  const lowerMessage = message.toLowerCase();

  // Common device patterns
  const patterns = [
    // iPhone models
    /iphone\s*(\d+\s*(?:pro|plus|max|mini)?(?:\s*[a-z])?)/i,
    /iphone\s*([xr|xs|se])/i,
    
    // Samsung models
    /samsung\s*(?:galaxy\s*)?([a-z]\d+[a-z]?)/i,
    /galaxy\s*([a-z]\d+[a-z]?)/i,
    
    // Google Pixel
    /pixel\s*(\d+[a-z]?(?:\s*(?:pro|xl))?)/i,
    
    // Generic patterns
    /(?:it'?s\s+a\s+)([a-z]+\s*\d+[a-z]?)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1].trim().toLowerCase();
    }
  }

  return null;
}

/**
 * Check if customer is mentioning a different device model than quoted
 */
export function detectDeviceMismatch(
  message: string,
  quotedDeviceModel: string
): {
  hasMismatch: boolean;
  mentionedModel: string | null;
  quotedModel: string;
  confidence: number;
} {
  const mentionedModel = extractDeviceModel(message);

  if (!mentionedModel) {
    return {
      hasMismatch: false,
      mentionedModel: null,
      quotedModel: quotedDeviceModel,
      confidence: 0,
    };
  }

  // Normalize both models for comparison
  const normalizedQuoted = quotedDeviceModel.toLowerCase().trim();
  const normalizedMentioned = mentionedModel.toLowerCase().trim();

  // Check if they're different
  // Allow for minor variations (e.g., "6" vs "6 pro" might be same)
  const isDifferent = !normalizedQuoted.includes(normalizedMentioned) &&
                      !normalizedMentioned.includes(normalizedQuoted);

  return {
    hasMismatch: isDifferent,
    mentionedModel,
    quotedModel: quotedDeviceModel,
    confidence: isDifferent ? 0.9 : 0,
  };
}

/**
 * Common device model variations that should be treated as different
 */
export function areModelsSignificantlyDifferent(
  model1: string,
  model2: string
): boolean {
  const m1 = model1.toLowerCase().trim();
  const m2 = model2.toLowerCase().trim();

  // Exact match
  if (m1 === m2) return false;

  // Common variations that ARE different devices
  const significantDifferences = [
    // iPhone
    ['iphone 6', 'iphone 6s'],
    ['iphone 6', 'iphone 6 plus'],
    ['iphone 11', 'iphone 11 pro'],
    ['iphone 12', 'iphone 12 mini'],
    ['iphone 13', 'iphone 13 pro'],
    ['iphone 14', 'iphone 14 plus'],
    ['iphone 15', 'iphone 15 pro'],
    
    // Samsung
    ['s21', 's21+'],
    ['s21', 's21 ultra'],
    ['a52', 'a53'],
    
    // Google Pixel
    ['pixel 6', 'pixel 6a'],
    ['pixel 6', 'pixel 6 pro'],
    ['pixel 7', 'pixel 7a'],
    ['pixel 7', 'pixel 7 pro'],
  ];

  for (const [variant1, variant2] of significantDifferences) {
    if ((m1.includes(variant1) && m2.includes(variant2)) ||
        (m1.includes(variant2) && m2.includes(variant1))) {
      return true;
    }
  }

  // If one is contained in the other, they might be the same
  // e.g., "iPhone 12" contains "12"
  if (m1.includes(m2) || m2.includes(m1)) {
    return false;
  }

  // Otherwise, treat as different
  return true;
}
