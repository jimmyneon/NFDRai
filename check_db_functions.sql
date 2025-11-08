-- Check if required database functions exist

-- 1. Check for get_prompt_modules function
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%prompt%';

-- 2. If function doesn't exist, we need to create it
-- This function should return relevant prompt modules based on intent
