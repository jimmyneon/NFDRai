-- Test if Amanda's quote exists and can be accepted
-- Run this to verify the quote is in the database

SELECT 
  id,
  name,
  phone,
  device_make,
  device_model,
  issue,
  quoted_price,
  status,
  expires_at,
  created_at
FROM quote_requests
WHERE name LIKE '%Amanda%' 
  OR phone LIKE '%Amanda%'
ORDER BY created_at DESC
LIMIT 5;

-- If you see a quote with status='quoted', copy its ID and run:
-- UPDATE quote_requests SET status = 'accepted' WHERE id = '[paste-id-here]';
-- If that works, the database is fine and the issue is in the API code
