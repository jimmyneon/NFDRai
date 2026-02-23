-- Check if Sarah's quote exists and its current status
-- Run this in Supabase SQL Editor

-- 1. Find Sarah's quote
SELECT 
  id,
  name,
  phone,
  device_make,
  device_model,
  issue,
  quoted_price,
  status,
  created_at,
  updated_at,
  quoted_at,
  quote_sent_at
FROM quote_requests
WHERE phone LIKE '%Sarah%' 
   OR name LIKE '%Sarah%'
   OR device_model LIKE '%6a%'
ORDER BY created_at DESC
LIMIT 5;

-- 2. Check for Pixel 6a quotes
SELECT 
  id,
  name,
  phone,
  device_make,
  device_model,
  issue,
  quoted_price,
  status,
  created_at,
  quote_sent_at
FROM quote_requests
WHERE device_model LIKE '%6%'
  AND device_make LIKE '%Android%'
ORDER BY created_at DESC
LIMIT 5;

-- 3. Check all recent quotes (last 24 hours)
SELECT 
  id,
  name,
  phone,
  device_make,
  device_model,
  issue,
  quoted_price,
  status,
  created_at,
  quote_sent_at
FROM quote_requests
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
