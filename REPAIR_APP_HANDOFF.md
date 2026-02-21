# Repair App Handoff Integration

## Overview

When a customer accepts a quote via SMS/chat, the system automatically:
1. Marks the quote as "accepted" in the database
2. Sends the quote details to the repair app API
3. Creates a job in the repair app
4. Updates the quote status to "completed" once handoff succeeds

## API Endpoint

**Repair App API:** `POST https://nfd-repairs-app.vercel.app/api/sms/send`

## Flow

### 1. Customer Receives Quote
- Quote sent via SMS with 7-day expiry
- Quote stored in `quote_requests` table with status = "quoted"

### 2. Customer Accepts Quote
Customer replies with acceptance phrases like:
- "Yes", "Yes please", "Yeah", "Yep", "Sure", "OK"
- "Go ahead", "Proceed", "Book it in"
- "When can I drop it off?", "I'll bring it in"

### 3. AI Detects Acceptance
- AI has quote acceptance workflow in prompt modules
- Checks for active quote by phone number
- Detects acceptance intent with confidence scoring
- High confidence (>0.8): Proceeds automatically
- Medium confidence: Asks for confirmation

### 4. Quote Marked as Accepted
- Status updated from "quoted" to "accepted"
- Timestamp recorded

### 5. Handoff to Repair App
**Automatic API call to repair app:**

```typescript
POST https://nfd-repairs-app.vercel.app/api/sms/send
Content-Type: application/json

{
  "quote_id": "uuid",
  "customer_name": "John Doe",
  "customer_phone": "+447123456789",
  "customer_email": "john@example.com",
  "device_make": "Apple",
  "device_model": "iPhone 14 Pro",
  "issue": "Screen replacement",
  "description": "Cracked screen, touch still works",
  "additional_issues": [
    {
      "issue": "Battery replacement",
      "description": "Battery health at 78%"
    }
  ],
  "quoted_price": 149.99,
  "requires_parts_order": false
}
```

### 6. Repair App Response
Expected response:
```json
{
  "success": true,
  "job_id": "repair-job-123",
  "message": "Job created successfully"
}
```

### 7. Status Update
- If handoff succeeds: Quote status → "completed"
- If handoff fails: Quote stays "accepted", staff notified to manually create job

## Manual Acceptance API

You can also manually trigger quote acceptance:

```bash
POST /api/quotes/accept
Content-Type: application/json

{
  "quoteId": "uuid-of-quote"
}
```

This will:
- Validate the quote exists and is in "quoted" status
- Check it hasn't expired
- Mark as accepted
- Send to repair app
- Return success/failure

## Files

### Core Logic
- `app/lib/repair-app-handoff.ts` - API integration with repair app
- `app/lib/quote-acceptance-handler.ts` - Processes acceptance and triggers handoff
- `app/lib/quote-lookup.ts` - Quote lookup and acceptance functions
- `app/lib/quote-acceptance-detector.ts` - Detects acceptance intent

### API Endpoints
- `app/api/quotes/accept/route.ts` - Manual acceptance endpoint

### Database
- `quote_requests` table - Stores all quotes
- Status flow: `pending` → `quoted` → `accepted` → `completed`

## Data Mapping

| AI Responder Field | Repair App Field |
|-------------------|------------------|
| `id` | `quote_id` |
| `name` | `customer_name` |
| `phone` | `customer_phone` |
| `email` | `customer_email` |
| `device_make` | `device_make` |
| `device_model` | `device_model` |
| `issue` | `issue` |
| `description` | `description` |
| `additional_issues` | `additional_issues` |
| `quoted_price` | `quoted_price` |
| `requires_parts_order` | `requires_parts_order` |

## Error Handling

### Handoff Fails
- Quote remains in "accepted" status
- Error logged to console
- Staff can manually create job in repair app
- Can retry by calling `/api/quotes/accept` again

### Quote Expired
- Handoff blocked
- Customer offered new quote

### Quote Already Accepted
- Handoff blocked
- Returns error message

## Testing

1. **Create a test quote** via the quotes page
2. **Send the quote** to a test phone number
3. **Reply with "Yes"** from that number
4. **Check logs** for:
   - `[Quote Acceptance] ✅ Quote marked as accepted`
   - `[Repair App Handoff] Sending accepted quote to repair app`
   - `[Repair App Handoff] ✅ Success`
5. **Verify in repair app** that job was created

## Monitoring

Watch for these log messages:

```
[Quote Acceptance] ✅ Quote marked as accepted: [quote-id]
[Repair App Handoff] Sending accepted quote to repair app: {...}
[Repair App Handoff] ✅ Success: {job_id: "..."}
[Quote Acceptance] ✅ Sent to repair app. Job ID: [job-id]
```

Or errors:

```
[Repair App Handoff] ❌ Failed: HTTP 500: ...
[Quote Acceptance] ⚠️ Failed to send to repair app: ...
```

## Future Enhancements

- Add retry logic for failed handoffs
- Store job_id in quote_requests table
- Add webhook from repair app for status updates
- Support for quote modifications before acceptance
- Batch handoff for multiple quotes
