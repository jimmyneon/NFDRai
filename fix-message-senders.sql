-- Fix messages that have AI Steve signature but are marked as customer
-- These are duplicate tracking messages from MacroDroid

BEGIN;

-- First, let's see what we're fixing
SELECT 
  COUNT(*) as incorrect_messages,
  'Messages with AI Steve signature marked as customer' as description
FROM messages
WHERE sender = 'customer'
  AND text ILIKE '%ai steve%';

-- Update messages with AI Steve signature to be from AI
UPDATE messages
SET sender = 'ai'
WHERE sender = 'customer'
  AND text ILIKE '%ai steve%';

-- Check for messages with John signature marked as customer
SELECT 
  COUNT(*) as incorrect_messages,
  'Messages with John signature marked as customer' as description
FROM messages
WHERE sender = 'customer'
  AND (text ILIKE '%many thanks, john%' OR text ILIKE '%many thenks, john%');

-- Update messages with John signature to be from staff
UPDATE messages
SET sender = 'staff'
WHERE sender = 'customer'
  AND (text ILIKE '%many thanks, john%' OR text ILIKE '%many thenks, john%');

-- Show summary of changes
SELECT 
  sender,
  COUNT(*) as message_count
FROM messages
GROUP BY sender
ORDER BY sender;

COMMIT;
