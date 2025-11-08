-- Learning System: Track AI performance and improve over time

-- 1. Conversation context tracking
CREATE TABLE conversation_context (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  state TEXT NOT NULL,
  intent TEXT NOT NULL,
  device_type TEXT,
  device_model TEXT,
  customer_name TEXT,
  confidence NUMERIC(3,2),
  state_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. AI performance analytics
CREATE TABLE ai_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  
  -- Classification data
  intent TEXT NOT NULL,
  intent_confidence NUMERIC(3,2),
  state TEXT NOT NULL,
  
  -- Performance metrics
  response_time_ms INTEGER,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  cost_usd NUMERIC(10,6),
  
  -- Quality indicators
  validation_passed BOOLEAN DEFAULT true,
  validation_issues JSONB,
  handoff_to_staff BOOLEAN DEFAULT false,
  handoff_reason TEXT,
  
  -- Customer interaction
  customer_replied BOOLEAN,
  time_to_reply_seconds INTEGER,
  customer_sentiment TEXT, -- 'positive', 'neutral', 'negative', 'unknown'
  
  -- Learning signals
  led_to_visit BOOLEAN,
  led_to_sale BOOLEAN,
  customer_satisfaction_score INTEGER, -- 1-5 if available
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Prompt performance tracking (for A/B testing)
CREATE TABLE prompt_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID NOT NULL,
  prompt_version TEXT NOT NULL,
  intent TEXT NOT NULL,
  
  -- Aggregated metrics
  total_uses INTEGER DEFAULT 0,
  avg_confidence NUMERIC(5,2),
  avg_response_time_ms INTEGER,
  avg_tokens INTEGER,
  handoff_rate NUMERIC(5,2), -- percentage
  customer_reply_rate NUMERIC(5,2), -- percentage
  conversion_rate NUMERIC(5,2), -- percentage that led to visit/sale
  
  -- Cost tracking
  total_cost_usd NUMERIC(10,2),
  avg_cost_per_message NUMERIC(10,6),
  
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Learning feedback (manual corrections from staff)
CREATE TABLE learning_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- What went wrong
  issue_type TEXT NOT NULL, -- 'wrong_price', 'wrong_info', 'tone', 'missed_context', 'other'
  issue_description TEXT,
  
  -- What should have happened
  correct_response TEXT,
  
  -- Learning signals
  intent_was_wrong BOOLEAN DEFAULT false,
  correct_intent TEXT,
  state_was_wrong BOOLEAN DEFAULT false,
  correct_state TEXT,
  
  -- Status
  reviewed BOOLEAN DEFAULT false,
  applied_to_training BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Common patterns (auto-learned from successful conversations)
CREATE TABLE learned_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_type TEXT NOT NULL, -- 'device_mention', 'issue_description', 'positive_signal', etc.
  pattern_text TEXT NOT NULL,
  intent TEXT,
  confidence_boost NUMERIC(3,2) DEFAULT 0.1, -- How much this pattern increases confidence
  
  -- Learning metadata
  learned_from_count INTEGER DEFAULT 1, -- How many conversations contributed to this
  success_rate NUMERIC(5,2), -- How often this pattern led to good outcomes
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Intent classification history (for improving classifier)
CREATE TABLE intent_classifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  
  -- Classification results
  predicted_intent TEXT NOT NULL,
  predicted_confidence NUMERIC(3,2),
  
  -- Actual outcome (filled in later)
  actual_intent TEXT,
  was_correct BOOLEAN,
  
  -- Context at time of classification
  conversation_history JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_conversation_context_conversation ON conversation_context(conversation_id);
CREATE INDEX idx_conversation_context_state ON conversation_context(state);
CREATE INDEX idx_conversation_context_intent ON conversation_context(intent);

CREATE INDEX idx_ai_analytics_conversation ON ai_analytics(conversation_id);
CREATE INDEX idx_ai_analytics_intent ON ai_analytics(intent);
CREATE INDEX idx_ai_analytics_created_at ON ai_analytics(created_at DESC);
CREATE INDEX idx_ai_analytics_handoff ON ai_analytics(handoff_to_staff);

CREATE INDEX idx_prompt_performance_intent ON prompt_performance(intent);
CREATE INDEX idx_prompt_performance_version ON prompt_performance(prompt_version);

CREATE INDEX idx_learning_feedback_reviewed ON learning_feedback(reviewed);
CREATE INDEX idx_learning_feedback_issue_type ON learning_feedback(issue_type);

CREATE INDEX idx_learned_patterns_type ON learned_patterns(pattern_type);
CREATE INDEX idx_learned_patterns_intent ON learned_patterns(intent);
CREATE INDEX idx_learned_patterns_active ON learned_patterns(active);

CREATE INDEX idx_intent_classifications_conversation ON intent_classifications(conversation_id);
CREATE INDEX idx_intent_classifications_was_correct ON intent_classifications(was_correct);

-- Triggers
CREATE TRIGGER update_conversation_context_updated_at 
  BEFORE UPDATE ON conversation_context
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE conversation_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE learned_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE intent_classifications ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view all learning data
CREATE POLICY "Authenticated users can view conversation context" ON conversation_context
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view ai analytics" ON ai_analytics
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view prompt performance" ON prompt_performance
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view learning feedback" ON learning_feedback
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view learned patterns" ON learned_patterns
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view intent classifications" ON intent_classifications
  FOR SELECT USING (auth.role() = 'authenticated');

-- Staff can add feedback
CREATE POLICY "Authenticated users can insert learning feedback" ON learning_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- System can insert analytics
CREATE POLICY "System can insert conversation context" ON conversation_context
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can insert ai analytics" ON ai_analytics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can insert intent classifications" ON intent_classifications
  FOR INSERT WITH CHECK (true);

-- Admins can manage everything
CREATE POLICY "Admins can manage learned patterns" ON learned_patterns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- View: AI Performance Dashboard
CREATE OR REPLACE VIEW ai_performance_summary AS
SELECT 
  DATE(created_at) as date,
  intent,
  COUNT(*) as total_messages,
  AVG(intent_confidence) as avg_confidence,
  AVG(response_time_ms) as avg_response_time_ms,
  AVG(total_tokens) as avg_tokens,
  SUM(cost_usd) as total_cost,
  AVG(cost_usd) as avg_cost_per_message,
  SUM(CASE WHEN handoff_to_staff THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) * 100 as handoff_rate,
  SUM(CASE WHEN customer_replied THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) * 100 as reply_rate,
  AVG(time_to_reply_seconds) as avg_time_to_reply
FROM ai_analytics
GROUP BY DATE(created_at), intent
ORDER BY date DESC, total_messages DESC;

-- View: Intent accuracy tracking
CREATE OR REPLACE VIEW intent_accuracy AS
SELECT 
  predicted_intent,
  COUNT(*) as total_predictions,
  SUM(CASE WHEN was_correct THEN 1 ELSE 0 END) as correct_predictions,
  SUM(CASE WHEN was_correct THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) * 100 as accuracy_rate,
  AVG(predicted_confidence) as avg_confidence
FROM intent_classifications
WHERE actual_intent IS NOT NULL
GROUP BY predicted_intent
ORDER BY accuracy_rate DESC;

-- Function: Auto-learn patterns from successful conversations
CREATE OR REPLACE FUNCTION learn_from_successful_conversation(conv_id UUID)
RETURNS void AS $$
DECLARE
  conv_messages TEXT;
  conv_intent TEXT;
BEGIN
  -- Get conversation details
  SELECT string_agg(text, ' '), MAX(intent)
  INTO conv_messages, conv_intent
  FROM messages m
  JOIN ai_analytics a ON m.id = a.message_id
  WHERE m.conversation_id = conv_id
  GROUP BY m.conversation_id;
  
  -- Extract and store useful patterns (simplified - would use NLP in production)
  -- This is a placeholder for more sophisticated pattern extraction
  
  -- Mark as learned
  UPDATE ai_analytics
  SET customer_satisfaction_score = 5
  WHERE conversation_id = conv_id
    AND led_to_visit = true;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE conversation_context IS 'Tracks conversation state for flow control';
COMMENT ON TABLE ai_analytics IS 'Performance metrics for every AI response';
COMMENT ON TABLE prompt_performance IS 'A/B testing and prompt optimization data';
COMMENT ON TABLE learning_feedback IS 'Manual corrections from staff to improve AI';
COMMENT ON TABLE learned_patterns IS 'Auto-learned patterns from successful conversations';
COMMENT ON TABLE intent_classifications IS 'Intent classifier accuracy tracking';
