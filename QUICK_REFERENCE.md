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

## Next Steps

1. Open `START_HERE.md`
2. Follow steps 1-10
3. Run `npm run dev`
4. Open http://localhost:3000

**Time**: 15 minutes to working app! 🚀
