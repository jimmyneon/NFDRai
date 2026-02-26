# Human Control Window System

## Overview

The Human Control Window system prevents AI Steve from interfering when John is actively handling a conversation, while still allowing limited factual automation for basic FAQs.

## Core Problem Solved

**Before:** AI Steve replied to all messages, causing dual-voice confusion when John was actively conversing with a customer.

**After:** Intent-based gating ensures AI only responds when appropriate, giving John clear control windows.

---

## Architecture

### 1. Intent Classification Layer

Every incoming message is classified into one of these intents:

| Intent | Description | AI Response During Human Control? |
|--------|-------------|-----------------------------------|
| `SAFE_FAQ` | Hours, location, parking, booking info | ✅ YES |
| `CONTEXTUAL_QUERY` | Pricing, repairs (needs context) | ❌ NO |
| `JOB_SPECIFIC` | Status checks, "is my phone ready?" | ❌ NO |
| `COMPLAINT` | Frustration, complaints | ❌ NO |
| `CONVERSATION` | Conversational messages | ❌ NO |
| `ACKNOWLEDGMENT` | "Thanks", "Ok" | ❌ NO (no response needed) |
| `UNKNOWN` | Uncertain | ❌ NO (default to human) |

### 2. Human Control Window

When John sends a message:
- **Activates:** 2-4 hour control window (configurable)
- **During window:** AI only responds to SAFE_FAQ intents
- **After window:** AI resumes normal operation

### 3. Single-Shot Behavior

When AI does respond:
- **Cooldown:** 6-12 hours before next AI response
- **Exception:** Safe FAQs can always respond
- **Purpose:** Prevents conversational loops

### 4. Manual Override System

John can manually control AI per conversation:
- **Enable AI:** Deactivate control window, AI responds normally
- **Mute temporarily:** Set custom control window (e.g., 4 hours)
- **Mute permanently:** Human-only mode, AI never responds
- **Safe FAQ only:** AI only responds to hours/location/parking

---

## Database Schema

### New Columns in `conversations` table

```sql
ai_muted_until TIMESTAMPTZ           -- AI muted until this time
ai_mute_reason TEXT                  -- Why AI is muted
last_ai_response_at TIMESTAMPTZ      -- Last AI response (for cooldown)
human_control_active BOOLEAN         -- Is control window active?
ai_control_mode ai_control_mode      -- Control mode enum
```

### Control Modes

```sql
CREATE TYPE ai_control_mode AS ENUM (
  'auto',                -- Normal AI operation
  'human_control',       -- Human Control Window active
  'permanently_muted',   -- AI never responds
  'safe_faq_only'        -- AI only responds to safe FAQs
);
```

---

## Flow Examples

### Example 1: John Handling Pricing Question

```
10:00 AM - Customer: "How much for iPhone screen?"
          → Intent: JOB_SPECIFIC
          → AI responds: "For iPhone screen repair, typically £80-120..."

10:05 AM - John: "Hi Sarah, your iPhone 14 screen would be £149.99"
          → Human Control Window activated (until 12:05 PM)
          
10:10 AM - Customer: "When are you open?"
          → Intent: SAFE_FAQ
          → AI responds: "We're open Mon-Fri 10am-5pm..."
          ✅ ALLOWED (safe FAQ)

10:15 AM - Customer: "How much for battery too?"
          → Intent: JOB_SPECIFIC
          → AI stays silent
          → Alert sent to John
          ❌ BLOCKED (Human Control Window active)
```

### Example 2: Safe FAQ During Control Window

```
2:00 PM - John: "Your phone is ready, £99.99"
         → Human Control Window activated (until 4:00 PM)

2:05 PM - Customer: "Great! Where are you located?"
         → Intent: SAFE_FAQ
         → AI responds: "We're at 123 High Street..."
         ✅ ALLOWED (safe FAQ exception)

2:10 PM - Customer: "Is there parking?"
         → Intent: SAFE_FAQ
         → AI responds: "Yes, free parking available..."
         ✅ ALLOWED (safe FAQ exception)
```

### Example 3: Single-Shot Cooldown

```
9:00 AM - Customer: "Do you fix Samsung phones?"
         → Intent: CONTEXTUAL_QUERY
         → No Human Control Window active
         → AI responds: "Yes, we fix all Samsung models..."
         → Cooldown activated (until 3:00 PM)

9:30 AM - Customer: "How much for S23 screen?"
         → Intent: JOB_SPECIFIC
         → AI in cooldown (5.5h remaining)
         → AI stays silent
         → Alert sent to John
         ❌ BLOCKED (cooldown active)

3:05 PM - Customer: "Are you still there?"
         → Cooldown expired
         → AI responds
         ✅ ALLOWED (cooldown expired)
```

---

## Configuration

### Adjustable Parameters

```typescript
// app/lib/human-control-window.ts
export const CONTROL_WINDOW_HOURS = 2;        // 2-4 hours recommended
export const SINGLE_SHOT_COOLDOWN_HOURS = 6;  // 6-12 hours recommended
```

### Safe FAQ Patterns

Add/remove patterns in `app/lib/intent-classifier.ts`:

```typescript
const SAFE_FAQ_PATTERNS = {
  hours: [/when.*open/i, /what.*hours/i],
  location: [/where.*located/i, /what.*address/i],
  parking: [/where.*park/i, /parking/i],
  // Add more as needed
};
```

---

## API Endpoints

### Get Control Status
```bash
GET /api/conversations/{id}/control
```

Response:
```json
{
  "success": true,
  "status": {
    "isActive": true,
    "aiMutedUntil": "2024-02-26T14:00:00Z",
    "muteReason": "Human Control Window - staff is handling conversation",
    "controlMode": "human_control",
    "hoursRemaining": 1.5,
    "canAIRespond": false
  }
}
```

### Update Control Mode
```bash
POST /api/conversations/{id}/control
Content-Type: application/json

{
  "action": "enable_ai" | "mute_temporarily" | "mute_permanently" | "safe_faq_only",
  "hours": 2  // optional, for mute_temporarily
}
```

---

## Migration

Run migration to add new columns:
```bash
supabase migration up 083_human_control_window.sql
```

This will:
- Add new columns to conversations table
- Create triggers to auto-activate control window
- Create view for conversations in human control

---

## Benefits

### 1. No Dual-Voice Confusion
- Only one "voice" responds at a time
- Clear handoff between AI and John

### 2. Preserves Automation for FAQs
- Customers still get instant answers to basic questions
- Reduces John's workload for repetitive queries

### 3. Predictable Behavior
- Intent-based logic is transparent and debuggable
- No fragile timing hacks

### 4. Maintainable
- Easy to add new safe FAQ patterns
- Clear separation of concerns
- Well-documented decision logic

### 5. Flexible Control
- John can override per conversation
- Multiple control modes for different scenarios
- Configurable time windows

---

## Testing

Run test suite:
```bash
node test-human-control-window.js
```

Tests cover:
- Intent classification accuracy
- Human Control Window activation/deactivation
- Safe FAQ exceptions
- Single-shot cooldown
- Manual override controls

---

## Monitoring

Logs show decision-making process:

```
[Human Control] Analyzing message for AI response decision...
[Human Control] Intent classification: { intent: 'SAFE_FAQ', confidence: 0.9 }
[Human Control] Control status: { isActive: true, hoursRemaining: 1.5 }
[Human Control] Final decision: { shouldRespond: true, reason: 'Safe FAQ allowed' }
✅ Safe FAQ (hours) - AI can respond even during Human Control Window
```

---

## Comparison: Old vs New

### Old System (30-minute pause)
- ❌ Time-based only (too blunt)
- ❌ 30 minutes too short for real conversations
- ❌ Too restrictive (blocked all responses)
- ❌ No intent awareness

### New System (Human Control Window)
- ✅ Intent-based gating (smart)
- ✅ 2-4 hour window (configurable)
- ✅ Allows safe FAQs (balanced)
- ✅ Full intent classification
- ✅ Manual override controls
- ✅ Single-shot behavior prevents loops

---

## Future Enhancements

Potential improvements:
1. AI-based intent classification (fallback for uncertain cases)
2. Learning from John's manual overrides
3. Per-customer control preferences
4. Time-of-day based control windows
5. Integration with calendar/availability
