# 🔘 Active/Inactive Toggle Feature

**Migration**: `008_add_active_toggles.sql`  
**Purpose**: Hide prices, FAQs, and docs without deleting them  
**Status**: Ready to deploy

---

## 🎯 What This Does

### Before:
- ❌ Delete price → Lost forever
- ❌ Delete FAQ → Can't recover
- ❌ Delete doc → Gone permanently

### After:
- ✅ Toggle price off → Hidden from AI, kept in database
- ✅ Toggle FAQ off → Not shown to customers, data preserved
- ✅ Toggle doc off → AI doesn't see it, but you can re-enable anytime

---

## 📊 What Was Added

### New Columns:

**`prices` table:**
- Already has `active` column (from migration 007)

**`faqs` table:**
- ✅ `active` BOOLEAN (default: true)

**`docs` table:**
- ✅ `active` BOOLEAN (default: true)

---

## 🔍 New Views (AI-Friendly)

### `active_prices`
Only shows prices that are:
- ✅ `active = true`
- ✅ Not expired

### `active_faqs`
Only shows FAQs where:
- ✅ `active = true`

### `active_docs`
Only shows docs where:
- ✅ `active = true`

**AI will automatically use these views!**

---

## 🛠️ How to Use

### In SQL (Supabase):

#### Toggle Single Item:
```sql
-- Disable a price
SELECT toggle_item_status('prices', 'uuid-here', false);

-- Enable a FAQ
SELECT toggle_item_status('faqs', 'uuid-here', true);

-- Disable a doc
SELECT toggle_item_status('docs', 'uuid-here', false);
```

#### Toggle Multiple Items:
```sql
-- Disable multiple prices at once
SELECT bulk_toggle_items(
  'prices', 
  ARRAY['uuid1', 'uuid2', 'uuid3'], 
  false
);

-- Enable multiple FAQs
SELECT bulk_toggle_items(
  'faqs',
  ARRAY['uuid1', 'uuid2'],
  true
);
```

#### Manual Update:
```sql
-- Disable a price
UPDATE prices 
SET active = false, updated_at = NOW() 
WHERE id = 'uuid-here';

-- Enable all expired prices
UPDATE prices 
SET active = true 
WHERE expiry < NOW();
```

---

## 🎨 Dashboard Integration (Future)

### Pricing Table:

Add a toggle switch to each row:

```tsx
<Switch
  checked={price.active}
  onCheckedChange={async (checked) => {
    await supabase
      .from('prices')
      .update({ active: checked })
      .eq('id', price.id)
  }}
/>
```

### FAQ List:

```tsx
<Switch
  checked={faq.active}
  onCheckedChange={async (checked) => {
    await supabase
      .from('faqs')
      .update({ active: checked })
      .eq('id', faq.id)
  }}
/>
```

### Docs Table:

```tsx
<Switch
  checked={doc.active}
  onCheckedChange={async (checked) => {
    await supabase
      .from('docs')
      .update({ active: checked })
      .eq('id', doc.id)
  }}
/>
```

---

## 📋 Use Cases

### Seasonal Pricing:
```sql
-- Disable summer pricing in winter
UPDATE prices 
SET active = false 
WHERE device LIKE '%outdoor%';

-- Re-enable in summer
UPDATE prices 
SET active = true 
WHERE device LIKE '%outdoor%';
```

### Outdated FAQs:
```sql
-- Hide old COVID-related FAQs
UPDATE faqs 
SET active = false 
WHERE question LIKE '%COVID%' OR question LIKE '%pandemic%';
```

### Draft Documents:
```sql
-- Hide work-in-progress docs
UPDATE docs 
SET active = false 
WHERE title LIKE '%DRAFT%';
```

### Temporary Promotions:
```sql
-- Disable regular price, enable promo price
UPDATE prices SET active = false WHERE device = 'iPhone 14' AND cost = 149.99;
UPDATE prices SET active = true WHERE device = 'iPhone 14' AND cost = 99.99;

-- After promo ends, reverse it
UPDATE prices SET active = true WHERE device = 'iPhone 14' AND cost = 149.99;
UPDATE prices SET active = false WHERE device = 'iPhone 14' AND cost = 99.99;
```

---

## 🤖 AI Behavior

### What AI Sees:

**Prices:**
```sql
SELECT * FROM active_prices;
-- Only active, non-expired prices
```

**FAQs:**
```sql
SELECT * FROM active_faqs;
-- Only active FAQs
```

**Docs:**
```sql
SELECT * FROM active_docs;
-- Only active documents
```

### What AI Doesn't See:
- ❌ Inactive prices
- ❌ Inactive FAQs
- ❌ Inactive docs
- ❌ Expired prices (even if active)

---

## 📊 Query Examples

### See All Inactive Items:

```sql
-- Inactive prices
SELECT * FROM prices WHERE active = false;

-- Inactive FAQs
SELECT * FROM faqs WHERE active = false;

-- Inactive docs
SELECT * FROM docs WHERE active = false;
```

### Count Active vs Inactive:

```sql
-- Prices
SELECT 
  active,
  COUNT(*) as count
FROM prices
GROUP BY active;

-- FAQs
SELECT 
  active,
  COUNT(*) as count
FROM faqs
GROUP BY active;

-- Docs
SELECT 
  active,
  COUNT(*) as count
FROM docs
GROUP BY active;
```

### Recently Disabled Items:

```sql
-- Prices disabled in last 7 days
SELECT * FROM prices 
WHERE active = false 
AND updated_at > NOW() - INTERVAL '7 days';
```

---

## 🔄 Bulk Operations

### Disable All Expired Prices:
```sql
UPDATE prices 
SET active = false 
WHERE expiry < NOW() 
AND active = true;
```

### Re-enable All Items:
```sql
-- Prices
UPDATE prices SET active = true;

-- FAQs
UPDATE faqs SET active = true;

-- Docs
UPDATE docs SET active = true;
```

### Disable by Category:
```sql
-- Disable all laptop prices
UPDATE prices 
SET active = false 
WHERE device_type = 'laptop';

-- Disable all Apple prices
UPDATE prices 
SET active = false 
WHERE brand = 'Apple';
```

---

## 🎯 Benefits

### For You:
- ✅ Test prices without deleting
- ✅ Seasonal pricing control
- ✅ Keep historical data
- ✅ Easy rollback
- ✅ A/B testing

### For AI:
- ✅ Only sees current info
- ✅ No outdated data
- ✅ Cleaner responses
- ✅ Better accuracy

### For Customers:
- ✅ Current pricing only
- ✅ Relevant FAQs
- ✅ Up-to-date info
- ✅ No confusion

---

## 🚀 Deployment

### Step 1: Run Migration

```sql
-- In Supabase SQL Editor
-- Copy and paste: supabase/migrations/008_add_active_toggles.sql
-- Click "Run"
```

### Step 2: Verify

```sql
-- Check columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name IN ('prices', 'faqs', 'docs')
AND column_name = 'active';

-- Check views exist
SELECT * FROM active_prices LIMIT 1;
SELECT * FROM active_faqs LIMIT 1;
SELECT * FROM active_docs LIMIT 1;

-- Check functions exist
SELECT toggle_item_status('prices', (SELECT id FROM prices LIMIT 1), true);
```

### Step 3: Test

```sql
-- Disable a test price
UPDATE prices 
SET active = false 
WHERE id = (SELECT id FROM prices LIMIT 1);

-- Check it's hidden from AI view
SELECT * FROM active_prices;

-- Re-enable it
UPDATE prices 
SET active = true 
WHERE id = (SELECT id FROM prices LIMIT 1);
```

---

## 📱 Dashboard UI (To Add)

### Pricing Page:

Add a "Status" column with toggle switch:

```tsx
<td>
  <div className="flex items-center gap-2">
    <Switch
      checked={price.active}
      onCheckedChange={(checked) => handleToggle(price.id, checked)}
    />
    <Badge variant={price.active ? "default" : "secondary"}>
      {price.active ? "Active" : "Hidden"}
    </Badge>
  </div>
</td>
```

### FAQs Page:

```tsx
<Switch
  checked={faq.active}
  onCheckedChange={(checked) => handleToggleFAQ(faq.id, checked)}
/>
```

### Docs Page:

```tsx
<Switch
  checked={doc.active}
  onCheckedChange={(checked) => handleToggleDoc(doc.id, checked)}
/>
```

---

## 🔍 Monitoring

### Dashboard Analytics:

```sql
-- Active vs Inactive breakdown
SELECT 
  'Prices' as type,
  SUM(CASE WHEN active THEN 1 ELSE 0 END) as active_count,
  SUM(CASE WHEN NOT active THEN 1 ELSE 0 END) as inactive_count
FROM prices
UNION ALL
SELECT 
  'FAQs',
  SUM(CASE WHEN active THEN 1 ELSE 0 END),
  SUM(CASE WHEN NOT active THEN 1 ELSE 0 END)
FROM faqs
UNION ALL
SELECT 
  'Docs',
  SUM(CASE WHEN active THEN 1 ELSE 0 END),
  SUM(CASE WHEN NOT active THEN 1 ELSE 0 END)
FROM docs;
```

---

## ✅ Summary

**What Changed:**
- ✅ Added `active` column to FAQs and Docs
- ✅ Created AI-friendly views (active items only)
- ✅ Added toggle functions for easy management
- ✅ Prices already had active column (migration 007)

**How to Use:**
- Toggle items on/off in Supabase
- AI automatically uses active items only
- Add UI toggles to dashboard (optional)

**Benefits:**
- Never lose data
- Easy seasonal changes
- Test without deleting
- Clean AI responses

---

**Ready to use!** Run migration 008 and start toggling! 🎉

---

**Last Updated**: November 3, 2025  
**Migration**: 008_add_active_toggles.sql  
**Status**: Production Ready
