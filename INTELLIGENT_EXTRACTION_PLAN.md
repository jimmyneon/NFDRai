# Intelligent Information Extraction - Implementation Plan

## Your Key Insight

> "Use the AI to work out what to extract - don't tell it specifics, otherwise we may as well stick with regex! It should extract device details and any other info that's needed."

**You're absolutely right!** We're already paying $0.0002 per message for AI analysis. We should extract MAXIMUM value from that single call, not just sentiment.

## Current State

**What we extract NOW:**
- ✅ Sentiment (frustrated, angry, etc.)
- ✅ Intent (question, complaint, etc.)
- ✅ Customer name (from any context)
- ✅ Urgency level
- ✅ Should AI respond decision

**What we're MISSING:**
- ❌ Device type (iPhone, Samsung, etc.)
- ❌ Device model (iPhone 14 Pro, Galaxy S23)
- ❌ Device issue (cracked screen, won't charge)
- ❌ Customer preferences (timing, budget)
- ❌ Logistics (will drop off, needs pickup)
- ❌ Historical context (references previous repair)

## The Problem

We have `staff_message_extractions` table that captures device info from John's messages, but NO equivalent for customer messages!

When a customer says:
> "Hi, my iPhone 14 screen is cracked. Can you fix it today? I'm on a budget. Regards, Maurice"

We currently extract:
- Name: Maurice ✅
- Sentiment: neutral ✅
- Intent: device_issue ✅

But we MISS:
- Device: iPhone 14 ❌
- Issue: cracked screen ❌
- Urgency: today ❌
- Budget concern: yes ❌

## The Solution

### Phase 1: Database Schema ✅ DONE
Created `customer_message_extractions` table with fields for:
- Customer info (name, preferred name, contact preference)
- Device info (type, model, color, issue, category)
- Preferences (timing, budget, price sensitivity)
- Logistics (drop off, pickup, location)
- Historical context (previous repairs, devices)

### Phase 2: Enhanced AI Prompt (IN PROGRESS)
Update unified analyzer prompt to be INTELLIGENT, not rigid:

**OLD approach (rigid):**
```
Extract name if matches: "Hi, I'm {name}" or "Regards, {name}"
```

**NEW approach (intelligent):**
```
Extract customer's name from ANY context where they identify themselves.
Use your intelligence - if someone signs off "Regards, Maurice", that's their name.
```

**Apply same philosophy to EVERYTHING:**
- Device: "Use common sense - if they mention 'iPhone 14', extract deviceType='iPhone', deviceModel='14'"
- Issue: "If they say 'screen is cracked', extract deviceIssue='cracked screen', issueCategory='screen'"
- Timing: "If they say 'need it today', extract deadline='today', urgency='high'"

### Phase 3: Save Extracted Data
Update `saveAnalysisAsync` to also save to `customer_message_extractions` table.

### Phase 4: Use the Data
- Show device info in conversation view
- Pre-fill repair forms
- Analytics on common issues
- Better AI responses (knows device context)

## Implementation Steps

### Step 1: Update UnifiedAnalysis Interface
Add fields for all extractable data:
```typescript
export interface UnifiedAnalysis {
  // Existing fields...
  
  // NEW: Device Information
  deviceType: string | null
  deviceModel: string | null
  deviceIssue: string | null
  issueCategory: string | null
  
  // NEW: Customer Preferences
  preferredTime: string | null
  deadline: string | null
  budgetMentioned: number | null
  priceSensitive: boolean
  
  // NEW: Logistics
  willDropOff: boolean
  needsPickup: boolean
  
  // ... etc
}
```

### Step 2: Update AI Prompt
Make it INTELLIGENT, not pattern-based:

```
YOUR JOB: Extract ALL useful information from this message.
Use your intelligence and common sense.

Think: What would be valuable to know for providing great service?

EXTRACT (use null if not present):
- Customer name (from ANY context)
- Device details (type, model, what's wrong)
- What they want (repair, quote, status check)
- When they need it (timing, deadline)
- Budget concerns
- Anything else useful

REMEMBER: You're smart - use context. Don't just match patterns.
```

### Step 3: Update quickAnalysis Returns
Add null values for new fields to fix lint errors.

### Step 4: Save to Database
```typescript
// Save to sentiment_analysis (existing)
await supabase.from('sentiment_analysis').insert({...})

// NEW: Save to customer_message_extractions
if (analysis.deviceType || analysis.customerName || analysis.deviceIssue) {
  await supabase.from('customer_message_extractions').insert({
    message_id,
    conversation_id,
    customer_name: analysis.customerName,
    device_type: analysis.deviceType,
    device_model: analysis.deviceModel,
    device_issue: analysis.deviceIssue,
    issue_category: analysis.issueCategory,
    // ... all other fields
  })
}
```

## Benefits

### 1. Maximum Value from AI Call
- Same cost ($0.0002)
- 10x more data extracted
- No additional API calls needed

### 2. Better Service
- Know device details before customer arrives
- Pre-fill repair forms
- Understand urgency and budget
- Personalized responses

### 3. Analytics & Insights
- Most common devices
- Most common issues
- Price sensitivity trends
- Timing preferences

### 4. Future Automation
- Auto-quote based on device + issue
- Smart scheduling based on preferences
- Proactive parts ordering
- Better AI responses with context

## Example Extraction

**Customer message:**
> "Hi John, my iPhone 14 Pro screen is cracked. Can you fix it today? I'm on a tight budget. Will drop it off this afternoon. Regards, Maurice"

**Current extraction:**
```json
{
  "customerName": "Maurice",
  "sentiment": "neutral",
  "intent": "device_issue"
}
```

**NEW extraction:**
```json
{
  "customerName": "Maurice",
  "sentiment": "neutral",
  "intent": "device_issue",
  "deviceType": "iPhone",
  "deviceModel": "14 Pro",
  "deviceIssue": "cracked screen",
  "issueCategory": "screen",
  "deadline": "today",
  "urgency": "high",
  "priceSensitive": true,
  "budgetMentioned": null,
  "willDropOff": true,
  "preferredTime": "afternoon",
  "needsPickup": false
}
```

## Cost Analysis

**Current:**
- 1 AI call per message: $0.0002
- Extracts: 5 fields

**Proposed:**
- 1 AI call per message: $0.0002 (SAME!)
- Extracts: 20+ fields

**ROI:** 4x more data for same cost!

## Next Steps

1. ✅ Create database schema (migration 050)
2. ⏳ Update UnifiedAnalysis interface
3. ⏳ Enhance AI prompt (intelligent, not rigid)
4. ⏳ Fix quickAnalysis returns
5. ⏳ Save to customer_message_extractions table
6. ⏳ Display extracted data in UI
7. ⏳ Use data for better AI responses

## Philosophy

**OLD:** Tell AI exactly what patterns to match
**NEW:** Let AI use intelligence to extract what's useful

We're paying for GPT-4o-mini's intelligence - let's use it!
