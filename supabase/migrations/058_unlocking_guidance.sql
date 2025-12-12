-- Add unlocking/network unlock guidance to services module

UPDATE prompts
SET prompt_text = prompt_text || E'\n\nUNLOCKING / NETWORK UNLOCKS (CARRIER LOCKS):\n- We CAN often help with network unlocking/carrier locks, but it depends on the device/network and we usually need to see the handset in person.\n- Ask what type of lock it is: network/carrier unlock vs passcode vs iCloud/Google account lock.\n- If it''s a network/carrier unlock: ask make/model and which network it''s locked to (e.g. Vodafone), and whether they have proof of ownership.\n- If the network says "it''s nothing to do with us": suggest popping it in so John can check the IMEI/status and advise the best route.\n- We CANNOT unlock iCloud locked devices and we do NOT do jailbreaking.\n- For cost/time: it varies by device/network; John will confirm once he''s seen it.\n'
WHERE module_name = 'services_comprehensive'
  AND prompt_text NOT ILIKE '%UNLOCKING / NETWORK UNLOCKS%';
