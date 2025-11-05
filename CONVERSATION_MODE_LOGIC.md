# Conversation Mode Logic

## How It Works

The system automatically manages conversation modes so you don't have to manually toggle AI on/off.

## Automatic Mode Switching

### When John Sends a Message
**Action**: Conversation switches to **MANUAL** mode
- System detects you've taken over
- AI stays silent
- Waits for customer response

### When Customer Replies After John's Message

The system analyzes the customer's message and decides:

#### ✅ Switch to AUTO (AI responds)
- **Questions**: Any message with `?`
- **Longer messages**: More than 5 words (likely needs a response)
- **Generic queries**: 
  - "When are you open?"
  - "How much is...?"
  - "Do you fix...?"
  - "Can you help with...?"
- **Time-based**: If John replied 2+ hours ago

#### ⏸️ Stay in MANUAL (AI stays silent)
- **Acknowledgments**: "ok", "thanks", "yes", "no", "bye"
- **Personal messages**: "thanks john", "see you soon"
- **Coming in**: "on my way", "be there soon"
- **Short responses**: Less than 5 words (unless it's a question)

### Special Cases

#### Confirmation Messages
When you send: "Hi there Sarah, your iPhone 12 is fixed and ready for collection. Many thanks, John"
- System extracts customer name and device
- Updates customer record automatically
- If customer replies within 24 hours → AI stays silent
- After 24 hours → normal mode switching applies

## Examples

### Scenario 1: Quick Question After Your Message
```
John: "Hi Sarah, your iPhone is ready for collection"
Sarah: "Great! What time do you close?"
→ AI switches to AUTO and responds with hours
```

### Scenario 2: Acknowledgment
```
John: "Hi Sarah, your iPhone is ready"
Sarah: "Thanks John, see you soon"
→ AI stays SILENT (manual mode)
```

### Scenario 3: New Question After Time
```
John: "Your device is ready" (2pm)
[2 hours pass]
Sarah: "Do you also fix iPads?" (4pm)
→ AI switches to AUTO (time-based + question)
```

### Scenario 4: Follow-up Question
```
John: "Your repair is £50"
Sarah: "Do you take card?"
→ AI switches to AUTO (generic question)
```

## Configuration

### Time Thresholds
- **2 hours**: Auto-switch to AI if John hasn't replied
- **24 hours**: Confirmation reply detection window
- **5 minutes**: Wait time if staff recently active

### Message Length
- **5+ words**: Likely needs AI response
- **<5 words**: Likely acknowledgment (stay manual)

## Benefits

✅ **No manual toggling** - System handles it automatically
✅ **Smart detection** - Knows when AI should respond
✅ **Context aware** - Reads conversation history
✅ **Time-based fallback** - Won't leave customers waiting
✅ **Confirmation handling** - Extracts data and stays silent

## Logs

Check Vercel logs for mode decisions:
```
[Smart Mode] Conversation in manual mode
[Smart Mode] Hours since staff reply: 0.5
[Smart Mode] Should switch to auto? true
[Smart Mode] Reason: Generic question detected - AI can handle this
[Smart Mode] ✅ Switched to auto mode
```
