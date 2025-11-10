# AI Opportunities in the App

## Current AI Usage

1. **Main AI Response Generation** (GPT-4o)
   - Cost: ~$0.01-0.03 per response
   - Purpose: Generate customer responses
   - Status: ✅ Working well

2. **Name Extraction** (GPT-4o-mini) - NEW
   - Cost: ~$0.0001 per extraction
   - Purpose: Extract customer names from staff messages
   - Status: ✅ Just implemented

## Potential AI Enhancements

### 🔥 HIGH IMPACT (Should Do)

#### 1. **Intent Classification** (Already Doing!)
**Current:** Using GPT-4o-mini for intent classification before main response
**Cost:** ~$0.0001 per message
**Status:** ✅ Already implemented in `lib/ai/intent-classifier.ts`
**Impact:** Helps AI understand what customer wants (repair, quote, status check, etc.)

#### 2. **Sentiment Analysis**
**Purpose:** Detect frustrated/angry customers
**Use Case:** 
- Flag conversations needing immediate staff attention
- Prioritize upset customers in conversation list
- Alert you when customer is frustrated
**Cost:** ~$0.0001 per message (GPT-4o-mini)
**Implementation:** Add to incoming message handler
**Example:**
```
Customer: "This is the third time I've asked! Where is my phone?!"
AI detects: sentiment=frustrated, urgency=high
→ Alert sent to staff immediately
→ Conversation marked as priority
```

#### 3. **Smart Message Summarization**
**Purpose:** Summarize long conversations for quick context
**Use Case:**
- Show 1-2 sentence summary in conversation list
- Quick recap when opening conversation
- Daily digest of all conversations
**Cost:** ~$0.0002 per conversation (GPT-4o-mini)
**Implementation:** Generate on-demand or cache summaries
**Example:**
```
Conversation summary: "Customer inquiring about iPhone 14 screen repair. 
Quoted £149. Scheduled for tomorrow 2pm."
```

#### 4. **Automatic Tagging/Categorization**
**Purpose:** Auto-tag conversations by topic
**Use Case:**
- Filter by device type (iPhone, Samsung, laptop)
- Filter by issue type (screen, battery, water damage)
- Filter by status (quoted, booked, completed)
**Cost:** ~$0.0001 per message (GPT-4o-mini)
**Implementation:** Extract tags from messages, save to database
**Example:**
```
Message: "My iPhone 14 screen is cracked"
Tags: device:iphone, model:iphone_14, issue:screen, issue:cracked
```

### 💡 MEDIUM IMPACT (Nice to Have)

#### 5. **Price Suggestion**
**Purpose:** Suggest pricing based on similar repairs
**Use Case:**
- When you're quoting a repair
- AI suggests price based on historical data
- Shows range and confidence
**Cost:** ~$0.0005 per suggestion (GPT-4o-mini with context)
**Implementation:** Query past repairs, let AI suggest price
**Example:**
```
You: Quoting iPhone 14 screen repair
AI suggests: £140-160 (based on 23 similar repairs, avg £149)
```

#### 6. **Smart Search**
**Purpose:** Natural language search across conversations
**Use Case:**
- "Find the customer who had the water damaged MacBook last week"
- "Show me all Samsung screen repairs this month"
- "Who was asking about battery replacements?"
**Cost:** ~$0.001 per search (GPT-4o-mini + embeddings)
**Implementation:** Use semantic search with vector database

#### 7. **Appointment Extraction**
**Purpose:** Auto-detect when customer books appointment
**Use Case:**
- Extract date/time from customer messages
- Create calendar events automatically
- Send reminders
**Cost:** ~$0.0002 per message (GPT-4o-mini)
**Implementation:** Similar to name extraction
**Example:**
```
Customer: "I'll come by tomorrow at 2pm"
AI extracts: date=tomorrow, time=14:00
→ Creates appointment automatically
```

#### 8. **Follow-up Suggestions**
**Purpose:** Suggest when to follow up with customers
**Use Case:**
- "Customer quoted 3 days ago, no response - suggest follow-up"
- "Repair completed yesterday, suggest asking for feedback"
**Cost:** ~$0.0001 per analysis (GPT-4o-mini)
**Implementation:** Analyze conversation state, suggest actions

### 🎯 LOW IMPACT (Future)

#### 9. **Voice Transcription**
**Purpose:** Transcribe phone calls automatically
**Use Case:** If you take phone calls, auto-transcribe and log
**Cost:** ~$0.006 per minute (Whisper API)
**Implementation:** Integrate with phone system

#### 10. **Image Analysis**
**Purpose:** Analyze customer photos of damaged devices
**Use Case:**
- Customer sends photo of cracked screen
- AI estimates damage severity
- Suggests repair type
**Cost:** ~$0.01 per image (GPT-4o-vision)
**Implementation:** Add to image upload handler

#### 11. **Predictive Analytics**
**Purpose:** Predict customer behavior
**Use Case:**
- Likelihood customer will book
- Estimated repair value
- Churn risk
**Cost:** ~$0.001 per prediction
**Implementation:** Train on historical data

#### 12. **Auto-Reply Suggestions**
**Purpose:** Suggest quick replies for you
**Use Case:**
- Show 3-4 suggested responses
- Click to send
- Faster than typing
**Cost:** ~$0.0005 per suggestion (GPT-4o-mini)
**Implementation:** Generate suggestions when viewing conversation

## Cost Analysis

### Current Monthly AI Costs (Estimated)

Assuming 100 conversations/day:

| Feature | Cost per Use | Uses per Day | Daily Cost | Monthly Cost |
|---------|-------------|--------------|------------|--------------|
| Main AI Responses | $0.02 | 50 | $1.00 | $30.00 |
| Intent Classification | $0.0001 | 100 | $0.01 | $0.30 |
| Name Extraction | $0.0001 | 30 | $0.003 | $0.09 |
| **TOTAL** | - | - | **$1.01** | **$30.39** |

### With New Features (Estimated)

| Feature | Cost per Use | Uses per Day | Daily Cost | Monthly Cost |
|---------|-------------|--------------|------------|--------------|
| Sentiment Analysis | $0.0001 | 100 | $0.01 | $0.30 |
| Conversation Summaries | $0.0002 | 50 | $0.01 | $0.30 |
| Auto-Tagging | $0.0001 | 100 | $0.01 | $0.30 |
| **NEW TOTAL** | - | - | **$1.04** | **$31.29** |

**Additional cost: ~$1/month** for significant improvements!

## Recommendations

### Implement Now (High ROI)

1. **Sentiment Analysis** - Catch frustrated customers early
2. **Conversation Summaries** - Save time reviewing conversations
3. **Auto-Tagging** - Better organization and filtering

### Implement Later (Medium ROI)

4. **Appointment Extraction** - Automate scheduling
5. **Smart Search** - Find conversations faster
6. **Follow-up Suggestions** - Don't lose leads

### Consider (Low ROI)

7. **Price Suggestions** - You already know your pricing
8. **Image Analysis** - Nice but not essential
9. **Voice Transcription** - Only if you take many calls

## Implementation Priority

### Phase 1 (This Week) - $0.90/month additional
- ✅ Name Extraction (Done!)
- 🔄 Sentiment Analysis
- 🔄 Auto-Tagging

### Phase 2 (Next Week) - $0.30/month additional
- Conversation Summaries
- Appointment Extraction

### Phase 3 (Future) - Variable cost
- Smart Search
- Follow-up Suggestions
- Price Suggestions

## Technical Notes

### Why GPT-4o-mini is Perfect for These Tasks

1. **Cheap** - $0.15 per 1M input tokens
2. **Fast** - <1 second response time
3. **Accurate** - Good enough for structured extraction
4. **JSON Mode** - Reliable structured output

### When to Use GPT-4o Instead

- Main customer responses (need high quality)
- Complex reasoning tasks
- When accuracy is critical

### When to Use Regex Instead

- Simple pattern matching (like we do for name fallback)
- When speed is critical
- When cost needs to be zero

## Summary

**Best Opportunities:**
1. **Sentiment Analysis** - Catch frustrated customers ($0.30/month)
2. **Auto-Tagging** - Better organization ($0.30/month)
3. **Conversation Summaries** - Save time ($0.30/month)

**Total Additional Cost:** ~$1/month for 3 major improvements

**Current Model Choice:** GPT-4o-mini is perfect - cheapest and fast enough!
