-- IMMEDIATE DELETE for test phone +447910381247
-- This version has DELETE statements UNCOMMENTED and ready to run

-- Delete in correct order (respecting foreign keys)
DELETE FROM messages
WHERE conversation_id IN (
  SELECT c.id 
  FROM conversations c
  JOIN customers cu ON c.customer_id = cu.id
  WHERE cu.phone IN ('+447910381247', '447910381247', '07910381247')
);

-- Skip conversation_states - table doesn't exist
-- DELETE FROM conversation_states

DELETE FROM conversations
WHERE customer_id IN (
  SELECT id FROM customers
  WHERE phone IN ('+447910381247', '447910381247', '07910381247')
);

DELETE FROM customers
WHERE phone IN ('+447910381247', '447910381247', '07910381247');

-- Verify deletion
SELECT 
  'Deletion complete' as status, 
  COUNT(*) as remaining_records
FROM customers
WHERE phone IN ('+447910381247', '447910381247', '07910381247');
