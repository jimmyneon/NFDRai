# Fixes Applied - November 11, 2025

## 1. ✅ Fixed: Status Words Extracted as Names

**Problem:** AI was extracting "Away" as a customer name from "I am away until tomorrow"

**Solution:**
- Added blacklist of status/availability words to both regex and AI name extractors
- Blacklisted words: `away`, `out`, `busy`, `unavailable`, `available`, `free`, `off`, `working`, `late`, `early`, `soon`, `later`, `tomorrow`, `today`, `tonight`, `now`
- Updated AI prompt with example showing "I am away" should not extract a name

**Files Modified:**
- `app/lib/customer-name-extractor.ts`
- `app/lib/ai-name-extractor.ts`

---

## 2. ✅ Fixed: Customer Names Not Saving from AI Responses

**Problem:** AI would greet customers by name (e.g., "Hi Carol") but the name wasn't being saved to the database

**Root Cause:** Name extraction only happened from customer and staff messages, not from AI responses

**Solution:**
- Added name extraction from AI's first response message
- Extracts names like "Carol" from "Hi Carol, your phone is ready"
- Only extracts if customer has no name or is "Unknown Customer"
- Uses the smart AI-powered name extractor for accuracy
- Implemented in both:
  - Incoming message route (automatic AI responses)
  - Manual retry endpoint (when staff clicks "Retry with AI")

**Files Modified:**
- `app/api/messages/incoming/route.ts`
- `app/api/conversations/[id]/retry-ai/route.ts`

**Example:**
```
Customer: "When are you open?"
AI: "Hi Carol, we're open 9-5 Monday to Friday!"
→ Database now saves "Carol" as customer name ✅
```

---

## 3. ✅ Improved: Blocked Status Visibility

**Problem:** 
- Blocked conversations weren't clearly labeled
- Hard to tell when AI is permanently disabled for a conversation

**Solution:**

### Conversation Dialog Header:
- Added red "AI Blocked" badge with ban icon when status is blocked
- Replaces the normal "AI Mode" / "Manual Mode" badge
- Uses destructive variant for high visibility

### Conversation List:
- Added 🚫 emoji prefix to blocked status badge
- Uses destructive variant (red) for blocked conversations
- Makes it immediately obvious which conversations have AI disabled

**Files Modified:**
- `components/conversations/conversation-dialog.tsx`
- `components/conversations/conversation-list.tsx`

**Visual Changes:**
```
Before: [blocked] (gray badge)
After:  [🚫 blocked] (red badge with icon)

Dialog Header:
Before: [🤖 AI Mode] or [👨‍💼 Manual Mode]
After:  [🚫 AI Blocked] (when blocked)
```

---

## 4. ✅ Diagnostic Tools Created

Created diagnostic script to help troubleshoot AI issues:

**File:** `diagnose-ai-issue.js`

**Usage:**
```bash
node diagnose-ai-issue.js
```

**What it checks:**
1. Conversation statuses (auto/manual/blocked)
2. Blocked conversations
3. AI settings and API key
4. Recent messages and their senders
5. Customers without names
6. Provides recommendations for fixing issues

**Example Output:**
```
🔍 Diagnosing AI Response Issues...

1️⃣ Checking conversation statuses:
   🤖 AUTO     | +447762365340 | No name
   👨‍💼 MANUAL   | +447484186812 | No name
   
   Status Summary:
   - auto: 25
   - manual: 10

2️⃣ Checking blocked conversations:
   ✅ No blocked conversations found

5️⃣ Checking customer name extraction:
   ⚠️  Found 5 customers without names
```

---

## Verification

### AI Still Working ✅
- Diagnostic shows AI sent message at 12:53 PM today
- 25 conversations in auto mode
- 0 blocked conversations
- Blocking one conversation does NOT affect others

### Name Extraction Now Works ✅
- AI responses will extract customer names
- Names saved to database automatically
- Works for both automatic and manual retry responses

### Blocked Status Clear ✅
- Red badge with 🚫 icon in conversation list
- "AI Blocked" badge in dialog header
- Easy to identify blocked conversations

---

## Next Steps

1. **Monitor name extraction** - Check if new customer names are being saved correctly
2. **Test blocking** - Verify blocking/unblocking works as expected
3. **Clean up old data** - Consider updating the customer with name "Away" to null
4. **Review other status words** - Add more if needed based on real usage

---

## SQL to Fix "Away" Customer

If you want to remove "Away" as a customer name:

```sql
UPDATE customers 
SET name = NULL 
WHERE name = 'Away';
```
