# Quick Fix: Phone Number Format Mismatch

## The Problem

The 404 errors on `/api/messages/send` are likely caused by **phone number format mismatch**:

- MacroDroid sends: `+447410381247` (international format with +)
- Database might have: `07410381247` (UK format without +)
- Or vice versa!

## Quick Solution: Normalize Phone Numbers

I can update the endpoint to try multiple phone formats automatically.

### Option 1: Try Multiple Formats (Recommended)

Update the lookup to try:
1. Exact match: `+447410381247`
2. Without +: `447410381247`
3. UK format: `07410381247`

### Option 2: Check Database First

Run this SQL to see what format your database uses:

```sql
SELECT phone FROM customers WHERE phone LIKE '%7410381247%';
```

Then adjust MacroDroid to match that format.

## Implementing Option 1

Let me add phone normalization to the send endpoint:

```typescript
// Try multiple phone number formats
const phoneVariants = [
  customerPhone,                                    // +447410381247
  customerPhone.replace(/^\+/, ''),                // 447410381247
  customerPhone.replace(/^\+44/, '0'),             // 07410381247
  customerPhone.replace(/^44/, '0'),               // 07410381247
  customerPhone.replace(/^0/, '+44'),              // +447410381247
]

// Try each variant
for (const phoneVariant of phoneVariants) {
  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('phone', phoneVariant)
    .single()
    
  if (customer) {
    // Found it!
    break
  }
}
```

## Should I Implement This?

Say "yes" and I'll add phone number normalization to handle all common formats automatically.

Or check your database first to see what format you're using.
