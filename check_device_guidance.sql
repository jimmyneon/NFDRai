-- Check if device detection guidance exists in prompts
SELECT 
  module_name,
  prompt_text
FROM prompts
WHERE 
  module_name = 'core_identity'
  OR prompt_text ILIKE '%check the logo%'
  OR prompt_text ILIKE '%Settings > General > About%'
ORDER BY module_name;
