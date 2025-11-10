-- Add price_ranges column to business_info for managing AI price estimates
-- This allows customizable price ranges without hardcoding in the AI

ALTER TABLE public.business_info 
ADD COLUMN IF NOT EXISTS price_ranges JSONB DEFAULT '[
  {
    "category": "iPhone Screen Repairs",
    "min": 80,
    "max": 120,
    "description": "depending on model"
  },
  {
    "category": "Android Screen Repairs",
    "min": 60,
    "max": 100,
    "description": "depending on model"
  },
  {
    "category": "Battery Replacements",
    "min": 50,
    "max": 80,
    "description": "depending on device"
  },
  {
    "category": "Laptop Screen Repairs",
    "min": 100,
    "max": 200,
    "description": "depending on size/model"
  },
  {
    "category": "Diagnostics",
    "min": 0,
    "max": 30,
    "description": "usually free or £20-30"
  }
]'::jsonb;

-- Add toggle for pricing mode (ranges vs exact)
ALTER TABLE public.business_info 
ADD COLUMN IF NOT EXISTS use_exact_prices BOOLEAN DEFAULT false;

-- Add comments
COMMENT ON COLUMN public.business_info.price_ranges IS 'JSONB array of price ranges for AI estimates. Format: [{"category": "...", "min": 0, "max": 0, "description": "..."}]';
COMMENT ON COLUMN public.business_info.use_exact_prices IS 'If true, AI uses exact prices from database. If false, AI uses price ranges with confirmation disclaimer.';
