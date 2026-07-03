import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ||
  "New Forest Device Repairs <noreply@newforestdevicerepairs.co.uk>";

/**
 * Send an email via Resend
 * Used as a fallback when SMS fails or the customer's number isn't a UK mobile
 */
export async function sendQuoteEmail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}): Promise<{ sent: boolean; provider: string; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.error("[Email] No RESEND_API_KEY configured");
    return {
      sent: false,
      provider: "resend",
      error: "No RESEND_API_KEY configured",
    };
  }

  if (!to) {
    return {
      sent: false,
      provider: "resend",
      error: "No recipient email address",
    };
  }

  try {
    const { data, error } = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      text,
    });

    if (error) {
      console.error("[Email] Resend error:", error);
      return {
        sent: false,
        provider: "resend",
        error: error.message,
      };
    }

    console.log(`[Email] ✅ Sent to ${to} (id: ${data?.id})`);
    return { sent: true, provider: "resend" };
  } catch (error) {
    console.error("[Email] Error:", error);
    return {
      sent: false,
      provider: "resend",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
