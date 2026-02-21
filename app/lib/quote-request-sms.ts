export function buildQuoteRequestConfirmationSms(details: {
  name: string;
  device_make: string;
  device_model: string;
  issue: string;
  type: "repair" | "sell";
}): string {
  const { name, device_make, device_model, issue, type } = details;
  const firstName = name.split(" ")[0];

  // Avoid duplicate device type (e.g., "iPhone iPhone 14" -> "iPhone 14")
  const deviceDescription = device_model
    .toLowerCase()
    .includes(device_make.toLowerCase())
    ? device_model
    : `${device_make} ${device_model}`;

  if (type === "sell") {
    return `Hi ${firstName},

Thanks for getting in touch about selling your ${deviceDescription}.

To give you an accurate quote, could you reply with the storage size and condition (and any issues/cracks)? If you know roughly how old it is, that helps too.

John will get back to you ASAP with an offer.

Many thanks,
New Forest Device Repairs`;
  }

  return `Hi ${firstName},

Thanks for getting in touch with New Forest Device Repairs. Your repair/quote request for your ${deviceDescription} (${issue}) has been received and is being reviewed.

Our technician will respond shortly with the next steps.

You're welcome to reply to this message if you need to add any further information or have any questions.

Many thanks,
New Forest Device Repairs`;
}
