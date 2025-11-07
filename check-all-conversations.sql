-- Check ALL conversations for this phone number
SELECT 
  c.id as customer_id,
  c.phone,
  c.name,
  conv.id as conversation_id,
  conv.status,
  conv.channel,
  conv.created_at,
  conv.updated_at,
  (SELECT COUNT(*) FROM messages WHERE conversation_id = conv.id) as message_count,
  (SELECT MAX(created_at) FROM messages WHERE conversation_id = conv.id) as last_message_at
FROM customers c
LEFT JOIN conversations conv ON conv.customer_id = c.id
WHERE c.phone IN ('+447410381247', '447410381247', '07410381247')
ORDER BY conv.updated_at DESC;
