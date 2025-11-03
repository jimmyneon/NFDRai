# 🚀 Setup Instructions - Do This Now!

## ⚠️ IMPORTANT: You Need to Complete These Steps

The `.env.local` file has been created, but it needs **YOUR credentials** to work.

---

## Step 1: Create Supabase Project (5 minutes)

### Go to Supabase
1. Open [https://supabase.com](https://supabase.com) in your browser
2. Click **"Start your project"** or **"Sign In"**
3. Sign up with GitHub (recommended) or email

### Create New Project
1. Click **"New Project"**
2. Fill in:
   - **Organization**: Create new or select existing
   - **Name**: `nfd-ai-responder`
   - **Database Password**: Click "Generate a password" (SAVE THIS!)
   - **Region**: Choose closest to you (e.g., `London` for UK)
3. Click **"Create new project"**
4. ⏳ Wait ~2 minutes for setup to complete

---

## Step 2: Run Database Migration (3 minutes)

### In Supabase Dashboard:
1. Click **"SQL Editor"** in the left sidebar
2. Click **"New Query"**
3. Open this file in your editor: `supabase/migrations/001_initial_schema.sql`
4. **Copy ALL contents** (Cmd+A, Cmd+C)
5. **Paste** into Supabase SQL Editor
6. Click **"Run"** button (or press Cmd+Enter)
7. ✅ You should see: **"Success. No rows returned"**

### Verify Tables Created:
1. Click **"Table Editor"** in left sidebar
2. You should see 10 tables:
   - users
   - customers
   - conversations
   - messages
   - prices
   - faqs
   - docs
   - ai_settings
   - alerts
   - staff_notes

---

## Step 3: Get Supabase Credentials (2 minutes)

### In Supabase Dashboard:
1. Click **"Project Settings"** (gear icon in left sidebar)
2. Click **"API"** in the settings menu
3. **Copy these 3 values:**

   **A. Project URL**
   - Look for "Project URL"
   - Starts with `https://`
   - Example: `https://abcdefghijklmnop.supabase.co`
   - 📋 Copy this

   **B. anon/public key**
   - Look for "Project API keys" → "anon" "public"
   - Starts with `eyJ...`
   - Very long string
   - 📋 Copy this

   **C. service_role key**
   - Click **"Reveal"** next to service_role
   - ⚠️ KEEP THIS SECRET!
   - Starts with `eyJ...`
   - Very long string
   - 📋 Copy this

---

## Step 4: Get OpenAI API Key (3 minutes)

### Go to OpenAI:
1. Open [https://platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Click your **profile icon** (top right)
4. Click **"View API keys"**
5. Click **"Create new secret key"**
6. Name it: `NFD AI Responder`
7. Click **"Create secret key"**
8. 📋 **COPY THE KEY** (starts with `sk-`)
9. ⚠️ Save it somewhere - you won't see it again!

---

## Step 5: Update .env.local File (2 minutes)

### Edit the file:
1. Open `.env.local` in your editor
2. Replace the placeholder values with YOUR credentials:

```env
# Supabase - PASTE YOUR VALUES HERE
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI - PASTE YOUR API KEY HERE
OPENAI_API_KEY=sk-proj-...

# Resend (optional - leave as is for now)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourcompany.com

# App Configuration (already set - don't change)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

3. **Save the file** (Cmd+S)

---

## Step 6: Enable Supabase Authentication (1 minute)

### In Supabase Dashboard:
1. Click **"Authentication"** in left sidebar
2. Click **"Providers"**
3. Make sure **"Email"** is enabled (should be by default)
4. (Optional) Enable **"Google"** if you want Google OAuth

---

## Step 7: Start the Development Server (1 minute)

### In your terminal:
```bash
npm run dev
```

### You should see:
```
▲ Next.js 15.0.0
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in 2.3s
```

---

## Step 8: Open the App (NOW!)

1. Open your browser
2. Go to: [http://localhost:3000](http://localhost:3000)
3. You should see the **login page** 🎉

---

## Step 9: Create Your Admin Account (2 minutes)

### Sign Up:
1. Click **"Sign Up"** (or use Google if you enabled it)
2. Enter your **email** and **password**
3. Click **"Sign In"**
4. You'll be redirected to the dashboard

### Make Yourself Admin:
1. Go back to **Supabase Dashboard**
2. Click **"Table Editor"** → **"users"**
3. Find your user (just created, should be the only one)
4. Click the **"role"** cell
5. Change from `employee` to `admin`
6. Click the **checkmark** to save
7. **Log out** of the app and **log back in**

---

## Step 10: Configure AI Settings (5 minutes)

### In the App:
1. Go to **Dashboard → Settings**
2. Fill in:
   - **AI Provider**: Select `OpenAI`
   - **API Key**: Paste your OpenAI key
   - **Model**: Select `gpt-3.5-turbo` (cheaper) or `gpt-4-turbo-preview` (better)
   - **Temperature**: `0.7`
   - **Max Tokens**: `500`
   - **Confidence Threshold**: `70`
   - **System Prompt**:
     ```
     You are a helpful customer service assistant for New Forest Device Repairs. 
     Be friendly, professional, and concise. Always reference our pricing and 
     FAQ database when answering questions. If you're not confident about an 
     answer, say so.
     ```
   - **Fallback Message**:
     ```
     Thanks for your message! I want to make sure I give you accurate information, 
     so I'm passing this to one of our team members who will respond shortly.
     ```
   - **AI Automation Active**: Toggle ON ✅
3. Click **"Save Settings"**

---

## Step 11: Add Sample Data (3 minutes)

### Add Pricing:
1. Go to **Dashboard → Pricing**
2. Click **"Upload CSV"**
3. Select `sample-data/pricing-template.csv`
4. Verify prices imported successfully

### Add FAQs:
1. Go to **Dashboard → FAQs**
2. Click **"Add FAQ"** and add:

   **FAQ 1:**
   - Question: `What are your opening hours?`
   - Answer: `We're open Monday-Friday 9am-6pm, Saturday 10am-4pm. Closed Sundays.`

   **FAQ 2:**
   - Question: `Do you offer a warranty?`
   - Answer: `Yes! All repairs come with a 90-day warranty on parts and labor.`

   **FAQ 3:**
   - Question: `What payment methods do you accept?`
   - Answer: `We accept cash, all major credit/debit cards, Apple Pay, and Google Pay.`

---

## Step 12: Test in Sandbox (3 minutes)

### Test Your AI:
1. Go to **Dashboard → Sandbox**
2. Enter test query:
   ```
   How much for iPhone 14 screen replacement?
   ```
3. Click **"Test AI Response"**
4. ✅ You should see:
   - AI response mentioning **£149.99**
   - Confidence score **80%+**
   - Provider: **OpenAI**

### Test More Queries:
- "What are your opening hours?"
- "Do you offer warranty?"
- "Can I pay with card?"

---

## 🎉 YOU'RE LIVE!

If all steps completed successfully, your AI customer service system is now running!

### What You Have Now:
✅ Working dashboard  
✅ AI configured and tested  
✅ Pricing database loaded  
✅ FAQs ready  
✅ Sandbox for testing  

### Next Steps:
- Connect your messaging platform (see `WEBHOOK_EXAMPLES.md`)
- Deploy to production (see `DEPLOYMENT.md`)
- Monitor and optimize

---

## 🆘 Troubleshooting

### App won't start?
```bash
# Check .env.local has all values (no "your_" placeholders)
cat .env.local

# Reinstall dependencies
rm -rf node_modules
npm install

# Clear Next.js cache
rm -rf .next
npm run dev
```

### Can't log in?
- Check Supabase Auth is enabled
- Verify credentials in `.env.local`
- Check browser console for errors

### AI not responding in Sandbox?
- Verify OpenAI API key is correct
- Check you have credits in OpenAI account
- Ensure AI Automation is enabled in Settings

---

## 📞 Need Help?

1. Check `README.md` for full documentation
2. Review `GETTING_STARTED.md` for detailed guide
3. See `tasks.md` for step-by-step checklist
4. Check browser console and terminal for error messages

---

**Total Time: ~30 minutes**

**You've got this! 🚀**
