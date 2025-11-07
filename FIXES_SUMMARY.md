# Fixes Summary - Nov 5, 2025

## ✅ Issues Fixed

### 1. Conversation Dialog - Auto-scroll to Bottom
**Problem**: Messages were sorted correctly (newest at bottom) but dialog opened at the top, requiring scrolling.

**Fix**: 
- Improved scroll behavior with `setTimeout` to ensure DOM is ready
- Changed to `behavior: 'instant'` for immediate scroll
- File: `components/conversations/conversation-dialog.tsx`

**Result**: Dialog now opens scrolled to the bottom showing the newest messages.

---

### 2. API Logging - Not Recording
**Problem**: API logs page existed but no logs were being recorded.

**Fix**: 
- Added `logApiCall` import to incoming messages route
- Added logging for all request outcomes:
  - ✅ Successful requests (200)
  - ❌ Validation errors (400)
  - ⚠️ Rate limit errors (429)
  - 💥 Server errors (500)
- Logs include: request body, response body, duration, IP, user agent
- File: `app/api/messages/incoming/route.ts`

**Result**: All incoming message API calls now logged to `api_logs` table.

---

### 3. Dashboard Auto Responses Count
**Problem**: Showing same number as total conversations (6).

**Fix**: 
- Changed from counting conversations with `status='auto'`
- Now counts actual AI messages with `sender='ai'`
- File: `app/dashboard/page.tsx`

**Result**: Shows total number of AI responses sent, not conversations in auto mode.

---

### 4. Dashboard Recent Activity
**Problem**: Not sorted by most recent message, no timestamps shown.

**Fix**: 
- Added message fetching to get last message timestamp
- Sort by `lastMessageTime` instead of just `updated_at`
- Added timestamp display in format: "05 Nov, 14:30"
- File: `app/dashboard/page.tsx`

**Result**: Recent activity properly sorted with visible timestamps.

---

### 5. AI Wait Logic
**Problem**: Auto/manual mode switching was too aggressive.

**Fix**: 
- Removed mode switching entirely
- AI now waits 5 minutes after staff sends a message
- If customer responds within 5 minutes → AI waits, creates alert
- If customer responds after 5 minutes → AI sends response
- File: `app/api/messages/incoming/route.ts`

**Result**: Seamless handoff - staff can jump in anytime, AI automatically waits.

---

## 🔄 Restart Required

**All changes require Next.js dev server restart to take effect:**

```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## 📊 API Logs Setup

If you see "Table Not Found" on the API Logs page, run this SQL in Supabase:

```sql
CREATE TABLE IF NOT EXISTS public.api_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  request_body JSONB,
  response_body JSONB,
  error TEXT,
  ip_address TEXT,
  user_agent TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint ON public.api_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON public.api_logs(created_at DESC);

ALTER TABLE public.api_logs DISABLE ROW LEVEL SECURITY;
```

---

## 🧪 Testing After Restart

1. **Dashboard**:
   - Check "Auto Responses" shows actual count
   - Verify "Recent Activity" sorted correctly with timestamps

2. **Conversations**:
   - Open a conversation dialog
   - Should open at bottom showing newest messages
   - No need to scroll

3. **API Logs**:
   - Navigate to API Logs page
   - Should see logs appearing as messages come in
   - Check request/response bodies are recorded

4. **AI Behavior**:
   - Send a message as staff
   - Customer responds within 5 minutes → AI waits
   - Customer responds after 5 minutes → AI responds

---

## 📝 Files Modified

1. `components/conversations/conversation-dialog.tsx` - Auto-scroll fix
2. `app/dashboard/page.tsx` - Stats and recent activity fixes
3. `app/api/messages/incoming/route.ts` - API logging + wait logic
4. `components/dashboard/nav.tsx` - Added API Logs link (from earlier)
