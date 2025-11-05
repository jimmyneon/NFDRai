# AI Wait Logic Update

## Problem
The previous auto/manual mode switching was too aggressive. It would turn off AI completely when staff sent a message, requiring manual re-enabling.

## New Solution
**Time-based waiting** - AI monitors staff activity and waits intelligently:

### How It Works Now

1. **Customer sends message** → Saved to database

2. **AI checks recent messages**:
   - Looks at last 10 messages
   - Finds the most recent staff message (if any)

3. **Decision logic**:
   
   **If staff replied within last 5 minutes:**
   - ✋ AI waits and doesn't respond
   - 🔔 Creates alert to notify staff of new customer message
   - Staff has time to reply themselves
   
   **If staff replied 5+ minutes ago (or never):**
   - ✅ AI generates and sends response
   - Could be full answer or generic holding message
   - Keeps customer engaged while staff is busy

4. **If AI says handoff phrases** (e.g., "I'll check with John"):
   - 🔔 Creates `manual_required` alert
   - ❌ Does NOT switch conversation to manual mode
   - AI continues to monitor and can respond to next message

## Key Benefits

✅ **No mode switching** - Everything stays in auto mode
✅ **Staff can jump in anytime** - AI automatically detects and waits
✅ **5-minute grace period** - Gives staff time to respond
✅ **Generic fallback** - After 5 minutes, AI sends holding response
✅ **Seamless handoff** - Staff can take over without toggling modes

## Configuration

Current wait time: **5 minutes**

To adjust, change this line in `/app/api/messages/incoming/route.ts`:
```typescript
if (minutesSinceStaffMessage < 5) {  // Change 5 to desired minutes
```

## What Was Removed

- ❌ Auto/manual mode switching
- ❌ `handleResume` / `handleTakeOver` buttons (no longer needed)
- ❌ Conversation status changes based on staff activity

## What Stays

- ✅ Manual mode toggle (for global kill switch scenarios)
- ✅ Alert creation for low confidence / handoff phrases
- ✅ All existing AI response logic
- ✅ Message batching for rapid messages
