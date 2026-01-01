# Supabase Database Setup

This folder contains database migrations and configuration for Sunroof.

## Quick Setup

### Option 1: Supabase Dashboard (Recommended for beginners)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run each migration file in order:
   - `migrations/001_initial_schema.sql`
   - `migrations/002_add_performance_indexes.sql`

### Option 2: Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

## Storage Buckets

Create these storage buckets in the Supabase Dashboard:

### 1. `sunroof-media` (Public)
- For journey photos/media
- Policy: Authenticated users can upload to `{user_id}/*`
- Policy: Public read access

### 2. `avatars` (Public)
- For user profile pictures
- Policy: Authenticated users can upload to `{user_id}/*`
- Policy: Public read access

## Environment Variables

After setup, add these to your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Migrations

| File | Description |
|------|-------------|
| `001_initial_schema.sql` | Core tables, RLS policies, triggers |
| `002_add_performance_indexes.sql` | Performance optimization indexes |

## Database Schema

```
journeys
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── name (TEXT)
├── destination (TEXT, nullable)
├── unlock_date (TIMESTAMPTZ)
├── status (TEXT: active/completed/archived/unlocked)
├── shared_with (UUID[])
├── cover_url (TEXT, nullable)
├── deleted_at (TIMESTAMPTZ, nullable)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)

memories
├── id (UUID, PK)
├── journey_id (UUID, FK → journeys)
├── type (TEXT: photo/text)
├── url (TEXT, nullable)
├── note (TEXT, nullable)
├── metadata (JSONB)
├── deleted_at (TIMESTAMPTZ, nullable)
└── created_at (TIMESTAMPTZ)

push_subscriptions
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── endpoint (TEXT)
├── p256dh (TEXT, nullable)
├── auth (TEXT, nullable)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

