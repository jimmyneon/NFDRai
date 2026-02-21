# SMS Template Structure Guide

## Overview
All SMS messages from New Forest Device Repairs follow a consistent structure with proper spacing and formatting.

---

## Standard Template Structure

### 1. **Greeting**
```
Hi {FirstName},

```
- Use first name only (extracted from full name)
- Always followed by **double newline** (`\n\n`)

### 2. **Main Content**
```
{Main message content here}

```
- Clear, concise message body
- Each paragraph separated by **double newline** (`\n\n`)
- Multiple paragraphs allowed

### 3. **Call to Action / Additional Info** (Optional)
```
{Additional information or instructions}

```
- Separated by **double newline** (`\n\n`)
- Examples: "This quote is valid for 7 days.", "Just reply to this message..."

### 4. **Sign-off**
```
Many thanks, {Name}
New Forest Device Repairs
```
- Always preceded by **double newline** (`\n\n`)
- Two formats:
  - **Staff messages:** `Many thanks, John\nNew Forest Device Repairs`
  - **AI messages:** `Many thanks, AI Steve\nNew Forest Device Repairs`
  - **System messages:** `Many thanks,\nNew Forest Device Repairs` (no name)
- Sign-off uses **single newline** (`\n`) between name and business name

---

## Complete Template Examples

### Quote SMS (Single Repair)
```
Hi {FirstName},

Your quote for the {DeviceName} ({Issue} - {Description}) is £{Amount}.

This quote is valid for 7 days.

Just reply to this message if you'd like to book in, or if you have any questions.

Many thanks, John
New Forest Device Repairs
```

**Example Output:**
```
Hi Sarah,

Your quote for the iPhone 14 (Screen damage - Cracked) is £149.99.

This quote is valid for 7 days.

Just reply to this message if you'd like to book in, or if you have any questions.

Many thanks, John
New Forest Device Repairs
```

---

### Quote SMS (Multiple Repairs)
```
Hi {FirstName},

Your quote for the {DeviceName}:
• {Issue1} - {Description1}
• {Issue2} - {Description2}

Total: £{Amount}

This quote is valid for 7 days.

Just reply to this message if you'd like to book in, or if you have any questions.

Many thanks, John
New Forest Device Repairs
```

**Example Output:**
```
Hi Mike,

Your quote for the Samsung Galaxy S23:
• Screen damage - Cracked
• Battery replacement - Won't hold charge

Total: £199.00

This quote is valid for 7 days.

Just reply to this message if you'd like to book in, or if you have any questions.

Many thanks, John
New Forest Device Repairs
```

---

### Quote SMS (Parts Order Required)
```
Hi {FirstName},

Your quote for the {DeviceName} ({Issue} - {Description}) is £{Amount}.

We will need to order parts for this job. Normally next day delivery, excluding weekends.

This quote is valid for 7 days.

Just reply to this message if you'd like to book in, or if you have any questions.

Many thanks, John
New Forest Device Repairs
```

---

### Quote Request Confirmation (Repair)
```
Hi {FirstName},

Thanks for getting in touch with New Forest Device Repairs. Your repair/quote request for your {DeviceName} ({Issue}) has been received and is being reviewed.

Our technician will respond shortly with the next steps.

You're welcome to reply to this message if you need to add any further information or have any questions.

Many thanks,
New Forest Device Repairs
```

---

### Quote Request Confirmation (Sell Device)
```
Hi {FirstName},

Thanks for getting in touch about selling your {DeviceName}.

To give you an accurate quote, could you reply with the storage size and condition (and any issues/cracks)? If you know roughly how old it is, that helps too.

John will get back to you ASAP with an offer.

Many thanks,
New Forest Device Repairs
```

---

### Unable to Quote (Needs Assessment)
```
Hi {FirstName},

Thanks for the information provided about your {DeviceName} ({Issue}).

This type of issue requires a brief in-store assessment before we can diagnose the fault and provide an exact price.

You're welcome to bring the device in during opening hours and we'll take a look. If diagnostics are required, we'll confirm that with you before proceeding.

Find us here: {GoogleMapsURL}

Many thanks, John
New Forest Device Repairs
```

---

### Missed Call Auto-Response
```
Sorry we missed your call!

I can help with pricing, bookings, or any questions you have. Just text back and I'll get you sorted straight away.

Many thanks, AI Steve
New Forest Device Repairs
```

---

## Spacing Rules Summary

### ✅ **ALWAYS Use Double Newline (`\n\n`):**
- After greeting: `Hi Sarah,\n\n`
- Between paragraphs in main content
- Before sign-off: `{content}\n\nMany thanks, John`

### ✅ **ALWAYS Use Single Newline (`\n`):**
- Within sign-off: `Many thanks, John\nNew Forest Device Repairs`
- Within bullet lists: `• Item 1\n• Item 2`

### ❌ **NEVER:**
- Use triple newlines (`\n\n\n`)
- Mix spacing inconsistently
- Forget spacing before sign-off

---

## Device Name Handling

**Avoid Duplication:**
```typescript
// If device_model already contains device_make, don't duplicate
const deviceName = device_model.toLowerCase().includes(device_make.toLowerCase())
  ? device_model
  : `${device_make} ${device_model}`;
```

**Examples:**
- ✅ `iPhone 14` (not "iPhone iPhone 14")
- ✅ `Samsung Galaxy S23` (not "Android Phone Samsung Galaxy S23")
- ✅ `iPad Air` (not "iPad / Tablet iPad Air")

---

## Name Extraction

**Always use first name only:**
```typescript
const firstName = name.split(" ")[0];
```

**Examples:**
- "Sarah Johnson" → "Hi Sarah,"
- "Mike" → "Hi Mike,"
- "Dr. Emma Smith" → "Hi Dr.,"

---

## Sign-off Variations

### Staff Messages (John)
```
Many thanks, John
New Forest Device Repairs
```

### AI Messages (AI Steve)
```
Many thanks, AI Steve
New Forest Device Repairs
```

### System Messages (No Name)
```
Many thanks,
New Forest Device Repairs
```

---

## Implementation Files

- **Quote SMS:** `/app/api/quotes/send/route.ts`
  - `buildQuoteSms()` - Standard quote
  - `buildPartsOrderQuoteSms()` - Quote with parts order

- **Quote Request Confirmation:** `/app/lib/quote-request-sms.ts`
  - `buildQuoteRequestConfirmationSms()` - Initial confirmation

- **Unable to Quote:** `/app/api/quotes/unable/route.ts`
  - `buildUnableToQuoteSms()` - Needs assessment

- **Missed Call:** `/app/api/messages/missed-call/route.ts`
  - Auto-response template

---

## Testing Checklist

When creating or modifying SMS templates:

- [ ] Greeting has double newline after it
- [ ] All paragraphs separated by double newline
- [ ] Sign-off has double newline before it
- [ ] Sign-off uses single newline between name and business name
- [ ] Device name doesn't duplicate (e.g., "iPhone iPhone 14")
- [ ] First name extracted correctly
- [ ] Message is clear and professional
- [ ] No triple newlines anywhere
- [ ] Consistent spacing throughout

---

## Common Mistakes to Avoid

❌ **Missing spacing before sign-off:**
```
Just reply if you have questions.
Many thanks, John
```

✅ **Correct:**
```
Just reply if you have questions.

Many thanks, John
```

---

❌ **Wrong newlines in sign-off:**
```
Many thanks, John

New Forest Device Repairs
```

✅ **Correct:**
```
Many thanks, John
New Forest Device Repairs
```

---

❌ **Device name duplication:**
```
Your quote for the iPhone iPhone 14
```

✅ **Correct:**
```
Your quote for the iPhone 14
```

---

## Quick Reference

```
Hi {FirstName},\n\n
{Paragraph 1}\n\n
{Paragraph 2}\n\n
{Paragraph 3}\n\n
Many thanks, {Name}\n
New Forest Device Repairs
```

**Line count:** 7 lines total (including blank lines)
**Newline count:** 6 newlines total (4 double, 1 single)
