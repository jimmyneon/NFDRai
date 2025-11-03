# 🔒 Price Checking Control - Safety First!

**Migration**: `009_add_price_checking_toggle.sql`  
**Purpose**: Turn off AI price quotes until you're confident they're correct  
**Default**: DISABLED (safe mode)

---

## 🎯 The Problem

### Without This Feature:

```
You: *Just added prices, not sure if they're right*
Customer: "How much for iPhone 14 screen?"
AI: "£149.99" ← WRONG PRICE!
Customer: "Great, I'll come in!"
You: 😱 "Actually it's £249.99..."
Customer: 😠 Not happy!
```

### With This Feature:

```
You: *Just added prices, not sure if they're right*
You: *Turn OFF price checking*
Customer: "How much for iPhone 14 screen?"
AI: "Let me check our current pricing and get back to you shortly."
You: ✅ Verify prices are correct
You: *Turn ON price checking*
Customer: "How much for iPhone 14 screen?"
AI: "£249.99" ← CORRECT!
Customer: 😊 Happy!
```

---

## 🔘 What Was Added

### New Column: `price_checking_enabled`

**In `ai_settings` table:**
- Type: BOOLEAN
- Default: `false` (safe mode)
- Controls: Whether AI quotes prices

**When DISABLED:**
- ❌ AI won't quote specific prices
- ✅ AI will say "Let me check and get back to you"
- ✅ You can verify prices safely
- ✅ No wrong quotes to customers

**When ENABLED:**
- ✅ AI quotes prices from database
- ✅ Normal operation
- ✅ Fast customer service

---

## 🛠️ How to Use

### Check Current Status:

```sql
SELECT * FROM price_checking_status;
```

**Returns:**
```
price_checking_enabled | status_message                                    | last_changed
-----------------------|---------------------------------------------------|-------------
false                  | AI will NOT quote prices - prices being verified | 2025-11-03
```

---

### Enable Price Checking:

```sql
SELECT toggle_price_checking(true);
```

**AI will now:**
- ✅ Quote prices from database
- ✅ Use `active_prices` view
- ✅ Give specific costs

---

### Disable Price Checking:

```sql
SELECT toggle_price_checking(false);
```

**AI will now:**
- ❌ NOT quote specific prices
- ✅ Say "Let me check our current pricing"
- ✅ Suggest customer contact you directly

---

## 🤖 AI Behavior

### When DISABLED (price_checking_enabled = false):

**Customer asks:** "How much for iPhone 14 screen?"

**AI responds:**
```
"Thanks for your interest! I want to make sure I give you the most 
accurate pricing. Let me pass this to our team who will confirm the 
current cost for an iPhone 14 screen replacement and get back to you 
right away."
```

**Or:**
```
"I'd be happy to help! For the most up-to-date pricing on iPhone 14 
screen replacements, please give us a call or one of our team will 
respond shortly with the exact cost."
```

---

### When ENABLED (price_checking_enabled = true):

**Customer asks:** "How much for iPhone 14 screen?"

**AI responds:**
```
"iPhone 14 screen replacement is £249.99, with same-day turnaround. 
Would you like to book an appointment?"
```

---

## 📋 Workflow

### Initial Setup:

1. **Deploy app** ✅
2. **Price checking is DISABLED** (default)
3. **Add your prices** to database
4. **Verify prices are correct:**
   ```sql
   SELECT * FROM active_prices ORDER BY device;
   ```
5. **Double-check costs, turnaround times**
6. **Enable price checking:**
   ```sql
   SELECT toggle_price_checking(true);
   ```
7. **AI now quotes prices!** 🎉

---

### When Updating Prices:

**Option 1: Keep Enabled (Recommended)**
- Update prices in database
- They take effect immediately
- AI quotes new prices

**Option 2: Disable During Update (Safer)**
1. Disable price checking:
   ```sql
   SELECT toggle_price_checking(false);
   ```
2. Update all prices
3. Verify they're correct
4. Re-enable:
   ```sql
   SELECT toggle_price_checking(true);
   ```

---

### Seasonal Price Changes:

```sql
-- Before changing prices
SELECT toggle_price_checking(false);

-- Update prices
UPDATE prices SET cost = cost * 0.9 WHERE device_type = 'phone';  -- 10% off

-- Verify
SELECT * FROM active_prices WHERE device_type = 'phone';

-- Enable when ready
SELECT toggle_price_checking(true);
```

---

## 🎨 Dashboard Integration

### Settings Page:

Add a prominent toggle:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Price Checking</CardTitle>
    <CardDescription>
      Control whether AI quotes prices to customers
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium">
          {priceCheckingEnabled ? 'Enabled' : 'Disabled'}
        </p>
        <p className="text-sm text-muted-foreground">
          {priceCheckingEnabled 
            ? 'AI will quote prices from database'
            : 'AI will NOT quote specific prices'}
        </p>
      </div>
      <Switch
        checked={priceCheckingEnabled}
        onCheckedChange={async (checked) => {
          const { data } = await supabase
            .from('ai_settings')
            .update({ price_checking_enabled: checked })
            .eq('active', true)
          
          setPriceCheckingEnabled(checked)
        }}
      />
    </div>
  </CardContent>
</Card>
```

---

### Pricing Page:

Add a warning banner when disabled:

```tsx
{!priceCheckingEnabled && (
  <Alert variant="warning">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Price Checking Disabled</AlertTitle>
    <AlertDescription>
      AI is NOT quoting prices to customers. Enable in Settings when ready.
    </AlertDescription>
  </Alert>
)}
```

---

## 🔍 Monitoring

### Check Status Anytime:

```sql
SELECT * FROM price_checking_status;
```

### See When It Was Last Changed:

```sql
SELECT 
  price_checking_enabled,
  updated_at,
  EXTRACT(EPOCH FROM (NOW() - updated_at))/3600 as hours_since_change
FROM ai_settings
WHERE active = true;
```

### Audit Trail (if needed):

```sql
-- Add audit table (optional)
CREATE TABLE price_checking_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enabled BOOLEAN NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason TEXT
);

-- Log changes
CREATE OR REPLACE FUNCTION log_price_checking_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.price_checking_enabled != NEW.price_checking_enabled THEN
    INSERT INTO price_checking_audit (enabled, changed_at)
    VALUES (NEW.price_checking_enabled, NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER price_checking_audit_trigger
AFTER UPDATE ON ai_settings
FOR EACH ROW
EXECUTE FUNCTION log_price_checking_change();
```

---

## 🎯 Use Cases

### 1. Initial Setup
```sql
-- Start with disabled (default)
-- Add all prices
-- Verify everything
-- Enable when confident
SELECT toggle_price_checking(true);
```

### 2. Major Price Update
```sql
-- Disable during update
SELECT toggle_price_checking(false);

-- Update prices
UPDATE prices SET cost = new_cost WHERE ...;

-- Verify
SELECT * FROM active_prices;

-- Re-enable
SELECT toggle_price_checking(true);
```

### 3. Importing New Prices
```sql
-- Disable before import
SELECT toggle_price_checking(false);

-- Import CSV
COPY prices FROM 'prices.csv' ...;

-- Check for errors
SELECT * FROM prices WHERE cost IS NULL OR cost < 0;

-- Enable when clean
SELECT toggle_price_checking(true);
```

### 4. Testing New Pricing Strategy
```sql
-- Disable while testing
SELECT toggle_price_checking(false);

-- Test different prices
-- Get feedback from staff
-- Adjust as needed

-- Enable when finalized
SELECT toggle_price_checking(true);
```

---

## 🚨 Safety Features

### Default: DISABLED
- Migration sets `price_checking_enabled = false`
- Safe by default
- You must explicitly enable it

### Manual Override
- Staff can always quote prices manually
- This only affects AI automation
- You're always in control

### Visual Indicators
- Dashboard shows status clearly
- Warning when disabled
- Easy to toggle

---

## 📊 AI System Prompt Update

### Add to System Prompt:

```
IMPORTANT: Price Checking Status

Check the ai_settings.price_checking_enabled flag before quoting prices.

IF price_checking_enabled = false:
- DO NOT quote specific prices
- Say: "Let me check our current pricing and get back to you shortly"
- OR: "For the most accurate pricing, one of our team will respond shortly"
- Mark conversation for manual response

IF price_checking_enabled = true:
- Quote prices from active_prices view
- Include cost and turnaround time
- Be confident and specific
```

---

## 🔄 API Integration

### Check Status in API:

```typescript
// In /app/api/messages/incoming/route.ts

const { data: settings } = await supabase
  .from('ai_settings')
  .select('price_checking_enabled')
  .eq('active', true)
  .single()

const systemPrompt = `
  ${baseSystemPrompt}
  
  ${settings.price_checking_enabled 
    ? 'You can quote prices from the database.'
    : 'DO NOT quote specific prices. Say you will check and get back to them.'}
`
```

---

## ✅ Verification

### After Running Migration:

```sql
-- 1. Check column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'ai_settings'
AND column_name = 'price_checking_enabled';

-- 2. Check default is false (safe)
SELECT price_checking_enabled FROM ai_settings WHERE active = true;
-- Should return: false

-- 3. Test toggle function
SELECT toggle_price_checking(true);
-- Should return: true

SELECT * FROM price_checking_status;
-- Should show: enabled

-- 4. Toggle back to safe mode
SELECT toggle_price_checking(false);
-- Should return: false
```

---

## 🎉 Benefits

### For You:
- ✅ Safe price updates
- ✅ No wrong quotes
- ✅ Time to verify
- ✅ Confidence before going live

### For AI:
- ✅ Clear instructions
- ✅ Knows when to quote
- ✅ Knows when to defer

### For Customers:
- ✅ Accurate prices only
- ✅ No confusion
- ✅ Professional service
- ✅ Trust maintained

---

## 🚀 Quick Reference

### Enable Price Checking:
```sql
SELECT toggle_price_checking(true);
```

### Disable Price Checking:
```sql
SELECT toggle_price_checking(false);
```

### Check Status:
```sql
SELECT * FROM price_checking_status;
```

### Manual Update:
```sql
UPDATE ai_settings 
SET price_checking_enabled = true 
WHERE active = true;
```

---

## 📝 Recommended Workflow

### Day 1: Setup
- ✅ Deploy app
- ✅ Price checking DISABLED (default)
- ✅ Add prices to database

### Day 2-3: Verification
- ✅ Review all prices
- ✅ Test with sample queries
- ✅ Get team approval

### Day 4: Go Live
- ✅ Enable price checking
- ✅ Monitor first conversations
- ✅ Adjust if needed

### Ongoing:
- ✅ Update prices anytime
- ✅ Disable during major changes
- ✅ Re-enable when verified

---

## 🎯 Summary

**What Changed:**
- ✅ Added `price_checking_enabled` to `ai_settings`
- ✅ Default: `false` (safe mode)
- ✅ Toggle function for easy control
- ✅ Status view for monitoring

**How to Use:**
- Start with disabled (default)
- Add and verify prices
- Enable when confident
- Disable during major updates

**Result:**
- No wrong price quotes
- Safe price management
- Professional service
- Peace of mind

---

**Ready to deploy!** Run migration 009 and control price checking! 🔒

---

**Last Updated**: November 3, 2025  
**Migration**: 009_add_price_checking_toggle.sql  
**Status**: Production Ready  
**Default**: DISABLED (safe mode)
