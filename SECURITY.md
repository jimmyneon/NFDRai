# 🔐 Security Documentation

## API Key Storage

### Current Implementation (v1.0)

**Storage**: Plain text in PostgreSQL database  
**Table**: `ai_settings.api_key`  
**Security**: Row-Level Security (RLS) + Role-based access

### Security Measures ✅

#### 1. Row-Level Security (RLS)
```sql
-- Only admins can access AI settings
CREATE POLICY "Admins can view ai_settings" 
ON public.ai_settings FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

**Protection**:
- ✅ Database-level enforcement
- ✅ Cannot be bypassed from frontend
- ✅ Only authenticated admins can read/write

#### 2. Role-Based Access Control
- ✅ Three roles: `admin`, `manager`, `employee`
- ✅ Only `admin` can access AI settings
- ✅ Enforced in database policies

#### 3. Transport Security
- ✅ HTTPS/TLS for all connections
- ✅ Supabase uses SSL by default
- ✅ API keys encrypted in transit

#### 4. Supabase Security
- ✅ Hosted in secure infrastructure
- ✅ Access controlled by Supabase Auth
- ✅ Service role key required for direct access
- ✅ Regular security updates

---

## 🔒 Recommended: Add Encryption (Production)

For production environments, encrypt API keys at rest.

### Option 1: PostgreSQL pgcrypto ⭐ Recommended

**Migration file**: `supabase/migrations/002_encrypt_api_keys.sql`

#### Setup Steps:

1. **Set encryption key** (in Supabase dashboard):
   ```sql
   ALTER DATABASE postgres SET app.encryption_key = 'your-very-secret-key-here';
   ```

2. **Run migration**:
   ```bash
   # In Supabase SQL Editor
   # Run: supabase/migrations/002_encrypt_api_keys.sql
   ```

3. **Update application code**:
   ```typescript
   // When saving
   const { data } = await supabase.rpc('encrypt_api_key', { 
     key_text: apiKey 
   })
   
   // When reading
   const { data } = await supabase.rpc('decrypt_api_key', { 
     encrypted_key: row.api_key 
   })
   ```

#### Pros:
- ✅ Database-level encryption
- ✅ Transparent to application
- ✅ Uses AES-256
- ✅ No external dependencies

#### Cons:
- ⚠️ Encryption key must be secured
- ⚠️ Requires database functions

---

### Option 2: Application-Level Encryption

Use Node.js crypto module:

```typescript
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY! // 32 bytes
const IV_LENGTH = 16

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY),
    iv
  )
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

function decrypt(text: string): string {
  const parts = text.split(':')
  const iv = Buffer.from(parts[0], 'hex')
  const encrypted = Buffer.from(parts[1], 'hex')
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY),
    iv
  )
  let decrypted = decipher.update(encrypted)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString()
}
```

#### Pros:
- ✅ Full control over encryption
- ✅ No database changes needed
- ✅ Easy to implement

#### Cons:
- ⚠️ Application must handle encryption
- ⚠️ Encryption key in environment variables

---

### Option 3: Secrets Manager (Enterprise)

Use a dedicated secrets manager:

- **AWS Secrets Manager**
- **HashiCorp Vault**
- **Google Secret Manager**
- **Azure Key Vault**

#### Pros:
- ✅ Enterprise-grade security
- ✅ Automatic rotation
- ✅ Audit logging
- ✅ Access control

#### Cons:
- ⚠️ Additional cost
- ⚠️ More complex setup
- ⚠️ External dependency

---

## 🛡️ Current Security Posture

### For Development ✅
Current implementation is **acceptable**:
- RLS protects against unauthorized access
- Only admins can view/modify
- HTTPS encrypts in transit

### For Production ⚠️
**Recommended improvements**:
1. ✅ Add encryption at rest (Option 1 or 2)
2. ✅ Use secrets manager for encryption keys
3. ✅ Enable audit logging
4. ✅ Regular security reviews

---

## 🔍 Security Checklist

### Database Security ✅
- [x] Row-Level Security enabled
- [x] Role-based access control
- [x] Secure connection (SSL/TLS)
- [ ] API keys encrypted at rest (optional)
- [ ] Audit logging enabled (optional)

### Application Security ✅
- [x] Authentication required
- [x] HTTPS in production
- [x] Environment variables for secrets
- [x] No API keys in frontend code
- [x] Input validation
- [x] Error handling

### Infrastructure Security ✅
- [x] Supabase hosted securely
- [x] Regular backups
- [x] Access logs
- [ ] WAF/DDoS protection (optional)
- [ ] Rate limiting (optional)

---

## 📋 Best Practices

### DO ✅
- ✅ Use RLS policies
- ✅ Require authentication
- ✅ Use HTTPS in production
- ✅ Rotate keys regularly
- ✅ Monitor access logs
- ✅ Limit admin access
- ✅ Use strong passwords

### DON'T ❌
- ❌ Store keys in frontend code
- ❌ Commit keys to git
- ❌ Share admin credentials
- ❌ Disable RLS policies
- ❌ Use weak encryption
- ❌ Ignore security updates

---

## 🚨 Incident Response

### If API Key is Compromised:

1. **Immediately**:
   - Revoke the compromised key
   - Generate new key
   - Update in Settings page

2. **Investigate**:
   - Check access logs
   - Identify how it was compromised
   - Review security measures

3. **Prevent**:
   - Implement encryption
   - Review access controls
   - Update security policies

---

## 📞 Security Contacts

- **Supabase Security**: security@supabase.com
- **Report Vulnerability**: [Your security email]

---

## 🔄 Regular Security Tasks

### Weekly
- [ ] Review admin access logs
- [ ] Check for failed login attempts
- [ ] Monitor API usage

### Monthly
- [ ] Review user roles
- [ ] Update dependencies
- [ ] Security audit

### Quarterly
- [ ] Rotate API keys
- [ ] Review RLS policies
- [ ] Penetration testing (optional)

---

**Last Updated**: 2025-10-08  
**Version**: 1.0.0  
**Security Level**: Development (RLS + HTTPS)  
**Recommended**: Add encryption for production
