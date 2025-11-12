-- Add intent and content_type to sentiment_analysis table
-- These fields help understand WHY the AI made its decision

-- Add new columns
ALTER TABLE sentiment_analysis 
ADD COLUMN IF NOT EXISTS intent TEXT,
ADD COLUMN IF NOT EXISTS content_type TEXT,
ADD COLUMN IF NOT EXISTS intent_confidence DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS should_ai_respond BOOLEAN DEFAULT true;

-- Add checks for valid values
ALTER TABLE sentiment_analysis
DROP CONSTRAINT IF EXISTS sentiment_analysis_intent_check,
ADD CONSTRAINT sentiment_analysis_intent_check 
  CHECK (intent IS NULL OR intent IN ('question', 'complaint', 'booking', 'status_check', 'greeting', 'acknowledgment', 'device_issue', 'buyback', 'purchase', 'unclear'));

ALTER TABLE sentiment_analysis
DROP CONSTRAINT IF EXISTS sentiment_analysis_content_type_check,
ADD CONSTRAINT sentiment_analysis_content_type_check 
  CHECK (content_type IS NULL OR content_type IN (
    'pricing', 'business_hours', 'location', 'services', 'warranty',
    'troubleshooting', 'water_damage', 'battery_issue', 'screen_damage',
    'camera_issue', 'charging_issue', 'software_issue',
    'device_sale', 'device_purchase', 'appointment', 'repair_status',
    'introduction', 'acknowledgment', 'dissatisfaction', 'unclear'
  ));

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_intent ON sentiment_analysis(intent);
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_content_type ON sentiment_analysis(content_type);

-- Add reasoning to conversations table for quick access
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS last_analysis_reasoning TEXT;

-- Function to update conversation with latest analysis reasoning
CREATE OR REPLACE FUNCTION update_conversation_sentiment()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the conversation with latest sentiment and reasoning
  UPDATE conversations
  SET 
    last_sentiment = NEW.sentiment,
    last_urgency = NEW.urgency,
    requires_urgent_attention = NEW.requires_staff_attention,
    last_analysis_reasoning = NEW.reasoning,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comment on new columns
COMMENT ON COLUMN sentiment_analysis.intent IS 'Customer intent: question, complaint, booking, status_check, greeting, acknowledgment, device_issue, buyback, purchase, unclear';
COMMENT ON COLUMN sentiment_analysis.content_type IS 'Specific topic of the message';
COMMENT ON COLUMN sentiment_analysis.intent_confidence IS 'Confidence score for intent detection (0-1)';
COMMENT ON COLUMN conversations.last_analysis_reasoning IS 'Reasoning from latest sentiment analysis (e.g., "Customer requesting callback from staff")';
