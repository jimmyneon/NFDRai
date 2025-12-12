export function buildQuoteRequestConfirmationSms(details: {
  name: string;
  device_make: string;
  device_model: string;
  issue: string;
  type: "repair" | "sell";
}): string {
  const { name, device_make, device_model, issue, type } = details;
  const firstName = name.split(" ")[0];

  if (type === "sell") {
    return `Hi ${firstName},

Thanks for getting in touch about selling your ${device_make} ${device_model}.

To give you an accurate quote, could you reply with the storage size and condition (and any issues/cracks)? If you know roughly how old it is, that helps too.

John will get back to you ASAP with an offer.

Many thanks,
New Forest Device Repairs`;
  }

  return `Hi ${firstName},

Thanks for your repair enquiry!

John will get back to you ASAP with a quote for your ${device_make} ${device_model} (${issue}).

If you have any questions in the meantime, just reply to this message.

Many thanks,
New Forest Device Repairs`;
}
