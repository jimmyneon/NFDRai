# Send Endpoint 404 - Explanation & Fix

## What's Happening

The `/api/messages/send` endpoint **IS working correctly** - the 404 is actually the **expected behavior** in your current situation.

### Why You're Getting 404

The endpoint returns 404 when:
1. MacroDroid sends `conversationId=lookup-by-phone` and `customerPhone=+447410381247`
2. The system looks for a customer with that phone number
3. **No customer exists** OR **no conversation exists** for that phone
4. Returns 404: "Conversation not found"

### This Means

You're trying to track a sent SMS for a phone number that:
- Has never messaged your system before, OR
- Has no active conversation in the database

## The Real Question

**When are you sending these SMS messages?**

### Scenario A: Replying to Customer Messages
If you're replying to a customer who messaged you:
- The customer should already exist in the database
- A conversation should already exist
- The 404 suggests something is wrong with phone number formatting

### Scenario B: Sending Manual SMS
If you're sending SMS manually (not in response to a customer):
- No customer/conversation exists yet
- 404 is correct behavior
- You need to create the customer/conversation first

## Debugging Steps

### Step 1: Check Phone Number Format

MacroDroid might be sending the phone in a different format than what's stored:

**MacroDroid sends**: `+447410381247` (with +44)
**Database has**: `07410381247` (without +44)

Or vice versa!

### Step 2: Check Your Database

Run this in Supabase SQL Editor:

```sql
-- Check if customer exists
SELECT * FROM customers 
WHERE phone LIKE '%7410381247%';

-- Check all phone formats in database
SELECT DISTINCT phone FROM customers
ORDER BY phone;
```

### Step 3: Wait for Deployment & Check Logs

I've added detailed logging. After Vercel deploys (~2 minutes), try sending again and check the logs:

```
[Send Message] Looking up conversation for phone: +447410381247
[Send Message] Customer not found: +447410381247 <error message>
```

This will tell us exactly why it's not finding the customer.

## Solutions

### Solution 1: Fix Phone Number Format in MacroDroid

If database has `07410381247` but MacroDroid sends `+447410381247`:

**MacroDroid Variable:**
Change from: `{phone_number}`
To: Remove the +44 prefix or format consistently

### Solution 2: Normalize Phone Numbers in Code

I can add code to try multiple phone formats:
- `+447410381247`
- `447410381247`
- `07410381247`

### Solution 3: Create Customer/Conversation for Manual SMS

If you're sending manual SMS outside the system, you need to:
1. Create the customer first
2. Create a conversation
3. Then track the sent SMS

## Test After Deployment

Once Vercel deploys the new logging (check dashboard), try sending an SMS again and look for these log messages:

```
[Send Message] Parsed form data
[Send Message] Looking up conversation for phone: +447410381247
[Send Message] Customer not found: +447410381247 PGRST116
```

Or:

```
[Send Message] Found customer: <uuid>
[Send Message] Conversation not found for customer: <uuid> PGRST116
```

This will tell us exactly what's missing.

## Quick Check

Run this to see what phone numbers are in your database:

```sql
-- See all customers and their phone formats
SELECT 
  id,
  name,
  phone,
  created_at
FROM customers
ORDER BY created_at DESC
LIMIT 10;
```

Compare the phone format with what MacroDroid is sending.

## Expected Behavior

### When It Should Work (200 OK)
- Customer exists in database
- Conversation exists for that customer
- Phone number format matches exactly
- Returns: `{"success": true, "message": {...}}`

### When It Should Return 404
- Customer doesn't exist
- No conversation for that customer
- Phone number format doesn't match
- Returns: `{"error": "Conversation not found"}`

## Next Steps

1. **Wait 2 minutes** for Vercel to deploy the logging
2. **Try sending an SMS** via MacroDroid
3. **Check Vercel logs** for the detailed messages
4. **Check your database** for phone number formats
5. **Report back** what the logs show

Then we can fix the root cause (likely phone number format mismatch).

## Summary

- ✅ Endpoint is working correctly
- ❌ Can't find customer/conversation for that phone
- 🔍 Need to check phone number format
- 📝 Added detailed logging to diagnose
- ⏳ Wait for deployment, then test again
