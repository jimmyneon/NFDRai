# Message Role and Name Extraction Fixes

## Issues Fixed

### 1. Message Sender Role Detection
**Problem**: AI messages (containing "AI Steve" signature) were being saved with `sender: 'customer'` instead of `sender: 'ai'` when MacroDroid tracked them through the `/api/messages/send` endpoint.

**Root Cause**: 
- MacroDroid doesn't send the `sender` parameter when tracking messages
- The duplicate check only ran when `sender === 'staff'`, so it never detected AI messages
- Messages were being inserted twice: once by AI (correct), once by MacroDroid tracking (incorrect)

**Fix**: 
- Detect sender EARLY in the send endpoint (line 102) before checking if it's tracking-only
- If message contains "AI Steve" signature, automatically treat it as tracking-only
- This prevents duplicate AI messages from being created

**Files Modified**:
- `/app/api/messages/send/route.ts` - Early sender detection

### 2. Customer Name Extraction
**Problem**: Name extraction was too aggressive and extracting common words like "BAD", "just", "changing" as customer names.

**Root Cause**:
- Not all extraction patterns validated the extracted name before returning
- Common words list was incomplete

**Fix**:
- Added validation to ALL name extraction patterns
- Expanded common words blacklist to include verbs and more common words
- Now validates extracted names before storing them

**Files Modified**:
- `/app/lib/customer-name-extractor.ts` - Added validation to all patterns

## Deployment Steps

### 1. Fix Existing Data

Run these SQL scripts to clean up existing incorrect data:

```bash
# Fix message senders (AI messages marked as customer)
psql $DATABASE_URL -f fix-message-senders.sql

# Fix customer names (common words stored as names)
psql $DATABASE_URL -f fix-customer-names.sql
```

Or via Supabase SQL Editor:
1. Open Supabase Dashboard → SQL Editor
2. Run `fix-message-senders.sql`
3. Run `fix-customer-names.sql`

### 2. Deploy Code Changes

The code changes are already in place:
- ✅ `/app/api/messages/send/route.ts` - Early sender detection
- ✅ `/app/lib/customer-name-extractor.ts` - Improved name validation

### 3. Test

After deployment, new messages should:
- ✅ AI messages always saved with `sender: 'ai'`
- ✅ Staff messages always saved with `sender: 'staff'`
- ✅ Customer messages always saved with `sender: 'customer'`
- ✅ No duplicate AI messages from MacroDroid tracking
- ✅ No common words extracted as customer names

## Verification

Run the test script to verify:
```bash
node test-message-roles.js
```

Expected output:
- All messages with "AI Steve" signature should have `sender: 'ai'`
- All messages with "many thanks, John" should have `sender: 'staff'`
- No common words like "Bad", "Just", "Changing" as customer names

## Impact

### Message Display
- **Before**: AI messages showed on left (customer side) with wrong icon
- **After**: AI messages show on right with bot icon, staff messages with staff icon

### Name Extraction
- **Before**: Customers had names like "Bad", "Just", "Changing"
- **After**: Only valid names extracted, common words ignored

### Duplicate Prevention
- **Before**: AI messages duplicated when MacroDroid tracked them
- **After**: Duplicate check catches AI messages, prevents duplication
