# Sunroof

A time-capsule photo journal. Capture moments during your journeys and unlock them later.

![Sunroof](https://getsunroof.com/og-image.png)

## Quick Start

```bash
npm install
npm run dev
```

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=              # optional
```

## Stack

- **Next.js 16** with App Router
- **Supabase** for auth, database, storage
- **Tailwind CSS v4**
- **TypeScript**

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm test             # Unit tests (Vitest)
npm run test:e2e     # E2E tests (Playwright)
```

## Structure

```
src/
├── app/           # Routes
├── components/    # UI + feature components
├── hooks/         # Custom hooks
├── lib/           # Utilities
├── providers/     # Context providers
├── services/      # Data layer
└── types/         # TypeScript types
```

## License

MIT
