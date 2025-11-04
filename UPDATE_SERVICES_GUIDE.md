# 🛍️ Update AI with Full Services Information

## What's Being Added

The AI will now know about ALL your services:
- ✅ Device repairs (existing)
- ✅ **Buying devices** (iPhones, iPads, MacBooks, laptops)
- ✅ **Selling refurbished devices**
- ✅ **Accessories in stock** (cases, chargers, cables, etc.)

---

## 📋 Run These SQL Files in Supabase

### 1. Update FAQs (New Questions About Buying/Selling)
```sql
-- File: update-faqs-buying-selling.sql
-- Adds 8 new FAQs about:
-- - Buying devices
-- - Selling devices  
-- - Accessories
-- - Buyback process
-- - Trade-ins
```

### 2. Update System Prompt (AI Personality & Knowledge)
```sql
-- File: update-system-prompt-full-services.sql
-- Updates AI to know:
-- - We buy devices at good rates
-- - We sell refurbished devices
-- - We stock all accessories
-- - How to handle buyback queries
-- - When to pass to John
```

### 3. Add Knowledge Base Docs (Detailed Info)
```sql
-- File: add-full-services-docs.sql
-- Adds 4 comprehensive docs:
-- - Full services overview
-- - Buyback process details
-- - Refurbished devices info
-- - Accessories catalog
```

---

## 🎯 What the AI Will Say

### Buyback Queries:
**Customer:** "Do you buy phones?"  
**AI:** "Yes! We buy iPhones, iPads, MacBooks, and laptops at good rates. Pop in for an instant appraisal or send me the model and condition and I'll get back to you ASAP. We don't mess you about like the online shops!"

### Selling Devices:
**Customer:** "Got any iPhones for sale?"  
**AI:** "Yes! We sell refurbished iPhones that are tested and come with warranty. Pop in to see what we have in stock or ask about specific models you're looking for!"

### Accessories:
**Customer:** "Do you have iPhone cases?"  
**AI:** "Yes! We stock phone cases for all models, plus screen protectors, chargers, cables, and all the normal accessories. Pop in to see what we have!"

### Unknown Queries:
**Customer:** "Can you fix my toaster?"  
**AI:** "Ha! That's a bit beyond us I'm afraid. We stick to phones, tablets, and laptops. I'll pass you onto John if you need something specialized!"

---

## 🔑 Key Phrases AI Will Use

### For Buybacks:
- "We buy at good rates"
- "No messing about like online shops"
- "Pop in for instant appraisal"
- "Send me the details and I'll get back to you ASAP"

### For Sales:
- "Refurbished devices with warranty"
- "Pop in to see what's available"
- "All tested and working"

### For Accessories:
- "All the normal accessories in stock"
- "Pop in to see what we have"

### When Unsure:
- "I'll pass you onto John"
- "Let me get John to help with that"

---

## 📊 How to Run the Updates

### Option 1: Run All at Once
```sql
-- Copy and paste all three files into Supabase SQL Editor
-- Run them in order:
-- 1. update-faqs-buying-selling.sql
-- 2. update-system-prompt-full-services.sql  
-- 3. add-full-services-docs.sql
```

### Option 2: Run Individually
1. Go to Supabase → SQL Editor
2. Open `update-faqs-buying-selling.sql`
3. Copy contents, paste, run
4. Repeat for other two files

---

## ✅ Verify It Worked

### Check FAQs:
```sql
SELECT question, answer, category 
FROM faqs 
WHERE question LIKE '%buy%' OR question LIKE '%sell%' OR question LIKE '%accessories%'
ORDER BY priority DESC;
```

### Check System Prompt:
```sql
SELECT LEFT(system_prompt, 200) as prompt_preview
FROM ai_settings;
```

### Check Docs:
```sql
SELECT title, category 
FROM docs 
WHERE category IN ('services', 'products')
AND active = true;
```

---

## 🧪 Test the AI

### Test Buyback:
Send SMS: "Do you buy iPhones?"  
**Expected:** AI mentions good rates, no messing about, instant appraisal

### Test Sales:
Send SMS: "Got any iPads for sale?"  
**Expected:** AI mentions refurbished devices with warranty

### Test Accessories:
Send SMS: "Do you have phone cases?"  
**Expected:** AI says yes, mentions full range in stock

### Test Unknown:
Send SMS: "Can you fix my car?"  
**Expected:** AI says it's beyond them, offers to pass to John

---

## 🎉 Benefits

After running these updates:
- ✅ AI knows about ALL your services
- ✅ Can handle buyback inquiries professionally
- ✅ Promotes refurbished device sales
- ✅ Mentions accessories naturally
- ✅ Emphasizes "no messing about" vs online shops
- ✅ Knows when to pass to John
- ✅ Encourages customers to search online for more info

---

## 📝 Notes

- **Buyback rates:** AI won't quote specific prices (you handle that)
- **Stock availability:** AI will say "pop in" or "ask what's available"
- **Unknown queries:** AI will pass to John rather than make things up
- **Search suggestion:** AI will mention "Search New Forest Device Repairs online"

---

**Ready to run!** Just execute the three SQL files in Supabase and your AI will know everything! 🚀
