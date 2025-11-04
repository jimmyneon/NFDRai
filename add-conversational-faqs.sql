-- Add More Conversational FAQs
-- Run this in Supabase SQL Editor

-- Update existing FAQs to be more conversational
UPDATE faqs SET 
  answer = 'Absolutely! We fix all major brands - Samsung, iPhone, Google Pixel, Huawei, OnePlus, you name it. Samsung screen replacements are one of our most common repairs. Same 90-day warranty on all brands!'
WHERE question LIKE '%Samsung%' OR question LIKE '%brands%';

-- Add new conversational FAQs
INSERT INTO faqs (question, answer) VALUES
('Can you fix my phone while I wait?', 
'For most screen replacements, yes! If we have the part in stock, we can usually do it in 30-60 minutes. Battery replacements are even quicker - often done in 15-20 minutes. Just give us a call first to make sure we have your part ready and we''re not too busy.'),

('What if my phone is really old?', 
'We can still help! We keep parts for older models and can often source rare parts if needed. Even if it''s not economical to repair, we''ll be honest with you and help you decide the best option. Sometimes older phones are actually easier to fix!'),

('Do I need an appointment?', 
'Nope! Walk-ins are totally welcome. But if you call ahead, we can make sure we have your part ready and give you a more accurate time estimate. Also helps if we''re having a busy day - we can let you know the best time to pop in.'),

('What should I bring with me?', 
'Just your device and any cables/chargers you have. If you know your passcode, that helps us test it properly after repair. We''ll give you a receipt and estimated completion time. Oh, and backup your data before coming in if possible!'),

('Can you fix laptops too?', 
'Yes! We do laptop repairs - screen replacements, keyboard repairs, battery replacements, charging port fixes, and more. Turnaround is usually 2-3 days depending on parts availability. Bring it in for a free assessment!'),

('What if you can''t fix it?', 
'If we can''t fix it, you don''t pay. Simple as that. We offer free diagnostics and we''ll always be upfront about whether a repair makes sense. Sometimes we''ll honestly recommend upgrading instead if the repair cost is too high compared to the device value.'),

('Do you buy broken phones?', 
'Sometimes! Depends on the model and condition. Bring it in and we''ll make you a fair offer. We refurbish what we can and recycle the rest responsibly. Even if we can''t buy it, we can recycle it properly for you.'),

('How much does a screen repair cost?', 
'Depends on your model! Check our pricing page or just ask - we have prices for most common models. iPhone screens typically £70-150, Samsung £80-200 depending on model. We''ll always quote you the exact price before starting any work.'),

('Is it worth repairing or should I buy new?', 
'Great question! Generally if the repair is less than half the cost of a new device, it''s worth fixing. We''ll be honest with you - if your phone is ancient and the repair is expensive, we''ll tell you it might not be worth it. We''d rather give honest advice than take your money for a repair that doesn''t make sense!'),

('Do you use genuine parts?', 
'We use high-quality aftermarket parts that meet or exceed OEM standards. Genuine Apple/Samsung parts aren''t available to independent repair shops, but our parts come with the same 90-day warranty and work just as well. We''ll always tell you what we''re using.'),

('Can you fix water damage?', 
'We can try! Success depends on how quickly you bring it in and how bad the damage is. First step is always a free diagnostic to see what''s damaged. Sometimes it''s a simple fix, sometimes it''s not economical. We''ll be honest about the chances and costs before proceeding.'),

('How long is the warranty?', 
'90 days on all parts and labor! If anything goes wrong with our repair within 90 days, bring it back and we''ll sort it out. Warranty doesn''t cover new damage or issues unrelated to our repair, but we''ll always check it for free.'),

('Can I drop it off and pick it up later?', 
'Absolutely! Most people do. Drop it off, we''ll give you a ticket and estimated completion time. We''ll text you when it''s ready. For quick repairs like batteries, you can wait if you prefer. Whatever works best for you!'),

('Do you fix tablets?', 
'Yes! iPads, Samsung tablets, Amazon Fire tablets - we fix them all. Screen replacements, charging issues, battery replacements. Tablet repairs usually take 1-3 days depending on parts. Bring it in for a free quote!'),

('What payment methods do you accept?', 
'We take everything - cash, all major credit/debit cards, and contactless payments including Apple Pay and Google Pay. Payment is due when you pick up your repaired device.'),

('My phone is stuck in a boot loop, can you fix it?', 
'Often yes! Boot loops can be software or hardware issues. Bring it in for a free diagnostic. Sometimes it''s a simple software fix, sometimes it''s a component issue. We''ll figure out what''s wrong and let you know if it''s fixable and how much.'),

('Do you offer student discounts?', 
'We don''t have a formal student discount, but we always try to keep our prices fair and competitive. Our prices are already lower than most high street shops. If you''re a student and money''s tight, let us know - we might be able to work something out!'),

('Can you transfer my data to a new phone?', 
'We can help with basic transfers, but we recommend using iCloud (iPhone) or Google backup (Android) - it''s easier and safer. We can show you how if you''re not sure. For complex transfers, there are specialized services, but most people can do it themselves with our guidance.'),

('My phone keeps overheating, what''s wrong?', 
'Could be several things - battery issue, software problem, or component failure. Bring it in for a free diagnostic. We''ll run tests to figure out the cause. Sometimes it''s just an app running wild, sometimes it''s hardware. We''ll get to the bottom of it!'),

('Can you unlock my phone?', 
'If you mean carrier unlock, that''s something you need to do through your carrier (O2, EE, Vodafone, etc). If you mean you forgot your passcode, we can''t bypass that for security reasons - you''ll need to contact Apple/Samsung. We can help with hardware issues though!');

-- Verify inserts
SELECT question, LEFT(answer, 100) as answer_preview FROM faqs ORDER BY created_at DESC LIMIT 10;
