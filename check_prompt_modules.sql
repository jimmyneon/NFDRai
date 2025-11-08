-- Check all active prompt modules and their priorities
SELECT 
  module_name, 
  priority, 
  active,
  category,
  LENGTH(prompt_text) as text_length,
  updated_at,
  version
FROM prompts 
WHERE active = true
ORDER BY priority DESC;

-- Check specifically for migration 033 modules
SELECT 
  module_name,
  priority,
  active,
  CASE 
    WHEN module_name = 'duplicate_prevention' THEN '✅ From Migration 033'
    WHEN module_name = 'ask_whats_wrong_first' THEN '✅ From Migration 033'
    WHEN module_name = 'proactive_troubleshooting' THEN '✅ From Migration 033'
    WHEN module_name = 'battery_genuine_option' THEN '✅ From Migration 034'
    WHEN module_name = 'genuine_vs_aftermarket_explanation' THEN '✅ From Migration 035'
    ELSE 'Existing module'
  END as migration_source,
  updated_at
FROM prompts 
WHERE module_name IN (
  'core_identity',
  'duplicate_prevention',
  'ask_whats_wrong_first',
  'proactive_troubleshooting',
  'context_awareness',
  'battery_genuine_option',
  'genuine_vs_aftermarket_explanation',
  'pricing_flow'
)
ORDER BY priority DESC;

-- Check if "ask what's wrong first" text is in core_identity
SELECT 
  module_name,
  CASE 
    WHEN prompt_text LIKE '%What''s Wrong? (ALWAYS FIRST%' THEN '✅ Has "ask what''s wrong first" text'
    ELSE '❌ Missing "ask what''s wrong first" text'
  END as has_whats_wrong_text,
  CASE 
    WHEN prompt_text LIKE '%GENUINE APPLE BATTERIES (~£90%' THEN '✅ Has genuine battery £90 text'
    ELSE '❌ Missing genuine battery £90 text'
  END as has_genuine_battery_text,
  updated_at
FROM prompts 
WHERE module_name = 'core_identity';

-- Check if pricing_flow has ||| separator
SELECT 
  module_name,
  CASE 
    WHEN prompt_text LIKE '%|||By the way%' THEN '✅ Has ||| separator'
    ELSE '❌ Missing ||| separator (might have ---)'
  END as has_separator,
  updated_at
FROM prompts 
WHERE module_name = 'pricing_flow';
