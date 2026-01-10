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

Thanks for getting in touch! I've passed your details to John and he'll send you a quote for your ${deviceDescription} (${issue}) very soon.

Feel free to reply if you have any questions in the meantime.

Many thanks,
New Forest Device Repairs`;
}
