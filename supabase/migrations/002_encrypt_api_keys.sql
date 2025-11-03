-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encryption key (store this securely in environment variables!)
-- In production, use: ALTER DATABASE your_db SET app.encryption_key = 'your-secret-key';

-- Create encrypted column
ALTER TABLE public.ai_settings ADD COLUMN api_key_encrypted BYTEA;

-- Migrate existing keys (if any)
UPDATE public.ai_settings 
SET api_key_encrypted = pgp_sym_encrypt(api_key, current_setting('app.encryption_key'))
WHERE api_key IS NOT NULL;

-- Drop old plain text column (after migration)
-- ALTER TABLE public.ai_settings DROP COLUMN api_key;

-- Rename encrypted column
-- ALTER TABLE public.ai_settings RENAME COLUMN api_key_encrypted TO api_key;

-- Helper functions for encryption/decryption
CREATE OR REPLACE FUNCTION encrypt_api_key(key_text TEXT)
RETURNS BYTEA AS $$
BEGIN
  RETURN pgp_sym_encrypt(key_text, current_setting('app.encryption_key'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_api_key(encrypted_key BYTEA)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(encrypted_key, current_setting('app.encryption_key'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
