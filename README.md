# 🌅 Sunroof

**Capture now, relive later.**

Sunroof is a time-capsule photo journal app. Take photos and notes during your journeys, and unlock them when you're ready to remember.

![Sunroof](https://getsunroof.com/og-image.png)

## ✨ Features

- **Journey-Based Organization**: Group memories by trip, vacation, or experience
- **Time-Locked Memories**: Photos and notes stay hidden until your chosen unlock date
- **Magic Link Auth**: Passwordless sign-in via email
- **PWA Support**: Install on iOS/Android for a native-like experience
- **Collaborative Journeys**: Share journeys with friends and family
- **AI Recaps**: Get AI-generated summaries of your unlocked memories
- **Push Notifications**: Get notified when your memories unlock
- **Offline Support**: View cached content when offline
- **Image Compression**: Automatic client-side compression for fast uploads

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (Auth, Database, Storage)
- **AI**: OpenAI API (GPT-4o-mini)
- **Testing**: Vitest + Playwright
- **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- (Optional) OpenAI API key for AI features

### Environment Variables

Create a `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# OpenAI (optional - for AI recaps)
OPENAI_API_KEY=your_openai_key

# Push Notifications (optional)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
```

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/sunroof-app.git
cd sunroof-app

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 📁 Project Structure

```
sunroof-app/
├── app/                    # Next.js App Router pages
│   ├── api/                # API routes
│   │   └── ai/             # AI endpoints
│   ├── components/         # React components
│   ├── login/              # Login page
│   ├── profile/            # User profile
│   ├── settings/           # App settings
│   ├── privacy/            # Privacy policy
│   ├── terms/              # Terms of service
│   └── layout.tsx          # Root layout
├── lib/                    # Utility libraries
│   ├── auth.tsx            # Auth context
│   ├── supabase.ts         # Supabase client
│   ├── haptics.ts          # Vibration feedback
│   ├── notifications.ts    # Push notifications
│   └── imageCompression.ts # Image compression
├── public/                 # Static assets
├── tests/                  # Unit tests (Vitest)
├── e2e/                    # E2E tests (Playwright)
└── middleware.ts           # Auth middleware
```

## 🧪 Testing

```bash
# Unit tests (watch mode)
npm test

# Unit tests (single run)
npm run test:run

# Unit tests with coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui
```

## 🗄 Database Schema

### Tables

```sql
-- Journeys table
CREATE TABLE journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  destination TEXT,
  unlock_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active',
  shared_with UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memories table
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID REFERENCES journeys(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'photo' or 'text'
  url TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push subscriptions (optional)
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT,
  auth TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);
```

### RLS Policies

Enable Row Level Security on all tables and add appropriate policies for user data isolation.

## 🚢 Deployment

### Vercel

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy

### Supabase Setup

1. Create a new Supabase project
2. Run the database schema SQL
3. Enable RLS and add policies
4. Create storage buckets: `sunroof-media`, `avatars`
5. Configure email templates for magic links

## 📱 PWA Installation

### iOS
1. Open Safari and navigate to getsunroof.com
2. Tap the Share button
3. Tap "Add to Home Screen"

### Android
1. Open Chrome and navigate to getsunroof.com
2. Tap the install banner or menu → "Install app"

## 🔒 Security

- Passwordless authentication via Supabase Magic Links
- Row Level Security (RLS) on all database tables
- Server-side session management
- Rate limiting on AI endpoints
- Client-side input validation

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org)
- [Supabase](https://supabase.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)
- [Vercel](https://vercel.com)

---

**Made with ☀️ by Sunroof**

[getsunroof.com](https://getsunroof.com)
