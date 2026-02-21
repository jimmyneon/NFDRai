# Repair Status API Integration

## Overview
AI Steve can now check repair job statuses in real-time using the repair app API.

---

## How It Works

### 1. **Automatic Detection**
When a customer sends a message containing status-related keywords, the system automatically checks for repair jobs:

**Keywords that trigger status check:**
- "status"
- "ready"
- "update"
- "how's"
- "progress"
- "when will"
- "finished"
- "done"
- "collect"

### 2. **API Call**
The system calls the repair app API:
```
GET https://nfd-repairs-app.vercel.app/api/jobs/check-status?phone={customer_phone}
```

### 3. **AI Response**
AI Steve receives the job data and formats an appropriate response based on:
- Number of jobs found (single, multiple, or none)
- Current status of each job
- Tracking URLs
- Job reference numbers

---

## Response Templates

### **Single Job Found**
```
I can see you have one repair with us:

📱 Apple iPhone 14 Pro - Screen replacement
Status: Ready to Collect
Job Ref: NFD-2024-001

Great news! Your device is ready to collect. Opening hours: https://maps.app.goo.gl/jAvhRuG61bssFcL7A

Track your repair: https://nfd-repairs-app.vercel.app/t/abc123...

Many thanks, AI Steve
New Forest Device Repairs
```

### **Multiple Jobs Found**
```
I can see you have 2 repairs with us:

1. 📱 Apple iPhone 14 Pro - Screen replacement
   Status: Ready to Collect
   Job Ref: NFD-2024-001

2. 💻 Samsung Galaxy S23 - Battery replacement
   Status: In Repair
   Job Ref: NFD-2024-002

Would you like details about a specific repair?

Many thanks, AI Steve
New Forest Device Repairs
```

### **No Jobs Found (Critical Handling)**
```
I can't seem to find any repair jobs under this phone number.

This could be because:
• You're texting from a different number than the one used for booking
• The repair was booked under a different phone number

Please try:
1. Text from the phone number you used when booking the repair, OR
2. Reply with your job reference number (e.g., NFD-2024-001), OR
3. Let me know and I'll pass this to our team for assistance

How would you like to proceed?

Many thanks, AI Steve
New Forest Device Repairs
```

---

## Status-Specific Messages

AI Steve provides context-aware messages based on job status:

| Status | Message |
|--------|---------|
| **READY_TO_COLLECT** | "Great news! Your device is ready to collect. Opening hours: [link]" |
| **IN_REPAIR** | "Our technicians are currently working on your device. We'll update you when it's ready." |
| **AWAITING_DEPOSIT** | "We need a £[amount] deposit to order parts. Please contact us to arrange payment." |
| **PARTS_ORDERED** | "Parts have been ordered and we'll notify you when they arrive." |
| **READY_TO_BOOK_IN** | "Your repair is ready to be booked in. You can drop your device off during opening hours." |
| **RECEIVED** | "We've received your repair request and will assess it shortly." |
| **COMPLETED** | "Your repair has been completed and collected. Thank you!" |
| **CANCELLED** | "This repair was cancelled." |

---

## Implementation Details

### **Files Modified**

1. **`/app/lib/repair-status-checker.ts`** (NEW)
   - API client for repair status endpoint
   - Response formatting functions
   - Status-specific message templates

2. **`/app/api/messages/incoming/route.ts`**
   - Added status inquiry detection
   - Calls `checkRepairStatus()` when customer asks about repairs
   - Adds repair status data to AI context

3. **`/supabase/migrations/082_add_status_check_api.sql`** (NEW)
   - Updates `status_check` prompt module
   - Adds API integration instructions
   - Includes response templates for all scenarios

---

## Example Conversation Flow

**Customer:** "What's the status of my repair?"

**System:**
1. Detects status inquiry keywords
2. Calls repair app API with customer's phone number
3. Receives job data
4. Formats data for AI context
5. AI generates response using status_check module

**AI Steve:**
```
I can see you have one repair with us:

📱 iPhone 14 Pro - Screen replacement
Status: Ready to Collect
Job Ref: NFD-2024-001

Great news! Your device is ready to collect. Opening hours: https://maps.app.goo.gl/jAvhRuG61bssFcL7A

Track your repair: https://nfd-repairs-app.vercel.app/t/abc123...
```

---

## Critical: No Jobs Found Handling

**⚠️ IMPORTANT:** When no jobs are found, AI Steve does NOT say:
- ❌ "You don't have any repairs"
- ❌ "No repairs found"
- ❌ "We don't have any record"

**Instead, AI Steve:**
- ✅ Suggests customer may be texting from wrong number
- ✅ Offers alternative solutions (job reference number, escalation)
- ✅ Keeps conversation helpful and positive

This prevents customer frustration when they're texting from a different phone.

---

## Phone Number Handling

The API automatically handles different phone number formats:
- `+447410381247` (international)
- `07410381247` (UK format)
- `+44 7410 381247` (with spaces)

Both formats are tried to maximize match rate.

---

## Testing

### **Test Status Check**
1. Send message: "What's the status of my repair?"
2. System should detect status inquiry
3. API call should be made
4. AI should respond with job details or no-jobs template

### **Test Keywords**
Try different variations:
- "Is my phone ready?"
- "Any update on my repair?"
- "How's my device doing?"
- "When will it be finished?"
- "Can I collect it?"

All should trigger status check.

---

## Deployment Checklist

- [x] Create `repair-status-checker.ts` API client
- [x] Add status check to incoming message handler
- [x] Create migration 082 for status_check prompt
- [ ] Apply migration 082 to Supabase
- [ ] Deploy to Vercel
- [ ] Test with real customer phone number
- [ ] Verify no-jobs template works correctly
- [ ] Verify multiple jobs display correctly

---

## Benefits

✅ **Real-time status updates** - No manual checking required
✅ **Automatic detection** - AI knows when to check status
✅ **Accurate information** - Direct from repair app database
✅ **Better UX** - Customers get instant answers
✅ **Reduced manual work** - Staff don't need to answer status questions
✅ **Tracking links** - Customers can track repairs themselves

---

## API Endpoint Documentation

**Endpoint:** `GET https://nfd-repairs-app.vercel.app/api/jobs/check-status?phone={phone}`

**Response:**
```json
{
  "success": true,
  "phone": "+447410381247",
  "jobs": [
    {
      "id": "...",
      "job_ref": "NFD-2024-001",
      "customer_name": "John Smith",
      "device_make": "Apple",
      "device_model": "iPhone 14 Pro",
      "issue": "Screen replacement",
      "status": "READY_TO_COLLECT",
      "status_label": "Ready to Collect",
      "quoted_price": 149.99,
      "tracking_url": "https://...",
      ...
    }
  ]
}
```

---

## Next Steps

1. **Apply migration 082** to update the `status_check` prompt module
2. **Deploy to Vercel** to activate the integration
3. **Test with real customer** to verify it works end-to-end
4. **Monitor logs** to ensure API calls are successful
5. **Gather feedback** from customers using the feature
