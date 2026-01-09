/**
 * Send message via MacroDroid webhook or external provider
 */
export async function sendMessageViaProvider({
  channel,
  to,
  text,
}: {
  channel: string;
  to: string | null;
  text: string;
}): Promise<{ sent: boolean; provider: string; error?: string }> {
  if (!to) {
    return {
      sent: false,
      provider: channel,
      error: "No recipient phone/ID",
    };
  }

  // Option 1: MacroDroid Webhook (for SMS via your Android phone)
  const macrodroidBase = process.env.MACRODROID_WEBHOOK_URL;

  if (macrodroidBase && channel === "sms") {
    try {
      const response = await fetch(macrodroidBase, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          type: "sms",
          phone: to,
          message: text,
        }),
      });

      if (response.ok) {
        console.log(`[MacroDroid] SMS sent to ${to}`);
        return { sent: true, provider: "macrodroid" };
      } else {
        console.error(`[MacroDroid] Failed: ${response.status}`);
        return {
          sent: false,
          provider: "macrodroid",
          error: `HTTP ${response.status}`,
        };
      }
    } catch (error) {
      console.error("[MacroDroid] Error:", error);
      return {
        sent: false,
        provider: "macrodroid",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Option 2: Twilio SMS
  if (channel === "sms" && process.env.TWILIO_ACCOUNT_SID) {
    try {
      // Uncomment when you add Twilio credentials:
      // const twilioClient = require('twilio')(
      //   process.env.TWILIO_ACCOUNT_SID,
      //   process.env.TWILIO_AUTH_TOKEN
      // )
      // await twilioClient.messages.create({
      //   body: text,
      //   from: process.env.TWILIO_PHONE_NUMBER,
      //   to: to,
      // })

      console.log(`[Twilio SMS] Would send to ${to}: ${text}`);
      return { sent: true, provider: "twilio-sms" };
    } catch (error) {
      console.error("[Twilio SMS] Error:", error);
      return {
        sent: false,
        provider: "twilio-sms",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Option 3: Twilio WhatsApp
  if (channel === "whatsapp" && process.env.TWILIO_ACCOUNT_SID) {
    try {
      // Uncomment when you add Twilio credentials:
      // const twilioClient = require('twilio')(
      //   process.env.TWILIO_ACCOUNT_SID,
      //   process.env.TWILIO_AUTH_TOKEN
      // )
      // await twilioClient.messages.create({
      //   body: text,
      //   from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      //   to: `whatsapp:${to}`,
      // })

      console.log(`[Twilio WhatsApp] Would send to ${to}: ${text}`);
      return { sent: true, provider: "twilio-whatsapp" };
    } catch (error) {
      console.error("[Twilio WhatsApp] Error:", error);
      return {
        sent: false,
        provider: "twilio-whatsapp",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Option 4: Meta Messenger
  if (channel === "messenger" && process.env.META_PAGE_ACCESS_TOKEN) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me/messages?access_token=${process.env.META_PAGE_ACCESS_TOKEN}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
          body: JSON.stringify({
            recipient: { id: to },
            message: { text },
          }),
        }
      );

      if (response.ok) {
        console.log(`[Messenger] Sent to ${to}`);
        return { sent: true, provider: "meta-messenger" };
      } else {
        console.error(`[Messenger] Failed: ${response.status}`);
        return {
          sent: false,
          provider: "meta-messenger",
          error: `HTTP ${response.status}`,
        };
      }
    } catch (error) {
      console.error("[Messenger] Error:", error);
      return {
        sent: false,
        provider: "meta-messenger",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // No provider configured
  console.log(`[${channel}] No provider configured for ${to}: ${text}`);
  return {
    sent: false,
    provider: "none",
    error: "No messaging provider configured",
  };
}
