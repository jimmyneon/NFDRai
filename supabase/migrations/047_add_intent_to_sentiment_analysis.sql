-- Migration: Add intent and content_type to sentiment_analysis table
-- Purpose: Store unified analysis results including intent and content type
-- Date: 2024-11-11

-- Add new columns to sentiment_analysis table
ALTER TABLE sentiment_analysis
ADD COLUMN IF NOT EXISTS intent TEXT,
ADD COLUMN IF NOT EXISTS content_type TEXT,
ADD COLUMN IF NOT EXISTS intent_confidence DECIMAL(3,2);

-- Add comments for documentation
COMMENT ON COLUMN sentiment_analysis.intent IS 'Customer intent: question, complaint, booking, status_check, greeting, acknowledgment, device_issue, buyback, purchase, unclear';
COMMENT ON COLUMN sentiment_analysis.content_type IS 'Specific topic: pricing, business_hours, location, services, warranty, troubleshooting, water_damage, battery_issue, screen_damage, camera_issue, charging_issue, software_issue, device_sale, device_purchase, appointment, repair_status, introduction, acknowledgment, dissatisfaction, unclear';
COMMENT ON COLUMN sentiment_analysis.intent_confidence IS 'Confidence score for intent detection (0.0 to 1.0)';

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_intent ON sentiment_analysis(intent);
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_content_type ON sentiment_analysis(content_type);
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_intent_content ON sentiment_analysis(intent, content_type);

-- Create view for analytics
CREATE OR REPLACE VIEW sentiment_analysis_summary AS
SELECT 
  sentiment,
  intent,
  content_type,
  urgency,
  COUNT(*) as count,
  AVG(confidence) as avg_confidence,
  AVG(intent_confidence) as avg_intent_confidence,
  SUM(CASE WHEN requires_staff_attention THEN 1 ELSE 0 END) as staff_attention_count
FROM sentiment_analysis
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY sentiment, intent, content_type, urgency
ORDER BY count DESC;

-- Grant permissions
GRANT SELECT ON sentiment_analysis_summary TO authenticated;
GRANT SELECT ON sentiment_analysis_summary TO anon;
