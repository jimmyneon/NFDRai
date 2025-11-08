-- Find the test conversation by looking for recent messages or "Unknown Customer"

-- 1. Find all recent conversations (last 24 hours)
SELECT 
  c.id as conversation_id,
  cu.id as customer_id,
  cu.phone,
  cu.name,
  COUNT(m.id) as message_count,
  MAX(m.created_at) as latest_message
FROM conversations c
JOIN customers cu ON c.customer_id = cu.id
LEFT JOIN messages m ON m.conversation_id = c.id
WHERE c.created_at > NOW() - INTERVAL '24 hours'
GROUP BY c.id, cu.id, cu.phone, cu.name
ORDER BY MAX(m.created_at) DESC;

-- 2. Find conversations with "Unknown Customer" or similar
SELECT 
  c.id as conversation_id,
  cu.id as customer_id,
  cu.phone,
  cu.name,
  COUNT(m.id) as message_count
FROM conversations c
JOIN customers cu ON c.customer_id = cu.id
LEFT JOIN messages m ON m.conversation_id = c.id
WHERE cu.name LIKE '%Unknown%' OR cu.name LIKE '%v2%' OR cu.name IS NULL
GROUP BY c.id, cu.id, cu.phone, cu.name
ORDER BY c.created_at DESC
LIMIT 10;

-- 3. Find messages containing test phrases
SELECT 
  m.id,
  m.conversation_id,
  cu.phone,
  cu.name,
  m.sender,
  m.text,
  m.created_at
FROM messages m
JOIN conversations c ON m.conversation_id = c.id
JOIN customers cu ON c.customer_id = cu.id
WHERE m.text LIKE '%broken phone%' 
   OR m.text LIKE '%don''t know the model%'
   OR m.text LIKE '%not woking%'
ORDER BY m.created_at DESC
LIMIT 20;

-- 4. Show ALL customers and their phone formats
SELECT 
  id,
  phone,
  name,
  created_at
FROM customers
ORDER BY created_at DESC
LIMIT 20;
