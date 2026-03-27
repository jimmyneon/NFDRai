/**
 * Sync quote data to Repair App
 * Sends quote information via webhook for integration with Repair App's quote lookup system
 */

interface QuoteData {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  device_make: string;
  device_model: string;
  issue: string;
  description?: string | null;
  additional_issues?: Array<{ issue: string; description: string }> | null;
  quoted_price?: number | null;
  status?: string;
  type?: string;
  page?: string | null;
  source?: string;
  requires_parts_order?: boolean;
  conversation_id?: string | null;
  created_at?: string;
}

export async function syncQuoteToRepairApp(quoteData: QuoteData): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Check if webhook URL is configured
    const webhookUrl = process.env.REPAIR_APP_WEBHOOK_URL;
    const webhookSecret = process.env.REPAIR_APP_WEBHOOK_SECRET;

    if (!webhookUrl || !webhookSecret) {
      console.log('[Repair App Sync] Webhook not configured - skipping sync');
      return { success: true }; // Not an error, just not configured
    }

    // Build webhook payload
    const payload = {
      quote_request_id: quoteData.id,
      customer_name: quoteData.name,
      customer_phone: quoteData.phone,
      customer_email: quoteData.email || undefined,
      device_make: quoteData.device_make,
      device_model: quoteData.device_model,
      issue: quoteData.issue,
      description: quoteData.description || undefined,
      additional_issues: quoteData.additional_issues || undefined,
      quoted_price: quoteData.quoted_price || undefined,
      status: quoteData.status || 'pending',
      type: quoteData.type || 'repair',
      source_page: quoteData.page || undefined,
      source: quoteData.source || 'website',
      requires_parts_order: quoteData.requires_parts_order || false,
      conversation_id: quoteData.conversation_id || undefined,
      created_at: quoteData.created_at || new Date().toISOString(),
    };

    console.log('[Repair App Sync] Syncing quote to Repair App:', {
      quote_id: quoteData.id,
      customer: quoteData.name,
      device: `${quoteData.device_make} ${quoteData.device_model}`,
    });

    // Send webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': webhookSecret,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Repair App Sync] Failed to sync quote:', {
        status: response.status,
        error: errorText,
      });
      return {
        success: false,
        error: `Webhook failed: ${response.status} - ${errorText}`,
      };
    }

    console.log('[Repair App Sync] ✅ Quote synced successfully');
    return { success: true };
  } catch (error) {
    console.error('[Repair App Sync] Error syncing quote:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
