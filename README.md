# Profitabilly

Profitabilly is a SaaS for tracking project and job profitability. Users log
revenue and costs against each project or job, and Profitabilly calculates
profit and profit margin — for agencies, consultants, freelancers,
construction, contractors, and other service businesses.

## Status

- **Mini-Sprint 1** — Next.js/Tailwind/Supabase project shell, static homepage.
- **Mini-Sprint 2** — `profiles` + `customers` tables with Row Level
  Security (see [Database schema](#database-schema)).
- **Mini-Sprint 3** — Auth: signup, login, logout, protected `/dashboard`.
- **Mini-Sprint 4** — Customers feature: list, create, edit, delete under
  `/dashboard/customers`, scoped to the authenticated user by both
  application code and RLS.
- **Mini-Sprint 6** — Customers hardening: fixed silent success on
  zero-row update/delete, unchecked profile-save error in signup,
  duplicated status constants.
- **Mini-Sprint 7** — Projects/Jobs foundation: `projects` table (1
  customer → many projects), list/create/edit/delete under
  `/dashboard/projects`, same per-user isolation pattern as Customers.

Not implemented yet: revenue, costs, profit calculations, dashboard
metrics, reports, payments — later mini-sprints.

## Stack

- [Next.js](https://nextjs.org) (App Router) + React + TypeScript
- [Tailwind CSS](https://tailwindcss.com) for styling
- [Supabase](https://supabase.com) for auth and database
- [Vercel](https://vercel.com) for hosting/deployment

## Project structure

```
app/
  dashboard/
    customers/       Customers list, create, edit (protected)
    projects/        Projects list, create, edit (protected)
  login/, signup/     Auth pages
components/          Shared, reusable UI primitives
lib/
  auth/              Auth server actions, error mapping
  customers/          Customer server actions
  projects/          Project server actions
  supabase/          Supabase client factories (browser, server, middleware)
public/              Static assets
supabase/
  migrations/        SQL migrations (schema, RLS policies)
types/               Shared TypeScript types
```

## Database schema

Defined in `supabase/migrations/20260909075059_create_profiles_and_customers.sql`.

- **profiles** — one row per authenticated user, keyed by the same UUID
  as `auth.users.id`. A `handle_new_user` trigger inserts this row
  automatically on signup, so there's no client-side insert path.
- **customers** — belongs to one profile via `user_id` (profiles 1 →
  many customers).

Row Level Security is enabled on both tables. Every policy checks
`auth.uid()` against the row's owner, so a user can only:

| Table     | select | insert | update | delete |
|-----------|--------|--------|--------|--------|
| profiles  | own row | — (trigger only) | own row | — |
| customers | own rows | own rows | own rows | own rows |

To apply the migration to a Supabase project: `npx supabase db push`
(or run the SQL file directly in the Supabase SQL editor).

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in your Supabase project values
npm run dev
```

Then open http://localhost:3000.

Other scripts:

```bash
npm run build       # production build
npm run typecheck   # tsc --noEmit
npm run lint        # next lint
```

## Supabase

`lib/supabase/client.ts` and `lib/supabase/server.ts` are the only two
Supabase client factories in the app (for Client Components, and for
Server Components/Actions respectively), using `@supabase/ssr` so
cookies are handled correctly under the App Router. `lib/supabase/middleware.ts`
is the edge-runtime companion used by `middleware.ts` to refresh the
session cookie and protect `/dashboard/*` — not a second client
implementation, just the standard pattern for middleware, which can't
import `next/headers`.

Auth (`lib/auth/actions.ts`) and customer CRUD (`lib/customers/actions.ts`)
are both implemented as server actions that call `createClient()` from
`lib/supabase/server.ts` and re-check `auth.getUser()` themselves —
every customer query is scoped to the signed-in user's id, with Row
Level Security as the final backstop.

## What's intentionally not here yet

The following are **not** implemented: projects, revenue, costs,
dashboard metrics, payments, reports. These land in later mini-sprints.
