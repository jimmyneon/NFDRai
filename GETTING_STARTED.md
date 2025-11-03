# Getting Started - New Forest Device Repairs AI Responder

**Welcome!** This guide will get you up and running in under 30 minutes.

---

## 🎯 What You'll Build

An AI-powered customer service system that:
- Automatically responds to SMS/WhatsApp/Messenger
- References your pricing and FAQs
- Handles 70%+ of queries without human intervention
- Alerts staff when manual help is needed
- Provides analytics and insights

---

## ⚡ Quick Start (5 Minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Name it "nfd-ai-responder"
4. Choose a region close to you
5. Set a strong database password
6. Wait 2 minutes for setup

### Step 3: Run Database Migration
1. In Supabase dashboard, click "SQL Editor"
2. Click "New Query"
3. Copy entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and click "Run"
5. You should see "Success. No rows returned"

### Step 4: Get Your Credentials
1. In Supabase, go to "Project Settings" → "API"
2. Copy these values:
   - Project URL
   - anon/public key
   - service_role key (click "Reveal" first)

### Step 5: Configure Environment
```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local and paste your Supabase credentials
# Also add your OpenAI API key (get from platform.openai.com)
```

### Step 6: Start Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) 🎉

---

## 👤 Create Your Admin Account

### Step 1: Sign Up
1. Click "Sign Up" or use Google OAuth
2. Enter your email and password
3. You'll be redirected to the dashboard

### Step 2: Make Yourself Admin
1. Go to Supabase dashboard
2. Click "Table Editor" → "users"
3. Find your user (just created)
4. Click the "role" cell
5. Change from "employee" to "admin"
6. Click the checkmark to save

### Step 3: Log Out and Back In
Your admin permissions are now active!

---

## 🤖 Configure AI (10 Minutes)

### Step 1: Get an AI Provider API Key

**Option A: OpenAI (Recommended)**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Go to "API Keys"
4. Click "Create new secret key"
5. Copy the key (starts with `sk-`)

**Option B: Anthropic (Claude)**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Get API key from settings

**Option C: Others**
- Mistral AI, DeepSeek, or custom endpoints also supported

### Step 2: Configure in Dashboard
1. Go to **Dashboard → Settings**
2. Select your AI provider
3. Paste your API key
4. Choose a model:
   - OpenAI: `gpt-4-turbo-preview` (best) or `gpt-3.5-turbo` (faster/cheaper)
   - Anthropic: `claude-3-sonnet-20240229`
5. Set temperature to `0.7` (balanced)
6. Set max tokens to `500`
7. Configure system prompt:

```
You are a helpful customer service assistant for New Forest Device Repairs. 
Be friendly, professional, and concise. Always reference our pricing and 
FAQ database when answering questions. If you're not confident about an 
answer, say so clearly.
```

8. Set confidence threshold to `70`
9. Set fallback message:

```
Thanks for your message! I want to make sure I give you accurate information, 
so I'm passing this to one of our team members who will respond shortly.
```

10. Enable "AI Automation Active"
11. Click "Save Settings"

---

## 💰 Add Your Pricing (5 Minutes)

### Option A: Use Sample Data
```bash
# Import the sample pricing CSV
# Go to Dashboard → Pricing → Upload CSV
# Select: sample-data/pricing-template.csv
```

### Option B: Add Manually
1. Go to **Dashboard → Pricing**
2. Click "Add Price"
3. Fill in:
   - Device: "iPhone 14"
   - Repair Type: "Screen Replacement"
   - Cost: "149.99"
   - Turnaround: "Same Day"
4. Click "Add Price"
5. Repeat for your common repairs

### Option C: Create Your Own CSV
```csv
device,repair_type,cost,turnaround,expiry
iPhone 14,Screen Replacement,149.99,Same Day,
iPhone 14,Battery Replacement,79.99,2-3 Hours,
```

---

## ❓ Add FAQs (5 Minutes)

1. Go to **Dashboard → FAQs**
2. Click "Add FAQ"
3. Add these common questions:

**Opening Hours**
- Q: "What are your opening hours?"
- A: "We're open Monday-Friday 9am-6pm, Saturday 10am-4pm. Closed Sundays."

**Warranty**
- Q: "Do you offer a warranty?"
- A: "Yes! All repairs come with a 90-day warranty on parts and labor."

**Payment Methods**
- Q: "What payment methods do you accept?"
- A: "We accept cash, all major credit/debit cards, Apple Pay, and Google Pay."

**Location**
- Q: "Where are you located?"
- A: "We're at [Your Address]. Free parking available."

**Turnaround**
- Q: "How long does a repair take?"
- A: "Most screen repairs are same-day. Battery replacements take 1-2 hours. We'll give you an exact time when you drop off."

---

## 🧪 Test Your AI (5 Minutes)

### Step 1: Use Sandbox Mode
1. Go to **Dashboard → Sandbox**
2. Enter a test query:
   ```
   How much for iPhone 14 screen replacement?
   ```
3. Click "Test AI Response"
4. You should see:
   - AI response mentioning £149.99
   - High confidence score (80%+)
   - Provider and model used

### Step 2: Test More Queries
```
What are your opening hours?
Do you fix Samsung phones?
How long does a battery replacement take?
Can I pay with card?
```

### Step 3: Adjust if Needed
- If responses are too verbose → lower max tokens
- If responses are too robotic → increase temperature
- If confidence is low → improve system prompt or add more FAQs

---

## 🔌 Connect Your Messaging (Varies)

### Option 1: MacroDroid (Android - Easiest)

**For testing locally:**
1. Install MacroDroid on Android
2. Create new macro
3. Trigger: "SMS Received"
4. Action: "HTTP Request"
   - URL: `http://YOUR_LOCAL_IP:3000/api/messages/incoming`
   - Method: POST
   - Body:
   ```json
   {
     "from": "{sms_number}",
     "message": "{sms_body}",
     "channel": "sms"
   }
   ```
5. Test by sending SMS to your phone

**For production:**
- Replace URL with your Vercel deployment URL

### Option 2: Twilio (SMS/WhatsApp)

1. Create Twilio account
2. Get a phone number
3. Configure webhook:
   - URL: `https://your-domain.com/api/messages/incoming`
   - Method: POST
4. See `WEBHOOK_EXAMPLES.md` for code examples

### Option 3: Meta Messenger

1. Create Meta Developer account
2. Create Messenger app
3. Configure webhook
4. See `WEBHOOK_EXAMPLES.md` for setup

---

## 🚀 Deploy to Production (10 Minutes)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO
git push -u origin main
```

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Select your GitHub repo
4. Add environment variables:
   - Copy all from `.env.local`
   - Change `NEXT_PUBLIC_APP_URL` to your Vercel URL
   - Set `NODE_ENV=production`
5. Click "Deploy"
6. Wait 2-3 minutes

### Step 3: Update Webhooks
- Update your webhook URLs to point to Vercel domain
- Test with a real message

---

## ✅ Verification Checklist

Run the verification script:
```bash
node scripts/verify-setup.js
```

Or manually check:
- [ ] Dependencies installed (`node_modules` exists)
- [ ] Environment variables configured (`.env.local`)
- [ ] Supabase migration ran successfully
- [ ] Can log in to dashboard
- [ ] Admin role assigned
- [ ] AI settings configured
- [ ] Pricing data added
- [ ] FAQs added
- [ ] Sandbox tests pass
- [ ] Webhook connected (optional for now)

---

## 🎓 Next Steps

### Learn the Dashboard
- **Home**: Overview and quick actions
- **Conversations**: View and manage customer chats
- **Pricing**: Keep prices up to date
- **FAQs**: Expand your knowledge base
- **Analytics**: Track performance
- **Sandbox**: Test changes safely
- **Settings**: Fine-tune AI behavior

### Best Practices
1. **Start with high confidence threshold** (70-80%)
2. **Monitor first conversations closely**
3. **Add FAQs as new questions come in**
4. **Update pricing regularly**
5. **Review analytics weekly**
6. **Use sandbox before changing settings**

### Common Workflows

**Taking over a conversation:**
1. Go to Conversations
2. Click on conversation
3. Click "Take Over (Manual Mode)"
4. Respond manually

**Updating prices:**
1. Go to Pricing
2. Click edit on price card
3. Update and save

**Adding new FAQ:**
1. Go to FAQs
2. Click "Add FAQ"
3. Enter question and answer

---

## 🆘 Troubleshooting

### "AI not responding"
- Check Settings → AI Automation is enabled
- Verify API key is correct
- Test in Sandbox first

### "Can't log in"
- Check Supabase Auth is enabled
- Verify email/password
- Try password reset

### "Webhook not working"
- Check URL is correct (https://)
- Verify payload format matches docs
- Check Vercel function logs

### "Database errors"
- Confirm migration ran successfully
- Check RLS policies in Supabase
- Verify user role is set

---

## 📚 Documentation

- **README.md** - Full documentation
- **tasks.md** - Detailed setup checklist
- **DEPLOYMENT.md** - Deployment guide
- **WEBHOOK_EXAMPLES.md** - Integration examples
- **PROJECT_SUMMARY.md** - Technical overview

---

## 🎉 You're Ready!

Your AI customer service system is now live. Here's what happens next:

1. **Customer sends message** → Webhook receives it
2. **AI analyzes** → References pricing and FAQs
3. **Generates response** → With confidence score
4. **Sends reply** → Or triggers manual alert if unsure
5. **You monitor** → Dashboard shows all activity

**Welcome to automated customer service!** 🤖✨

---

## 💡 Tips for Success

1. **Start small** - Test with a few conversations first
2. **Iterate** - Adjust system prompt based on real interactions
3. **Build knowledge base** - Add FAQs as you go
4. **Monitor closely** - Check dashboard daily at first
5. **Trust the system** - Let AI handle routine queries
6. **Stay updated** - Keep pricing and FAQs current

---

## 📞 Need Help?

- Check the docs (README.md, tasks.md)
- Review webhook examples
- Check Supabase/Vercel logs
- Verify setup with `node scripts/verify-setup.js`

---

**Happy automating!** 🚀
