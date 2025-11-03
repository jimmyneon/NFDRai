# 🚀 Deployment Checklist - Ready to Go Live!

**Status**: ✅ Ready to deploy  
**Platform**: Vercel (recommended)  
**Time**: 15-20 minutes

---

## ✅ Pre-Deployment Checklist

### Code Status:
- [x] Dashboard built and tested
- [x] API routes created
- [x] Database migrations ready
- [x] MacroDroid integration documented
- [x] AI takeover prevention implemented
- [x] Multi-channel support added
- [x] Enhanced pricing structure ready

**All systems go!** 🎉

---

## 🔑 Required Environment Variables

### 1. Supabase (Required)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to get:**
1. Go to [supabase.com](https://supabase.com)
2. Open your project
3. Go to **Settings** → **API**
4. Copy:
   - Project URL
   - `anon` `public` key
   - `service_role` key (click "Reveal")

---

### 2. OpenAI (Required for AI)

```env
OPENAI_API_KEY=sk-proj-xxxxx...
```

**Where to get:**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign in
3. Go to **API Keys**
4. Click **"Create new secret key"**
5. Copy the key (starts with `sk-`)

**Cost**: ~£0.002 per message (very cheap!)

---

### 3. MacroDroid Webhook (Optional - for dashboard replies)

```env
MACRODROID_WEBHOOK_URL=https://trigger.macrodroid.com/YOUR_UNIQUE_ID/send-sms
```

**Where to get:**
1. Set up MacroDroid webhook macro (Part 3 in setup guide)
2. Copy the auto-generated webhook URL
3. Add to environment variables

**Note**: You can deploy without this and add it later!

---

### 4. App Configuration (Required)

```env
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
NODE_ENV=production
```

**Note**: You'll get the Vercel URL after deployment

---

### 5. Optional Services

#### Resend (Email notifications)
```env
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

#### Twilio (Professional SMS - future)
```env
# TWILIO_ACCOUNT_SID=ACxxxxx
# TWILIO_AUTH_TOKEN=xxxxx
# TWILIO_PHONE_NUMBER=+1234567890
```

#### Meta Messenger (future)
```env
# META_PAGE_ACCESS_TOKEN=xxxxx
```

---

## 📋 Complete .env.local Template

```env
# ============================================
# REQUIRED - Supabase Database
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# REQUIRED - AI Provider
# ============================================
OPENAI_API_KEY=sk-proj-xxxxx...

# ============================================
# REQUIRED - App Configuration
# ============================================
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
NODE_ENV=production

# ============================================
# OPTIONAL - MacroDroid Webhook
# ============================================
MACRODROID_WEBHOOK_URL=https://trigger.macrodroid.com/YOUR_ID/send-sms

# ============================================
# OPTIONAL - Email Notifications
# ============================================
# RESEND_API_KEY=re_xxxxx
# RESEND_FROM_EMAIL=noreply@yourdomain.com

# ============================================
# OPTIONAL - Twilio (Future)
# ============================================
# TWILIO_ACCOUNT_SID=ACxxxxx
# TWILIO_AUTH_TOKEN=xxxxx
# TWILIO_PHONE_NUMBER=+1234567890
# TWILIO_WHATSAPP_NUMBER=+1234567890

# ============================================
# OPTIONAL - Meta Messenger (Future)
# ============================================
# META_PAGE_ACCESS_TOKEN=xxxxx
```

---

## 🚀 Deployment Steps

### Step 1: Prepare Supabase

1. **Create Supabase Project** (if not done):
   - Go to [supabase.com](https://supabase.com)
   - Click **"New Project"**
   - Name: `nfd-ai-responder`
   - Choose region (closest to you)
   - Set strong database password
   - Wait 2 minutes

2. **Run Migrations**:
   - Go to **SQL Editor** in Supabase
   - Click **"New Query"**
   - Copy and paste each migration file:
     - `001_initial_schema.sql` ✅ Required
     - `002_*.sql` through `006_*.sql` ✅ Required
     - `007_enhance_pricing_structure.sql` ✅ Recommended
   - Click **"Run"** for each
   - Should see "Success. No rows returned"

3. **Get API Keys**:
   - Go to **Settings** → **API**
   - Copy all three keys (see above)

---

### Step 2: Push to GitHub

```bash
# Initialize git (if not done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial deployment"

# Create GitHub repo (on github.com)
# Then connect and push:
git remote add origin https://github.com/YOUR_USERNAME/nfd-ai-responder.git
git branch -M main
git push -u origin main
```

---

### Step 3: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)**
2. Click **"Add New"** → **"Project"**
3. **Import your GitHub repository**
4. **Configure:**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

5. **Add Environment Variables:**
   Click **"Environment Variables"** and add:
   
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGci...
   SUPABASE_SERVICE_ROLE_KEY = eyJhbGci...
   OPENAI_API_KEY = sk-proj-...
   NODE_ENV = production
   ```

6. **Click "Deploy"**
7. **Wait 2-3 minutes** ⏳
8. **Get your URL**: `https://your-app-name.vercel.app`

---

### Step 4: Update Environment Variables

1. **Copy your Vercel URL**
2. **Go back to Vercel** → **Settings** → **Environment Variables**
3. **Edit** `NEXT_PUBLIC_APP_URL`:
   ```
   NEXT_PUBLIC_APP_URL = https://your-app-name.vercel.app
   ```
4. **Redeploy** (Vercel will auto-redeploy)

---

### Step 5: Create Admin Account

1. **Visit your deployed app**: `https://your-app-name.vercel.app`
2. **Click "Sign Up"**
3. **Enter your email and password**
4. **Sign in**
5. **Go to Supabase Dashboard**:
   - **Table Editor** → **users** table
   - Find your user
   - Change `role` from `employee` to `admin`
   - Save
6. **Log out and back in**
7. **You're now admin!** 🎉

---

### Step 6: Configure AI Settings

1. **Go to Dashboard** → **Settings**
2. **Configure AI**:
   - Provider: **OpenAI**
   - Model: **gpt-4-turbo-preview** (or `gpt-3.5-turbo` for cheaper)
   - Temperature: **0.7**
   - Max Tokens: **500**
   - Confidence Threshold: **70**
   - System Prompt:
     ```
     You are a helpful customer service assistant for New Forest Device Repairs.
     Be friendly, professional, and concise. Always reference our pricing and
     FAQ database when answering questions. If you're not confident about an
     answer, say so clearly.
     ```
   - Fallback Message:
     ```
     Thanks for your message! I want to make sure I give you accurate information,
     so I'm passing this to one of our team members who will respond shortly.
     ```
3. **Enable "AI Automation Active"**
4. **Click "Save Settings"**

---

### Step 7: Add Sample Data (Optional)

1. **Go to Dashboard** → **Pricing**
2. **Click "Add Price"** or **"Upload CSV"**
3. **Add a few common repairs**:
   - iPhone 14 Screen - £149.99
   - iPhone 13 Screen - £129.99
   - Samsung S23 Screen - £119.99

4. **Go to FAQs**
5. **Add common questions**:
   - Opening hours
   - Warranty info
   - Payment methods
   - Location

---

### Step 8: Set Up MacroDroid

1. **Open MacroDroid on your phone**
2. **Create Macro 1: Incoming SMS**
   - Trigger: SMS Received
   - Action: HTTP POST to `https://your-app-name.vercel.app/api/messages/incoming`
   - Action: Send SMS (AI response)

3. **Create Macro 2: Track Sent SMS**
   - Trigger: SMS Sent
   - Action: HTTP POST to `https://your-app-name.vercel.app/api/messages/send`

4. **Create Macro 3: Dashboard Webhook** (optional)
   - Trigger: Webhook URL
   - Copy webhook URL
   - Add to Vercel environment variables as `MACRODROID_WEBHOOK_URL`
   - Redeploy

**See `/MACRODROID_SETUP.md` for detailed instructions**

---

### Step 9: Test Everything

1. **Send test SMS to your phone**:
   ```
   "How much for iPhone 14 screen?"
   ```

2. **Expected flow**:
   - MacroDroid receives SMS
   - Sends to Vercel
   - AI processes
   - Returns response
   - MacroDroid sends SMS back
   - You receive: "iPhone 14 screen replacement is £149.99..."

3. **Check dashboard**:
   - Go to **Conversations**
   - Should see the conversation
   - Should see both messages

4. **Test manual reply**:
   - Reply from your phone
   - Check dashboard shows it as "staff"
   - Send another customer message
   - Verify AI doesn't respond

---

## ✅ Post-Deployment Checklist

- [ ] App deployed to Vercel
- [ ] Environment variables configured
- [ ] Supabase migrations run
- [ ] Admin account created
- [ ] AI settings configured
- [ ] Sample pricing added
- [ ] Sample FAQs added
- [ ] MacroDroid macros created
- [ ] Test SMS sent and received
- [ ] AI response working
- [ ] Manual reply tracking working
- [ ] Dashboard accessible
- [ ] All features tested

---

## 🔍 Verification Commands

### Check Deployment Status:
```bash
# Visit these URLs:
https://your-app-name.vercel.app
https://your-app-name.vercel.app/login
https://your-app-name.vercel.app/api/health
```

### Test API Endpoints:
```bash
# Test incoming message
curl -X POST https://your-app-name.vercel.app/api/messages/incoming \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+1234567890",
    "message": "How much for iPhone screen?",
    "channel": "sms"
  }'

# Should return AI response
```

### Check Vercel Logs:
1. Go to Vercel Dashboard
2. Click your project
3. Go to **"Logs"** tab
4. See all requests and errors

---

## 🐛 Troubleshooting

### Issue: Build Failed

**Check:**
- All dependencies in `package.json`
- No TypeScript errors
- Environment variables set

**Fix:**
```bash
# Test build locally first
npm run build

# If it works locally, check Vercel logs
```

---

### Issue: "Unauthorized" Error

**Check:**
- Supabase keys are correct
- Keys are in Vercel environment variables
- Redeployed after adding keys

---

### Issue: AI Not Responding

**Check:**
- OpenAI API key is correct
- OpenAI API key has credits
- AI settings configured in dashboard
- "AI Automation Active" is enabled

**Test:**
```bash
# Test OpenAI key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_OPENAI_KEY"

# Should return list of models
```

---

### Issue: MacroDroid Can't Connect

**Check:**
- URL is `https://` not `http://`
- URL is correct (no typos)
- App is deployed and running
- Test URL in browser first

---

## 💰 Cost Estimate

### Vercel:
- **Free tier**: Perfect for starting
- Includes: Unlimited deployments, 100GB bandwidth
- **Upgrade**: £16/month if you need more

### Supabase:
- **Free tier**: 500MB database, 2GB bandwidth
- Perfect for starting
- **Upgrade**: £20/month for more

### OpenAI:
- **Pay-as-you-go**: ~£0.002 per message
- Example: 1000 messages = £2
- Very affordable!

### Total First Month:
- **Free tier**: £0 (just OpenAI usage)
- **Paid tier**: ~£36/month + OpenAI usage

**Recommendation**: Start with free tier!

---

## 🎯 What You Get

### After Deployment:

✅ **Live Dashboard**: Access from anywhere  
✅ **AI Customer Service**: 24/7 automated responses  
✅ **Multi-Channel**: SMS, WhatsApp, Messenger ready  
✅ **Manual Override**: Take over anytime  
✅ **Analytics**: Track performance  
✅ **Secure**: HTTPS, authentication, RLS  
✅ **Scalable**: Handles growth automatically  
✅ **Professional**: Custom domain ready  

---

## 🚀 Next Steps After Deployment

### Immediate:
1. Test with real customers
2. Monitor first conversations
3. Adjust AI settings based on results
4. Add more pricing/FAQs as needed

### Week 1:
1. Review analytics
2. Check AI confidence scores
3. Update system prompt if needed
4. Train staff on dashboard

### Month 1:
1. Analyze performance
2. Add custom domain (optional)
3. Upgrade to paid tier if needed
4. Consider WhatsApp Business API

---

## 📞 Support Resources

### Vercel:
- Docs: https://vercel.com/docs
- Support: https://vercel.com/support

### Supabase:
- Docs: https://supabase.com/docs
- Support: https://supabase.com/support

### OpenAI:
- Docs: https://platform.openai.com/docs
- Support: https://help.openai.com

---

## 🎉 You're Ready!

**Minimum Required:**
- ✅ Supabase account + keys
- ✅ OpenAI API key
- ✅ GitHub account
- ✅ Vercel account (free)

**Time to Deploy:**
- ⏱️ 15-20 minutes total

**Cost:**
- 💰 Free to start (just OpenAI usage)

---

**Let's deploy!** 🚀

---

**Last Updated**: November 3, 2025  
**Status**: Production Ready  
**Platform**: Vercel + Supabase + OpenAI
