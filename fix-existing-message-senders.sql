-- Fix existing messages that have wrong sender type
-- This updates messages that are clearly from AI Steve but marked as staff

-- First, let's see what we're dealing with
SELECT 
  id,
  sender,
  LEFT(text, 100) as message_preview,
  created_at
FROM messages
WHERE 
  sender = 'staff'
  AND (
    text ILIKE '%many thanks, AI Steve%'
    OR text ILIKE '%best regards, AI Steve%'
    OR text ILIKE '%regards, AI Steve%'
    OR text ILIKE '%thanks, AI Steve%'
    OR text ILIKE '%cheers, AI Steve%'
    OR text ILIKE '%AI Steve from New Forest%'
  )
ORDER BY created_at DESC
LIMIT 20;

-- Now fix them - Update messages with AI Steve signature to sender = 'ai'
UPDATE messages
SET sender = 'ai'
WHERE 
  sender = 'staff'
  AND (
    text ILIKE '%many thanks, AI Steve%'
    OR text ILIKE '%best regards, AI Steve%'
    OR text ILIKE '%regards, AI Steve%'
    OR text ILIKE '%thanks, AI Steve%'
    OR text ILIKE '%cheers, AI Steve%'
    OR text ILIKE '%AI Steve from New Forest%'
  );

-- Check how many were updated
SELECT 
  'Fixed ' || COUNT(*) || ' messages from staff to ai' as result
FROM messages
WHERE 
  sender = 'ai'
  AND (
    text ILIKE '%many thanks, AI Steve%'
    OR text ILIKE '%best regards, AI Steve%'
    OR text ILIKE '%regards, AI Steve%'
    OR text ILIKE '%thanks, AI Steve%'
    OR text ILIKE '%cheers, AI Steve%'
    OR text ILIKE '%AI Steve from New Forest%'
  );

-- Verify the fix
SELECT 
  sender,
  COUNT(*) as count
FROM messages
GROUP BY sender
ORDER BY sender;