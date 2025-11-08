# Name Preference Correction Fix

## Problem

When customer corrected their name preference from "Dave" to "Mr. Davidson", the AI acknowledged it but **didn't update the customer record** in the database.

### Example
```
AI: "Perfect, Dave! We'll be ready to assist you on Monday..."
Customer: "Also please refer to me as Mr Davidson not dave"
AI: "Apologies for that, Mr. Davidson. I'll make sure to address you correctly..."
```

**Problem:** The database still showed "Dave" - only the AI's response changed. Future conversations would still use "Dave" until manually updated.

## Root Cause

The name extraction code only updated the database when:
1. Customer didn't have a name yet, OR
2. Detection confidence was "high"

But it didn't have a flag for **name preference corrections**, so corrections weren't always applied.

## Solution

### 1. Enhanced Name Extraction
**File:** `app/lib/customer-name-extractor.ts`

Added two new patterns:
- **Pattern 7:** "please refer to me as {name}" or "call me {name}"
- **Pattern 8:** "refer to me as {name} not {old_name}"

Added `isCorrection` flag to indicate this is a preference correction (not initial introduction).

### 2. Updated Database Logic
**File:** `app/api/messages/incoming/route.ts`

Changed update condition to include corrections:
```typescript
// Update if:
// 1. Customer doesn't have a name yet
// 2. This is high confidence
// 3. This is a name preference correction (always update)
if (!customer.name || nameData.confidence === 'high' || nameData.isCorrection) {
  // Update database
}
```

### 3. Added AI Guidance
**File:** `supabase/migrations/025_name_preference_handling.sql`

Added guidance for AI to:
- Acknowledge corrections politely
- Use corrected name consistently
- Brief acknowledgment, then continue conversation

## Expected Behavior After Fix

### Scenario 1: Name Preference Correction
```
AI: "Perfect, Dave! We'll be ready to assist you..."
Customer: "Also please refer to me as Mr Davidson not dave"

Actions:
1. ✅ Database updated: name = "Mr Davidson"
2. ✅ AI acknowledges: "Apologies for that, Mr. Davidson..."
3. ✅ Future messages use "Mr. Davidson"
```

### Scenario 2: Different Correction Formats
```
Customer: "Please call me John"
→ Database updated to "John"

Customer: "It's Mrs Smith, not Sarah"
→ Database updated to "Mrs Smith"

Customer: "Refer to me as Dr. Johnson"
→ Database updated to "Dr. Johnson"
```

## Patterns Detected

### Name Corrections
✅ "Please refer to me as {name}"
✅ "Call me {name}"
✅ "Refer to me as {name} not {old_name}"
✅ "It's {name}, not {old_name}"

### Initial Introductions (existing)
✅ "Hi, I'm {name}"
✅ "My name is {name}"
✅ "This is {name}"
✅ "I am {name}"

## Name Capitalization

The fix properly capitalizes names with titles:
- "mr davidson" → "Mr Davidson"
- "mrs smith" → "Mrs Smith"
- "dr johnson" → "Dr Johnson"

Uses `capitalizeProperName()` function that handles multi-word names correctly.

## Changes Made

### 1. Code: `app/lib/customer-name-extractor.ts`
- Added `isCorrection` flag to `ExtractedNameData` interface
- Added Pattern 7: "refer to me as" / "call me"
- Added Pattern 8: "refer to me as X not Y"
- Added `capitalizeProperName()` function for titles

### 2. Code: `app/api/messages/incoming/route.ts`
- Updated condition to always apply corrections
- Added logging for correction vs update
- Immediate database update on correction

### 3. Database: `supabase/migrations/025_name_preference_handling.sql`
- Updated `core_identity` module with correction guidance
- Updated `friendly_tone` module with acknowledgment examples
- Teaches AI to acknowledge briefly and continue

## Testing

### Test Case 1: Basic Correction
```
Setup: Customer name is "Dave"
Send: "Please refer to me as Mr Davidson"
Expected: 
  - Database updated to "Mr Davidson"
  - AI: "Apologies for that, Mr. Davidson..."
```

### Test Case 2: Correction with "not"
```
Setup: Customer name is "Dave"
Send: "Also please refer to me as Mr Davidson not dave"
Expected:
  - Database updated to "Mr Davidson"
  - AI acknowledges and continues conversation
```

### Test Case 3: Simple "Call me"
```
Send: "Call me John"
Expected:
  - Database updated to "John"
  - AI uses "John" in response
```

### Test Case 4: Formal Title
```
Send: "It's Dr. Smith"
Expected:
  - Database updated to "Dr. Smith"
  - AI uses "Dr. Smith" consistently
```

## Impact

### Before Fix
❌ Name corrections only acknowledged in conversation
❌ Database not updated
❌ Future conversations used old name
❌ Manual database update required

### After Fix
✅ Name corrections update database automatically
✅ AI acknowledges politely
✅ Corrected name used consistently
✅ No manual intervention needed
✅ Respects customer preferences

## Related Functionality

This fix works with existing name extraction:
- Initial introductions still work
- High-confidence updates still work
- Name validation still applies
- Common words still filtered out

## Notes

- Corrections always update database (even if name already exists)
- Proper capitalization for titles (Mr, Mrs, Dr, etc.)
- Brief, polite acknowledgment
- Continues conversation naturally
- Logged as "corrected" vs "updated" for debugging

---

**Created:** 8 Nov 2024
**Code Changes:** `app/lib/customer-name-extractor.ts`, `app/api/messages/incoming/route.ts`
**Migration:** `025_name_preference_handling.sql`
**Priority:** Medium - Improves customer experience and data accuracy
**Status:** Ready to deploy
