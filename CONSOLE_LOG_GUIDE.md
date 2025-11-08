# Console Log Monitoring Guide

## What to Look For in Console Logs

### 1. Prompt Size (Most Important!)

**Look for this log:**
```
[AI] Prompt size: 2,847 characters
```

**Expected:**
- ✅ **2,000 - 3,000 chars** = Context-aware working perfectly
- ⚠️  **3,000 - 5,000 chars** = Loading too many modules
- ❌ **10,000+ chars** = Context-aware NOT working (loading everything)
- ❌ **50,000 chars** = Using old full prompt (system broken)

---

### 2. Context-Aware Module Loading

**Look for this log:**
```
[AI] Context-aware modules loaded: ['core_identity', 'pricing_flow_detailed', 'warranty_mention']
```

**Expected:**
- ✅ Should only list 3-5 modules relevant to the query
- ❌ Should NOT list all 15 modules

**Examples:**

**Query: "What are your hours?"**
```
Modules: ['core_identity', 'business_hours_awareness']
```

**Query: "How much for iPhone screen?"**
```
Modules: ['core_identity', 'pricing_flow_detailed', 'screen_diagnosis_flow', 'warranty_mention']
```

**Query: "My phone got wet"**
```
Modules: ['core_identity', 'common_scenarios', 'operational_policies']
```

---

### 3. Conversation History

**Look for this log:**
```
[AI] Including 8 messages from conversation history
```

**Expected:**
- ✅ Should include up to 15 recent messages
- ✅ Number should match actual conversation length
- ❌ Should NOT be limited to 5 messages (old system)

---

### 4. Multi-Message Detection

**Look for this log:**
```
[AI] Multi-message response detected: 2 messages
```

**Expected:**
- ✅ Should appear when AI uses `|||` delimiter
- ✅ Should send messages with 2-second delay
- ✅ Each message should have its own sign-off

---

### 5. Sign-off Enforcement

**Look for this log:**
```
[AI] Sign-off missing, appending forced sign-off
```

**Expected:**
- ⚠️  Should be RARE (AI should include sign-off naturally)
- ✅ If it appears, sign-off should be added automatically
- ❌ If you see this often, AI prompt needs adjustment

---

### 6. Cost Tracking

**Look for this log:**
```
[AI] Cost: $0.0034 | Input tokens: 847 | Output tokens: 156
```

**Expected:**
- ✅ **$0.002 - $0.005** per message = Good!
- ⚠️  **$0.005 - $0.010** per message = Acceptable
- ❌ **$0.015+** per message = Too expensive (old system cost)

**Token Breakdown:**
- Input tokens = Prompt + conversation history
- Output tokens = AI's response
- Cost = (input × $0.003/1k) + (output × $0.015/1k) for GPT-4

---

### 7. Validation Failures

**Look for this log:**
```
[AI] ⚠️  Validation failed: [reason]
```

**Common Failures:**
- "Making assumptions about customer intent"
- "Not asking for device model"
- "Mentioning turnaround time unprompted"
- "Promising to check repair status"

**Expected:**
- ⚠️  Should be RARE (< 5% of messages)
- ✅ System should retry with corrected prompt
- ❌ If frequent, prompts need adjustment

---

### 8. State Detection

**Look for this log:**
```
[AI] Conversation state: new_inquiry
[AI] Intent detected: screen_repair
[AI] Device: iPhone 12
```

**Expected:**
- ✅ State should match conversation stage
- ✅ Intent should be detected correctly
- ✅ Device should be extracted when mentioned

---

## How to Monitor Logs

### Option 1: Vercel Dashboard (Production)
1. Go to Vercel Dashboard
2. Select your project
3. Click "Logs" tab
4. Filter by "Function: /api/messages/incoming"
5. Watch real-time logs as messages come in

### Option 2: Local Development
```bash
npm run dev
# or
vercel dev
```
Watch terminal for console logs

### Option 3: Supabase Logs
1. Go to Supabase Dashboard
2. Click "Logs" in sidebar
3. Select "API" logs
4. Filter for AI-related queries

---

## Quick Health Check

Run this in your browser console on the dashboard:

```javascript
// Check last 10 AI responses
fetch('/api/ai-analytics?limit=10')
  .then(r => r.json())
  .then(data => {
    console.table(data.map(d => ({
      timestamp: d.created_at,
      promptSize: d.prompt_size,
      cost: `$${d.cost_usd}`,
      validated: d.validation_passed ? '✓' : '✗'
    })))
  })
```

**Expected Output:**
```
┌─────┬──────────────────────┬────────────┬─────────┬───────────┐
│ idx │ timestamp            │ promptSize │ cost    │ validated │
├─────┼──────────────────────┼────────────┼─────────┼───────────┤
│ 0   │ 2024-11-08 12:00:00  │ 2847       │ $0.0034 │ ✓         │
│ 1   │ 2024-11-08 11:58:00  │ 2654       │ $0.0031 │ ✓         │
│ 2   │ 2024-11-08 11:55:00  │ 3012       │ $0.0038 │ ✓         │
└─────┴──────────────────────┴────────────┴─────────┴───────────┘
```

---

## Red Flags 🚩

**Immediate Action Required:**

1. **Prompt size > 10,000 chars**
   - Context-aware system not working
   - Check `smart-response-generator.ts` logic

2. **Cost > $0.015 per message**
   - Loading too much data
   - Check module filtering logic

3. **Validation failures > 20%**
   - Prompts need refinement
   - Check prompt module content

4. **Sign-off missing frequently**
   - AI not following instructions
   - Check forced sign-off logic

5. **No multi-message splits**
   - Delimiter not working
   - Check message splitting logic

---

## Success Indicators ✅

**System Working Perfectly:**

1. ✅ Prompt size: 2,000-3,000 chars
2. ✅ Cost: $0.002-0.005 per message
3. ✅ Validation: >95% pass rate
4. ✅ Context-aware: 3-5 modules per query
5. ✅ Sign-off: Always present
6. ✅ Multi-message: Working when appropriate
7. ✅ Memory: 15 messages included
8. ✅ No errors in logs

---

## Troubleshooting

### Problem: Prompt size still 50,000 chars
**Solution:** Context-aware logic not running
- Check `buildFocusedPrompt()` in `smart-response-generator.ts`
- Verify migrations applied (run `check_migrations.sql`)

### Problem: AI forgetting conversation
**Solution:** Message history not included
- Check `messages.slice(-15)` in `smart-response-generator.ts`
- Verify conversation state logic

### Problem: No multi-message splits
**Solution:** Delimiter not detected
- Check for `|||` in AI response
- Verify message splitting logic in `/api/messages/send`

### Problem: Sign-off missing
**Solution:** Forced sign-off not appending
- Check sign-off logic in `smart-response-generator.ts`
- Verify sign-off format matches exactly

---

## Daily Monitoring Checklist

- [ ] Check average prompt size (should be 2-3k)
- [ ] Check average cost per message (should be $0.002-0.005)
- [ ] Check validation pass rate (should be >95%)
- [ ] Review any validation failures
- [ ] Check for console errors
- [ ] Verify customer satisfaction (no complaints)
- [ ] Monitor response quality (friendly, relevant)

---

## Need Help?

If you see unexpected logs or errors:
1. Copy the full console log
2. Note what message triggered it
3. Check this guide for known issues
4. Review the relevant code section
5. Test with simpler message first
