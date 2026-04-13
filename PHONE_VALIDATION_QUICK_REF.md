# Phone Validation - Quick Reference

## ✅ ALLOWED (UK Mobiles Only)
- `07123456789`
- `+447123456789`
- `00447123456789`
- `07 1234 56789` (with spaces)

## ❌ BLOCKED

### Landlines
- `01202123456` (Bournemouth)
- `02012345678` (London)
- `+441202123456`
- `00441202123456`

### 0800/Freephone
- `08001234567`
- `08081234567`
- `+448001234567`

### International
- `+1234567890` (US)
- `+33123456789` (France)
- `+353123456789` (Ireland)

## Where It Works
1. Missed call SMS ✅
2. Quote sending SMS ✅
3. Incoming messages ✅

## Test It
```bash
node test-phone-validation.js
```

## What You'll See in Logs

**Blocked:**
```
[Missed Call - International Block] ❌ UK landline - SMS blocked
```

**Allowed:**
```
[Missed Call - UK Number] ✅ Verified UK mobile - SMS allowed
```
