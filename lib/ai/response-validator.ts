/**
 * Runtime Response Validator
 * Validates AI responses before sending to ensure compliance with strict routing rules
 */

export interface ValidationResult {
  valid: boolean;
  violations: string[];
  correctedResponse?: string;
}

/**
 * Validate AI response against strict routing assistant rules
 */
export function validateAIResponse(response: string): ValidationResult {
  const violations: string[] = [];
  let correctedResponse = response;

  // Check 1: Pricing violations
  const pricingPatterns = [
    /£\d+/,
    /typically.*£/i,
    /usually.*£/i,
    /around.*£/i,
    /costs?.*£/i,
    /price.*£\d+/i,
    /ranges? from/i,
  ];

  for (const pattern of pricingPatterns) {
    if (pattern.test(response)) {
      violations.push("Contains pricing information");
      // Remove pricing, add link instead
      correctedResponse = correctedResponse.replace(
        pattern,
        "You can get a quote here: https://www.newforestdevicerepairs.co.uk/repair-request"
      );
      break;
    }
  }

  // Check 2: John references
  const johnPatterns = [
    /john will/i,
    /i'?ll let john/i,
    /pass.*to john/i,
    /check with john/i,
    /john can/i,
    /john'?ll/i,
  ];

  for (const pattern of johnPatterns) {
    if (pattern.test(response)) {
      violations.push("Mentions John");
      correctedResponse = correctedResponse.replace(
        pattern,
        "You can get help here: https://www.newforestdevicerepairs.co.uk/start"
      );
      break;
    }
  }

  // Check 3: Walk-in alternatives (bypasses workflow)
  const walkInPatterns = [
    /or pop in during opening hours/i,
    /just pop in/i,
    /or just walk in/i,
    /no appointment needed/i,
    /or come by/i,
    /or drop in/i,
  ];

  for (const pattern of walkInPatterns) {
    if (pattern.test(response)) {
      violations.push("Offers walk-in alternative (bypasses workflow)");
      // Remove walk-in alternative
      correctedResponse = correctedResponse.replace(pattern, "");
      break;
    }
  }

  // Check 4: Device identification help (should route instead)
  const deviceHelpPatterns = [
    /go to settings.*general.*about/i,
    /settings.*about phone/i,
    /check the logo on the lid/i,
    /look for.*model name/i,
  ];

  for (const pattern of deviceHelpPatterns) {
    if (pattern.test(response)) {
      violations.push("Provides device identification help (should route to website)");
      correctedResponse =
        "No problem! Start here and we'll help you identify it: https://www.newforestdevicerepairs.co.uk/repair-request";
      break;
    }
  }

  // Check 5: Missing workflow link for repair/quote questions
  const needsLinkPatterns = [
    /repair/i,
    /quote/i,
    /fix/i,
    /broken/i,
    /screen/i,
    /battery/i,
  ];

  const hasLink = /newforestdevicerepairs\.co\.uk/i.test(response);
  const needsLink = needsLinkPatterns.some((pattern) => pattern.test(response));

  if (needsLink && !hasLink && violations.length === 0) {
    violations.push("Missing workflow link for repair/quote question");
    correctedResponse +=
      "\n\nYou can get started here: https://www.newforestdevicerepairs.co.uk/repair-request";
  }

  // Clean up corrected response
  if (violations.length > 0) {
    // Remove double spaces and extra newlines
    correctedResponse = correctedResponse
      .replace(/\s{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  return {
    valid: violations.length === 0,
    violations,
    correctedResponse: violations.length > 0 ? correctedResponse : undefined,
  };
}

/**
 * Log validation results
 */
export function logValidation(
  validation: ValidationResult,
  originalResponse: string
): void {
  if (!validation.valid) {
    console.warn("[Response Validator] ⚠️ Violations found:", {
      violations: validation.violations,
      originalLength: originalResponse.length,
      correctedLength: validation.correctedResponse?.length,
    });
    console.log("[Response Validator] Original:", originalResponse);
    console.log("[Response Validator] Corrected:", validation.correctedResponse);
  } else {
    console.log("[Response Validator] ✅ Response valid");
  }
}

/**
 * Check if response uses real API data (not guessing)
 */
export function validateAPIUsage(
  response: string,
  hasAPIData: boolean
): boolean {
  // If response mentions status/repair/quote info, it should have API data
  const mentionsStatus = /status|ready|progress|job ref|tracking/i.test(
    response
  );
  const mentionsQuote = /quote.*£|quoted.*price/i.test(response);

  if ((mentionsStatus || mentionsQuote) && !hasAPIData) {
    console.warn(
      "[Response Validator] ⚠️ Response mentions status/quote but no API data provided"
    );
    return false;
  }

  return true;
}
