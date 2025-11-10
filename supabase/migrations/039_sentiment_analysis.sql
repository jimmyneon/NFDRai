-- Sentiment Analysis for Customer Messages
-- Tracks emotional state and urgency of customer messages

-- Create sentiment_analysis table
CREATE TABLE IF NOT EXISTS sentiment_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  
  -- Sentiment data
  sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'neutral', 'negative', 'frustrated', 'angry')),
  urgency TEXT NOT NULL CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  reasoning TEXT,
  keywords TEXT[], -- Array of detected keywords
  requires_staff_attention BOOLEAN DEFAULT false,
  
  -- Analysis metadata
  analysis_method TEXT NOT NULL CHECK (analysis_method IN ('ai', 'regex', 'ai_verified')),
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sentiment_analysis_message_id ON sentiment_analysis(message_id);
CREATE INDEX idx_sentiment_analysis_conversation_id ON sentiment_analysis(conversation_id);
CREATE INDEX idx_sentiment_analysis_sentiment ON sentiment_analysis(sentiment);
CREATE INDEX idx_sentiment_analysis_urgency ON sentiment_analysis(urgency);
CREATE INDEX idx_sentiment_analysis_requires_attention ON sentiment_analysis(requires_staff_attention);
CREATE INDEX idx_sentiment_analysis_created_at ON sentiment_analysis(created_at DESC);

-- Add sentiment fields to conversations table for quick access
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS last_sentiment TEXT CHECK (last_sentiment IN ('positive', 'neutral', 'negative', 'frustrated', 'angry')),
ADD COLUMN IF NOT EXISTS last_urgency TEXT CHECK (last_urgency IN ('low', 'medium', 'high', 'critical')),
ADD COLUMN IF NOT EXISTS requires_urgent_attention BOOLEAN DEFAULT false;

-- Create index on urgent attention flag
CREATE INDEX idx_conversations_urgent_attention ON conversations(requires_urgent_attention) WHERE requires_urgent_attention = true;

-- Function to update conversation sentiment
CREATE OR REPLACE FUNCTION update_conversation_sentiment()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the conversation with latest sentiment
  UPDATE conversations
  SET 
    last_sentiment = NEW.sentiment,
    last_urgency = NEW.urgency,
    requires_urgent_attention = NEW.requires_staff_attention,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update conversation sentiment
CREATE TRIGGER trigger_update_conversation_sentiment
AFTER INSERT ON sentiment_analysis
FOR EACH ROW
EXECUTE FUNCTION update_conversation_sentiment();

-- View for frustrated/angry customers (for quick alerts)
CREATE OR REPLACE VIEW urgent_conversations AS
SELECT 
  c.id,
  c.customer_id,
  cu.name as customer_name,
  cu.phone as customer_phone,
  c.last_sentiment,
  c.last_urgency,
  c.status,
  c.channel,
  sa.reasoning,
  sa.keywords,
  sa.analyzed_at,
  c.updated_at
FROM conversations c
JOIN customers cu ON c.customer_id = cu.id
LEFT JOIN LATERAL (
  SELECT * FROM sentiment_analysis
  WHERE conversation_id = c.id
  ORDER BY created_at DESC
  LIMIT 1
) sa ON true
WHERE c.requires_urgent_attention = true
  AND c.status != 'closed'
ORDER BY c.updated_at DESC;

-- Comment on table
COMMENT ON TABLE sentiment_analysis IS 'Sentiment analysis of customer messages to detect frustrated or angry customers';
COMMENT ON COLUMN sentiment_analysis.sentiment IS 'Emotional state: positive, neutral, negative, frustrated, angry';
COMMENT ON COLUMN sentiment_analysis.urgency IS 'Urgency level: low, medium, high, critical';
COMMENT ON COLUMN sentiment_analysis.requires_staff_attention IS 'Flag for messages needing immediate staff attention';
COMMENT ON COLUMN sentiment_analysis.analysis_method IS 'Method used: ai (GPT-4o-mini), regex (pattern matching), ai_verified (regex + AI confirmation)';
