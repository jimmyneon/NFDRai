# ✅ Business Hours Table Verified

## Current Data:
```
Business Name: New Forest Device Repairs
Timezone: Europe/London
Hours:
- Monday-Friday: 9am-6pm
- Saturday: 10am-4pm
- Sunday: Closed
```

---

## To Edit Business Hours:

### 1. Make sure you're logged in as admin

Run this in Supabase SQL Editor to check:
```sql
SELECT id, email, role FROM users;
```

If you don't have an admin user, create one:
```sql
-- First, sign up via the app at /login
-- Then run this to make yourself admin:
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

### 2. Go to Business Hours page
- Navigate to: https://nfd-rai.vercel.app/dashboard/business-hours
- Fill in the form
- Click "Save Business Hours"

### 3. If you get errors:

**Check browser console (F12):**
- Look for 403 (Forbidden) - means you're not admin
- Look for 401 (Unauthorized) - means you're not logged in
- Look for 500 (Server error) - check Vercel logs

**Test the API directly:**
```bash
# Get current hours
curl https://nfd-rai.vercel.app/api/business-hours

# Update hours (need to be logged in)
curl -X POST https://nfd-rai.vercel.app/api/business-hours \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "business_name": "NFD Repairs",
    "timezone": "Europe/London",
    "monday_open": "09:00",
    "monday_close": "18:00"
  }'
```

---

## To Update Business Name for Missed Calls:

Just update the `business_name` field in the Business Hours page!

**Current:** "New Forest Device Repairs"  
**Will appear in missed calls as:** "This is New Forest Device Repairs. Sorry I missed your call!"

**To change to "NFD Repairs":**
1. Go to Business Hours page
2. Change "Business Name" field to "NFD Repairs"
3. Save
4. Missed calls will now say: "This is NFD Repairs. Sorry I missed your call!"

---

## Quick Update via SQL:

If you want to update it directly in Supabase:

```sql
UPDATE business_info
SET business_name = 'NFD Repairs'
WHERE id = '61f89dd9-851e-4e89-9948-9a4c7125e41e';
```

Then test missed call:
```bash
curl -X POST "https://nfd-rai.vercel.app/api/messages/missed-call" \
  -H "Content-Type: application/json" \
  -d '{"from": "07410381247", "channel": "sms"}'
```

Should receive SMS with "NFD Repairs" in the signature!

---

## Verify It's Working:

After updating, check the response:
```bash
curl https://nfd-rai.vercel.app/api/business-hours
```

Should return your updated business name.

---

**Status:** ✅ Table exists and is ready  
**Next Step:** Update business_name to your preferred name
