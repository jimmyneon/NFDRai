-- Find which module still has pricing
SELECT 
  module_name,
  priority,
  active,
  version,
  -- Show snippet of where pricing appears
  SUBSTRING(prompt_text FROM POSITION('£' IN prompt_text) - 50 FOR 150) as pricing_context
FROM prompts
WHERE active = true
  AND prompt_text ~ '£\d+'
ORDER BY module_name;
