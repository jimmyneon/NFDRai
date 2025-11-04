# 🎯 Quick Reference Card

## What You Need (4 Items)

| # | What | Where to Get It | Paste Into |
|---|------|----------------|------------|
| 1 | Supabase URL | supabase.com → Settings → API | `.env.local` line 2 |
| 2 | Supabase anon key | supabase.com → Settings → API | `.env.local` line 3 |
| 3 | Supabase service key | supabase.com → Settings → API (click Reveal) | `.env.local` line 4 |
| 4 | OpenAI API key | platform.openai.com → API Keys | `.env.local` line 7 |

## Quick Commands

```bash
# Start the app
npm run dev

# Verify setup
node scripts/verify-setup.js

# Build for production
npm run build
```

## Key URLs

- **App**: http://localhost:3000
- **Supabase**: https://supabase.com
- **OpenAI**: https://platform.openai.com

## Files to Edit

1. `.env.local` - Add your 4 credentials here

## Files to Read

1. `START_HERE.md` - Step-by-step guide (15 min)
2. `ACTION_REQUIRED.md` - Quick checklist
3. `tasks.md` - Full progress tracker

## MacroDroid Setup

| Macro | Trigger | Action | Purpose |
|-------|---------|--------|---------|
| 1 | SMS Received | HTTP POST to `/api/messages/incoming` | Notify dashboard |
| 2 | Webhook (`send-sms`) | Send SMS | Send from dashboard |
| 3 | SMS Sent | HTTP POST to `/api/messages/send` | Track your replies |
| 4 | Missed Call | HTTP POST to `/api/messages/missed-call` + Send SMS | AI response |

**Webhook URL**: Add to `.env.local`:
```env
MACRODROID_WEBHOOK_URL=https://trigger.macrodroid.com/YOUR_ID/send-sms
```

## Key Points

✅ **One webhook** for AI + manual sends  
✅ **Separate macros** for incoming vs outgoing  
✅ **AI generates** missed call responses  
✅ **Dashboard controls** all routing

## Next Steps

1. Open `YOUR_QUESTIONS_ANSWERED.md` - Answers all your questions
2. Follow `QUICK_FIX_GUIDE.md` - 5-minute setup
3. Read `MACRODROID_FLOW_DIAGRAM.md` - Visual guide
4. Run `npm run dev`
5. Open http://localhost:3000

**Time**: 15 minutes to working app! 🚀
