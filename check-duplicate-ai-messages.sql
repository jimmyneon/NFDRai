-- Check for duplicate AI messages that are marked as customer
SELECT 
  m.id,
  m.sender,
  m.created_at,
  LEFT(m.text, 80) as text_preview,
  c.name as customer_name,
  c.phone as customer_phone,
  CASE 
    WHEN m.text ILIKE '%ai steve%' THEN 'HAS AI STEVE'
    WHEN m.text ILIKE '%many thanks, john%' THEN 'HAS JOHN'
    ELSE 'NO SIGNATURE'
  END as signature_check
FROM messages m
JOIN conversations conv ON m.conversation_id = conv.id
JOIN customers c ON conv.customer_id = c.id
WHERE m.text ILIKE '%ai steve%'
  AND m.sender = 'customer'
ORDER BY m.created_at DESC
LIMIT 20;
