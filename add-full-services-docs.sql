-- Add comprehensive knowledge base documents about all services

-- Main services overview
INSERT INTO docs (title, content, category, active) VALUES
('Full Services Overview', 'New Forest Device Repairs offers comprehensive services:

REPAIRS:
- All devices: iPhones, iPads, Samsung, tablets, MacBooks, laptops
- Most repairs completed same day
- 90-day warranty on all work
- Quality parts and expert technicians
- Honest pricing - no hidden fees

BUYING DEVICES:
- We buy: iPhones, iPads, MacBooks, laptops, and other tech
- Good rates - better than online buyback services
- No messing about - fair prices, quick payment
- Instant appraisals in store
- Or send details for quick quote
- Trade-ins available towards repairs or purchases

SELLING DEVICES:
- Refurbished iPhones, iPads, MacBooks, laptops
- All devices tested and working perfectly
- Come with warranty
- Great selection in stock
- Pop in to see what''s available

ACCESSORIES:
- Phone cases for all models
- Screen protectors
- Charging cables and adapters
- Power banks
- Headphones and earbuds
- All the normal accessories you need
- Always in stock

For more information, search "New Forest Device Repairs" online!', 'services', true),

-- Buyback process
('Device Buyback Process', 'HOW OUR BUYBACK WORKS:

We make selling your device simple and fair:

OPTION 1 - IN STORE:
- Pop into the shop with your device
- Instant appraisal while you wait
- Fair offer on the spot
- Quick payment

OPTION 2 - REMOTE QUOTE:
- Send us the details:
  * Device model (e.g., iPhone 14 Pro, MacBook Air M1)
  * Condition (excellent, good, fair, damaged)
  * Any issues (cracked screen, battery health, etc.)
- We''ll get back to you ASAP with a fair offer
- No waiting around

WHAT WE BUY:
- iPhones (all models)
- iPads and tablets
- MacBooks and laptops
- Other tech devices

WHY CHOOSE US:
- Good rates - competitive with or better than online services
- No messing about - honest, fair pricing
- Quick process - no waiting weeks for payment
- Local and trustworthy
- Can do trade-ins towards repairs or purchases

Unlike online buyback services, we don''t lowball you or find excuses to reduce the price. What we quote is what you get!', 'services', true),

-- Refurbished devices
('Refurbished Devices for Sale', 'QUALITY REFURBISHED DEVICES:

We sell professionally refurbished devices:

AVAILABLE DEVICES:
- iPhones (various models)
- iPads
- MacBooks
- Laptops

QUALITY GUARANTEE:
- All devices thoroughly tested
- Any issues repaired with quality parts
- Cleaned and sanitized
- Battery health checked
- Come with warranty
- Ready to use out of the box

PRICING:
- Significantly cheaper than new
- Fair pricing based on model and condition
- Ask about current stock and prices

HOW TO BUY:
- Pop into the shop to see what''s in stock
- Ask about specific models you''re looking for
- We can source devices if we don''t have what you need

Great option if you want a quality device without the new price tag!', 'products', true),

-- Accessories
('Accessories and Products', 'IN-STOCK ACCESSORIES:

We keep all the essentials in stock:

PROTECTION:
- Phone cases (all popular models)
- Screen protectors (tempered glass and film)
- Tablet cases

CHARGING:
- Lightning cables
- USB-C cables
- Micro USB cables
- Wall adapters (various wattages)
- Car chargers
- Wireless charging pads
- Power banks

AUDIO:
- Wired headphones
- Earbuds
- Adapters

OTHER:
- SIM card tools
- Cleaning kits
- Phone stands
- Cable organizers

BRANDS:
- Mix of quality brands and budget options
- Something for every price point

Pop into the shop to see what we have in stock. If we don''t have exactly what you need, we can usually get it quickly!', 'products', true)

ON CONFLICT (title) DO UPDATE SET
  content = EXCLUDED.content,
  updated_at = NOW();
