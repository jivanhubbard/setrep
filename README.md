# Setrep

Workout tracking for **setrep.tech**: log sessions (title, exercises, sets, reps, weights), calendar history, analytics, and deterministic recommendations from your program template plus recent training history.

## Stack

- Next.js (App Router) on Vercel
- Supabase (Postgres + Auth + RLS)
- Tailwind CSS + shadcn-style UI

---

## 1. Supabase (do this first)

### Create the project

1. Go to [supabase.com](https://supabase.com) → **New project** → choose region and a strong DB password.
2. When it’s ready, open **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
   Do **not** put the **service_role** key in Vercel unless you add server-only features that need it; this app runs fine with the anon key in the browser plus RLS.

### Apply the database schema

Run the SQL files **in order** (same order as filenames):

1. Open **SQL Editor** in the Supabase dashboard.
2. Paste and run the full contents of [`supabase/migrations/20260405000000_initial_schema.sql`](supabase/migrations/20260405000000_initial_schema.sql).
3. Paste and run the full contents of [`supabase/migrations/20260405000001_seed_templates_and_exercises.sql`](supabase/migrations/20260405000001_seed_templates_and_exercises.sql).

Alternatively, with the [Supabase CLI](https://supabase.com/docs/guides/cli): link the project and run `supabase db push` (if you point the CLI at these migrations).

### Authentication URLs

In **Authentication → URL configuration**:

| Setting | Value |
|--------|--------|
| **Site URL** | `https://setrep.tech` (use `http://localhost:3000` only while developing locally) |
| **Redirect URLs** | Add each URL on its own line. Minimum for production: `https://setrep.tech/auth/callback`. For local dev, also add `http://localhost:3000/auth/callback`. |

For **Vercel preview deployments** (optional), add each preview URL, e.g. `https://setrep-git-main-yourteam.vercel.app/auth/callback`, or your team’s preview pattern once you know it.

### Email sign-in (magic link)

Under **Authentication → Providers**, ensure **Email** is enabled. Supabase sends magic links using its built-in mailer (fine to start); you can switch to custom SMTP later under **Project Settings → Auth**.

---

## 2. Vercel

### Connect the repo

1. Go to [vercel.com](https://vercel.com) → **Add New… → Project**.
2. Import the **Setrep** GitHub repository.
3. **Framework Preset**: Next.js (auto-detected). Root directory: `.` (default). Build: `next build` (default).

### Environment variables

In the project **Settings → Environment Variables**, add for **Production** (and **Preview** if you use previews):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon public key |

Redeploy after changing env vars (**Deployments → … → Redeploy**).

### Custom domain (setrep.tech)

1. **Project → Settings → Domains** → add `setrep.tech` (and `www.setrep.tech` if you use it).
2. At your DNS host, add the records Vercel shows (usually **A** / **CNAME** to Vercel). Wait for DNS to propagate.

### Smoke test after deploy

1. Open `https://setrep.tech` (or your Vercel URL before the domain works).
2. You should get the **login** page → request a magic link → complete sign-in → **onboarding** → home.
3. If the link opens but auth fails, double-check **Redirect URLs** in Supabase include exactly `https://setrep.tech/auth/callback` (no trailing slash mismatch).

### `500` / `MIDDLEWARE_INVOCATION_FAILED` on Vercel

Almost always one of:

1. **Missing env vars on the deployment you’re hitting** — In Vercel → **Settings → Environment Variables**, ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set for **Production** (and **Preview** if you use preview URLs). Redeploy after saving.
2. **Preview vs Production** — Preview deployments only see variables scoped to **Preview**; they do not inherit Production-only vars unless you duplicate them.
3. **Typo** — Names must match exactly (`NEXT_PUBLIC_…`).

---

## 3. Local development

1. Complete the Supabase steps above (same project for dev and prod is fine).
2. **Authentication → URL configuration**: keep `http://localhost:3000` in **Site URL** or in **Redirect URLs** while testing locally (you can use **Additional Redirect URLs** alongside production).
3. Copy [`.env.example`](.env.example) to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Run:

```bash
npm install
npm run dev
```

---

## Checklist summary

- [ ] Supabase: both migration SQL files applied successfully  
- [ ] Supabase: Email provider on; Site URL + `/auth/callback` redirect URLs correct  
- [ ] Vercel: repo connected; `NEXT_PUBLIC_SUPABASE_*` set; production deploy green  
- [ ] Vercel: **setrep.tech** (or your URL) added and DNS verified  
- [ ] End-to-end: magic link sign-in → onboarding → log a workout  
