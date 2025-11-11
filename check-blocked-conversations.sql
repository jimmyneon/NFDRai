-- Check for blocked conversations
SELECT 
  c.id,
  c.status,
  c.channel,
  c.created_at,
  cu.name as customer_name,
  cu.phone as customer_phone,
  COUNT(m.id) as message_count
FROM conversations c
LEFT JOIN customers cu ON c.customer_id = cu.id
LEFT JOIN messages m ON m.conversation_id = c.id
GROUP BY c.id, c.status, c.channel, c.created_at, cu.name, cu.phone
ORDER BY c.created_at DESC
LIMIT 20;

-- Count by status
SELECT status, COUNT(*) as count
FROM conversations
GROUP BY status;

-- Check if any conversations are incorrectly blocked
SELECT 
  c.id,
  c.status,
  cu.phone,
  MAX(m.created_at) as last_message_time
FROM conversations c
LEFT JOIN customers cu ON c.customer_id = cu.id
LEFT JOIN messages m ON m.conversation_id = c.id
WHERE c.status = 'blocked'
GROUP BY c.id, c.status, cu.phone;
