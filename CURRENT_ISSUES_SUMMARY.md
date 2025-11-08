# Current Issues Summary - Nov 8, 2025

## ✅ FIXED Issues

### 1. Duplicate Messages
- **Status:** FIXED
- **Solution:** 
  - Added duplicate webhook detection (5 second window)
  - Added AI response deduplication (70% similarity threshold)
  - Added race condition handling for simultaneous webhooks

### 2. Send API Parse Errors
- **Status:** FIXED
- **Solution:**
  - Detect form-encoded data from body content (not header)
  - Parse using URLSearchParams
  - Support both JSON and form-encoded formats

### 3. Sender Detection
- **Status:** WORKING
- **Solution:**
  - Already checks message content for "AI Steve" vs "John" signatures
  - Correctly identifies staff vs AI messages
  - Added better logging

## ⏳ PENDING Issues

### 1. AI Not Following Prompt Rules
- **Problem:** 
  - Not asking "what's wrong?" first
  - Not presenting both screen prices together
  - Not explaining popup warnings
  - Too wordy responses
  
- **Root Cause:** 
  - Too many conflicting prompt modules from multiple migrations
  - High-priority modules weren't being loaded (FIXED in code)
  - Need to consolidate rules
  
- **Solution:** 
  - **Migration 037** - Consolidates all rules into ONE master module
  - Deactivates conflicting old modules
  - Clear, concise examples
  - **STATUS: CREATED, NEEDS TO BE APPLIED**

### 2. AI Sending Greeting to Existing Conversation
- **Problem:**
  - Customer: "Thanks, will pop in tomorrow afternoon"
  - AI: "Hi! I'm AI Steve, your automated assistant..." ← NEW GREETING
  - Should continue conversation, not restart
  
- **Possible Causes:**
  - Conversation context not being loaded properly
  - AI not recognizing it's a continuation
  - State detection treating it as new conversation
  
- **Needs Investigation:**
  - Check conversation state detection
  - Check if recent messages are being loaded
  - Check if context is being passed to AI

### 3. Business Hours Check
- **Problem:** AI said "we're closed tomorrow" correctly
- **Status:** WORKING (from previous fix)

## 🚀 ACTION ITEMS

### Immediate (Apply Now):
1. **Apply Migration 037** to database
   - File: `supabase/migrations/037_consolidate_all_rules.sql`
   - This consolidates all prompt rules
   - Should fix: pricing, popup warnings, asking what's wrong first

### Investigation Needed:
2. **Fix AI greeting in existing conversations**
   - Debug why AI sends "Hi! I'm AI Steve..." to existing conversations
   - Should recognize conversation context and continue naturally
   - Check conversation state detection logic

### Testing After Migration 037:
3. Test these scenarios:
   - "Screen is cracked" → Should present both prices (£150 genuine, £100 OLED)
   - "What's the difference?" → Should explain popup warning
   - "My iPhone is broken" → Should ask "What's happening with it, and what model?"
   - "Is there something cheaper?" → Should mention both prices

## 📊 System Status

### Working Well:
- ✅ Duplicate prevention
- ✅ Sender detection (staff vs AI)
- ✅ Form data parsing
- ✅ Business hours awareness
- ✅ Troubleshooting instructions (force restart)
- ✅ Battery health guidance
- ✅ Context switching detection

### Needs Improvement:
- ⚠️ Prompt following (migration 037 should fix)
- ⚠️ Conversation continuity (greeting in existing conversations)
- ⚠️ Response length (too wordy)

## 🔧 Recent Code Changes

### High-Priority Module Loading (FIXED):
```typescript
// Now ALWAYS loads modules with priority >= 99
if (module.priority >= 99) {
  shouldInclude = true
}
```

This ensures critical rules are ALWAYS loaded, regardless of context.

### Form Data Parsing (FIXED):
```typescript
// Detects form-encoded data from body content
if (rawBody.includes('=') && (rawBody.includes('&') || !rawBody.includes('{'))) {
  const params = new URLSearchParams(rawBody)
  // Parse form data
}
```

### Duplicate Detection (FIXED):
```typescript
// Improved similarity calculation
// Normalizes strings, checks substring containment
// Lowered threshold from 80% to 70%
```

## 📝 Next Steps

1. **Apply migration 037** ← MOST IMPORTANT
2. Investigate greeting issue in existing conversations
3. Test all scenarios after migration
4. Monitor logs for any remaining issues
