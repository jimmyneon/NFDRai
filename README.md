# New Forest Device Repairs - AI Responder

A production-ready Next.js 20 admin dashboard for automated AI-powered customer service responses via SMS, WhatsApp, and Messenger.

## 🚀 Features

### Core Functionality
- **Multi-Provider AI Integration**: OpenAI, Anthropic (Claude), Mistral, DeepSeek, Google Gemini, and custom endpoints
- **Automated Response System**: AI-powered replies with confidence scoring and fallback mechanisms
- **Manual Override**: Take control of any conversation with one click
- **Global Kill Switch**: Pause all automation instantly
- **Conversation Management**: View, filter, and manage all customer interactions
- **Pricing Database**: Upload and manage repair prices with expiry dates
- **FAQ Management**: Maintain knowledge base for AI responses
- **Analytics Dashboard**: Track performance, busiest hours, and common queries
- **Sandbox Mode**: Test AI responses before going live
- **Staff Notes**: Add internal notes to conversations
- **Alert System**: Notifications when manual intervention is required

### Technical Features
- **Mobile-First Design**: Touch-friendly UI with big square buttons and tiles
- **Role-Based Access**: Admin, Manager, and Employee roles
- **Row-Level Security**: Supabase RLS policies for data protection
- **Real-Time Updates**: Live conversation status changes
- **CSV Import/Export**: Bulk upload pricing data and export analytics
- **Multi-Channel Support**: SMS, WhatsApp, Messenger integration ready

## 🛠️ Tech Stack

- **Framework**: Next.js 20 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Email/Password + Google OAuth)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **AI Providers**: OpenAI, Anthropic, Mistral, DeepSeek, Custom
- **Email**: Resend (optional)
- **TypeScript**: Full type safety

## 📋 Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Supabase account (free tier works)
- AI provider API key (OpenAI, Anthropic, etc.)
- (Optional) Resend account for email notifications

## 🔧 Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd NFDRAIRESPONDER
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration file:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
3. Enable Google OAuth (optional):
   - Go to **Authentication > Providers**
   - Enable Google provider
   - Add your OAuth credentials

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI (or your preferred provider)
OPENAI_API_KEY=your_openai_api_key

# Resend (optional - for email notifications)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourcompany.com

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Create First Admin User

1. Go to `/login`
2. Sign up with email/password or Google
3. In Supabase dashboard, go to **Table Editor > users**
4. Find your user and change `role` to `admin`

## 🚢 Deployment (Vercel)

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Manual Deployment

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

**Important**: Update `NEXT_PUBLIC_APP_URL` to your production URL.

## 📱 Webhook Integration

### Incoming Messages Endpoint

**URL**: `https://your-domain.com/api/messages/incoming`

**Method**: POST

**Payload**:
```json
{
  "from": "+1234567890",
  "message": "How much for iPhone 14 screen?",
  "channel": "sms",
  "customerName": "John Doe"
}
```

**Response**:
```json
{
  "success": true,
  "response": "AI generated response",
  "confidence": 85,
  "fallback": false
}
```

### Integration Examples

#### MacroDroid (Android)
1. Create a new macro triggered by SMS received
2. Add HTTP Request action
3. Set URL to your webhook endpoint
4. Configure JSON payload with SMS data

#### Twilio (SMS/WhatsApp)
```javascript
// Twilio webhook handler
const response = await fetch('https://your-domain.com/api/messages/incoming', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from: req.body.From,
    message: req.body.Body,
    channel: 'sms'
  })
});
```

#### Meta Messenger
Use Meta's Messenger Platform webhook to forward messages to your endpoint.

## 🎨 Design System

### Colors
- **Primary**: Green (#22c55e) - Main actions, active states
- **Secondary**: Ivory/Cream - Backgrounds
- **Accent**: Gold (#eab308) - Highlights
- **Destructive**: Red - Warnings, delete actions

### Components
- **Buttons**: Rounded 2xl (16px), minimum 44px touch target
- **Cards**: Rounded 2xl with soft shadows
- **Tiles**: Large square buttons for mobile navigation
- **Spacing**: Consistent 4px grid system

## 📊 Database Schema

### Tables
- `users` - Staff accounts with roles
- `customers` - Customer contact information
- `conversations` - Conversation threads
- `messages` - Individual messages
- `prices` - Repair pricing data
- `faqs` - Frequently asked questions
- `docs` - Policy documents
- `ai_settings` - AI provider configuration
- `alerts` - System notifications
- `staff_notes` - Internal conversation notes

See `supabase/migrations/001_initial_schema.sql` for full schema.

## 🔐 Security

- Row-Level Security (RLS) enabled on all tables
- API keys encrypted in database
- Role-based access control
- Secure authentication with Supabase Auth
- HTTPS required in production

## 🧪 Testing

### Sandbox Mode
1. Go to **Dashboard > Sandbox**
2. Enter a test customer query
3. View AI response with confidence score
4. Adjust settings if needed

### Manual Testing
1. Use the webhook endpoint with tools like Postman
2. Send test messages to verify AI responses
3. Check conversation status changes

## 📈 Analytics

The analytics dashboard provides:
- Total conversations and messages
- Auto vs manual response rates
- Channel distribution
- Busiest hours
- Common query terms
- CSV export functionality

## 🛟 Support & Troubleshooting

### Common Issues

**AI responses not working**
- Check AI settings in Dashboard > Settings
- Verify API key is correct
- Ensure AI automation is enabled

**Webhook not receiving messages**
- Check webhook URL is correct
- Verify payload format matches expected structure
- Check Supabase logs for errors

**Authentication issues**
- Clear browser cache and cookies
- Check Supabase Auth settings
- Verify environment variables

### Logs
- Check browser console for frontend errors
- View Vercel logs for API errors
- Check Supabase logs for database issues

## 🤝 Contributing

This is a production app for New Forest Device Repairs. For feature requests or bug reports, please contact the development team.

## 📄 License

Proprietary - All rights reserved.

## 🔗 Links

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)

---

**Built with ❤️ for New Forest Device Repairs**
