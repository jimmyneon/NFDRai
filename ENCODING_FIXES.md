# UTF-8 Encoding Fixes

## Problem

The application had character encoding issues affecting:
1. **AI messages** - Special characters like £ and German umlauts (ä, ö, ü) displayed incorrectly
2. **Customer responses** - Messages with paragraphs (newlines) caused 500 errors

## Root Causes

1. **Missing UTF-8 charset in Content-Type headers** - API responses didn't explicitly specify UTF-8 encoding
2. **Improper JSON parsing** - Request body parsing didn't handle UTF-8 encoding properly
3. **Form data parsing** - URL-encoded form data from MacroDroid wasn't decoded with UTF-8
4. **Missing charset in outgoing webhooks** - Messages sent to MacroDroid and external APIs didn't specify UTF-8

## Changes Made

### 1. API Route Headers (`/app/api/messages/incoming/route.ts`)
- ✅ Added explicit `charset=utf-8` to all `Content-Type` headers in responses
- ✅ Changed from `request.json()` to `request.text()` + `JSON.parse()` for better encoding control
- ✅ All error responses now include UTF-8 charset

### 2. Send Message Route (`/app/api/messages/send/route.ts`)
- ✅ Added explicit `charset=utf-8` to all response headers
- ✅ Improved form data parsing with UTF-8 handling
- ✅ All success and error responses include UTF-8 charset

### 3. Messaging Provider (`/app/lib/messaging/provider.ts`)
- ✅ MacroDroid webhook now sends `Content-Type: application/json; charset=utf-8`
- ✅ Meta Messenger API calls include UTF-8 charset
- ✅ Ensures special characters are properly encoded in outgoing messages

### 4. Next.js Configuration (`next.config.js`)
- ✅ Added global headers configuration for all API routes
- ✅ Ensures UTF-8 charset is set by default on all API responses

## Testing

Run the encoding test script to verify all fixes:

```bash
# Start the development server
npm run dev

# In another terminal, run the test script
node test-encoding.js
```

The test script validates:
- ✅ Pound sign (£)
- ✅ German umlauts (ä, ö, ü)
- ✅ French accents (é, è, à)
- ✅ Spanish characters (¡, ¿, ñ)
- ✅ Multi-paragraph messages with newlines
- ✅ Mixed special characters and symbols
- ✅ Emoji characters

## Database Considerations

PostgreSQL (Supabase) uses UTF-8 encoding by default for `text` columns, so no database changes were needed. The `messages.text` column already supports all UTF-8 characters.

## MacroDroid Configuration

If you're using MacroDroid to send/receive SMS:

1. **Incoming SMS webhook**: Ensure the webhook sends JSON with UTF-8 encoding
2. **Outgoing SMS webhook**: The app now sends UTF-8 encoded JSON to MacroDroid
3. **Form data**: If using form-encoded data, ensure it's URL-encoded properly

## Verification Checklist

- [x] API responses include `Content-Type: application/json; charset=utf-8`
- [x] Special characters (£, €, ä, ö, ü) display correctly in AI responses
- [x] Customer messages with paragraphs don't cause 500 errors
- [x] Messages with emojis are handled correctly
- [x] MacroDroid webhook receives properly encoded messages
- [x] Database stores and retrieves UTF-8 characters correctly

## Future Considerations

1. **Client-side encoding**: Ensure the frontend also handles UTF-8 properly
2. **Email notifications**: If adding email, ensure UTF-8 encoding in email headers
3. **File uploads**: If adding file uploads, handle UTF-8 filenames
4. **Logging**: Ensure log files use UTF-8 encoding

## Related Files

- `/app/api/messages/incoming/route.ts` - Incoming message handler
- `/app/api/messages/send/route.ts` - Outgoing message handler
- `/app/lib/messaging/provider.ts` - Message provider (MacroDroid, Twilio, etc.)
- `/next.config.js` - Next.js configuration
- `/test-encoding.js` - Encoding test script
