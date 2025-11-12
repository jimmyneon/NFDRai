# Extraction Audit System

## Overview

Comprehensive system to audit, review, and manually correct staff message extractions.

## 🎯 Your Request

> "any other improvements?? we need a way to audit this on the fly or use ai to group check it ?? or maybe add a manul entry edit button in the appp too"

**Solution:** 3-part system combining real-time dashboard, AI batch auditing, and manual editing.

## 🔧 Components

### 1. 📊 Audit Dashboard (`/dashboard/extractions`)

**What it does:**
- View all staff message extractions
- See original message + extracted data side-by-side
- Filter by confidence level or missing data
- Quick stats overview

**Features:**
- **Stats Cards:**
  - Total extractions
  - High confidence (≥80%)
  - Needs review (<50%)
  - Names extracted

- **Filters:**
  - All extractions
  - Low confidence only
  - No name extracted

- **Display:**
  - Original staff message
  - All extracted fields
  - Confidence score
  - Extraction method (AI, regex, manual)
  - Edit button for each extraction

**Access:** Dashboard → Extractions (add to nav menu)

### 2. ✏️ Manual Edit Feature

**What it does:**
- Click "Edit" button on any extraction
- Modal opens with all fields editable
- Save changes to database
- Marks extraction as "manual" method

**Editable Fields:**
- Customer Name
- Device Type
- Device Model
- Device Issue
- Repair Status (dropdown)
- Message Type (dropdown)
- Price Quoted
- Price Final

**How it works:**
1. Click "Edit" on any extraction
2. Modal shows original message + current values
3. Edit any field
4. Click "Save Changes"
5. Updates database
6. Marks as `extraction_method: 'manual'`
7. Page refreshes to show updated data

**API Endpoint:** `PATCH /api/extractions/[id]`

### 3. 🤖 AI Batch Audit Script

**What it does:**
- Reviews ALL extractions using AI
- Identifies common errors
- Suggests corrections
- Generates audit report

**Common Errors Detected:**
1. **Name Errors:**
   - "Mrs" or "Mr" extracted as name (should be surname)
   - Common words as names ("there", "away")
   - Missing name when present

2. **Device Errors:**
   - Wrong device type/model
   - Missing device info

3. **Status Errors:**
   - Wrong repair status
   - Missing status

4. **Pricing Errors:**
   - Wrong price
   - Missing price
   - Quoted vs final confusion

**How to run:**
```bash
npx ts-node scripts/audit-extractions.ts
```

**Output:**
```
🔍 Starting AI Batch Audit of Staff Message Extractions

📊 Auditing 100 extractions...

[1/100] Auditing extraction abc123...
  ⚠️  ERRORS FOUND:
     - Customer name is a title, not a surname
  💡 SUGGESTIONS:
     - customer_name: "Mrs" → "Smith"
       Reason: Extracted title instead of surname

[2/100] Auditing extraction def456...
  ✅ Looks good

...

📊 AUDIT SUMMARY

Total Audited: 100
With Errors: 12
No Errors: 88

🔍 ERRORS BY FIELD:
  customer_name: 8 errors
  device_type: 3 errors
  repair_status: 1 error

💾 Detailed results saved to: audit-results-2025-11-12T12-54-00.json

✅ Audit complete!
```

**Audit Report (JSON):**
```json
{
  "timestamp": "2025-11-12T12:54:00.000Z",
  "totalAudited": 100,
  "withErrors": 12,
  "results": [
    {
      "extractionId": "abc123...",
      "hasErrors": true,
      "errors": ["Customer name is a title, not a surname"],
      "suggestions": [
        {
          "field": "customer_name",
          "currentValue": "Mrs",
          "suggestedValue": "Smith",
          "reason": "Extracted title instead of surname"
        }
      ],
      "confidence": 0.95
    }
  ]
}
```

## 📋 Workflows

### Workflow 1: Daily Audit

**Morning routine:**
1. Go to `/dashboard/extractions`
2. Click "Low Confidence" filter
3. Review flagged extractions
4. Click "Edit" to fix errors
5. Save changes

**Time:** 5-10 minutes

### Workflow 2: Weekly AI Audit

**Weekly check:**
1. Run: `npx ts-node scripts/audit-extractions.ts`
2. Review audit report
3. Open dashboard
4. Fix flagged errors using edit button
5. Re-run audit to verify fixes

**Time:** 15-20 minutes

### Workflow 3: On-the-Fly Correction

**When you notice an error:**
1. Open dashboard
2. Find the extraction
3. Click "Edit"
4. Fix the error
5. Save

**Time:** 30 seconds

## 🎨 UI Examples

### Dashboard View

```
┌─────────────────────────────────────────────────────────────┐
│ Staff Message Extractions                                   │
│ Audit and manage information extracted from staff messages  │
└─────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Total        │ High Conf.   │ Needs Review │ Names        │
│ 100          │ 85           │ 5            │ 92           │
│ Last 100     │ ≥80%         │ <50%         │ 92%          │
└──────────────┴──────────────┴──────────────┴──────────────┘

[All (100)] [⚠️ Low Confidence (5)] [No Name (8)]

┌─────────────────────────────────────────────────────────────┐
│ Smith                                        [Edit] Button   │
│ 12 Nov 2025, 12:19 • +447410381247                         │
├─────────────────────────────────────────────────────────────┤
│ Original Message:                                           │
│ Hi Mrs Smith, your iPhone 14 screen is ready. £149.99      │
│                                                             │
│ Customer Name    Device          Issue          Status      │
│ Smith            iPhone 14       screen repair  ready       │
│                                                             │
│ Quoted: £149.99                                            │
│                                                             │
│ [High (95%)] [ai_enhanced] [ready_notification]           │
└─────────────────────────────────────────────────────────────┘
```

### Edit Modal

```
┌─────────────────────────────────────────────────────────────┐
│ Edit Extraction                                     [X]     │
│ Manually correct any extraction errors                      │
├─────────────────────────────────────────────────────────────┤
│ Original Message:                                           │
│ Hi Mrs Smith, your iPhone 14 screen is ready. £149.99      │
│                                                             │
│ Customer Name          Device Type                          │
│ [Smith          ]      [iPhone            ]                │
│                                                             │
│ Device Model           Device Issue                         │
│ [14             ]      [screen repair     ]                │
│                                                             │
│ Repair Status          Message Type                         │
│ [Ready          ▼]     [Ready Notification ▼]              │
│                                                             │
│ Price Quoted (£)       Price Final (£)                      │
│ [149.99         ]      [149.99            ]                │
│                                                             │
│                              [Cancel] [Save Changes]        │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Setup

### 1. Add to Navigation

Edit `app/dashboard/layout.tsx` or nav component:

```typescript
{
  name: 'Extractions',
  href: '/dashboard/extractions',
  icon: FileText
}
```

### 2. Run First Audit

```bash
# Install dependencies (if needed)
npm install dotenv

# Run audit
npx ts-node scripts/audit-extractions.ts
```

### 3. Review Results

1. Open audit report JSON file
2. Go to `/dashboard/extractions`
3. Fix flagged errors

## 📊 Benefits

### 1. Quality Control
- Catch errors immediately
- Maintain data accuracy
- Build confidence in system

### 2. Continuous Improvement
- Identify patterns in errors
- Improve extraction logic
- Train better AI prompts

### 3. Easy Corrections
- Fix errors in seconds
- No database knowledge needed
- Visual interface

### 4. Audit Trail
- Track manual edits
- See extraction method
- Review confidence scores

## 🔍 Common Error Patterns

### Pattern 1: Title as Name

**Error:**
```
Message: "Hi Mrs Smith, your phone is ready"
Extracted: customer_name = "Mrs"
```

**Fix:**
```
customer_name = "Smith"
```

**Prevention:** Already fixed with title handling!

### Pattern 2: Missing Device Model

**Error:**
```
Message: "Hi Carol, your iPhone 14 Pro screen is ready"
Extracted: device_type = "iPhone", device_model = null
```

**Fix:**
```
device_model = "14 Pro"
```

**Prevention:** Enhance device extraction regex

### Pattern 3: Wrong Status

**Error:**
```
Message: "Hi Mike, your phone would be £99 to fix"
Extracted: repair_status = "ready"
```

**Fix:**
```
repair_status = "quoted"
```

**Prevention:** Better status detection logic

## 📈 Metrics to Track

### Extraction Accuracy
- % with high confidence (≥80%)
- % with low confidence (<50%)
- % requiring manual correction

### Field Accuracy
- Name extraction rate
- Device extraction rate
- Status extraction rate
- Price extraction rate

### Improvement Over Time
- Errors per week
- Manual corrections per week
- Average confidence score

## 🎯 Next Steps

### Phase 1: Setup (Now)
- ✅ Create dashboard page
- ✅ Create edit functionality
- ✅ Create AI audit script
- ⏳ Add to navigation
- ⏳ Run first audit

### Phase 2: Use (This Week)
- Review dashboard daily
- Fix low-confidence extractions
- Run weekly AI audit
- Track error patterns

### Phase 3: Improve (Ongoing)
- Enhance extraction logic based on errors
- Update AI prompts
- Add more validation rules
- Automate common fixes

## 📝 Files Created

### Dashboard
- `app/dashboard/extractions/page.tsx` - Main dashboard page
- `components/extractions/extractions-list.tsx` - List component with edit

### API
- `app/api/extractions/[id]/route.ts` - Update endpoint

### Scripts
- `scripts/audit-extractions.ts` - AI batch audit script

### Documentation
- `EXTRACTION_AUDIT_SYSTEM.md` - This file

## 💡 Pro Tips

### Tip 1: Filter First
Use filters to focus on problematic extractions:
- Low confidence = likely errors
- No name = missing data

### Tip 2: Batch Edit
Fix similar errors together:
1. Filter by error type
2. Edit all at once
3. Save time

### Tip 3: Learn Patterns
Notice common errors?
- Update extraction logic
- Improve AI prompts
- Add validation rules

### Tip 4: Regular Audits
Schedule weekly AI audits:
- Sunday morning routine
- Review + fix errors
- Track improvement

### Tip 5: Use Audit Reports
Keep audit JSON files:
- Track trends over time
- Identify recurring issues
- Measure improvements

## 🎉 Summary

**You now have:**
1. ✅ **Dashboard** - View all extractions on the fly
2. ✅ **Edit Button** - Manual corrections in seconds
3. ✅ **AI Audit** - Batch check all extractions

**This gives you:**
- Full visibility into extractions
- Easy error correction
- Automated quality checks
- Continuous improvement

**No more guessing if extractions are correct!** 🎯
