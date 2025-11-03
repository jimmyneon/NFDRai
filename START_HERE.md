# 🚀 START HERE - Your Next 15 Minutes

## ✅ What's Done
- All code is written (80+ files)
- Dependencies installed (347 packages)
- `.env.local` file created
- Documentation complete

## ⏳ What You Need to Do

You need to get **4 credentials** and paste them into `.env.local`

---

## 📝 Step-by-Step Instructions

### 1️⃣ Create Supabase Account (2 minutes)

**Action**: Open https://supabase.com in your browser

1. Click **"Start your project"**
2. Sign up with **GitHub** (recommended) or email
3. Verify your email if needed

---

### 2️⃣ Create Supabase Project (3 minutes)

**In Supabase Dashboard**:

1. Click **"New Project"**
2. Fill in:
   - **Organization**: Create new or use existing
   - **Name**: `nfd-ai-responder`
   - **Database Password**: Click "Generate a password" 
     - ⚠️ **SAVE THIS PASSWORD!** Copy it somewhere safe
   - **Region**: Choose closest to you
     - UK: `London`
     - US East: `East US (North Virginia)`
     - US West: `West US (Oregon)`
3. Click **"Create new project"**
4. ⏳ **Wait 2 minutes** while it sets up (grab a coffee!)

---

### 3️⃣ Run Database Migration (2 minutes)

**In Supabase Dashboard**:

1. Click **"SQL Editor"** in left sidebar
2. Click **"New Query"** button
3. **In VS Code**: Open `supabase/migrations/001_initial_schema.sql`
4. **Select ALL** (Cmd+A or Ctrl+A)
5. **Copy** (Cmd+C or Ctrl+C)
6. **Back to Supabase**: Paste into the SQL Editor
7. Click **"Run"** button (or Cmd+Enter)
8. ✅ You should see: **"Success. No rows returned"**

**Verify it worked**:
- Click **"Table Editor"** in left sidebar
- You should see 10 tables: users, customers, conversations, messages, prices, faqs, docs, ai_settings, alerts, staff_notes

---

### 4️⃣ Get Supabase Credentials (2 minutes)

**In Supabase Dashboard**:

1. Click **"Project Settings"** (gear icon ⚙️ in left sidebar)
2. Click **"API"** in the settings menu
3. You'll see your credentials:

**Copy these 3 values** (you'll paste them in next step):

📋 **A. Project URL**
- Look for "Project URL"
- Example: `https://abcdefghijklmnop.supabase.co`
- Copy this entire URL

📋 **B. anon public key**
- Look for "Project API keys" section
- Find the "anon" "public" key
- It's a very long string starting with `eyJ...`
- Click the copy icon or select and copy

📋 **C. service_role key**
- In same section, find "service_role"
- Click **"Reveal"** button first
- ⚠️ **KEEP THIS SECRET!**
- Copy the long string starting with `eyJ...`

---

### 5️⃣ Get OpenAI API Key (3 minutes)

**Action**: Open https://platform.openai.com in your browser

1. Sign up or log in
2. Click your **profile icon** (top right)
3. Click **"View API keys"** or go to https://platform.openai.com/api-keys
4. Click **"Create new secret key"**
5. Name it: `NFD AI Responder`
6. Click **"Create secret key"**
7. 📋 **COPY THE KEY** - starts with `sk-proj-` or `sk-`
8. ⚠️ **SAVE IT!** You won't see it again

**Note**: You may need to add a payment method. OpenAI charges per use (very cheap for testing - usually <$1/day)

---

### 6️⃣ Update .env.local File (2 minutes)

**In VS Code**:

1. Open the file: `.env.local`
2. Replace the placeholder values with YOUR credentials:

```env
# Supabase - PASTE YOUR VALUES HERE
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR-LONG-KEY-HERE
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR-LONG-KEY-HERE

# OpenAI - PASTE YOUR API KEY HERE
OPENAI_API_KEY=sk-proj-YOUR-KEY-HERE

# Resend (optional - leave as is for now)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourcompany.com

# App Configuration (already correct - don't change)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

3. **Save the file** (Cmd+S or Ctrl+S)

---

### 7️⃣ Enable Supabase Authentication (1 minute)

**In Supabase Dashboard**:

1. Click **"Authentication"** in left sidebar
2. Click **"Providers"** tab
3. Verify **"Email"** is enabled (should be green/on by default)
4. (Optional) Enable **"Google"** if you want Google login

---

### 8️⃣ Start the Development Server! (1 minute)

**In your terminal** (in VS Code or separate terminal):

```bash
npm run dev
```

**You should see**:
```
▲ Next.js 15.0.0
- Local:        http://localhost:3000

✓ Ready in 2.3s
```

---

### 9️⃣ Open the App! 🎉

**In your browser**:

1. Go to: **http://localhost:3000**
2. You should see the **login page** with:
   - Email/password fields
   - Google sign-in button
   - Nice green theme

**If you see this - SUCCESS!** 🎉

---

### 🔟 Create Your Admin Account (2 minutes)

**In the browser**:

1. Click **"Sign Up"** (or use Google)
2. Enter your **email** and **password**
3. Click **"Sign In"**
4. You'll be redirected to the dashboard

**Make yourself admin**:

1. Go back to **Supabase Dashboard**
2. Click **"Table Editor"** → **"users"** table
3. You should see your user (just created)
4. Click the **"role"** cell
5. Change from `employee` to `admin`
6. Click the **checkmark** ✓ to save
7. **Back in the app**: Log out and log back in
8. Now you have full admin access!

---

## 🎊 You're Live!

If you made it here, your AI customer service system is now running!

### What to Do Next:

1. **Configure AI** (Dashboard → Settings)
   - Add your OpenAI key
   - Set system prompt
   - Enable automation

2. **Add Data** (Dashboard → Pricing & FAQs)
   - Upload sample pricing CSV
   - Add common FAQs

3. **Test AI** (Dashboard → Sandbox)
   - Try: "How much for iPhone 14 screen?"
   - Verify AI responds correctly

---

## 🆘 Troubleshooting

### App won't start?
```bash
# Check your .env.local has real values (no "your_" placeholders)
cat .env.local

# Clear cache and restart
rm -rf .next
npm run dev
```

### Can't see login page?
- Check terminal for errors
- Make sure port 3000 isn't already in use
- Try http://127.0.0.1:3000 instead

### Login doesn't work?
- Check Supabase Auth is enabled
- Verify credentials in `.env.local` are correct
- Check browser console (F12) for errors

### "Invalid API key" error?
- Double-check you copied the full key
- Make sure there are no extra spaces
- Verify the key in Supabase/OpenAI dashboard

---

## 📞 Need Help?

1. Check browser console (F12) for errors
2. Check terminal for error messages
3. Review `SETUP_NOW.md` for more details
4. Verify credentials are correct in `.env.local`

---

## ✅ Checklist

Use this to track your progress:

- [ ] Created Supabase account
- [ ] Created Supabase project
- [ ] Ran database migration (SQL)
- [ ] Copied Project URL
- [ ] Copied anon key
- [ ] Copied service_role key
- [ ] Got OpenAI API key
- [ ] Updated `.env.local` with all 4 credentials
- [ ] Enabled Supabase Email auth
- [ ] Ran `npm run dev`
- [ ] Opened http://localhost:3000
- [ ] Saw login page
- [ ] Created account
- [ ] Changed role to admin
- [ ] Logged back in

---

**Total Time**: ~15 minutes

**You've got this!** 🚀

Follow each step carefully and you'll have a working AI customer service system in no time!
