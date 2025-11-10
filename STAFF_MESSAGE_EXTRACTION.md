# Staff Message Information Extraction

## Overview

Automatically extracts structured information from your (John's) messages to customers, building a valuable database for future use. This captures device details, repair status, pricing, and customer information.

## What Gets Extracted

### Customer Information
- **Customer Name**: Extracted from greetings ("Hi Carol", "Hello Sarah")

### Device Information
- **Device Type**: iPhone, iPad, Samsung, MacBook, Laptop, Phone
- **Device Model**: Specific model (iPhone 14, Galaxy S23, iPad Pro)
- **Device Issue**: Screen repair, battery replacement, charging port, water damage, back glass

### Repair Information
- **Repair Status**: 
  - `ready` - Device ready for pickup
  - `in_progress` - Currently being repaired
  - `not_fixed` - Could not be fixed
  - `quoted` - Price quote provided
  - `awaiting_parts` - Waiting for parts
  - `awaiting_customer` - Waiting for customer decision

### Pricing Information
- **Price Quoted**: Initial quote (£149.99)
- **Price Final**: Final price if different
- **Currency**: GBP (default)

### Message Classification
- **ready_notification** - "Your device is ready"
- **quote** - Price quote messages
- **update** - Status update messages
- **not_fixed** - "Could not fix" messages
- **other** - Other staff messages

## Examples

### Example 1: Ready Notification
```
Message: "Hi Carol, your iPhone 14 screen replacement is all done and ready to collect. That's £149.99. Many thanks, John"

Extracted:
✅ Customer Name: Carol
✅ Device Type: iPhone
✅ Device Model: iPhone 14
✅ Device Issue: screen repair
✅ Repair Status: ready
✅ Message Type: ready_notification
✅ Price: £149.99
✅ Confidence: 100%
```

### Example 2: Quote Message
```
Message: "Hi Sarah, the Samsung Galaxy S23 screen would be £199 to fix. Let me know if you want to go ahead. Thanks, John"

Extracted:
✅ Customer Name: Sarah
✅ Device Type: Samsung
✅ Device Model: Galaxy S23
✅ Device Issue: screen repair
✅ Repair Status: quoted
✅ Message Type: quote
✅ Price: £199
✅ Confidence: 100%
```

### Example 3: Not Fixed
```
Message: "Hi Mike, unfortunately we couldn't fix your iPhone as the motherboard is damaged. Sorry about that. John"

Extracted:
✅ Customer Name: Mike
✅ Device Type: iPhone
✅ Repair Status: not_fixed
✅ Message Type: not_fixed
✅ Confidence: 70%
```

### Example 4: Awaiting Parts
```
Message: "Hi Emma, your iPad screen part is on order, should be here tomorrow. Will let you know when it arrives. John"

Extracted:
✅ Customer Name: Emma
✅ Device Type: iPad
✅ Device Issue: screen repair
✅ Repair Status: awaiting_parts
✅ Message Type: update
✅ Confidence: 87%
```

## Database Schema

All extracted information is stored in the `staff_message_extractions` table:

```sql
CREATE TABLE staff_message_extractions (
  id UUID PRIMARY KEY,
  message_id UUID REFERENCES messages(id),
  conversation_id UUID REFERENCES conversations(id),
  
  -- Customer info
  customer_name TEXT,
  
  -- Device info
  device_type TEXT,
  device_model TEXT,
  device_issue TEXT,
  
  -- Repair info
  repair_status TEXT,
  repair_notes TEXT,
  
  -- Pricing
  price_quoted NUMERIC(10,2),
  price_final NUMERIC(10,2),
  currency TEXT DEFAULT 'GBP',
  
  -- Classification
  message_type TEXT,
  
  -- Metadata
  extraction_confidence NUMERIC(3,2),
  extraction_method TEXT DEFAULT 'pattern_matching',
  raw_extracted_data JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## How It Works

1. **Automatic Extraction**: When you send a message, the system automatically analyzes it
2. **Pattern Matching**: Uses regex patterns to identify key information
3. **Confidence Scoring**: Calculates confidence based on fields extracted (0.0 to 1.0)
4. **Minimum Threshold**: Only saves extractions with confidence ≥ 0.3
5. **Silent Operation**: Extraction happens in background, doesn't affect message sending

## Confidence Scoring

- **100%**: All key fields extracted (name, device, issue, status, price)
- **87%**: Most fields extracted
- **70%**: Some key fields extracted
- **50%**: Minimal extraction
- **< 30%**: Not saved (too little information)

## Future Uses

This database can be used for:

- 📊 **Analytics**: Track repair types, pricing, completion rates
- 🔍 **Search**: Find past repairs by customer, device, or issue
- 📈 **Reporting**: Generate business insights
- 🤖 **AI Training**: Improve AI responses with real examples
- 📝 **Automation**: Auto-fill forms, generate invoices
- 💡 **Insights**: Identify common issues, popular devices

## Querying the Data

### Find all ready notifications
```sql
SELECT * FROM staff_message_extractions
WHERE message_type = 'ready_notification'
ORDER BY created_at DESC;
```

### Find iPhone repairs
```sql
SELECT * FROM staff_message_extractions
WHERE device_type = 'iPhone'
ORDER BY created_at DESC;
```

### Find repairs by customer
```sql
SELECT * FROM staff_message_extractions
WHERE customer_name ILIKE '%Carol%'
ORDER BY created_at DESC;
```

### Average prices by device type
```sql
SELECT 
  device_type,
  AVG(price_quoted) as avg_price,
  COUNT(*) as count
FROM staff_message_extractions
WHERE price_quoted IS NOT NULL
GROUP BY device_type
ORDER BY count DESC;
```

### Recent quotes
```sql
SELECT 
  customer_name,
  device_type,
  device_model,
  device_issue,
  price_quoted,
  created_at
FROM staff_message_extractions
WHERE message_type = 'quote'
ORDER BY created_at DESC
LIMIT 10;
```

## Technical Details

### Files Created
- `/supabase/migrations/038_staff_message_extractions.sql` - Database schema
- `/app/lib/staff-message-extractor.ts` - Extraction logic
- `/app/api/messages/send/route.ts` - Integration (updated)
- `test-staff-extraction.js` - Test suite (6/6 tests pass ✅)

### Extraction Patterns

**Customer Names:**
- "Hi Carol" → Carol
- "Hello Sarah" → Sarah
- "For Mike" → Mike

**Device Types:**
- iPhone, iPad, MacBook, Samsung, Laptop, Phone

**Device Models:**
- "iPhone 14" → iPhone 14
- "Galaxy S23" → Galaxy S23
- "iPad Pro" → iPad Pro

**Issues:**
- "screen" → screen repair
- "battery" → battery replacement
- "charging port" → charging port
- "water damage" → water damage

**Prices:**
- "£149.99" → 149.99
- "£199" → 199.00
- "89.99 pounds" → 89.99

**Status:**
- "ready to collect" → ready
- "couldn't fix" → not_fixed
- "would be £199" → quoted
- "part is on order" → awaiting_parts
- "working on it" → in_progress

## Monitoring

Check logs to see extraction in action:

```
[Staff Extraction] Extracting info from staff message...
[Staff Extraction] Extracted: {
  customerName: 'Carol',
  deviceType: 'iPhone',
  deviceModel: 'iPhone 14',
  repairStatus: 'ready',
  messageType: 'ready_notification',
  confidence: 1.0
}
[Staff Extraction] ✅ Saved extraction with confidence: 1.0
```

## Testing

Run the test suite:
```bash
node test-staff-extraction.js
```

All 6 tests pass:
- ✅ Ready notification with price
- ✅ Quote message
- ✅ Not fixed message
- ✅ Awaiting parts
- ✅ Simple ready notification
- ✅ Battery replacement quote

## Deployment

1. Run the migration:
```bash
# Via Supabase CLI
supabase db push

# Or via SQL Editor in Supabase Dashboard
# Copy and run: supabase/migrations/038_staff_message_extractions.sql
```

2. Code is already integrated - extraction happens automatically!

3. Check it's working by sending a test message and querying:
```sql
SELECT * FROM staff_message_extractions ORDER BY created_at DESC LIMIT 5;
```
