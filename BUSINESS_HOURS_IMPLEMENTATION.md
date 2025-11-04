# Business Hours Real-Time Implementation

## Problem Solved
The AI was incorrectly responding "yes we are open" when asked outside business hours. This implementation adds real-time business hours checking with automatic fallback to displaying the schedule and Google Maps link.

## What Was Added

### 1. Database Migration (`supabase/migrations/010_business_info.sql`)
- Created `business_info` table to store:
  - Business name
  - Google Maps URL for live hours
  - Timezone (defaults to Europe/London)
  - Opening/closing times for each day of the week
  - Special hours notes (holidays, etc.)
- Pre-populated with default hours:
  - Monday-Friday: 9:00 AM - 6:00 PM
  - Saturday: 10:00 AM - 4:00 PM
  - Sunday: Closed

### 2. Business Hours Utility (`lib/business-hours.ts`)
Functions that provide real-time hours checking:

- **`getBusinessHoursStatus()`**: Checks if business is currently open
  - Gets current time in business timezone
  - Compares against stored hours
  - Returns comprehensive status object

- **`formatBusinessHoursMessage()`**: Formats hours info for AI
  - Shows OPEN/CLOSED status with emoji indicators
  - Displays current time and today's hours
  - Shows next opening time if closed
  - Includes full weekly schedule
  - Adds Google Maps link for live updates

### 3. AI Response Updates
Updated both main response generator and sandbox test endpoint:
- **`lib/ai/response-generator.ts`**: Main AI responses
- **`app/api/sandbox/test/route.ts`**: Testing endpoint

Both now include:
- Real-time business hours status in every AI prompt
- Clear instructions to NEVER guess about hours
- Requirement to use exact current status
- Instruction to always provide Google Maps link

### 4. Database Types (`lib/supabase/database.types.ts`)
Added TypeScript types for the new `business_info` table.

## How It Works

### Real-Time Checking Flow
1. Customer asks "are you open?"
2. System fetches business_info from database
3. Gets current time in business timezone (Europe/London)
4. Compares current time against today's hours
5. Determines OPEN or CLOSED status
6. Formats comprehensive message with:
   - Current status (🟢 OPEN or 🔴 CLOSED)
   - Current time
   - Today's hours
   - Next opening time (if closed)
   - Full weekly schedule
   - Google Maps link for live updates

### AI Prompt Enhancement
The AI now receives this context in every response:

```
CURRENT BUSINESS HOURS STATUS (REAL-TIME):
**Current Status:** 🔴 CLOSED
**Current Time:** 22:30
**Today's Hours:** 9:00 AM - 6:00 PM
**Next Open:** Tomorrow at 9:00 AM

**Full Schedule:**
Monday: 9:00 AM - 6:00 PM
Tuesday: 9:00 AM - 6:00 PM
...

**Live Hours:** Check our Google Maps listing for real-time updates

CRITICAL HOURS RULES:
1. When asked about opening hours, ALWAYS use the REAL-TIME status above
2. The "Current Status" shows if we are OPEN or CLOSED RIGHT NOW
3. NEVER guess or assume - use the exact information provided above
4. If asked "are you open", check the "Current Status" field
5. Always provide the Google Maps link for live updates
```

## Deployment Steps

### 1. Run the Migration
```bash
# If using Supabase CLI
supabase db push

# Or run the migration manually in Supabase Dashboard:
# SQL Editor → New Query → Paste contents of 010_business_info.sql → Run
```

### 2. Update Business Hours (Optional)
If your hours differ from the defaults, update them in Supabase:

```sql
UPDATE business_info SET
  monday_open = '09:00',
  monday_close = '18:00',
  -- ... update other days as needed
  google_maps_url = 'https://www.google.com/maps/search/?api=1&query=YOUR_BUSINESS_NAME'
WHERE id = (SELECT id FROM business_info LIMIT 1);
```

### 3. Add Your Google Maps Link
Get your Google Maps link:
1. Search for your business on Google Maps
2. Click "Share"
3. Copy the link
4. Update in database:

```sql
UPDATE business_info SET
  google_maps_url = 'YOUR_GOOGLE_MAPS_LINK'
WHERE id = (SELECT id FROM business_info LIMIT 1);
```

### 4. Deploy Code Changes
```bash
# Commit and push changes
git add .
git commit -m "Add real-time business hours checking"
git push

# If using Vercel, it will auto-deploy
# Or manually deploy via your hosting platform
```

## Testing

### Test in Sandbox
1. Go to Dashboard → Settings → AI Sandbox
2. Try these queries:
   - "Are you open?"
   - "What are your hours?"
   - "When do you open?"
   - "Are you open on Sunday?"

### Expected Responses

**During Business Hours:**
> "Yes, we're currently open! Our hours today are 9:00 AM - 6:00 PM. Feel free to stop by or give us a call!"

**Outside Business Hours:**
> "We're currently closed. We'll be open tomorrow at 9:00 AM. Our regular hours are Monday-Friday 9:00 AM - 6:00 PM, Saturday 10:00 AM - 4:00 PM. You can check our Google Maps listing for live updates: [link]"

**On Sunday:**
> "We're closed on Sundays. We'll be open Monday at 9:00 AM. You can view our full schedule and any holiday hours on our Google Maps listing: [link]"

## Benefits

1. **Accurate Information**: AI always knows the current open/closed status
2. **Timezone Aware**: Correctly handles time zones
3. **Fallback to Google**: Provides Google Maps link for special hours/holidays
4. **Easy Updates**: Change hours in database without code changes
5. **Next Opening Time**: Tells customers when you'll be open next
6. **Full Schedule**: Shows complete weekly hours

## Maintenance

### Updating Regular Hours
Update directly in Supabase dashboard or via SQL:

```sql
UPDATE business_info SET
  friday_open = '10:00',
  friday_close = '17:00'
WHERE id = (SELECT id FROM business_info LIMIT 1);
```

### Adding Special Hours Notes
For holidays or temporary changes:

```sql
UPDATE business_info SET
  special_hours_note = 'Closed Dec 25-26 for Christmas. Open Dec 27 with regular hours.'
WHERE id = (SELECT id FROM business_info LIMIT 1);
```

### Changing Timezone
If you move or expand locations:

```sql
UPDATE business_info SET
  timezone = 'America/New_York'
WHERE id = (SELECT id FROM business_info LIMIT 1);
```

## Troubleshooting

### AI Still Says Wrong Hours
1. Check migration ran successfully: `SELECT * FROM business_info;`
2. Verify hours are correct in database
3. Check timezone is correct
4. Test in sandbox to see what AI receives

### Google Maps Link Not Showing
1. Verify `google_maps_url` is set in database
2. Check URL format is correct
3. Test the link manually in browser

### Wrong Timezone
1. Update timezone in database
2. Use standard timezone names (e.g., 'Europe/London', 'America/New_York')
3. Redeploy if needed

## Notes

- The system checks hours in real-time on every AI response
- No caching - always accurate to the minute
- Handles day transitions correctly (e.g., "tomorrow" vs "Monday")
- Works with any timezone
- Google Maps link is optional but recommended for holiday hours
