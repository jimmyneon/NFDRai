-- Check conversation history for +447410381247
-- This will show us what messages the AI should be seeing

-- First, find the customer and conversation
SELECT 
  c.id as customer_id,
  c.phone,
  c.name,
  conv.id as conversation_id,
  conv.status,
  conv.channel
FROM customers c
LEFT JOIN conversations conv ON conv.customer_id = c.id
WHERE c.phone IN ('+447410381247', '447410381247', '07410381247')
ORDER BY conv.updated_at DESC
LIMIT 1;

-- Then get the last 20 messages from that conversation
-- Replace the conversation_id below with the one from the query above
SELECT 
  created_at,
  sender,
  text,
  delivered
FROM messages
WHERE conversation_id = 'PASTE_CONVERSATION_ID_HERE'
ORDER BY created_at ASC
LIMIT 20;

-- Or use this combined query:
WITH customer_conv AS (
  SELECT 
    c.id as customer_id,
    conv.id as conversation_id
  FROM customers c
  LEFT JOIN conversations conv ON conv.customer_id = c.id
  WHERE c.phone IN ('+447410381247', '447410381247', '07410381247')
  ORDER BY conv.updated_at DESC
  LIMIT 1
)
SELECT 
  m.created_at,
  m.sender,
  m.text,
  m.delivered
FROM messages m
JOIN customer_conv cc ON m.conversation_id = cc.conversation_id
ORDER BY m.created_at ASC
LIMIT 20;
