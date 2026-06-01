# SMS Templates Documentation

This file documents all SMS templates used in the NFD Repairs system.

## Incoming SMS Templates (17 Intent Categories)

These templates are triggered by AI intent classification when customers send SMS messages.

### 1. Escalation (buildEscalationSms)

**When:** AI can't handle automatically (low confidence, complex, or unclear)
**Trigger:** `shouldEscalate = true` or `unknown_or_complex` intent

```
Thanks {firstName}, I'm not able to answer that automatically, so I'll pass this to John to review. He'll get back to you as soon as possible.

Many thanks,
New Forest Device Repairs
```

### 2. Opening Hours (buildOpeningHoursSms)

**When:** Customer asks about opening hours, closing time, when open
**Trigger:** `opening_hours` intent

```
Hi {firstName}, we're open 10am-5pm Monday to Friday, and 10am-3pm on Saturdays. We're closed Sundays.

You can check our live hours on Google Maps: https://www.google.com/maps/search/?api=1&query=New+Forest+Device+Repairs

Many thanks,
New Forest Device Repairs
```

### 3. Lunch Closure (buildLunchClosureSms)

**When:** Customer asks about lunch breaks, closed for lunch
**Trigger:** `lunch_closure` intent

```
Hi {firstName}, we're open during our normal opening hours and we don't usually close for lunch. You're welcome to pop in during opening hours.

Many thanks,
New Forest Device Repairs
```

### 4. Booking Question (buildBookingQuestionSms)

**When:** Customer asks about booking appointments, scheduling repairs
**Trigger:** `booking_question` intent

```
Hi {firstName}, we don't usually take fixed bookings. You're welcome to pop into the shop during opening hours, or you can submit a repair request here so we have the details ready: https://www.newforestdevicerepairs.co.uk/repair-request

Many thanks,
New Forest Device Repairs
```

### 5. Drop-in Question (buildDropInQuestionSms)

**When:** Customer asks about dropping in without appointment, walk-ins
**Trigger:** `drop_in_question` intent

```
Hi {firstName}, you're welcome to pop in during opening hours - no appointment needed. We're open 10am-5pm Monday to Friday, and 10am-3pm Saturdays.

You can check our live hours on Google Maps: https://www.google.com/maps/search/?api=1&query=New+Forest+Device+Repairs

Many thanks,
New Forest Device Repairs
```

### 6. New Repair Request (buildNewRepairRequestSms)

**When:** Customer wants a new repair, "can you fix", "need repair"
**Trigger:** `new_repair_request` intent

```
Thanks {firstName}, we'd be happy to help with that. Please submit a repair request here so we have the details ready: https://www.newforestdevicerepairs.co.uk/repair-request

John will review the details and get back to you as soon as possible.

Many thanks,
New Forest Device Repairs
```

### 7. Screen Quote (buildScreenQuoteSms)

**When:** Customer specifically asks for screen repair quote/price
**Trigger:** `screen_quote` intent

```
Hi {firstName}, for screen repairs John will confirm the exact quote once he has the device details.

Please submit a repair request with your device model so we can give you an accurate quote.

Many thanks,
New Forest Device Repairs
```

### 8. Battery Quote (buildBatteryQuoteSms)

**When:** Customer specifically asks for battery replacement quote/price
**Trigger:** `battery_quote` intent

```
Hi {firstName}, for battery replacements John will confirm the exact quote once he has the device details.

Please submit a repair request with your device model for an accurate quote.

Many thanks,
New Forest Device Repairs
```

### 9. Charging Port Quote (buildChargingPortQuoteSms)

**When:** Customer specifically asks for charging port repair quote/price
**Trigger:** `charging_port_quote` intent

```
Hi {firstName}, for charging port repairs John will confirm the exact quote after inspection.

Please submit a repair request with your device details.

Many thanks,
New Forest Device Repairs
```

### 10. Technical Support (buildTechnicalSupportSms)

**When:** Customer asks for help with a technical issue, troubleshooting
**Trigger:** `technical_support` intent

```
Thanks {firstName}, this sounds like technical support/troubleshooting. Technical support services start from £40. John will review the details and advise the next step.

Many thanks,
New Forest Device Repairs
```

### 11. Email Issue (buildEmailIssueSms)

**When:** Customer has email problems, can't send/receive emails
**Trigger:** `email_issue` intent

```
Thanks {firstName}, email issues can be tricky to diagnose. John will need to review the details to help troubleshoot this. Technical support starts from £40.

Many thanks,
New Forest Device Repairs
```

### 12. Device Setup (buildDeviceSetupSms)

**When:** Customer needs help setting up a new device, transferring data
**Trigger:** `device_setup` intent

```
Thanks {firstName}, we can help with device setup. This is a technical support service starting from £40. John will review your requirements and advise the next step.

Many thanks,
New Forest Device Repairs
```

### 13. Data Transfer (buildDataTransferSms)

**When:** Customer wants to transfer data from old to new device
**Trigger:** `data_transfer` intent

```
Thanks {firstName}, data transfer services start from £40 depending on the amount of data and devices involved. John will review the details and provide a quote.

Many thanks,
New Forest Device Repairs
```

### 14. Virus or Popups (buildVirusOrPopupsSms)

**When:** Customer mentions virus, malware, popups, slow performance
**Trigger:** `virus_or_popups` intent

```
Thanks {firstName}, virus/malware removal and performance optimisation starts from £40. John will need to assess the device to determine the extent of the issue.

Many thanks,
New Forest Device Repairs
```

### 15. Repair Status (buildRepairStatusSms)

**When:** Customer asks about existing repair status, "is it ready", "when done"
**Trigger:** `repair_status_request` intent
**Note:** Uses real API data to fetch actual repair status

```
Hi {firstName}, your repair status is currently: {actualStatusFromAPI}. We'll contact you when there is an update or when it's ready for collection.

Many thanks,
New Forest Device Repairs
```

### 16. Price Question (buildPriceQuestionSms)

**When:** General pricing question not specific to a repair type
**Trigger:** `price_question` intent

```
Hi {firstName}, pricing depends on the device model and the repair needed. Please submit a repair request with your device details for an accurate quote.

Many thanks,
New Forest Device Repairs
```

### 17. Deposit Question (buildDepositQuestionSms)

**When:** Customer asks about deposits, payment terms
**Trigger:** `deposit_question` intent

```
Hi {firstName}, some repairs may require a deposit if we need to order parts. John will confirm if a deposit is needed when reviewing your repair request.

Many thanks,
New Forest Device Repairs
```

### 18. Complaint or Confusion (buildComplaintOrConfusionSms)

**When:** Customer sounds angry, confused, or challenging something
**Trigger:** `complaint_or_confusion` intent

```
Thanks {firstName}, I'm not able to handle this automatically. I'll pass this to John to review and he'll get back to you as soon as possible.

Many thanks,
New Forest Device Repairs
```

### 19. Unknown or Complex (buildUnknownOrComplexSms)

**When:** Unclear intent, complex request, or multiple topics
**Trigger:** `unknown_or_complex` intent

```
Thanks {firstName}, I'm not sure I understand what you need. I'll pass this to John to review and he'll get back to you as soon as possible.

Many thanks,
New Forest Device Repairs
```

---

## Other Templates (Quotes, Acknowledgments, etc.)

### Generic Acknowledgment (buildAcknowledgmentSms)

**When:** Sent when repair request first received via form
**Purpose:** Prevents duplicate messages, sets expectations

```
Thanks {firstName}, we've received your repair request.
John will review the details and get back to you with a quote as soon as possible - usually within a couple of hours during business hours.

Many thanks,
New Forest Device Repairs
```

### Quote with Price (buildQuoteSms)

**When:** John sends an actual quote to customer
**Purpose:** Provides specific quote details with device info and pricing

```
Hi {firstName},

Your quote for the {deviceName} ({issue} - {description}) is £{amount}.

This quote is valid for 7 days.

Please check the device model and repair details above are correct before accepting.

Just reply to this message if you'd like to book in, or if you have any questions.

Many thanks,
John
New Forest Device Repairs
```

### Quote Requiring Parts Order (buildPartsOrderQuoteSms)

**When:** Quote requires parts to be ordered
**Purpose:** Adds parts ordering info to standard quote

```
[Same as buildQuoteSms but with this inserted before validity line:]

We'll need to order parts for this job. Normally next day delivery, excluding weekends.
```

### Quote Accepted (buildQuoteAcceptedSms)

**When:** Customer accepts a quote
**Purpose:** Confirms acceptance and next steps

```
Great {firstName}, thanks for accepting the quote.

We'll be in touch shortly to arrange collection or drop-off.

Many thanks,
New Forest Device Repairs
```

### Technical Support - Generic (buildTechnicalSupportSms - DUPLICATE)

**When:** Generic response for technical enquiries
**Note:** This is a duplicate function - should be removed

```
Thanks {firstName}, we've got your request for technical support.

John will be in touch as soon as possible to help you out.

Just to let you know, prices start from £40 depending on what's needed, but we'll always confirm the price with you before starting any repair.

Many thanks,
New Forest Device Repairs
```

### Don't Know (buildDontKnowSms)

**When:** Customer unsure what they need
**Purpose:** Requires manual review before sending

```
Thanks {firstName}, we've received your enquiry.

John will take a look and get back to you shortly to help figure out the best way forward.

Many thanks,
New Forest Device Repairs
```

---

## Issues Fixed

1. ✅ **Opening hours corrected:** Now shows 10am-3pm Saturday (was 10am-2pm)
2. ✅ **Google Maps link added:** Added to opening hours and drop-in templates for live hours verification
3. ✅ **Specific repair pricing removed:** Screen, battery, and charging port pricing removed - only technical support mentions £40
4. ✅ **Website link corrected:** Updated to https://www.newforestdevicerepairs.co.uk/repair-request
5. ✅ **Duplicate function removed:** Removed duplicate buildTechnicalSupportSms function
