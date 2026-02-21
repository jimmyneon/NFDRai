/**
 * Repair App Handoff
 * Sends accepted quotes to the repair app for job creation
 */

const REPAIR_APP_API_URL = "https://nfd-repairs-app.vercel.app/api/sms/send";

export interface RepairAppHandoffData {
  // Quote identification
  quoteId: string;

  // Customer details
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerId?: string;

  // Device details
  deviceMake: string;
  deviceModel: string;
  issue: string;
  description?: string;
  additionalIssues?: Array<{ issue: string; description?: string }>;

  // Quote details
  quotedPrice: number;
  quotedAt?: string;
  quotedBy?: string;
  expiresAt?: string;
  requiresPartsOrder: boolean;

  // Source tracking
  type: string; // 'repair' or 'sell'
  source?: string; // 'website', 'webchat', etc.
  page?: string; // Originating page

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // SMS/Notification tracking
  smsSent?: boolean;
  smsSentAt?: string;
  notificationUrl?: string;
  notificationReceivedAt?: string;
  quoteSentAt?: string;
  quoteSentBy?: string;

  // Conversation link
  conversationId?: string;
}

export interface RepairAppHandoffResult {
  success: boolean;
  error?: string;
  jobId?: string;
}

/**
 * Send accepted quote to repair app for job creation
 */
export async function sendToRepairApp(
  data: RepairAppHandoffData,
): Promise<RepairAppHandoffResult> {
  try {
    console.log("[Repair App Handoff] Sending accepted quote to repair app:", {
      quoteId: data.quoteId,
      customer: data.customerName,
      device: `${data.deviceMake} ${data.deviceModel}`,
      price: data.quotedPrice,
    });

    const response = await fetch(REPAIR_APP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Quote identification
        quote_id: data.quoteId,

        // Customer details
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        customer_email: data.customerEmail,
        customer_id: data.customerId,

        // Device details
        device_make: data.deviceMake,
        device_model: data.deviceModel,
        issue: data.issue,
        description: data.description,
        additional_issues: data.additionalIssues,

        // Quote details
        quoted_price: data.quotedPrice,
        quoted_at: data.quotedAt,
        quoted_by: data.quotedBy,
        expires_at: data.expiresAt,
        requires_parts_order: data.requiresPartsOrder,

        // Source tracking
        type: data.type,
        source: data.source,
        page: data.page,

        // Timestamps
        created_at: data.createdAt,
        updated_at: data.updatedAt,

        // SMS/Notification tracking
        sms_sent: data.smsSent,
        sms_sent_at: data.smsSentAt,
        notification_url: data.notificationUrl,
        notification_received_at: data.notificationReceivedAt,
        quote_sent_at: data.quoteSentAt,
        quote_sent_by: data.quoteSentBy,

        // Conversation link
        conversation_id: data.conversationId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "[Repair App Handoff] ❌ Failed:",
        response.status,
        errorText,
      );
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const result = await response.json();
    console.log("[Repair App Handoff] ✅ Success:", result);

    return {
      success: true,
      jobId: result.job_id || result.id,
    };
  } catch (error) {
    console.error("[Repair App Handoff] ❌ Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Format quote request data for repair app handoff
 * Includes ALL fields from quote_requests table
 */
export function formatQuoteForRepairApp(quote: any): RepairAppHandoffData {
  return {
    // Quote identification
    quoteId: quote.id,

    // Customer details
    customerName: quote.name,
    customerPhone: quote.phone,
    customerEmail: quote.email,
    customerId: quote.customer_id,

    // Device details
    deviceMake: quote.device_make,
    deviceModel: quote.device_model,
    issue: quote.issue,
    description: quote.description,
    additionalIssues: quote.additional_issues,

    // Quote details
    quotedPrice: parseFloat(quote.quoted_price),
    quotedAt: quote.quoted_at,
    quotedBy: quote.quoted_by,
    expiresAt: quote.expires_at,
    requiresPartsOrder: quote.requires_parts_order || false,

    // Source tracking
    type: quote.type || "repair",
    source: quote.source,
    page: quote.page,

    // Timestamps
    createdAt: quote.created_at,
    updatedAt: quote.updated_at,

    // SMS/Notification tracking
    smsSent: quote.sms_sent,
    smsSentAt: quote.sms_sent_at,
    notificationUrl: quote.notification_url,
    notificationReceivedAt: quote.notification_received_at,
    quoteSentAt: quote.quote_sent_at,
    quoteSentBy: quote.quote_sent_by,

    // Conversation link
    conversationId: quote.conversation_id,
  };
}
