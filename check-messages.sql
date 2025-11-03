-- Check recent messages in the test conversation
SELECT 
  m.id,
  m.sender,
  LEFT(m.text, 50) as message_preview,
  m.created_at,
  c.status as conversation_status
FROM messages m
JOIN conversations c ON m.conversation_id = c.id
JOIN customers cu ON c.customer_id = cu.id
WHERE cu.phone = '+447700900000'
ORDER BY m.created_at DESC
LIMIT 10;

-- Check if there are any staff messages that would trigger manual mode
SELECT 
  sender,
  COUNT(*) as count
FROM messages m
JOIN conversations c ON m.conversation_id = c.id
JOIN customers cu ON c.customer_id = cu.id
WHERE cu.phone = '+447700900000'
GROUP BY sender;

-- Delete test messages to start fresh
-- Uncomment to clean up:
-- DELETE FROM messages 
-- WHERE conversation_id IN (
--   SELECT c.id FROM conversations c
--   JOIN customers cu ON c.customer_id = cu.id
--   WHERE cu.phone = '+447700900000'
-- );
