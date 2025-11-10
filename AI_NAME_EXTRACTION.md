# AI-Powered Name Extraction from Staff Messages

## Problem

Staff message extraction wasn't capturing customer names reliably:
- Basic regex patterns missed variations like "Hi there Carol"
- Names weren't showing in conversation list
- Database had names in `staff_message_extractions` but not in `customers` table

## Solution

### 1. AI-Powered Name Extraction

Created `/app/lib/ai-name-extractor.ts` with two-tier approach:

**Tier 1: AI Extraction (GPT-4o-mini)**
- Uses AI to understand context and extract names
- Handles variations, typos, and edge cases
- Costs ~$0.0001 per extraction
- High accuracy

**Tier 2: Regex Fallback**
- If AI fails or no API key available
- Enhanced regex patterns covering:
  - "Hi Carol", "Hello Sarah", "Hey Mike"
  - "Hi there Carol", "Hello there Mike"
  - "Carol,", "Mike -", "Sarah:"
  - "Ready for Carol", "Quote for Mike"
  - Just "Carol" at start

### 2. Automatic Customer Name Updates

When a name is extracted from staff messages:
1. Save to `staff_message_extractions` table
2. **NEW**: Update `customers` table with the name
3. Only updates if customer name is currently null
4. Shows immediately in conversation list

## How It Works

### Staff Message Flow

```
1. You send: "Hi Carol, your iPhone is ready. £149.99"
   ↓
2. MacroDroid tracks message → /api/messages/send
   ↓
3. System detects sender='staff'
   ↓
4. Extracts info:
   - Customer name: "Carol" (AI or regex)
   - Device: iPhone
   - Status: ready
   - Price: £149.99
   ↓
5. Saves to staff_message_extractions
   ↓
6. Updates customers table: name = "Carol"
   ↓
7. Name shows in conversation list immediately
```

### Name Extraction Examples

**✅ Successfully Extracts:**
- "Hi Carol, your iPhone 14 screen is ready. £149.99" → Carol
- "Hello Sarah, your Galaxy S23 screen would be £199" → Sarah
- "Hi there Mike, it's £99" → Mike
- "Carol, your phone is ready" → Carol
- "Mike - your iPhone is fixed" → Mike
- "Ready for Carol to collect" → Carol
- "Carol your phone is ready" → Carol

**✅ Correctly Rejects:**
- "Your phone is ready" → null (no name)
- "Hi there, your device is ready" → null (no name after "there")
- "Many thanks, John" → null (John is staff, not customer)
- "Ready for collection" → null (no name)

## Testing

All 18 test cases pass:

```bash
node test-ai-name-extraction.js
```

**Results:**
- ✅ 18/18 tests passed
- Handles all greeting variations
- Correctly filters out common words
- Doesn't extract staff names

## Configuration

### Enable AI Extraction

AI extraction is automatic if you have an active AI settings record with an API key:

```sql
SELECT api_key FROM ai_settings WHERE active = true;
```

If API key exists → Uses AI (more accurate)  
If no API key → Uses regex fallback (still good)

### Cost

- AI extraction: ~$0.0001 per message (GPT-4o-mini)
- Only runs on staff messages with names
- Typical cost: < $0.01 per day

## Database Updates

### staff_message_extractions Table

```sql
INSERT INTO staff_message_extractions (
  customer_name,  -- Extracted name
  device_type,
  device_model,
  repair_status,
  price_final,
  extraction_method,  -- 'ai_enhanced' or 'pattern_matching'
  extraction_confidence
)
```

### customers Table

```sql
UPDATE customers 
SET name = 'Carol'
WHERE id = customer_id
  AND name IS NULL  -- Only if not already set
```

## Benefits

1. **Automatic Name Capture** - No manual entry needed
2. **Better UI** - Names show in conversation list immediately
3. **Flexible** - Handles "Hi Carol", "Hi there Carol", "Carol,", etc.
4. **Smart** - AI understands context, regex is fast fallback
5. **Safe** - Only updates if name is currently null
6. **Accurate** - 18/18 test cases pass

## Monitoring

Check logs for name extraction:

```
[Staff Extraction] Extracting info from staff message...
[AI Name Extractor] AI found: Carol (0.95)
[Staff Extraction] Extracted: { customerName: 'Carol', ... }
[Staff Extraction] ✅ Updated customer name: Carol
```

## Files Modified

- `/app/lib/ai-name-extractor.ts` - NEW: AI + regex name extraction
- `/app/lib/staff-message-extractor.ts` - Uses AI name extractor
- `/app/api/messages/send/route.ts` - Updates customers table with extracted names
- `test-ai-name-extraction.js` - 18 test cases

## Future Enhancements

Potential improvements:
- Extract full names (first + last)
- Handle nicknames and preferred names
- Learn from corrections
- Multi-language support
- Extract from customer messages too

## Summary

Staff messages now automatically extract customer names using AI (with regex fallback) and update the customers table, so names show immediately in the conversation list. Works with all greeting variations and handles edge cases reliably.
