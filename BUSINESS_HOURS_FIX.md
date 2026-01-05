# Business Hours & Custom Closures Fix

**Date**: January 5, 2026  
**Issue**: Missed call auto-reply didn't check special hours and said business was open when closed

---

## Problems Fixed

### 1. ❌ **Missed Call Message Ignored Special Hours**

**Root Cause**: `getBusinessHoursStatus()` only checked regular weekly schedule, didn't override `isOpen` when on holiday/special closure.

**Example**:

- Special hours: "Closed December 25-26 for Christmas"
- Regular hours: Monday-Friday 10am-5pm
- Missed call on Dec 25 at 2pm → Said "We're OPEN until 5pm" ❌

**Fix**: Added holiday detection to `getBusinessHoursStatus()` that overrides `isOpen` status:

```typescript
// CRITICAL: Check if on holiday/closed TODAY and override isOpen status
const holidayStatus = detectHolidayMode(info.special_hours_note);
if (holidayStatus.isOnHoliday) {
  isOpen = false; // Override - business is CLOSED
}
```

---

### 2. ❌ **No Support for Illness/Sick Days**

**Problem**: Only had "special hours note" field - couldn't add temporary closures for illness, emergencies, etc.

**Fix**: Created `custom_closures` table with:

- Date ranges (start_date, end_date)
- Reason (Illness, Sick day, Emergency, Personal leave)
- Custom message (optional)
- Active flag (can disable without deleting)

**Database Schema**:

```sql
CREATE TABLE public.custom_closures (
  id UUID PRIMARY KEY,
  reason TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  custom_message TEXT,
  active BOOLEAN DEFAULT true,
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);
```

---

## How It Works Now

### Priority Order (Highest to Lowest):

1. **Custom Closures** (illness, sick days) - Checked FIRST
2. **Holiday Mode** (special hours note with dates)
3. **Regular Weekly Schedule**

### Missed Call Message Logic:

```
1. Check custom_closures table for active closure TODAY
   ↓ YES → Show custom closure message
   ↓ NO
2. Check special_hours_note for holiday TODAY
   ↓ YES → Show holiday message
   ↓ NO
3. Check regular weekly schedule
   ↓ OPEN → "We're currently OPEN until [time]"
   ↓ CLOSED → "We're currently CLOSED. We'll be open [next time]"
```

---

## Example Messages

### Custom Closure (Illness):

```
Sorry we missed your call!

Temporarily closed due to illness.

I can provide repair estimates and answer questions right now.
John will confirm all quotes and bookings when he returns.

We expect to reopen Tuesday, 7 January.

Many thanks, AI Steve
New Forest Device Repairs
```

### Custom Closure (Custom Message):

```
Sorry we missed your call!

Closed today due to emergency - apologies for any inconvenience.

I can provide repair estimates and answer questions right now.
John will confirm all quotes and bookings when he returns.

We expect to reopen Monday, 6 January.

Many thanks, AI Steve
New Forest Device Repairs
```

### Holiday Mode:

```
Sorry we missed your call!

🎄 Merry Christmas!

Closed December 25-26 for Christmas, back on December 27th.

I can provide repair estimates and answer questions right now.
John will confirm all quotes and bookings when he returns.

We'll be back December 27th.

Many thanks, AI Steve
New Forest Device Repairs
```

### Regular Hours (Open):

```
Sorry we missed your call!

We're currently OPEN until 5:00 PM.

TEXT ME for instant help with:
• Repair quotes (no need to call!)
• Opening hours
• Booking appointments
• Any device questions

I'll reply straight away - much faster than waiting on hold!

Many thanks, AI Steve
New Forest Device Repairs
```

---

## Files Modified

1. **`/lib/business-hours.ts`**

   - Added `detectHolidayMode` import
   - Added custom closures check
   - Added holiday mode check
   - Both override `isOpen` status if active
   - Added `customClosure` field to `BusinessHoursStatus` interface

2. **`/app/api/messages/missed-call/route.ts`**

   - Pass `customClosure` to message generator
   - Handle custom closure message (highest priority)
   - Show return date if closure ends in future

3. **`/supabase/migrations/040_custom_closures.sql`** (NEW)
   - Created `custom_closures` table
   - RLS policies for public read, admin write
   - Date range validation constraint
   - Index for efficient date queries

---

## How to Use Custom Closures

### Via Database (for now):

```sql
-- Add illness closure for today
INSERT INTO custom_closures (reason, start_date, end_date, custom_message)
VALUES (
  'Illness',
  '2026-01-05',
  '2026-01-06',
  'Closed today due to illness - apologies for any inconvenience.'
);

-- Add sick day (single day)
INSERT INTO custom_closures (reason, start_date, end_date)
VALUES ('Sick day', '2026-01-07', '2026-01-07');

-- Add emergency closure (multi-day)
INSERT INTO custom_closures (reason, start_date, end_date, custom_message)
VALUES (
  'Emergency',
  '2026-01-10',
  '2026-01-12',
  'Temporarily closed due to emergency. We expect to reopen soon.'
);

-- Disable a closure without deleting
UPDATE custom_closures
SET active = false
WHERE id = '[closure-id]';
```

### Future: Business Hours Page UI

Will add UI to manage custom closures:

- Add closure button
- Date range picker
- Reason dropdown (Illness, Sick day, Emergency, Personal leave, Other)
- Optional custom message field
- List of active/upcoming closures
- Enable/disable toggle

---

## Testing

### Test Case 1: Custom Closure Active

```
Date: January 5, 2026
Custom Closure: "Illness" (Jan 5-6)
Regular Hours: Monday 10am-5pm
Time: 2:00 PM (normally open)

Expected: isOpen = false
Message: "Temporarily closed due to illness. We expect to reopen Tuesday, 7 January."
```

### Test Case 2: Holiday Mode Active

```
Date: December 25, 2025
Special Hours: "Closed December 25-26 for Christmas"
Regular Hours: Monday 10am-5pm
Time: 2:00 PM (normally open)

Expected: isOpen = false
Message: "🎄 Merry Christmas! Closed December 25-26 for Christmas..."
```

### Test Case 3: Regular Hours (Open)

```
Date: January 6, 2026
No Custom Closures
No Holiday Mode
Regular Hours: Monday 10am-5pm
Time: 2:00 PM

Expected: isOpen = true
Message: "We're currently OPEN until 5:00 PM. TEXT ME for instant help..."
```

---

## Deployment

```bash
# 1. Run migration
cd supabase
npx supabase migration up

# 2. Commit and push
git add .
git commit -m "Fix missed call hours check and add custom closures for illness/sick days"
git push

# 3. Vercel auto-deploys
```

---

## Logs to Monitor

```
[Business Hours] Custom closure override - setting isOpen to false: {
  reason: 'Illness',
  startDate: '2026-01-05',
  endDate: '2026-01-06',
  customMessage: 'Closed today due to illness...'
}

[Business Hours] Holiday override - setting isOpen to false: {
  holidayMessage: 'Closed December 25-26 for Christmas',
  returnDate: 'December 27th'
}

[Missed Call] Missed-call template sent successfully
```

---

## Summary

✅ **Fixed**: Missed call messages now correctly check special hours and custom closures  
✅ **Added**: Custom closures table for illness, sick days, emergencies  
✅ **Priority**: Custom closures → Holiday mode → Regular hours  
✅ **Messages**: Context-aware based on closure type

No more saying "We're OPEN" when actually closed! 🎉
