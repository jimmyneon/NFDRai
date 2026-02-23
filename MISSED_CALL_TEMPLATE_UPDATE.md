# Missed Call Template Update

## What Changed

Updated the missed call auto-response to include website links and better guide customers to the right resources.

## New Template Features

### 📱 Repair Quotes & Appointments
**Link:** https://www.newforestdevicerepairs.co.uk/repair-request
- For customers who want pricing
- For booking in repairs
- Direct path to start the repair process

### ❓ Questions & Status Checks
**Link:** https://www.newforestdevicerepairs.co.uk/start
- For general questions
- For checking repair status (AI Steve can check the database)
- For browsing information

### What AI Steve Can Do
The template now explicitly mentions:
- "I can help with opening hours, repair status checks, and answer any questions you have!"
- Customers know they can text for status updates
- AI Steve can check the database for job status

## Example Messages

### During Business Hours (OPEN)
```
Sorry we missed your call!

We're currently OPEN until 5:00 PM.

Need help? Here's the quickest way:

📱 REPAIR QUOTES & APPOINTMENTS:
https://www.newforestdevicerepairs.co.uk/repair-request

❓ QUESTIONS & STATUS CHECKS:
Text me or visit: https://www.newforestdevicerepairs.co.uk/start

I can help with opening hours, repair status checks, and answer any questions you have!

Live hours: https://maps.google.com/...

Many thanks, AI Steve
New Forest Device Repairs
```

### After Hours (CLOSED)
```
Sorry we missed your call!

We're currently CLOSED. We'll be open Wednesday at 10:00 AM.

Need help? Here's the quickest way:

📱 REPAIR QUOTES & APPOINTMENTS:
https://www.newforestdevicerepairs.co.uk/repair-request

❓ QUESTIONS & STATUS CHECKS:
Text me or visit: https://www.newforestdevicerepairs.co.uk/start

I can help with opening hours, repair status checks, and answer any questions you have!

Live hours: https://maps.google.com/...

Many thanks, AI Steve
New Forest Device Repairs
```

## What Stayed the Same

✅ "Sorry we missed your call!" - friendly apology  
✅ Current status (OPEN/CLOSED with hours)  
✅ Google Maps link for live hours  
✅ AI Steve signature  
✅ Holiday mode support (Christmas, New Year, etc.)

## What's Better

### Before
- Generic bullet list: "Repair quotes", "Opening hours", "Booking appointments", "Any questions"
- No clear path to action
- No website links
- Customers had to text for everything

### After
- **Clear categorization:** Repairs vs Questions
- **Direct links:** Customers can self-serve immediately
- **Status checks highlighted:** Customers know AI Steve can check their repair status
- **Better UX:** Multiple options (text OR visit website)

## Benefits

1. **Self-Service:** Customers can get quotes without texting
2. **Faster:** Direct links to the right pages
3. **Clear:** Separate links for different needs
4. **Informative:** Customers know AI Steve can check repair status
5. **Flexible:** Text OR visit website - customer's choice

## File Modified

`/Users/johnhopwood/NFDRAIRESPONDER/app/api/messages/missed-call/route.ts`

Lines 261-294 updated with new template structure

## Testing

Run: `node test-missed-call-template.js`

All 3 scenarios tested:
- ✅ During business hours
- ✅ After hours
- ✅ Holiday mode

## Deployment

Changes are in the codebase and ready to deploy. Next missed call will use the new template automatically.

---

**Updated:** February 23, 2026  
**Status:** ✅ Complete and ready to deploy
