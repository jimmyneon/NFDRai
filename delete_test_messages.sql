-- Delete all messages and conversation data for test phone number
-- Phone: +447910381247
-- Use this to clean up test data before running new tests

-- IMPORTANT: This will permanently delete all data for this phone number!

-- 1. First, let's see what we're about to delete
SELECT 
  'Preview - Messages to delete' as info,
  COUNT(*) as message_count,
  MIN(m.created_at) as oldest_message,
  MAX(m.created_at) as newest_message
FROM messages m
JOIN conversations c ON m.conversation_id = c.id
JOIN customers cu ON c.customer_id = cu.id
WHERE cu.phone IN ('+447910381247', '447910381247', '07910381247');

-- 2. Show the actual messages
SELECT 
  m.created_at,
  m.sender,
  LEFT(m.text, 100) as message_preview
FROM messages m
JOIN conversations c ON m.conversation_id = c.id
JOIN customers cu ON c.customer_id = cu.id
WHERE cu.phone IN ('+447910381247', '447910381247', '07910381247')
ORDER BY m.created_at DESC;

-- 3. Delete messages (uncomment to execute)
-- DELETE FROM messages
-- WHERE conversation_id IN (
--   SELECT c.id 
--   FROM conversations c
--   JOIN customers cu ON c.customer_id = cu.id
--   WHERE cu.phone IN ('+447910381247', '447910381247', '07910381247')
-- );

-- 4. Delete conversation state (uncomment to execute)
-- DELETE FROM conversation_states
-- WHERE conversation_id IN (
--   SELECT c.id 
--   FROM conversations c
--   JOIN customers cu ON c.customer_id = cu.id
--   WHERE cu.phone IN ('+447910381247', '447910381247', '07910381247')
-- );

-- 5. Delete conversations (uncomment to execute)
-- DELETE FROM conversations
-- WHERE customer_id IN (
--   SELECT id FROM customers
--   WHERE phone IN ('+447910381247', '447910381247', '07910381247')
-- );

-- 6. Delete customer (uncomment to execute)
-- DELETE FROM customers
-- WHERE phone IN ('+447910381247', '447910381247', '07910381247');

-- 7. Verify deletion (run after uncommenting above)
-- SELECT 
--   'Verification - Should be 0' as info,
--   COUNT(*) as remaining_messages
-- FROM messages m
-- JOIN conversations c ON m.conversation_id = c.id
-- JOIN customers cu ON c.customer_id = cu.id
-- WHERE cu.phone IN ('+447910381247', '447910381247', '07910381247');


-- ============================================
-- QUICK DELETE (ALL AT ONCE)
-- ============================================
-- Uncomment this section to delete everything in one go:

/*
-- Delete in correct order (respecting foreign keys)
DELETE FROM messages
WHERE conversation_id IN (
  SELECT c.id 
  FROM conversations c
  JOIN customers cu ON c.customer_id = cu.id
  WHERE cu.phone IN ('+447910381247', '447910381247', '07910381247')
);

DELETE FROM conversation_states
WHERE conversation_id IN (
  SELECT c.id 
  FROM conversations c
  JOIN customers cu ON c.customer_id = cu.id
  WHERE cu.phone IN ('+447910381247', '447910381247', '07910381247')
);

DELETE FROM conversations
WHERE customer_id IN (
  SELECT id FROM customers
  WHERE phone IN ('+447910381247', '447910381247', '07910381247')
);

DELETE FROM customers
WHERE phone IN ('+447910381247', '447910381247', '07910381247');

-- Verify
SELECT 'Deletion complete - should show 0' as status, COUNT(*) as remaining
FROM customers
WHERE phone IN ('+447910381247', '447910381247', '07910381247');
*/
