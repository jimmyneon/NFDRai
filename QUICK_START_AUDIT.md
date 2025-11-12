# Quick Start: Extraction Audit System

## 🚀 Get Started in 3 Steps

### Step 1: Add to Navigation (2 minutes)

Find your dashboard navigation file (likely `app/dashboard/layout.tsx` or a nav component) and add:

```typescript
{
  name: 'Extractions',
  href: '/dashboard/extractions',
  icon: FileText // or any icon you prefer
}
```

### Step 2: Run First Audit (5 minutes)

```bash
# Run the AI audit script
npx ts-node scripts/audit-extractions.ts
```

This will:
- Review last 100 extractions
- Flag errors
- Save report to `audit-results-[timestamp].json`

### Step 3: Fix Errors (10 minutes)

1. Go to `http://localhost:3000/dashboard/extractions`
2. Click "Low Confidence" filter
3. Click "Edit" on any extraction
4. Fix the errors
5. Click "Save Changes"

Done! ✅

## 📊 What You'll See

### Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ Staff Message Extractions                                   │
└─────────────────────────────────────────────────────────────┘

Stats:
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Total: 100   │ High: 85     │ Review: 5    │ Names: 92    │
└──────────────┴──────────────┴──────────────┴──────────────┘

Filters:
[All (100)] [⚠️ Low Confidence (5)] [No Name (8)]

Extractions:
┌─────────────────────────────────────────────────────────────┐
│ Smith                                        [Edit] Button   │
│ Original: Hi Mrs Smith, your iPhone 14 screen is ready      │
│ Name: Smith | Device: iPhone 14 | Status: ready            │
│ [High (95%)] [ai_enhanced]                                 │
└─────────────────────────────────────────────────────────────┘
```

### Edit Modal

```
┌─────────────────────────────────────────────────────────────┐
│ Edit Extraction                                             │
├─────────────────────────────────────────────────────────────┤
│ Original: Hi Mrs Smith, your iPhone 14 screen is ready      │
│                                                             │
│ Customer Name: [Smith          ]                           │
│ Device Type:   [iPhone         ]                           │
│ Device Model:  [14             ]                           │
│ Status:        [Ready          ▼]                          │
│ Price:         [149.99         ]                           │
│                                                             │
│                              [Cancel] [Save Changes]        │
└─────────────────────────────────────────────────────────────┘
```

### AI Audit Output

```
🔍 Starting AI Batch Audit...

[1/100] Auditing extraction abc123...
  ⚠️  ERRORS FOUND:
     - Customer name is a title, not a surname
  💡 customer_name: "Mrs" → "Smith"

[2/100] Auditing extraction def456...
  ✅ Looks good

📊 SUMMARY
Total: 100 | Errors: 12 | Good: 88

🔍 ERRORS BY FIELD:
  customer_name: 8 errors
  device_type: 3 errors

💾 Saved to: audit-results-2025-11-12.json
```

## 🎯 Daily Workflow (5 minutes)

**Morning routine:**

1. Open `/dashboard/extractions`
2. Check stats - any low confidence?
3. Click "Low Confidence" filter
4. Review + edit errors
5. Done!

## 🤖 Weekly Workflow (15 minutes)

**Sunday morning:**

1. Run: `npx ts-node scripts/audit-extractions.ts`
2. Review audit report
3. Open dashboard
4. Fix flagged errors
5. Re-run audit to verify
6. Track improvement!

## 💡 Common Fixes

### Fix 1: Title as Name

**Error:**
```
Message: "Hi Mrs Smith, your phone is ready"
Extracted: customer_name = "Mrs"
```

**Fix:**
1. Click "Edit"
2. Change "Mrs" to "Smith"
3. Save

### Fix 2: Missing Device Model

**Error:**
```
Message: "Hi Carol, your iPhone 14 Pro screen is ready"
Extracted: device_model = null
```

**Fix:**
1. Click "Edit"
2. Add "14 Pro" to Device Model
3. Save

### Fix 3: Wrong Status

**Error:**
```
Message: "Your phone would be £99 to fix"
Extracted: repair_status = "ready"
```

**Fix:**
1. Click "Edit"
2. Change status to "quoted"
3. Save

## 📈 Track Progress

### Week 1
- Run audit
- Note error count
- Fix errors

### Week 2
- Run audit again
- Compare error count
- Should be lower!

### Week 3+
- Continue weekly audits
- Errors should decrease
- Extraction quality improves

## 🎉 Benefits

**Before:**
- ❌ No visibility into extractions
- ❌ Can't fix errors
- ❌ Don't know if data is correct

**After:**
- ✅ See all extractions
- ✅ Edit in seconds
- ✅ AI checks quality
- ✅ Track improvement

## 🆘 Troubleshooting

### Dashboard not showing?

1. Check you added to nav menu
2. Restart dev server
3. Clear browser cache

### Audit script fails?

1. Check `.env.local` has `OPENAI_API_KEY`
2. Check `SUPABASE_SERVICE_ROLE_KEY`
3. Run `npm install dotenv`

### Edit not saving?

1. Check you're logged in
2. Check browser console for errors
3. Check API endpoint is deployed

## 📚 Full Documentation

See `EXTRACTION_AUDIT_SYSTEM.md` for complete details.

## 🎯 Summary

**You now have:**
1. ✅ Dashboard - View extractions on the fly
2. ✅ Edit button - Fix errors in seconds
3. ✅ AI audit - Batch check quality

**Start using it:**
1. Add to nav (2 min)
2. Run audit (5 min)
3. Fix errors (10 min)

**Total time: 17 minutes to full audit system!** 🚀
