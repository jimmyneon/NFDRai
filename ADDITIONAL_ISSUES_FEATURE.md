# Additional Issues Feature

## Overview
The quote request system now supports multiple repairs in a single quote request. Website forms can send a main issue plus an array of additional repairs, and the system will store and display all repairs when sending quotes to customers.

## Database Schema

### New Columns in `quote_requests` Table
```sql
description TEXT                -- Detailed description of main issue
additional_issues JSONB         -- Array of additional repairs
```

### Data Structure for `additional_issues`
```json
[
  {
    "issue": "Battery replacement",
    "description": "Battery health at 78%, drains quickly"
  },
  {
    "issue": "Back glass repair", 
    "description": "Small crack on back glass near camera"
  }
]
```

## Website Form Payload

### Expected Format
```json
{
  "name": "Sarah Johnson",
  "phone": "+447123456789",
  "email": "sarah@email.com",
  "device_make": "Apple",
  "device_model": "iPhone 14 Pro",
  "issue": "Cracked screen",
  "description": "Screen shattered after drop, touch still works",
  "additionalIssues": [
    {
      "issue": "Battery replacement",
      "description": "Battery health at 78%, drains quickly"
    },
    {
      "issue": "Back glass repair",
      "description": "Small crack on back glass near camera"
    }
  ]
}
```

## API Endpoints Updated

### 1. POST /api/webchat
- Accepts `description` and `additionalIssues` from AI extraction
- Saves to `quote_requests` table when creating quote requests
- Updates existing quote requests with new repair info

### 2. POST /api/quotes/send
- Reads `description` and `additional_issues` from database
- Formats SMS message with all repairs listed
- Uses bullet points for multiple repairs

## SMS Quote Message Format

### Single Repair (Original Format)
```
Hi Sarah,

Your quote for the Apple iPhone 14 Pro (Cracked screen - Screen shattered after drop) is £149.99.

Just reply to this message if you'd like to book in, or if you have any questions.

Many thanks, John
New Forest Device Repairs
```

### Multiple Repairs (New Format)
```
Hi Sarah,

Your quote for the Apple iPhone 14 Pro:
• Cracked screen - Screen shattered after drop
• Battery replacement - Battery health at 78%, drains quickly
• Back glass repair - Small crack on back glass near camera

Total: £289.99

Just reply to this message if you'd like to book in, or if you have any questions.

Many thanks, John
New Forest Device Repairs
```

## TypeScript Interface

### ExtractedQuoteInfo
```typescript
export interface ExtractedQuoteInfo {
  name: string | null;
  phone: string | null;
  email: string | null;
  device_make: string | null;
  device_model: string | null;
  issue: string | null;
  description: string | null;
  additionalIssues: Array<{
    issue: string;
    description: string;
  }>;
  confidence: number;
  isComplete: boolean;
}
```

## AI Extraction

The AI quote extractor (`webchat-quote-extractor.ts`) now extracts:
- Main issue + description
- Additional issues array from customer messages
- Example: "Screen is smashed and battery drains fast" → Main: "cracked screen", Additional: ["battery replacement"]

## Files Modified

1. **Database**
   - `supabase/migrations/066_add_additional_issues_to_quotes.sql` - New migration

2. **TypeScript Interfaces**
   - `app/lib/webchat-quote-extractor.ts` - Updated ExtractedQuoteInfo interface

3. **API Endpoints**
   - `app/api/webchat/route.ts` - Saves description and additional_issues
   - `app/api/quotes/send/route.ts` - Formats SMS with all repairs

## Benefits

1. **Single Quote Request** - Customer can request multiple repairs at once
2. **Better Pricing** - Staff can quote for bundle repairs (e.g., screen + battery combo)
3. **Clearer Communication** - All repairs listed in one SMS
4. **Job Creation Ready** - All repair info stored for future job creation system

## Future Enhancements

- Dashboard UI to display additional issues in quote list
- Job creation system that creates multiple jobs from one quote request
- Pricing calculator for multi-repair bundles
- Customer portal to view all requested repairs

## Migration

To apply this feature:
```bash
# Run the migration
supabase db push

# Or manually apply
psql -f supabase/migrations/066_add_additional_issues_to_quotes.sql
```

## Testing

Test with website form payload:
```bash
curl -X POST https://your-domain.com/api/webchat \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "My iPhone screen is cracked and battery drains fast",
    "visitor_name": "Test User",
    "visitor_email": "test@example.com"
  }'
```

The AI will extract both issues and create a quote request with:
- Main issue: "cracked screen"
- Additional issues: [{"issue": "battery replacement", "description": "drains fast"}]
