-- Verify if messages were actually deleted for +447910381247

-- 1. Check if customer still exists
SELECT 
  'Customer Check' as check_type,
  id,
  phone,
  name
FROM customers
WHERE phone IN ('+447910381247', '447910381247', '07910381247');

-- 2. Check if conversations still exist
SELECT 
  'Conversation Check' as check_type,
  c.id,
  c.customer_id,
  cu.phone
FROM conversations c
JOIN customers cu ON c.customer_id = cu.id
WHERE cu.phone IN ('+447910381247', '447910381247', '07910381247');

-- 3. Check if messages still exist
SELECT 
  'Message Check' as check_type,
  COUNT(*) as message_count,
  MAX(m.created_at) as latest_message
FROM messages m
JOIN conversations c ON m.conversation_id = c.id
JOIN customers cu ON c.customer_id = cu.id
WHERE cu.phone IN ('+447910381247', '447910381247', '07910381247');

-- 4. If messages still exist, show them
SELECT 
  m.id,
  m.created_at,
  m.sender,
  LEFT(m.text, 100) as message_preview,
  cu.phone
FROM messages m
JOIN conversations c ON m.conversation_id = c.id
JOIN customers cu ON c.customer_id = cu.id
WHERE cu.phone IN ('+447910381247', '447910381247', '07910381247')
ORDER BY m.created_at DESC
LIMIT 20;
