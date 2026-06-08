/**
 * SMS Templates for different request types
 * Friendly, natural language appropriate for New Forest/Hampshire area
 * AI selects template based on intent classification, fills in variables
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
  repairStatus?: string;
  repairLink?: string;
}

/**
 * Escalation template - when AI can't handle automatically
 */
export function buildEscalationSms(name: string): string {
  const firstName = name.split(" ")[0];

  return `Thanks ${firstName}, I'm not able to answer that automatically, so I'll pass this to John to review. He'll get back to you as soon as possible.

Many thanks,
New Forest Device Repairs`;
}

/**
 * Opening hours template
 */
export function buildOpeningHoursSms(name: string): string {
  const firstName = name.split(" ")[0];

  return `Hi ${firstName}, we're open 10am-5pm Monday to Friday, and 10am-3pm on Saturdays. We're closed Sundays.

You can check our live hours on Google Maps: https://www.google.com/maps/search/?api=1&query=New+Forest+Device+Repairs

Many thanks,
New Forest Device Repairs`;
}

/**
 * Lunch closure template
 */
export function buildLunchClosureSms(name: string): string {
  const firstName = name.split(" ")[0];

  return `Hi ${firstName}, we're open during our normal opening hours and we don't usually close for lunch. You're welcome to pop in during opening hours.

Many thanks,
New Forest Device Repairs`;
}

/**
 * Booking question template
 */
export function buildBookingQuestionSms(
  name: string,
  repairLink?: string,
): string {
  const firstName = name.split(" ")[0];
  const link =
    repairLink || "https://www.newforestdevicerepairs.co.uk/repair-request";

  return `Hi ${firstName}, we don't usually take fixed bookings. You're welcome to pop into the shop during opening hours, or you can submit a repair request here so we have the details ready: ${link}

Many thanks,
New Forest Device Repairs`;
}

/**
 * Drop-in question template
 */
export function buildDropInQuestionSms(name: string): string {
  const firstName = name.split(" ")[0];

  return `Hi ${firstName}, you're welcome to pop in during opening hours - no appointment needed. We're open 10am-5pm Monday to Friday, and 10am-3pm Saturdays.

You can check our live hours on Google Maps: https://www.google.com/maps/search/?api=1&query=New+Forest+Device+Repairs

Many thanks,
New Forest Device Repairs`;
}

/**
 * Technical support template
 */
export function buildTechnicalSupportSms(name: string): string {
  const firstName = name.split(" ")[0];

  return `Thanks ${firstName}, this sounds like technical support/troubleshooting. Technical support services start from £40. John will review the details and advise the next step.

Many thanks,
New Forest Device Repairs`;
}

/**
 * Email issue template
 */
export function buildEmailIssueSms(name: string): string {
  const firstName = name.split(" ")[0];

  return `Thanks ${firstName}, email issues can be tricky to diagnose. John will need to review the details to help troubleshoot this. Technical support starts from £40.

Many thanks,
New Forest Device Repairs`;
}

/**
 * Device setup template
 */
export function buildDeviceSetupSms(name: string): string {
  const firstName = name.split(" ")[0];

  return `Thanks ${firstName}, we can help with device setup. This is a technical support service starting from £40. John will review your requirements and advise the next step.

Many thanks,
New Forest Device Repairs`;
}

/**
 * Data transfer template
 */
export function buildDataTransferSms(name: string): string {
  const firstName = name.split(" ")[0];

  return `Thanks ${firstName}, data transfer services start from £40 depending on the amount of data and devices involved. John will review the details and provide a quote.

Many thanks,
New Forest Device Repairs`;
}

/**
 * Virus or popups template
 */
export function buildVirusOrPopupsSms(name: string): string {
  const firstName = name.split(" ")[0];

  return `Thanks ${firstName}, virus/malware removal and performance optimisation starts from £40. John will need to assess the device to determine the extent of the issue.

Many thanks,
New Forest Device Repairs`;
}

/**
 * Repair status request template
 */
export function buildRepairStatusSms(
  name: string,
  repairStatus?: string,
): string {
  const firstName = name.split(" ")[0];
  const status = repairStatus || "being processed";

  return `Hi ${firstName}, your repair status is currently: ${status}. We'll contact you when there is an update or when it's ready for collection.

Many thanks,
New Forest Device Repairs`;
}

/**
 * Price question template
 */
export function buildPriceQuestionSms(name: string): string {
  const firstName = name.split(" ")[0];

  return `Hi ${firstName}, pricing depends on the device model and the repair needed. Please submit a repair request with your device details for an accurate quote.

Many thanks,
New Forest Device Repairs`;
}

/**
 * Deposit question template
 */
export function buildDepositQuestionSms(name: string): string {
  const firstName = name.split(" ")[0];

  return `Hi ${firstName}, some repairs may require a deposit if we need to order parts. John will confirm if a deposit is needed when reviewing your repair request.

Many thanks,
New Forest Device Repairs`;
}

/**
 * Complaint or confusion template
 */
export function buildComplaintOrConfusionSms(name: string): string {
  const firstName = name.split(" ")[0];

  return `Thanks ${firstName}, I'm not able to handle this automatically. I'll pass this to John to review and he'll get back to you as soon as possible.

Many thanks,
New Forest Device Repairs`;
}

/**
 * Queue template - for awaiting review
 * Use once only, do not repeat
 */
export function buildQueueSms(name: string): string {
  const firstName = name.split(" ")[0];

  return `Thanks for your patience. Your enquiry is currently awaiting review. John will respond as soon as possible.

Many thanks,
New Forest Device Repairs`;
}

/**
 * Unknown or complex template
 */
export function buildUnknownOrComplexSms(name: string): string {
  const firstName = name.split(" ")[0];

  return `Thanks ${firstName}, I'm not sure I understand what you need. I'll pass this to John to review and he'll get back to you as soon as possible.

Many thanks,
New Forest Device Repairs`;
}

/**
 * Generic acknowledgment template - sent when request first received
 * Prevents duplicate messages, sets expectations
 */
export function buildAcknowledgmentSms(name: string): string {
  const firstName = name.split(" ")[0];

  return `Thanks ${firstName}, we've received your repair request. 
John will review the details and get back to you with a quote as soon as possible - usually within a couple of hours during business hours.

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
