-- Migration: Add webchat channel support for website widget
-- This enables AI Steve to power a chat widget on your website

-- 1. Add 'webchat' to the channel enum
-- First check if the enum value already exists
DO $$
BEGIN
    -- Try to add webchat to the channel enum
    ALTER TYPE channel_type ADD VALUE IF NOT EXISTS 'webchat';
EXCEPTION
    WHEN duplicate_object THEN
        -- Value already exists, ignore
        NULL;
    WHEN undefined_object THEN
        -- Enum doesn't exist, create it with all values
        CREATE TYPE channel_type AS ENUM ('sms', 'whatsapp', 'messenger', 'webchat');
END $$;

-- 2. Create web_sessions table for anonymous website visitors
CREATE TABLE IF NOT EXISTS web_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token VARCHAR(64) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    referrer TEXT,
    page_url TEXT,
    metadata JSONB DEFAULT '{}',
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create index for fast session lookups
CREATE INDEX IF NOT EXISTS idx_web_sessions_token ON web_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_web_sessions_customer ON web_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_web_sessions_activity ON web_sessions(last_activity_at);

-- 4. Create webchat_settings table for widget configuration
CREATE TABLE IF NOT EXISTS webchat_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    widget_title VARCHAR(100) DEFAULT 'Chat with AI Steve',
    welcome_message TEXT DEFAULT 'Hi! I''m AI Steve from New Forest Device Repairs. How can I help you today?',
    placeholder_text VARCHAR(100) DEFAULT 'Type your message...',
    primary_color VARCHAR(7) DEFAULT '#2563eb',
    position VARCHAR(20) DEFAULT 'bottom-right',
    show_branding BOOLEAN DEFAULT true,
    collect_email BOOLEAN DEFAULT false,
    collect_name BOOLEAN DEFAULT false,
    auto_open_delay_seconds INTEGER DEFAULT 0,
    offline_message TEXT DEFAULT 'Thanks for your message! We''ll get back to you as soon as possible.',
    allowed_domains TEXT[] DEFAULT ARRAY[]::TEXT[],
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Insert default webchat settings
INSERT INTO webchat_settings (id) 
VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- 6. Create api_keys table for widget authentication
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(64) NOT NULL,
    key_prefix VARCHAR(8) NOT NULL,
    permissions TEXT[] DEFAULT ARRAY['webchat']::TEXT[],
    rate_limit_per_minute INTEGER DEFAULT 60,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create index for API key lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(active) WHERE active = true;

-- 8. Enable RLS on new tables
ALTER TABLE web_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webchat_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- 9. RLS policies for web_sessions (service role only for security)
CREATE POLICY "Service role can manage web_sessions"
    ON web_sessions FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- 10. RLS policies for webchat_settings (authenticated users can read, admins can write)
CREATE POLICY "Anyone can read webchat_settings"
    ON webchat_settings FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can update webchat_settings"
    ON webchat_settings FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- 11. RLS policies for api_keys (authenticated users only)
CREATE POLICY "Authenticated users can manage api_keys"
    ON api_keys FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- 12. Function to generate secure API key
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TABLE(full_key TEXT, key_hash TEXT, key_prefix TEXT) AS $$
DECLARE
    random_bytes BYTEA;
    full_key_val TEXT;
BEGIN
    -- Generate 32 random bytes
    random_bytes := gen_random_bytes(32);
    -- Convert to base64 and make URL-safe
    full_key_val := 'nfdr_' || replace(replace(encode(random_bytes, 'base64'), '+', '-'), '/', '_');
    
    RETURN QUERY SELECT 
        full_key_val,
        encode(sha256(full_key_val::bytea), 'hex'),
        substring(full_key_val from 1 for 12);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Function to clean up old web sessions (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_web_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM web_sessions
    WHERE last_activity_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Add comment for documentation
COMMENT ON TABLE web_sessions IS 'Tracks anonymous website visitors for webchat widget';
COMMENT ON TABLE webchat_settings IS 'Configuration for the website chat widget';
COMMENT ON TABLE api_keys IS 'API keys for authenticating webchat widget requests';
