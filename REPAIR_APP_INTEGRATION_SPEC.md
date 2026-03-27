# Repair App Integration Specification

## Database Schema - AI Responder (`quote_requests` table)

This is the **exact schema** of the `quote_requests` table in the AI Responder app that needs to be synced to the Repair App.

### Complete Table Structure

```sql
CREATE TABLE public.quote_requests (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Customer Details
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  
  -- Device Details
  device_make TEXT NOT NULL,
  device_model TEXT NOT NULL,
  issue TEXT NOT NULL,
  description TEXT,
  additional_issues JSONB DEFAULT '[]'::jsonb,
  
  -- Quote Status & Pricing
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'quoted', 'accepted', 'declined', 'completed')),
  quoted_price NUMERIC(10,2),
  quoted_at TIMESTAMPTZ,
  quoted_by UUID REFERENCES public.users(id),
  
  -- Quote Type & Source
  type TEXT NOT NULL DEFAULT 'repair' 
    CHECK (type IN ('repair', 'sell')),
  source TEXT DEFAULT 'website',
  page TEXT,
  
  -- SMS & Notification Tracking
  sms_sent BOOLEAN DEFAULT FALSE,
  sms_sent_at TIMESTAMPTZ,
  notification_url TEXT,
  notification_received_at TIMESTAMPTZ,
  quote_sent_at TIMESTAMPTZ,
  quote_sent_by UUID REFERENCES public.users(id),
  
  -- Parts & Repair Details
  requires_parts_order BOOLEAN DEFAULT FALSE,
  
  -- Relationships
  conversation_id UUID REFERENCES public.conversations(id),
  customer_id UUID REFERENCES public.customers(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Webhook Payload Format

### Required Fields

Send this JSON structure to the Repair App webhook endpoint:

```json
{
  "quote_request_id": "uuid-from-ai-responder",
  "customer_name": "John Smith",
  "customer_phone": "+447410123456",
  "device_make": "Apple",
  "device_model": "iPhone 14 Pro",
  "issue": "Screen Replacement"
}
```

### Complete Payload (All Fields)

```json
{
  "quote_request_id": "550e8400-e29b-41d4-a716-446655440000",
  "customer_name": "John Smith",
  "customer_phone": "+447410123456",
  "customer_email": "john@example.com",
  "device_make": "Apple",
  "device_model": "iPhone 14 Pro",
  "issue": "Screen Replacement",
  "description": "Cracked screen from drop, still functional",
  "additional_issues": [
    {
      "issue": "Battery replacement",
      "description": "Battery health at 78%, drains quickly"
    }
  ],
  "quoted_price": 149.99,
  "status": "pending",
  "type": "repair",
  "source_page": "/repair-request/",
  "requires_parts_order": false,
  "conversation_id": "660e8400-e29b-41d4-a716-446655440000",
  "created_at": "2024-03-14T15:30:00Z"
}
```

---

## Field Mapping Reference

| AI Responder Field | Webhook Payload Key | Type | Required | Notes |
|-------------------|---------------------|------|----------|-------|
| `id` | `quote_request_id` | UUID | ✅ Yes | Primary identifier |
| `name` | `customer_name` | string | ✅ Yes | Customer's full name |
| `phone` | `customer_phone` | string | ✅ Yes | Include country code (e.g., +44) |
| `email` | `customer_email` | string | ❌ No | Optional |
| `device_make` | `device_make` | string | ✅ Yes | e.g., "Apple", "Samsung" |
| `device_model` | `device_model` | string | ✅ Yes | e.g., "iPhone 14 Pro" |
| `issue` | `issue` | string | ✅ Yes | Primary repair issue |
| `description` | `description` | string | ❌ No | Detailed description |
| `additional_issues` | `additional_issues` | array | ❌ No | Array of objects: `[{issue, description}]` |
| `quoted_price` | `quoted_price` | number | ❌ No | Price in GBP (e.g., 149.99) |
| `status` | `status` | string | ❌ No | pending/quoted/accepted/declined |
| `type` | `type` | string | ❌ No | "repair" or "sell" |
| `page` | `source_page` | string | ❌ No | Originating page path |
| `source` | `source` | string | ❌ No | e.g., "website", "phone" |
| `requires_parts_order` | `requires_parts_order` | boolean | ❌ No | Default: false |
| `conversation_id` | `conversation_id` | UUID | ❌ No | If linked to conversation |
| `created_at` | `created_at` | timestamp | ❌ No | ISO 8601 format |

---

## Webhook Configuration

### Endpoint Details

**URL:** `https://your-repair-app-domain.com/api/quotes/sync`

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
x-webhook-secret: YOUR_SHARED_SECRET_KEY
```

### Environment Variables

**AI Responder `.env`:**
```bash
REPAIR_APP_WEBHOOK_URL=https://your-repair-app-domain.com/api/quotes/sync
REPAIR_APP_WEBHOOK_SECRET=your-shared-secret-key-here
```

**Repair App `.env.local`:**
```bash
AI_RESPONDER_WEBHOOK_SECRET=your-shared-secret-key-here
```

⚠️ **Critical:** Both apps must use the **exact same** secret key!

---

## Example Webhook Implementation

### Node.js/TypeScript Example

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function syncQuoteToRepairApp(quoteId: string) {
  // Fetch quote from database
  const { data: quote, error } = await supabase
    .from('quote_requests')
    .select('*')
    .eq('id', quoteId)
    .single();

  if (error || !quote) {
    console.error('Failed to fetch quote:', error);
    return;
  }

  // Build webhook payload
  const payload = {
    quote_request_id: quote.id,
    customer_name: quote.name,
    customer_phone: quote.phone,
    customer_email: quote.email,
    device_make: quote.device_make,
    device_model: quote.device_model,
    issue: quote.issue,
    description: quote.description,
    additional_issues: quote.additional_issues || [],
    quoted_price: quote.quoted_price,
    status: quote.status,
    type: quote.type || 'repair',
    source_page: quote.page,
    source: quote.source,
    requires_parts_order: quote.requires_parts_order || false,
    conversation_id: quote.conversation_id,
    created_at: quote.created_at
  };

  // Send to Repair App
  try {
    const response = await fetch(process.env.REPAIR_APP_WEBHOOK_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': process.env.REPAIR_APP_WEBHOOK_SECRET!
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to sync quote:', error);
      throw new Error(`Webhook failed: ${response.status}`);
    }

    console.log(`✅ Quote ${quoteId} synced to Repair App`);
    return true;
  } catch (error) {
    console.error('Error syncing quote:', error);
    return false;
  }
}

// Call this function:
// 1. After creating a new quote
// 2. After updating an existing quote
// 3. In your bulk sync script
```

---

## Bulk Sync Script

Use this to sync all existing quotes from AI Responder to Repair App:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function bulkSyncQuotes() {
  console.log('Starting bulk quote sync...');

  // Fetch all quotes from last 90 days
  const { data: quotes, error } = await supabase
    .from('quote_requests')
    .select('*')
    .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch quotes:', error);
    return;
  }

  console.log(`Found ${quotes.length} quotes to sync`);

  let successCount = 0;
  let failCount = 0;

  for (const quote of quotes) {
    try {
      const payload = {
        quote_request_id: quote.id,
        customer_name: quote.name,
        customer_phone: quote.phone,
        customer_email: quote.email,
        device_make: quote.device_make,
        device_model: quote.device_model,
        issue: quote.issue,
        description: quote.description,
        additional_issues: quote.additional_issues || [],
        quoted_price: quote.quoted_price,
        status: quote.status,
        type: quote.type || 'repair',
        source_page: quote.page,
        source: quote.source,
        requires_parts_order: quote.requires_parts_order || false,
        conversation_id: quote.conversation_id,
        created_at: quote.created_at
      };

      const response = await fetch(process.env.REPAIR_APP_WEBHOOK_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': process.env.REPAIR_APP_WEBHOOK_SECRET!
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log(`✅ Synced: ${quote.name} - ${quote.device_model}`);
        successCount++;
      } else {
        const error = await response.text();
        console.error(`❌ Failed: ${quote.id} - ${error}`);
        failCount++;
      }

      // Rate limit: 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`❌ Error syncing ${quote.id}:`, error);
      failCount++;
    }
  }

  console.log('\n=== Sync Complete ===');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📊 Total: ${quotes.length}`);
}

// Run the sync
bulkSyncQuotes();
```

**To run:**
```bash
npx tsx scripts/sync-quotes-to-repair-app.ts
```

---

## When to Send Webhooks

Send a webhook to the Repair App in these scenarios:

### 1. New Quote Created
```typescript
// After inserting into quote_requests table
const { data: newQuote } = await supabase
  .from('quote_requests')
  .insert({ ... })
  .select()
  .single();

await syncQuoteToRepairApp(newQuote.id);
```

### 2. Quote Updated
```typescript
// After updating quote (price, status, etc.)
const { data: updatedQuote } = await supabase
  .from('quote_requests')
  .update({ quoted_price: 149.99, status: 'quoted' })
  .eq('id', quoteId)
  .select()
  .single();

await syncQuoteToRepairApp(updatedQuote.id);
```

### 3. Quote Status Changed
```typescript
// When customer accepts/declines quote
const { data } = await supabase
  .from('quote_requests')
  .update({ status: 'accepted' })
  .eq('id', quoteId)
  .select()
  .single();

await syncQuoteToRepairApp(quoteId);
```

---

## Response Codes

The Repair App webhook will return:

| Code | Meaning | Action |
|------|---------|--------|
| `200` | Success | Quote synced successfully |
| `400` | Bad Request | Check payload format, missing required fields |
| `401` | Unauthorized | Check webhook secret matches |
| `409` | Conflict | Quote already exists (safe to ignore) |
| `500` | Server Error | Check Repair App logs, retry later |

---

## Testing the Integration

### 1. Test with curl

```bash
curl -X POST https://your-repair-app-domain.com/api/quotes/sync \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: your-shared-secret-key" \
  -d '{
    "quote_request_id": "550e8400-e29b-41d4-a716-446655440000",
    "customer_name": "Test Customer",
    "customer_phone": "+447410123456",
    "device_make": "Apple",
    "device_model": "iPhone 14 Pro",
    "issue": "Screen Replacement",
    "quoted_price": 149.99
  }'
```

### 2. Verify in Repair App

1. Log into Repair App
2. Go to "Create Job" page
3. Click "Search Quotes"
4. Search for phone number: `+447410123456`
5. Quote should appear in results

### 3. Test Quote Conversion

1. Click "Convert" on the quote
2. Form should pre-fill with quote data
3. Complete job creation
4. Quote should be marked as converted

---

## Common Issues & Solutions

### Issue: 401 Unauthorized

**Cause:** Webhook secret doesn't match

**Solution:**
1. Check `.env` in AI Responder: `REPAIR_APP_WEBHOOK_SECRET`
2. Check `.env.local` in Repair App: `AI_RESPONDER_WEBHOOK_SECRET`
3. Ensure they are **exactly the same**
4. Restart both apps after changing

### Issue: 400 Bad Request - Missing Fields

**Cause:** Required fields not included in payload

**Solution:** Ensure these fields are always present:
- `quote_request_id` (UUID)
- `customer_name` (string)
- `customer_phone` (string with country code)
- `device_make` (string)
- `device_model` (string)
- `issue` (string)

### Issue: Quote Not Appearing in Search

**Cause:** Quote may already be converted or phone number mismatch

**Solution:**
1. Check Repair App database: `SELECT * FROM quotes WHERE phone = '+447410123456';`
2. Verify `converted_to_job` is `false`
3. Check phone number format matches exactly (including +44)

### Issue: Duplicate Quotes

**Cause:** Webhook sent multiple times for same quote

**Solution:** Repair App handles this automatically:
- Uses `quote_request_id` as unique identifier
- Updates existing quote if already exists (upsert)
- No duplicates will be created

---

## Database Query Examples

### Check if Quote Synced to Repair App

```sql
-- In Repair App database
SELECT * FROM quotes 
WHERE quote_request_id = '550e8400-e29b-41d4-a716-446655440000';
```

### Find All Unconverted Quotes

```sql
-- In Repair App database
SELECT * FROM quotes 
WHERE converted_to_job = false
ORDER BY created_at DESC;
```

### Count Synced Quotes

```sql
-- In Repair App database
SELECT COUNT(*) as total_quotes FROM quotes;
```

---

## Integration Checklist

### AI Responder Setup

- [ ] Add `REPAIR_APP_WEBHOOK_URL` to `.env`
- [ ] Add `REPAIR_APP_WEBHOOK_SECRET` to `.env`
- [ ] Create `syncQuoteToRepairApp()` function
- [ ] Call sync function after quote creation
- [ ] Call sync function after quote updates
- [ ] Create bulk sync script
- [ ] Run bulk sync for existing quotes
- [ ] Test with new quote creation
- [ ] Verify quote appears in Repair App

### Repair App Setup

- [ ] Add `AI_RESPONDER_WEBHOOK_SECRET` to `.env.local`
- [ ] Deploy to production
- [ ] Test webhook endpoint with curl
- [ ] Verify quotes appear in search
- [ ] Test quote conversion to job
- [ ] Monitor logs for errors

---

## Support & Troubleshooting

If you encounter issues:

1. **Check webhook secret** - Must match exactly in both apps
2. **Verify payload format** - Use the examples above
3. **Check logs** - Both AI Responder and Repair App
4. **Test with curl** - Isolate webhook issues
5. **Verify database** - Check if quote exists in Repair App

**Logs to check:**
- AI Responder: Webhook send logs
- Repair App: `/api/quotes/sync` endpoint logs
- Database: Query `quotes` table directly

---

## Summary

**What you need to send:**

Minimum payload:
```json
{
  "quote_request_id": "uuid",
  "customer_name": "Name",
  "customer_phone": "+44...",
  "device_make": "Apple",
  "device_model": "iPhone 14",
  "issue": "Screen"
}
```

**Where to send it:**
```
POST https://repair-app.com/api/quotes/sync
Header: x-webhook-secret: your-secret
```

**When to send it:**
- New quote created
- Quote updated
- Quote status changed
- Bulk sync of existing quotes

That's it! The Repair App will handle the rest.
