-- Delete messages for the CORRECT phone number: +447410381247
-- (Previous attempts used +447910381247 which was wrong)

-- Delete messages
DELETE FROM messages
WHERE conversation_id IN (
  SELECT c.id 
  FROM conversations c
  JOIN customers cu ON c.customer_id = cu.id
  WHERE cu.phone IN ('+447410381247', '447410381247', '07410381247')
);

-- Delete conversations
DELETE FROM conversations
WHERE customer_id IN (
  SELECT id FROM customers
  WHERE phone IN ('+447410381247', '447410381247', '07410381247')
);

-- Delete customer
DELETE FROM customers
WHERE phone IN ('+447410381247', '447410381247', '07410381247');

-- Verify deletion
SELECT 
  'Deletion complete' as status, 
  COUNT(*) as remaining_records
FROM customers
WHERE phone IN ('+447410381247', '447410381247', '07410381247');
