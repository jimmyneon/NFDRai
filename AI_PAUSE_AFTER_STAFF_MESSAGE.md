# AI Pause After Staff Message

## Feature Overview

When you (John) send a manual message to a customer, the AI will pause for **30 minutes** to give you space to handle the conversation. During this pause:

- ✅ **AI WILL respond** to simple queries (hours, directions, location)
- ❌ **AI WON'T respond** to complex queries (pricing, repairs, status checks)
- ⏰ **Auto-resume** after 30 minutes back to full AI mode

## How It Works

### 1. Staff Message Triggers Pause
When you send a message through the dashboard or MacroDroid, the system:
- Records the timestamp of your message
- Enters "pause mode" for 30 minutes
- Notifies you of any new customer messages

### 2. During Pause (0-30 minutes)

**Simple Queries (AI WILL respond):**
- "When are you open?"
- "What time do you close?"
- "Where are you located?"
- "What's your address?"
- "How do I get there?"
- "What's your phone number?"

**Complex Queries (AI WON'T respond - waits for you):**
- "How much for iPhone screen?"
- "Is my phone ready?"
- "Can you fix my laptop?"
- "My screen is cracked"
- "Do you have the part?"

### 3. After 30 Minutes
- AI automatically resumes full operation
- Responds to ALL customer messages
- No manual intervention needed

## Examples

### Example 1: Simple Query During Pause

```
10:00 AM - You: "Hi Carol, yes we can fix that. Pop in anytime today."
10:15 AM - Customer: "What time are you open until?"
10:15 AM - AI: "We're open until 6:00 PM today. See you soon!"
```

✅ AI responds because it's a simple hours query

### Example 2: Complex Query During Pause

```
10:00 AM - You: "Hi Carol, yes we can fix that. Pop in anytime today."
10:15 AM - Customer: "How much will it cost?"
10:15 AM - System: [Alert sent to you - no AI response]
```

❌ AI doesn't respond - waits for you to handle pricing discussion

### Example 3: Auto-Resume After 30 Minutes

```
10:00 AM - You: "Hi Carol, yes we can fix that. Pop in anytime today."
10:45 AM - Customer: "Actually, can you also check my battery?"
10:45 AM - AI: "Of course! I can help with that..."
```

✅ AI responds because 30+ minutes have passed

## Technical Details

### Files Modified
- `/app/lib/simple-query-detector.ts` - New utility to detect simple queries
- `/app/api/messages/incoming/route.ts` - Updated to use 30-minute pause logic

### Configuration
The pause duration is set to **30 minutes** in the code. To change:

```typescript
// In /app/lib/simple-query-detector.ts
const PAUSE_DURATION_MINUTES = 30  // Change this value
```

### Query Types Detected

**Simple Queries (AI responds):**
- `hours` - Business hours/opening times
- `location` - Address/location
- `directions` - How to get there
- `contact` - Phone/email

**Complex Queries (AI pauses):**
- Pricing questions
- Repair inquiries
- Status checks
- Issue descriptions
- Anything requiring conversation context

## Benefits

1. **Gives you space** - AI won't interfere when you're actively helping a customer
2. **Still helpful** - AI answers factual questions so you don't have to
3. **Auto-resume** - No need to manually re-enable AI after 30 minutes
4. **Smart detection** - Distinguishes between simple and complex queries

## Monitoring

Check the logs to see pause behavior:

```
[Staff Activity Check] Minutes since staff message: 15.2
[Staff Activity Check] Should AI respond? false
[Staff Activity Check] Reason: Staff replied 15 minutes ago - waiting for staff (15 min remaining)
```

Or when AI responds to simple query:

```
[Staff Activity Check] Minutes since staff message: 10.5
[Staff Activity Check] Should AI respond? true
[Staff Activity Check] Reason: Simple hours query - AI can answer even during pause
```

## Testing

Use the test script to verify behavior:

```bash
node test-ai-pause.js
```

This will test:
- Simple queries during pause (should respond)
- Complex queries during pause (should NOT respond)
- Auto-resume after 30 minutes (should respond to everything)
