# Customer Name Extraction Feature

## Overview
Automatically extracts and stores customer names when they introduce themselves in messages, similar to how we extract names from John's confirmation messages.

## How It Works

### 1. **Name Extraction Patterns**
The system detects when customers introduce themselves using common patterns:

- "Hi, I'm John"
- "My name is Sarah"
- "This is Mike"
- "It's Emma here"
- "Hi, John here"
- "I am David"

### 2. **Confidence Levels**
- **High confidence**: "I'm {name}", "My name is {name}", "I am {name}", "This is {name}"
- **Medium confidence**: "It's {name}", "{name} here"
- **Low confidence**: No match found

### 3. **Name Validation**
Before storing, the system validates that the extracted text is likely a real name:

✅ **Valid names:**
- At least 2 characters
- Only contains letters
- Not a common word (like "phone", "screen", "thanks", etc.)

❌ **Invalid names:**
- Common words: "the", "and", "thanks", "hello", "phone", "screen", etc.
- Too short: single letters
- Contains numbers or special characters

## Implementation

### Files Created
- **`/app/lib/customer-name-extractor.ts`** - Name extraction logic with pattern matching

### Files Modified
- **`/app/api/messages/incoming/route.ts`** - Added name extraction on incoming messages
- **`/update-system-prompt-final.sql`** - Updated AI Steve to use customer names

## Behavior

### When Customer Introduces Themselves:
```
Customer: "Hi, I'm Sarah. Can you fix my phone?"
```

**System actions:**
1. Extracts "Sarah" from message
2. Validates it's a real name (not a common word)
3. Updates customer record in database
4. AI Steve immediately uses the name in response

**AI Response:**
```
"Hi Sarah! Yes, I can help with that. What make and model is your phone?"
```

### Name Update Logic:
- If customer has **no name**: Update with any valid extracted name
- If customer **already has a name**: Only update if new extraction is **high confidence**
- This prevents overwriting correct names with false positives

## Database Updates

### Customers Table
When a name is extracted, the `customers.name` field is updated:

```sql
UPDATE customers 
SET name = 'Sarah' 
WHERE id = '{customer_id}';
```

## AI Steve Instructions

Added to system prompt:
- **ALWAYS use the customer's name if you know it** - makes it personal and friendly
- **If customer introduces themselves**, use their name in your response
- Makes conversations more personal and engaging

## Examples

### Example 1: High Confidence
```
Customer: "My name is Tom, my screen is cracked"
AI Steve: "Hi Tom! We can definitely fix that. What make and model is your phone so I can give you an exact quote?"
```

### Example 2: Medium Confidence
```
Customer: "It's Emma here, need a battery replacement"
AI Steve: "Hi Emma! We can help with that. What's your phone model?"
```

### Example 3: No Name Detected
```
Customer: "Can you fix my phone?"
AI Steve: "Yes! What make and model is it?"
```

## Benefits

✅ **More personal service** - Using customer names makes interactions warmer
✅ **Automatic extraction** - No manual data entry required
✅ **Immediate use** - AI Steve can use the name in the same conversation
✅ **Validation** - Prevents storing common words as names
✅ **Confidence-based** - Only overwrites existing names with high-confidence matches

## Similar to Existing Feature

This works similarly to the existing confirmation message extractor:
- **Confirmation extractor**: Extracts names from John's messages ("Hi there Sarah, your iPhone is ready...")
- **Customer name extractor**: Extracts names from customer messages ("Hi, I'm Sarah...")

Both features automatically populate the `customers.name` field for better personalization.

## Testing

Test with these messages:
- "Hi, I'm John" → Should extract "John"
- "My name is Sarah" → Should extract "Sarah"
- "This is Mike" → Should extract "Mike"
- "It's Emma here" → Should extract "Emma"
- "Hi, thanks for your help" → Should NOT extract "thanks"
- "My phone is broken" → Should NOT extract "phone"

## Future Enhancements

Potential improvements:
- Extract full names (first + last)
- Handle nicknames
- Extract email addresses
- Extract device models from messages
- Machine learning for better pattern recognition
