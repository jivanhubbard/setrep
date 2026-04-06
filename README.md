# Setrep

Workout tracking for **setrep.tech**: log sessions (title, exercises, sets, reps, weights), calendar history, analytics, and deterministic recommendations from your program template plus recent training history.

## Stack

- Next.js (App Router) on Vercel
- Supabase (Postgres + Auth + RLS)
- Tailwind CSS + shadcn-style UI

## Local setup

1. Create a Supabase project and run SQL migrations in order from [`supabase/migrations/`](supabase/migrations/) (SQL editor or `supabase db push` with CLI).

2. In Supabase **Authentication → URL configuration**, add:

   - Site URL: `http://localhost:3000` (and production URL when deployed)
   - Redirect URLs: `http://localhost:3000/auth/callback`, `https://your-domain.com/auth/callback`

3. Copy [`.env.example`](.env.example) to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

4. Install and run:

```bash
npm install
npm run dev
```

## Deploy (Vercel)

- Import the repo, set the same env vars as `.env.example`, deploy.
- Add **setrep.tech** under Project → Domains and point DNS per Vercel’s instructions.
- Add production redirect URLs in Supabase Auth for `https://setrep.tech/auth/callback`.
