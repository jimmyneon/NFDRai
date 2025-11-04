-- Update FAQs to include buying, selling, and accessories information

-- Add new FAQs about buying and selling devices
INSERT INTO faqs (question, answer, category, priority, active) VALUES
('Do you buy phones and devices?', 'Yes! We buy iPhones, iPads, MacBooks, laptops, and other devices at great rates. Unlike online shops, we don''t mess you about - pop in for an appraisal or send me the details and I''ll get back to you ASAP with a fair offer.', 'services', 90, true),

('What devices do you buy?', 'We buy iPhones, iPads, MacBooks, laptops, and other tech devices. We offer good rates and quick payment - no messing about like the online buyback services. Pop in for an instant appraisal or message me the details!', 'services', 85, true),

('Do you sell phones and devices?', 'Yes! We sell refurbished iPhones, iPads, MacBooks, and laptops. All devices are tested and come with warranty. We also have a great selection in stock - pop in or ask what we have available!', 'services', 85, true),

('Do you have phone cases and accessories?', 'Yes! We stock phone cases, screen protectors, chargers, cables, and all the normal accessories you need. Pop in to see what we have in stock!', 'products', 80, true),

('What accessories do you stock?', 'We have all the essentials: phone cases, screen protectors, charging cables, power adapters, headphones, and more. If you need something specific, just ask!', 'products', 75, true),

('How does your buyback work?', 'Simple! Pop into the shop for an instant appraisal, or send me the device details (model, condition, any issues) and I''ll get back to you ASAP with a fair offer. We pay good rates and don''t mess you about like the online shops.', 'services', 80, true),

('What''s your buyback process?', 'Easy - either pop in with your device for an instant quote, or message me with: device model, condition, and any issues. I''ll give you a fair price straight away. No waiting around or lowball offers like the online services!', 'services', 75, true),

('Do you do trade-ins?', 'Yes! We buy your old device and you can put the money towards a repair or purchasing a refurbished device from us. Pop in or send me the details for a quick quote.', 'services', 70, true)

ON CONFLICT (question) DO UPDATE SET
  answer = EXCLUDED.answer,
  priority = EXCLUDED.priority,
  updated_at = NOW();

-- Update existing repair FAQ to mention full services
UPDATE faqs 
SET answer = 'We repair all types of devices: iPhones, iPads, Samsung phones, tablets, MacBooks, and laptops. We also buy and sell devices, and stock accessories. Most repairs done same day with 90-day warranty!'
WHERE question LIKE '%what do you repair%' OR question LIKE '%what devices%';

-- Add general services FAQ
INSERT INTO faqs (question, answer, category, priority, active) VALUES
('What services do you offer?', 'We offer repairs for all devices (iPhones, iPads, MacBooks, laptops, tablets), we buy devices at good rates, we sell refurbished devices, and we stock all accessories (cases, chargers, cables, etc). For more info, search "New Forest Device Repairs" online!', 'general', 95, true)
ON CONFLICT (question) DO UPDATE SET
  answer = EXCLUDED.answer,
  priority = EXCLUDED.priority,
  updated_at = NOW();
