# 🧪 Quick Test - Migration 033 Applied

## Test Right Now

Send this message to your system:

```
"My iPhone is broken"
```

---

## ✅ CORRECT Response (After Migration)

```
Hi! I'm AI Steve, your automated assistant for New Forest Device Repairs.

I can help with pricing, bookings, and questions.

What's happening with it, and what model - iPhone 12, 13, 14, 15, or 16?

Many Thanks,
AI Steve,
New Forest Device Repairs
```

**Key Points:**
- ✅ Asks "What's happening with it" (what's wrong)
- ✅ Asks "what model" at the SAME TIME
- ✅ Line breaks between sections
- ✅ Only ONE message sent

---

## ❌ WRONG Response (Old Behavior)

```
Hi! I'm AI Steve, your automated assistant for New Forest Device Repairs. I can help with pricing, bookings, and questions. What model is your iPhone? Once I know that, I can help you with the next steps. Many Thanks, AI Steve, New Forest Device Repairs
```

**Problems:**
- ❌ Only asks "What model?" 
- ❌ Doesn't ask what's wrong
- ❌ No line breaks (hard to read)
- ❌ Might send duplicate

---

## If You Get the WRONG Response

The migration might not have applied fully. Run this to check:

```sql
SELECT module_name, active, priority 
FROM prompts 
WHERE module_name = 'ask_whats_wrong_first';
```

Should return:
- `ask_whats_wrong_first`, `true`, `97`

If no results, the migration didn't apply. Re-run it.

---

## Next Test

After confirming the first test works, try:

```
"iPhone 13 black screen"
```

Should get:
- ✅ Force restart instructions
- ✅ Ask about damage
- ✅ Pricing context
- ❌ NOT just "bring it in"

---

## 🎯 Bottom Line

**Test message:** "My iPhone is broken"

**Should ask:** "What's happening with it, and what model?"

**Should NOT ask:** "What model is your iPhone?" (without asking what's wrong)

Try it now! 🚀
