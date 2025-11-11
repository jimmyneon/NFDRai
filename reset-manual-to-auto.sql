-- Reset all manual conversations to auto mode
-- This fixes the issue where AI stops responding because conversations are stuck in manual mode

-- First, check which conversations are in manual mode
SELECT 
  c.id,
  c.status,
  c.created_at,
  cu.phone,
  cu.name,
  (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count,
  (SELECT MAX(created_at) FROM messages WHERE conversation_id = c.id AND sender = 'staff') as last_staff_message,
  (SELECT MAX(created_at) FROM messages WHERE conversation_id = c.id AND sender = 'customer') as last_customer_message
FROM conversations c
LEFT JOIN customers cu ON c.customer_id = cu.id
WHERE c.status = 'manual'
ORDER BY c.updated_at DESC;

-- Reset all manual conversations to auto mode
-- UNCOMMENT THE LINE BELOW TO APPLY THE FIX:
-- UPDATE conversations SET status = 'auto', updated_at = NOW() WHERE status = 'manual';

-- Verify the fix
-- SELECT status, COUNT(*) FROM conversations GROUP BY status;
