# Auto Mode Switch & AI Response Fix

## Problem
When conversation switched from manual → auto mode, AI wasn't responding to the triggering message due to blocking checks (staff activity check and context confidence check).

Additionally, simple queries like "when are you open?" were sometimes being blocked even though AI should always respond to these.

## Solution - Three-Part Fix

### 1. Skip Blocking Checks on Mode Switch
**File:** `app/api/messages/incoming/route.ts`

Added `justSwitchedToAuto` flag that:
- Gets set to `true` when conversation switches from manual → auto
- Skips staff activity check (30-minute pause)
- Skips context confidence check
- Ensures AI responds to the message that triggered the switch

**Before:**
```
Customer: "When are you open?"
→ Switches to auto mode
→ Staff activity check blocks (staff replied 15 min ago)
→ No AI response ❌
```

**After:**
```
Customer: "When are you open?"
→ Switches to auto mode
→ justSwitchedToAuto = true
→ Skips blocking checks
→ AI responds ✅
```

### 2. Always Respond to Simple Queries
**File:** `app/api/messages/incoming/route.ts`

Context confidence check now skips for:
- Messages that just switched to auto mode
- Simple queries (hours, location, directions, contact)

**Simple queries that always get AI response:**
- "When are you open?"
- "What time do you close?"
- "Where are you located?"
- "What's your address?"
- "How do I get there?"
- "What's your phone number?"

These are factual questions that don't need context and AI should always answer.

### 3. Manual "Retry with AI" Button
**Files:**
- `app/api/conversations/[id]/retry-ai/route.ts` (new endpoint)
- `components/conversations/conversation-dialog.tsx` (UI button)

Added backup button in conversation dialog:
- Shows in both auto and manual mode
- Manually triggers AI to respond to latest customer message
- Useful when AI didn't respond for any reason
- Shows toast notification with number of messages sent

**UI Location:**
- Conversation dialog → Actions section
- Next to "Take Over" or "Resume Auto Mode" buttons
- Icon: Refresh/Retry icon

## Testing

### Test Case 1: Mode Switch Response
1. Staff sends message → Conversation in manual mode
2. Customer asks: "When are you open?"
3. ✅ Should switch to auto mode
4. ✅ AI should respond immediately

### Test Case 2: Simple Query Always Responds
1. Staff sends message 10 minutes ago
2. Customer asks: "What's your address?"
3. ✅ AI should respond (simple query exception)

### Test Case 3: Manual Retry Button
1. Open conversation with unresponded customer message
2. Click "Retry with AI" button
3. ✅ AI should generate and send response
4. ✅ Toast shows "AI sent X message(s)"

## Code Changes

### app/api/messages/incoming/route.ts
```typescript
// Added at line 552
let justSwitchedToAuto = false

// Set flag when switching to auto (line 604)
justSwitchedToAuto = true

// Skip staff activity check if just switched (line 685)
if (recentStaffMessage && !justSwitchedToAuto) {
  // ... check logic
}

// Skip context check for mode switch or simple queries (line 725)
const skipContextCheck = justSwitchedToAuto || isSimpleQuery(message).isSimpleQuery
```

### app/api/conversations/[id]/retry-ai/route.ts (NEW)
```typescript
export async function POST(request, { params }) {
  // Get latest customer message
  // Generate AI response
  // Send via provider
  // Return success
}
```

### components/conversations/conversation-dialog.tsx
```typescript
// Added retry handler (line 276)
const handleRetryAI = async () => {
  const response = await fetch(`/api/conversations/${conversation.id}/retry-ai`, {
    method: 'POST',
  })
  // Show toast with result
}

// Added button in UI (line 440, 450)
<Button onClick={handleRetryAI} variant="outline">
  <RefreshCw className="w-4 h-4 mr-2" />
  Retry with AI
</Button>
```

## Benefits

1. **Automatic Response on Mode Switch** - AI responds to the message that triggered auto mode
2. **Simple Queries Always Work** - "When are you open?" always gets answered
3. **Manual Backup** - Staff can manually trigger AI response if needed
4. **Better UX** - No more missed messages or confused customers
5. **Fail-Safe** - Multiple ways to ensure AI responds when it should

## Deployment

```bash
# No database changes needed
# Just deploy the code changes
git add .
git commit -m "Fix: AI now responds when switching to auto mode + retry button"
git push
```

## Monitoring

Watch logs for these messages:
- `[Smart Mode] ✅ Switched to auto mode` - Mode switch detected
- `[Staff Activity Check] ✅ Just switched to auto mode - AI will respond` - Blocking check skipped
- `[Context Check] ⏭️  Skipped - just switched to auto mode or simple query` - Context check skipped
- `[Manual AI Retry] Generating AI response` - Manual retry triggered

## Related Files
- `app/lib/simple-query-detector.ts` - Simple query patterns
- `app/lib/conversation-mode-analyzer.ts` - Mode switching logic
- `app/lib/context-confidence-checker.ts` - Context checking logic
