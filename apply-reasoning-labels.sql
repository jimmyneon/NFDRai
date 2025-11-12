-- Apply this SQL to your Supabase database to enable reasoning labels
-- This adds the column that stores WHY the AI didn't respond

-- Add reasoning column to conversations table
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS last_analysis_reasoning TEXT;

-- Add intent and content_type to sentiment_analysis table
ALTER TABLE sentiment_analysis 
ADD COLUMN IF NOT EXISTS intent TEXT,
ADD COLUMN IF NOT EXISTS content_type TEXT,
ADD COLUMN IF NOT EXISTS intent_confidence DECIMAL(3,2);

-- Update the trigger function to save reasoning
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

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'conversations' 
  AND column_name = 'last_analysis_reasoning';

-- Should return: last_analysis_reasoning | text
