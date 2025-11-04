-- Add Comprehensive Knowledge Base Documents
-- Run this in Supabase SQL Editor

-- Troubleshooting Guides
INSERT INTO docs (title, content, category, active) VALUES
('Water Damage Protocol', 
'If customer mentions water damage: 
- Advise turning off device immediately
- Don''t try to charge it
- Bring it in ASAP for assessment
- Explain we offer free diagnostics
- Water damage repair success depends on how quickly we see it
- Not always fixable but we''ll be honest about chances
- Rice doesn''t work - professional drying is needed',
'troubleshooting', true),

('Cracked Screen vs Display Issues',
'Screen cracked but touch works = just glass replacement (easier, cheaper)
Touch not working or glitchy = digitizer issue (more serious)
Lines on screen = LCD damage
Black screen but phone works = display cable or LCD issue
Always ask: Can you see anything? Does touch work? Any lines or spots?
Most screen issues can be fixed same day if parts in stock',
'troubleshooting', true),

('Battery Swelling Warning',
'If customer mentions swollen battery:
- URGENT: Stop using device immediately
- Don''t charge it
- Don''t put pressure on it
- Bring it in same day if possible
- Explain it''s a safety issue (can catch fire)
- We can usually replace same day
- Covered by warranty if from recent repair
- Signs: back cover lifting, screen popping out, device feels thick',
'safety', true),

('Charging Port Issues',
'Common charging problems:
- Lint/debris in port (most common - we can clean it free)
- Bent pins in port (repairable)
- Loose connection (port replacement needed)
- Cable issue (try different cable first)
- Software issue (try restart)
Ask: Does it charge at all? Loose connection? Tried different cable?
Port replacement usually 1-2 days, £40-60 depending on model',
'troubleshooting', true),

('Software vs Hardware Issues',
'Software issues (we can help):
- Phone frozen/won''t turn on (try hard reset first)
- Apps crashing
- Slow performance
- Storage full

Hardware issues (we fix):
- Physical damage
- Component failures
- Water damage
- Charging issues

If software issue, we can diagnose free and advise. Sometimes just needs update or reset.',
'troubleshooting', true);

-- Policies & Procedures
INSERT INTO docs (title, content, category, active) VALUES
('Out of Warranty Repairs',
'For devices out of manufacturer warranty:
- We can still fix most issues
- Often cheaper than manufacturer repairs
- Same 90-day warranty on our work
- Free diagnostic to assess damage
- Honest advice if not worth repairing
- We''ll tell you if buying new makes more sense
- No fix, no fee policy',
'policies', true),

('Data Recovery Questions',
'If asked about data recovery:
- We focus on hardware repair, not data recovery
- Strongly recommend backing up to iCloud/Google before repair
- We don''t access customer data (privacy policy)
- If device won''t turn on, data recovery specialists might be needed
- Can recommend local data recovery services if needed
- Always try to preserve data during repair
- Not responsible for data loss (customer should backup)',
'policies', true),

('Warranty Coverage',
'Our 90-day warranty covers:
- Parts we installed
- Labor for the repair
- Any issues related to our work

Warranty does NOT cover:
- New damage after repair
- Water damage to other components
- Normal wear and tear
- Issues unrelated to our repair
- Customer-caused damage

If issue within 90 days, bring it back - we''ll check it free and fix if warranty applies',
'policies', true),

('Walk-ins vs Appointments',
'Walk-ins welcome! No appointment needed for most repairs.
But calling ahead helps because:
- We can confirm we have your part in stock
- Give you accurate time estimate
- Reserve a spot if we''re busy
- Answer quick questions

For complex repairs or rare devices, definitely call first.
Same-day service available for most common repairs if parts in stock.',
'policies', true);

-- Location & Business Info
INSERT INTO docs (title, content, category, active) VALUES
('New Forest Location Info',
'We''re based in the New Forest area of Hampshire. 
Easy to reach from: Lyndhurst, Brockenhurst, Lymington, New Milton, Totton, Southampton, Bournemouth.
Free parking nearby. 
Can arrange collection/delivery for local customers (small fee may apply).
Serving the New Forest community with honest, reliable repairs.
Easy to find - just search us on Google Maps!',
'location', true),

('Our Story & Values',
'Family-run repair shop specializing in phones, tablets, and laptops.
We believe in right to repair and keeping devices out of landfills.
All technicians are certified and experienced.
We use quality parts and stand behind our work with 90-day warranty.
Supporting local community with honest, affordable repairs.
No fix, no fee - if we can''t fix it, you don''t pay.
We''ll always be upfront about costs and whether repair makes sense.',
'about', true),

('What We Fix',
'Devices we repair:
- iPhones (all models)
- Samsung phones (Galaxy series)
- Google Pixel
- OnePlus, Huawei, Xiaomi
- iPads and tablets
- Laptops (screen, keyboard, battery)
- Some smartwatches

Common repairs:
- Screen replacements (most popular)
- Battery replacements
- Charging port repairs
- Camera repairs
- Water damage assessment
- Back glass replacement
- Button repairs

If it''s not listed, ask! We can often source parts for older or rare devices.',
'services', true);

-- Common Scenarios
INSERT INTO docs (title, content, category, active) VALUES
('Phone Won''t Turn On',
'Troubleshooting steps:
1. Try charging for 30 minutes
2. Try hard reset (varies by model)
3. Check for physical damage
4. Bring it in for free diagnostic

Could be: Dead battery, charging port issue, motherboard issue, water damage
We offer free diagnostics - we''ll test it and give honest assessment
Most issues fixable, some not economical to repair (we''ll advise)',
'troubleshooting', true),

('Screen Protector vs Screen Repair',
'If screen protector is cracked:
- Just the protector, not the actual screen
- Can remove and replace protector
- Screen underneath usually fine
- Much cheaper than screen repair!

If actual screen is cracked:
- Will need screen replacement
- Bring it in for assessment
- We can usually do same day
- Prices in our price list

Ask customer: Is it just the protector or the actual screen underneath?',
'troubleshooting', true);

-- Verify inserts
SELECT title, category FROM docs WHERE active = true ORDER BY category, title;
