/**
 * SMS Templates for different request types
 * Friendly, natural language appropriate for New Forest/Hampshire area
 */

export interface TemplateDetails {
  name: string;
  device_make?: string;
  device_model?: string;
  issue?: string;
  description?: string;
  additional_issues?: Array<{ issue: string; description: string }> | null;
  quote_amount?: number;
  additional_notes?: string;
}

/**
 * Generic acknowledgment template - sent when request first received
 * Prevents duplicate messages, sets expectations
 */
export function buildAcknowledgmentSms(name: string): string {
  const firstName = name.split(" ")[0];

  return `Thanks ${firstName}, we've received your message. 
We'll get back to you as soon as we can - usually within a couple of hours during business hours.

Many thanks,
New Forest Device Repairs`;
}

/**
 * Quote request template - when customer wants a specific price
 */
export function buildQuoteSms(details: TemplateDetails): string {
  const {
    name,
    device_make,
    device_model,
    issue,
    description,
    additional_issues,
    quote_amount,
    additional_notes,
  } = details;

  const firstName = name.split(" ")[0];
  const hasAdditionalIssues = additional_issues && additional_issues.length > 0;

  // Build device name - avoid duplication
  const deviceName =
    device_model && device_make
      ? device_model.toLowerCase().includes(device_make.toLowerCase())
        ? device_model
        : `${device_make} ${device_model}`
      : device_model || device_make || "your device";

  let message = `Hi ${firstName},\n\n`;

  if (hasAdditionalIssues) {
    message += `Your quote for the ${deviceName}:\n`;
    message += `• ${issue}`;
    if (description) message += ` - ${description}`;
    message += `\n`;

    additional_issues.forEach((repair) => {
      message += `• ${repair.issue}`;
      if (repair.description) message += ` - ${repair.description}`;
      message += `\n`;
    });

    message += `\nTotal: £${(quote_amount || 0).toFixed(2)}`;
  } else {
    message += `Your quote for the ${deviceName} (${issue}`;
    if (description) message += ` - ${description}`;
    message += `) is £${(quote_amount || 0).toFixed(2)}.`;
  }

  message += `\n\nThis quote is valid for 7 days.`;
  message += `\n\nPlease check the device model and repair details above are correct before accepting.`;
  message += `\n\nJust reply to this message if you'd like to book in, or if you have any questions.`;
  message += `\n\nMany thanks,\nJohn\nNew Forest Device Repairs`;

  return message;
}

/**
 * Quote requiring parts order template
 */
export function buildPartsOrderQuoteSms(details: TemplateDetails): string {
  const quoteMessage = buildQuoteSms(details);

  // Insert parts ordering info before the validity line
  const partsInfo = `\n\nWe'll need to order parts for this job. Normally next day delivery, excluding weekends.`;

  return quoteMessage.replace(
    `\n\nThis quote is valid for 7 days.`,
    `${partsInfo}\n\nThis quote is valid for 7 days.`,
  );
}

/**
 * Technical support template - generic response for technical enquiries
 */
export function buildTechnicalSupportSms(name: string): string {
  const firstName = name.split(" ")[0];

  return `Thanks ${firstName}, we've got your request for technical support.

John will be in touch as soon as possible to help you out.

Just to let you know, prices start from £40 depending on what's needed, but we'll always confirm the price with you before starting any repair.

Many thanks,
New Forest Device Repairs`;
}

/**
 * Don't know template - when customer unsure what they need
 * Requires manual review before sending
 */
export function buildDontKnowSms(name: string, customMessage?: string): string {
  const firstName = name.split(" ")[0];

  if (customMessage) {
    return customMessage;
  }

  return `Thanks ${firstName}, we've received your enquiry.

John will take a look and get back to you shortly to help figure out the best way forward.

Many thanks,
New Forest Device Repairs`;
}

/**
 * Quote accepted confirmation
 */
export function buildQuoteAcceptedSms(name: string): string {
  const firstName = name.split(" ")[0];

  return `Great ${firstName}, thanks for accepting the quote.

We'll be in touch shortly to arrange collection or drop-off.

Many thanks,
New Forest Device Repairs`;
}
