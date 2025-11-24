/**
 * Detects automated messages from companies/services that shouldn't receive AI responses
 *
 * Returns true if the message appears to be from an automated system
 */
export function isAutoresponder(message: string, phoneNumber: string): boolean {
  const lowerMessage = message.toLowerCase();

  // Common autoresponder patterns
  const autoresponderPatterns = [
    // Delivery services
    /your\s+(order|parcel|delivery|package)\s+(is|has|will)/i,
    /out\s+for\s+delivery/i,
    /delivered\s+to/i,
    /tracking\s+(number|code|link)/i,
    /estimated\s+delivery/i,

    // E-commerce
    /order\s+(confirmation|confirmed|placed|received)/i,
    /thank\s+you\s+for\s+your\s+(order|purchase)/i,
    /your\s+order\s+#?\d+/i,
    /payment\s+(received|confirmed|processed)/i,
    /invoice\s+(attached|#\d+)/i,

    // Appointment/booking confirmations
    /appointment\s+(confirmed|booked|scheduled)/i,
    /booking\s+(confirmed|reference)/i,
    /confirmation\s+(code|number)/i,
    /reference\s+(number|code):\s*[A-Z0-9]+/i,

    // Marketing/promotional
    /unsubscribe|opt.?out/i,
    /click\s+here\s+to/i,
    /visit\s+our\s+website/i,
    /limited\s+time\s+offer/i,
    /discount\s+code/i,
    /promo\s+code/i,

    // Notifications
    /this\s+is\s+an?\s+automated/i,
    /do\s+not\s+reply/i,
    /no.?reply/i,
    /automated\s+(message|notification)/i,

    // Two-factor auth / verification
    /verification\s+code/i,
    /your\s+code\s+is/i,
    /\d{4,6}\s+is\s+your/i,
    /one.?time\s+password/i,
    /OTP/i,

    // Banking/financial
    /account\s+(balance|statement)/i,
    /transaction\s+(alert|notification)/i,
    /card\s+ending\s+(in\s+)?\d{4}/i,
    /payment\s+(reminder|due|overdue)/i,
    /minimum\s+payment/i,
    /direct\s+debit/i,
    /standing\s+order/i,
    /reply\s+yes\s+to\s+pay/i,
    /debit\s+card\s+ending/i,

    // Specific company patterns
    /ebay/i,
    /lebara/i,
    /domino'?s/i,
    /amazon/i,
    /paypal/i,
    /uber/i,
    /deliveroo/i,
    /just\s+eat/i,
    /dpd/i,
    /royal\s+mail/i,
    /hermes/i,
    /yodel/i,
    /evri/i,
    /vanquis/i,
    /barclaycard/i,
    /capital\s+one/i,
    /mbna/i,
    /tesco\s+bank/i,
  ];

  for (const pattern of autoresponderPatterns) {
    if (pattern.test(lowerMessage)) {
      return true;
    }
  }

  // Check for short codes (5-6 digit numbers) commonly used by automated systems
  if (/^\d{5,6}$/.test(phoneNumber)) {
    return true;
  }

  // Check for alphanumeric sender IDs (e.g., "AMAZON", "EBAY")
  if (/^[A-Z]{3,}$/.test(phoneNumber)) {
    return true;
  }

  // Check for messages that are all caps (often automated)
  const words = message.split(/\s+/);
  const capsWords = words.filter((w) => w === w.toUpperCase() && w.length > 2);
  if (words.length > 5 && capsWords.length / words.length > 0.7) {
    return true; // More than 70% caps words
  }

  // Check for messages with lots of links
  const linkCount = (message.match(/https?:\/\//g) || []).length;
  if (linkCount >= 2) {
    return true; // Multiple links usually means automated
  }

  return false;
}

/**
 * Get a human-readable reason for the autoresponder detection
 */
export function getAutoresponderReason(
  message: string,
  phoneNumber: string
): string {
  const lowerMessage = message.toLowerCase();

  if (/^\d{5,6}$/.test(phoneNumber)) {
    return "Short code number (automated system)";
  }

  if (/^[A-Z]{3,}$/.test(phoneNumber)) {
    return "Alphanumeric sender ID (automated system)";
  }

  if (/your\s+(order|parcel|delivery)/.test(lowerMessage)) {
    return "Delivery notification";
  }

  if (/order\s+confirmation/.test(lowerMessage)) {
    return "Order confirmation";
  }

  if (/verification\s+code|your\s+code\s+is/.test(lowerMessage)) {
    return "Verification code";
  }

  if (/do\s+not\s+reply|no.?reply/.test(lowerMessage)) {
    return "No-reply automated message";
  }

  if (/ebay|lebara|domino|amazon|paypal/.test(lowerMessage)) {
    return "Known company automated message";
  }

  const linkCount = (message.match(/https?:\/\//g) || []).length;
  if (linkCount >= 2) {
    return "Multiple links (likely automated)";
  }

  return "Automated message pattern detected";
}
