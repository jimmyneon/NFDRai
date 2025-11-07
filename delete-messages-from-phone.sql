-- Delete all messages from phone number +447410381247
-- This will delete messages, conversations, and the customer record

-- First, let's see what we're deleting (optional - comment out if you want to skip)
SELECT 
  c.id as customer_id,
  c.name,
  c.phone,
  conv.id as conversation_id,
  COUNT(m.id) as message_count
FROM customers c
LEFT JOIN conversations conv ON conv.customer_id = c.id
LEFT JOIN messages m ON m.conversation_id = conv.id
WHERE c.phone = '+447410381247'
GROUP BY c.id, c.name, c.phone, conv.id;

-- Delete all messages from this customer
-- Due to CASCADE constraints, this will automatically delete:
-- 1. All messages in the conversations
-- 2. All conversations
-- 3. The customer record
DELETE FROM customers
WHERE phone = '+447410381247';

-- Verify deletion (should return 0 rows)
SELECT COUNT(*) as remaining_records
FROM customers
WHERE phone = '+447410381247';
