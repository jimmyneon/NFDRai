-- Fix customer names that are common words (false positives from name extraction)

BEGIN;

-- Show customers with invalid names
SELECT 
  id,
  name,
  phone,
  created_at
FROM customers
WHERE name IN (
  'Bad', 'Just', 'Changing', 'Learning', 'Doing', 'Getting', 'Having', 'Being',
  'Going', 'Coming', 'Looking', 'Trying', 'Making', 'Taking', 'Giving',
  'Telling', 'Asking', 'Calling', 'Texting', 'Messaging', 'Sending',
  'About', 'After', 'Before', 'During', 'Between', 'Through', 'Into',
  'From', 'With', 'Without', 'Under', 'Over', 'Above', 'Below',
  'The', 'A', 'An', 'And', 'But', 'For', 'Not', 'Yes', 'Sure', 'Okay', 'Ok',
  'Thanks', 'Thank', 'Please', 'Sorry', 'Hello', 'Hi', 'Hey',
  'Good', 'Great', 'Fine', 'Well', 'Very', 'Much', 'More',
  'Only', 'Also', 'Even', 'Still', 'Back', 'Here', 'There',
  'This', 'That', 'These', 'Those', 'What', 'When', 'Where', 'Which',
  'Who', 'Why', 'How', 'Can', 'Could', 'Would', 'Should', 'Will',
  'Phone', 'Screen', 'Battery', 'Repair', 'Fix', 'Broken', 'Cracked', 'Lol'
)
ORDER BY created_at DESC;

-- Clear invalid names (set to NULL)
UPDATE customers
SET name = NULL
WHERE name IN (
  'Bad', 'Just', 'Changing', 'Learning', 'Doing', 'Getting', 'Having', 'Being',
  'Going', 'Coming', 'Looking', 'Trying', 'Making', 'Taking', 'Giving',
  'Telling', 'Asking', 'Calling', 'Texting', 'Messaging', 'Sending',
  'About', 'After', 'Before', 'During', 'Between', 'Through', 'Into',
  'From', 'With', 'Without', 'Under', 'Over', 'Above', 'Below',
  'The', 'A', 'An', 'And', 'But', 'For', 'Not', 'Yes', 'Sure', 'Okay', 'Ok',
  'Thanks', 'Thank', 'Please', 'Sorry', 'Hello', 'Hi', 'Hey',
  'Good', 'Great', 'Fine', 'Well', 'Very', 'Much', 'More',
  'Only', 'Also', 'Even', 'Still', 'Back', 'Here', 'There',
  'This', 'That', 'These', 'Those', 'What', 'When', 'Where', 'Which',
  'Who', 'Why', 'How', 'Can', 'Could', 'Would', 'Should', 'Will',
  'Phone', 'Screen', 'Battery', 'Repair', 'Fix', 'Broken', 'Cracked', 'Lol'
);

-- Show summary
SELECT 
  CASE 
    WHEN name IS NULL THEN 'No Name'
    ELSE 'Has Name'
  END as name_status,
  COUNT(*) as customer_count
FROM customers
GROUP BY name_status;

COMMIT;
