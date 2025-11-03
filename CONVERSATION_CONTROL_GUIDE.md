# 🎛️ Conversation Control System - How It Works

## Problem Solved

**Issue**: When staff manually reply to a customer, the AI might jump back in and respond to the next customer message, creating confusion and duplicate responses.

**Solution**: Multi-layered conversation control system that automatically detects manual intervention and pauses AI responses.

---

## 🔒 How AI is Prevented from Interfering

### 1. **Automatic Status Switching**
When a staff member sends a message via `/api/messages/send`:
```typescript
// Automatically switches conversation to 'manual' mode
await supabase
  .from('conversations')
  .update({ status: 'manual' })
  .eq('id', conversationId)
```

### 2. **Recent Message Detection**
Before AI responds to any incoming message, it checks the last 5 messages:
```typescript
// Check if staff has recently replied
const { data: recentMessages } = await supabase
  .from('messages')
  .select('sender')
  .eq('conversation_id', conversation.id)
  .order('created_at', { ascending: false })
  .limit(5)

const hasRecentStaffMessage = recentMessages?.some(
  (msg) => msg.sender === 'staff'
)

if (hasRecentStaffMessage) {
  // AI pauses - staff has taken over
  return 'manual mode'
}
```

### 3. **Global Kill Switch**
Admins can disable all AI automation:
```typescript
// Check global automation setting
const { data: settings } = await supabase
  .from('ai_settings')
  .select('automation_enabled')
  .eq('active', true)
  .single()

if (!settings?.automation_enabled) {
  // AI is globally disabled
  return 'manual mode'
}
```

### 4. **Conversation Status Check**
Every incoming message checks conversation status:
```typescript
if (conversation.status !== 'auto') {
  // Don't generate AI response
  // Send alert to staff instead
  return 'manual mode'
}
```

---

## 🎯 Workflow Examples

### Scenario 1: Staff Takes Over Mid-Conversation

**Timeline:**
1. ✅ Customer: "How much for iPhone 14 screen?"
2. ✅ AI: "iPhone 14 screen replacement is £149.99..."
3. ✅ Customer: "Can I get a discount?"
4. 👤 **Staff manually replies**: "Let me check with my manager..."
   - ⚡ Conversation automatically switches to `manual` mode
   - ⚡ `last_staff_activity` timestamp updated
5. ✅ Customer: "Thanks, I'll wait"
6. ❌ **AI does NOT respond** (detects recent staff message)
7. 🔔 Alert sent to staff: "Manual response required"

### Scenario 2: Staff Resumes AI After Handling Complex Query

**Timeline:**
1. 👤 Staff handles complex pricing negotiation
2. ✅ Customer: "Okay, I'll book it"
3. 👤 Staff clicks **"Resume AI"** button
   - ⚡ Conversation switches back to `auto` mode
4. ✅ Customer: "What are your opening hours?"
5. ✅ **AI responds** with FAQ information

### Scenario 3: Low Confidence Auto-Switch

**Timeline:**
1. ✅ Customer: "Can you fix my quantum computer?"
2. ✅ AI generates response with 45% confidence
3. ⚡ **Automatic switch to manual** (below 70% threshold)
4. 🔔 Alert: "Low confidence response - review needed"
5. ✅ Customer sends follow-up
6. ❌ **AI does NOT respond** (status is manual)
7. 👤 Staff reviews and responds

---

## 🛡️ Safety Layers

### Layer 1: Global Kill Switch
```
ai_settings.automation_enabled = false
→ ALL AI responses disabled
```

### Layer 2: Conversation Status
```
conversations.status = 'manual'
→ AI disabled for this conversation
```

### Layer 3: Recent Activity Detection
```
Last 5 messages contain staff message
→ AI automatically pauses
```

### Layer 4: Confidence Threshold
```
AI confidence < 70%
→ Auto-switch to manual
```

### Layer 5: Manual Takeover Button
```
Staff clicks "Take Over"
→ Immediate switch to manual
```

---

## 📊 Database Schema

### New Columns Added (Migration 006)

```sql
-- Track when staff last interacted
ALTER TABLE conversations 
ADD COLUMN last_staff_activity TIMESTAMPTZ;

-- Assign conversations to specific staff
ALTER TABLE conversations 
ADD COLUMN assigned_to UUID REFERENCES users(id);

-- Global automation toggle
ALTER TABLE ai_settings 
ADD COLUMN automation_enabled BOOLEAN DEFAULT true;
```

### Automatic Trigger

```sql
-- Automatically updates last_staff_activity when staff sends message
CREATE TRIGGER trigger_update_last_staff_activity
  AFTER INSERT ON messages
  FOR EACH ROW
  WHEN (NEW.sender = 'staff')
  EXECUTE FUNCTION update_last_staff_activity();
```

---

## 🎨 UI Components

### ConversationControls Component
Located: `/components/conversations/conversation-controls.tsx`

**Features:**
- Visual status badge (AI Auto / Manual)
- "Take Over" button (switches to manual)
- "Resume AI" button (switches to auto)
- Confirmation dialog with warnings
- Real-time status updates

**Usage:**
```tsx
<ConversationControls
  conversationId={conversation.id}
  currentStatus={conversation.status}
  onStatusChange={(newStatus) => {
    // Handle status change
  }}
/>
```

---

## 🔄 API Endpoints

### POST /api/messages/incoming
**Checks before AI responds:**
1. ✅ Global automation enabled?
2. ✅ Conversation in auto mode?
3. ✅ No recent staff messages?
4. ✅ Confidence threshold met?

**If any check fails:** → Manual mode + Alert sent

### POST /api/messages/send
**Automatic actions:**
1. ✅ Saves staff message
2. ✅ Switches conversation to manual
3. ✅ Updates last_staff_activity
4. ✅ Sends message to customer

### PATCH /api/conversations/[id]
**Allows updating:**
- `status`: 'auto' | 'manual' | 'archived'
- `assigned_to`: Staff user ID

---

## 🧪 Testing Scenarios

### Test 1: Manual Takeover
```bash
# 1. Send customer message (AI responds)
POST /api/messages/incoming
{
  "from": "+1234567890",
  "message": "Hello",
  "channel": "sms"
}
# Expected: AI responds

# 2. Staff sends message
POST /api/messages/send
{
  "conversationId": "xxx",
  "text": "Hi, I'm here to help"
}
# Expected: Status → manual

# 3. Customer replies
POST /api/messages/incoming
{
  "from": "+1234567890",
  "message": "Thanks",
  "channel": "sms"
}
# Expected: AI does NOT respond, alert sent
```

### Test 2: Resume AI
```bash
# 1. Conversation in manual mode
# 2. Staff clicks "Resume AI"
PATCH /api/conversations/xxx
{
  "status": "auto"
}
# Expected: Status → auto

# 3. Customer sends message
POST /api/messages/incoming
# Expected: AI responds
```

---

## ⚙️ Configuration

### Confidence Threshold
Located: `ai_settings.confidence_threshold`
```sql
-- Default: 70%
-- If AI confidence < 70%, auto-switch to manual
UPDATE ai_settings 
SET confidence_threshold = 75 
WHERE active = true;
```

### Recent Message Window
Located: `/app/api/messages/incoming/route.ts`
```typescript
// Currently checks last 5 messages
// Adjust this number to change sensitivity
.limit(5)  // ← Change this
```

---

## 🚨 Alerts Generated

### Alert Types
1. **manual_required** - Conversation needs staff attention
2. **low_confidence** - AI response below threshold
3. **staff_takeover** - Staff has manually intervened

### Alert Delivery
- Real-time via Supabase subscriptions
- Toast notifications in UI
- Notification Center badge
- Email (optional, via Resend)

---

## 💡 Best Practices

### For Staff
1. ✅ **Always use "Take Over" button** when jumping into a conversation
2. ✅ **Resume AI** when you're done to reduce workload
3. ✅ **Check alerts** regularly for conversations needing attention
4. ✅ **Assign conversations** to specific team members

### For Admins
1. ✅ **Monitor confidence scores** and adjust threshold
2. ✅ **Review AI responses** regularly
3. ✅ **Use global kill switch** during system issues
4. ✅ **Train staff** on when to take over vs let AI handle

### For Developers
1. ✅ **Test all scenarios** before deploying
2. ✅ **Monitor logs** for unexpected AI responses
3. ✅ **Adjust recent message window** based on usage patterns
4. ✅ **Add more safety layers** as needed

---

## 🔍 Debugging

### AI Responding When It Shouldn't?

**Check:**
1. Conversation status: `SELECT status FROM conversations WHERE id = 'xxx'`
2. Recent messages: `SELECT sender FROM messages WHERE conversation_id = 'xxx' ORDER BY created_at DESC LIMIT 5`
3. Global setting: `SELECT automation_enabled FROM ai_settings WHERE active = true`
4. Logs: Check server logs for decision path

### AI Not Responding When It Should?

**Check:**
1. Status is 'auto': `UPDATE conversations SET status = 'auto' WHERE id = 'xxx'`
2. No recent staff messages in last 5
3. Global automation enabled
4. Confidence threshold not too high

---

## 📈 Future Enhancements

### Planned Features
- [ ] **Time-based auto-resume** (e.g., resume AI after 1 hour of inactivity)
- [ ] **Smart detection** of conversation completion
- [ ] **Partial automation** (AI suggests, staff approves)
- [ ] **A/B testing** of AI vs manual responses
- [ ] **Sentiment-based takeover** (detect angry customers)
- [ ] **Workload balancing** (auto-assign based on staff availability)

---

## 📞 Support

If AI behavior is unexpected:
1. Check conversation status in database
2. Review recent messages
3. Check global automation setting
4. Review server logs
5. Contact development team

---

**Last Updated**: November 3, 2025  
**Version**: 1.0.0  
**Migration**: 006_conversation_control.sql
