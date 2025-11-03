# Deployment Guide

## Quick Start (5 Minutes)

### 1. Supabase Setup
```bash
# Visit https://supabase.com and create a new project
# Run the SQL migration from supabase/migrations/001_initial_schema.sql
# Copy your project URL and keys
```

### 2. Environment Variables
```bash
# Create .env.local with:
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
OPENAI_API_KEY=your_openai_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Install & Run
```bash
npm install
npm run dev
```

### 4. Create Admin User
1. Visit http://localhost:3000/login
2. Sign up with email
3. In Supabase dashboard, change your user role to 'admin'

## Production Deployment (Vercel)

### One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Manual Steps
1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

## Webhook Integration

### Endpoint
```
POST https://your-domain.com/api/messages/incoming
```

### Payload
```json
{
  "from": "+1234567890",
  "message": "Customer message",
  "channel": "sms",
  "customerName": "John Doe"
}
```

## Post-Deployment Checklist

- [ ] Configure AI settings in dashboard
- [ ] Add pricing data
- [ ] Add FAQs
- [ ] Test sandbox mode
- [ ] Set up webhook integration
- [ ] Enable AI automation

## Support

See README.md for full documentation.
