/**
 * Repair App Handoff
 * Sends accepted quotes to the repair app for job creation
 */

const REPAIR_APP_API_URL = "https://nfd-repairs-app.vercel.app/api/sms/send";

export interface RepairAppHandoffData {
  quoteId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deviceMake: string;
  deviceModel: string;
  issue: string;
  description?: string;
  additionalIssues?: Array<{ issue: string; description?: string }>;
  quotedPrice: number;
  requiresPartsOrder: boolean;
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
  data: RepairAppHandoffData
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
        // Map our quote data to repair app format
        quote_id: data.quoteId,
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        customer_email: data.customerEmail,
        device_make: data.deviceMake,
        device_model: data.deviceModel,
        issue: data.issue,
        description: data.description,
        additional_issues: data.additionalIssues,
        quoted_price: data.quotedPrice,
        requires_parts_order: data.requiresPartsOrder,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Repair App Handoff] ❌ Failed:", response.status, errorText);
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
 */
export function formatQuoteForRepairApp(quote: any): RepairAppHandoffData {
  return {
    quoteId: quote.id,
    customerName: quote.name,
    customerPhone: quote.phone,
    customerEmail: quote.email,
    deviceMake: quote.device_make,
    deviceModel: quote.device_model,
    issue: quote.issue,
    description: quote.description,
    additionalIssues: quote.additional_issues,
    quotedPrice: parseFloat(quote.quoted_price),
    requiresPartsOrder: quote.requires_parts_order || false,
  };
}
