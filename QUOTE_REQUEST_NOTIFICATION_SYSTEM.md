# Quote Request Notification System

## Overview

Complete system for handling repair request notifications from MacroDroid, displaying quote details, and sending SMS quotes.

## Flow

1. **MacroDroid sends notification** → `POST http://192.168.178.188:8080/repair-request`
2. **System creates quote link** → `/dashboard/quotes/[id]`
3. **Staff opens link** → Views repair details and enters quote amount
4. **Staff sends quote** → SMS sent via MacroDroid API

## Components Created

### 1. API Endpoint - Receive Notifications

**File:** `/app/api/repair-request/route.ts`

Receives notification from MacroDroid when a repair request comes in.

**Request:**

```bash
curl -X POST http://192.168.178.188:8080/repair-request \
  -d "https://example.com/repair/[quote_id]"
```

**Response:**

```json
{
  "success": true,
  "quote_id": "uuid",
  "quote_url": "https://yourdomain.com/dashboard/quotes/uuid"
}
```

### 2. Database Migration

**File:** `/supabase/migrations/065_add_quote_notification_fields.sql`

Adds fields to `quote_requests` table:

- `notification_url` - URL received from MacroDroid
- `notification_received_at` - Timestamp of notification
- `quote_sent_at` - When quote SMS was sent
- `quote_sent_by` - User who sent the quote

**Apply migration:**

```bash
cd supabase
supabase db push
```

### 3. Quote Detail Page

**File:** `/app/dashboard/quotes/[id]/page.tsx`

Displays:

- Customer details (name, phone, email)
- Repair details (device make, model, issue)
- Quote form with amount input
- Previous quote info (if already sent)

**URL:** `/dashboard/quotes/[quote_id]`

### 4. Quote Form Component

**File:** `/components/quotes/quote-form.tsx`

Features:

- Quote amount input (£)
- Additional notes textarea (optional)
- SMS preview
- Send button
- Success/error handling
- Auto-redirect after sending

### 5. API Endpoint - Send Quote

**File:** `/app/api/quotes/send/route.ts`

Sends quote via SMS and updates database.

**Request:**

```json
{
  "quote_id": "uuid",
  "quote_amount": 149.99,
  "additional_notes": "Includes screen protector"
}
```

**SMS Format:**

```
Hi [Name],

Quote for your [Make] [Model] ([Issue]):

£149.99

[Additional notes if provided]

Reply to book in or ask any questions.

Many thanks, John
New Forest Device Repairs
```

### 6. Updated Quote List

**File:** `/components/quotes/quote-requests-list.tsx`

Added "View Details" link to each quote request that opens the individual quote page.

## Usage

### Step 1: MacroDroid Notification

When a repair request comes in, MacroDroid sends:

```bash
curl -X POST http://192.168.178.188:8080/repair-request \
  -d "https://example.com/repair/abc-123-def"
```

### Step 2: Open Quote Page

Navigate to `/dashboard/quotes` and click "View Details" on any quote request.

Or directly access: `/dashboard/quotes/[quote_id]`

### Step 3: Enter Quote

1. Review customer and repair details
2. Enter quote amount (£)
3. Add optional notes (turnaround time, warranty info, etc.)
4. Click "Send Quote via SMS"

### Step 4: SMS Sent

- Quote SMS sent to customer via MacroDroid API
- Database updated with quote amount and timestamp
- Status changed to "quoted"
- Redirect to quotes list

## Database Schema

```sql
-- quote_requests table (updated)
CREATE TABLE quote_requests (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  device_make TEXT NOT NULL,
  device_model TEXT NOT NULL,
  issue TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  quoted_price NUMERIC(10,2),
  quoted_at TIMESTAMPTZ,
  quoted_by UUID,

  -- New fields
  notification_url TEXT,
  notification_received_at TIMESTAMPTZ,
  quote_sent_at TIMESTAMPTZ,
  quote_sent_by UUID,

  -- Existing fields
  sms_sent BOOLEAN DEFAULT FALSE,
  sms_sent_at TIMESTAMPTZ,
  conversation_id UUID,
  customer_id UUID,
  source TEXT DEFAULT 'website',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## API Endpoints

### Receive Notification

```
POST /api/repair-request
Body: URL string (e.g., "https://example.com/repair/123")
```

### Send Quote

```
POST /api/quotes/send
Body: {
  "quote_id": "uuid",
  "quote_amount": 149.99,
  "additional_notes": "Optional notes"
}
```

## Testing

### Test Notification Endpoint

```bash
# Replace with actual quote_id from your database
curl -X POST http://localhost:3000/api/repair-request \
  -d "https://example.com/repair/YOUR_QUOTE_ID"
```

### Test Quote Page

1. Go to `/dashboard/quotes`
2. Click "View Details" on any quote
3. Enter amount and send

## MacroDroid Integration

### Notification Webhook

Configure MacroDroid to send POST request when repair request received:

```
URL: http://YOUR_DOMAIN/api/repair-request
Method: POST
Body: https://example.com/repair/[quote_id]
```

### SMS Sending

The system uses existing MacroDroid SMS API via `sendMessageViaProvider()`:

- Automatically formats quote message
- Sends via configured messaging provider
- Updates database on success

## Features

✅ Receive repair request notifications
✅ Display full repair details
✅ Enter quote amount with validation
✅ Optional additional notes
✅ SMS preview before sending
✅ Send quote via MacroDroid API
✅ Track quote status and history
✅ Link from quote list to detail page
✅ Prevent duplicate quotes
✅ Show previous quote info

## Next Steps

1. **Apply database migration:**

   ```bash
   cd supabase
   supabase db push
   ```

2. **Configure MacroDroid webhook** to call `/api/repair-request`

3. **Test the flow:**
   - Send test notification
   - Open quote page
   - Enter quote and send
   - Verify SMS received

## Notes

- Quote amounts are stored as NUMERIC(10,2) for precision
- SMS messages are signed "Many thanks, John" (staff signature)
- System prevents sending duplicate quotes (shows warning if already quoted)
- All timestamps are stored in UTC
- Quote history is preserved (quoted_at, quoted_by fields)
