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
- **Mini-Sprint 8** — Revenue & Costs foundation: `revenues` and `costs`
  tables (1 project → many of each), managed from the new
  `/dashboard/projects/[id]` detail page, which also shows
  Revenue/Cost totals and Profit for that project.
- **Mini-Sprint 19** — Profit planning foundation: `estimated_revenues`
  and `estimated_costs` tables (kept separate from `revenues`/`costs`,
  not a shared table with an `is_estimate` flag, so no query for
  actuals can ever accidentally include an estimate). The project
  detail page shows Estimated Revenue/Costs, Estimated Profit/Margin,
  Estimated vs Actual, Cost Variance, and Projected Final Profit (the
  last one only while the project is Active — see
  [Project lifecycle](#project-lifecycle)).
- **Mini-Sprint 21** — Explicit project acceptance: a nullable
  `accepted_at` timestamp on `projects` (not a new status value), set
  once via "Accept Project" — see [Project lifecycle](#project-lifecycle).
- **Mini-Sprint 32** — Navigation: the project detail page now has its
  own "Edit" link (previously only reachable from the Projects list);
  editing a project now returns to that project's detail page instead
  of the list, matching how Revenue/Cost/Estimated edits already
  behaved.
- **Mini-Sprint 34** — Global navigation: `app/dashboard/layout.tsx` +
  `components/DashboardNav.tsx` add a persistent Dashboard/Projects/
  Customers nav bar to every `/dashboard/**` page.
- **Mini-Sprint 35** — Design audit: the three near-identical local
  `StatusBadge` functions were consolidated into
  `components/StatusBadge.tsx`.
- **Mini-Sprint 36** — Design-system foundation: approved navy palette
  as role-named tokens, Inter + tabular figures, `Button` variants
  (primary/secondary/destructive), shared form-control styles
  (`components/fieldStyles.ts`), restyled nav and status badge,
  48px mobile touch targets. Screens themselves are not redesigned yet.
  See `ARCHITECTURE.md`'s Design system section.

- **Mini-Sprint 37** — Dashboard redesign (presentation only): KPI cards
  via the new `components/Card.tsx`, mobile/desktop layouts, "Dashboard"
  heading, "Add Project" action in the header. Data queries and
  calculations are unchanged.

- **Mini-Sprint 40** — Project Profitability chart on the Dashboard:
  a grouped bar chart (Revenue / Costs / Profit per project), placed
  between the KPI cards and the existing Projects card. Built with
  plain HTML/CSS (no charting library) reusing `sumCents`/`formatCents`/
  `profitToneClass` from `lib/finance/money.ts` and the same
  group-by-`project_id` pattern already used on the Projects list page
  — no new calculation, no new table, no new route. The Dashboard's
  `projects`/`revenues`/`costs` queries now also select `id`/`name`/
  `project_id` (previously just `status`/`amount`) so the existing
  per-project totals can be shown; nothing else about those queries
  changed. Every value is shown as text next to its bar, so the chart
  never relies on color alone. Only shown when the user has at least
  one project (no empty chart with invented data); responsive via a
  single flex layout that fills the card on wide screens and scrolls
  horizontally, without squeezing labels, once there are more projects
  than fit.

- **Mini-Sprint 39** — PWA / installable web app: `app/manifest.ts`
  (Next.js 15's built-in manifest route, served at
  `/manifest.webmanifest`) plus icons (`public/icons/icon-192.png`,
  `icon-512.png`, `icon-512-maskable.png`), `public/apple-touch-icon.png`
  and `public/favicon.ico`. `app/layout.tsx` links them via `metadata`
  and sets `theme_color` via the `viewport` export. Uses the existing
  `ink`/`paper` colors and product name/description — no new brand
  identity, no redesign. No service worker: Chrome/Android installability
  only needs a valid manifest + HTTPS + icons, and adding one would have
  meant either a no-op file or venturing into caching, which this sprint
  intentionally excludes (offline support is out of scope). No business
  logic, routes, or existing screens were touched.

- **Mini-Sprint 38** — Design completion (presentation only): Project
  Details redesigned to the same language as the Dashboard — header
  (name, status, customer, Edit), Profitability Check, Actual,
  Estimated, Estimated vs Actual (+ Cost Variance, Projected Final
  Profit while Active), then a "Project actions" card (Accept /
  Mark as Completed). `Card`, `Button` and `StatusBadge` are reused;
  ledger rows stack on mobile with 48px touch targets. The Dashboard
  was verified as already complete and left unchanged. No calculations,
  queries, routes or lifecycle rules changed.

Not implemented yet: invoices, payments, reports. The dashboard shows
simple running totals (all-time sums), not date-range or per-period
metrics.

## Stack

- [Next.js](https://nextjs.org) (App Router) + React + TypeScript
- [Tailwind CSS](https://tailwindcss.com) for styling
- [Supabase](https://supabase.com) for auth and database
- [Vercel](https://vercel.com) for hosting/deployment

## Project structure

```
app/
  dashboard/
    customers/        Customers list, create, edit (protected)
    projects/         Projects list, create, edit
      [id]/            Detail page: Actual + Estimated financials,
                        Accept/Complete actions, Edit link; nested
                        revenue/, costs/, estimated-revenue/,
                        estimated-costs/ create+edit routes
  login/, signup/      Auth pages
  forgot-password/,
  reset-password/      Password recovery pages
  auth/callback/       OAuth/recovery code exchange (route handler)
components/            Shared, reusable UI primitives (Button, TextField,
                       SelectField, TextareaField)
lib/
  auth/                Auth server actions, error mapping, constants
  customers/           Customer server actions, status constants
  projects/            Project server actions (create/update/delete/
                       accept/complete), status constants
  revenue/             Revenue server actions
  costs/               Cost server actions, category constants
  estimated-revenue/   Estimated Revenue server actions
  estimated-costs/     Estimated Cost server actions
  finance/             Shared money helpers (cents math) + shared
                       description/amount/date/ownership validation
  supabase/            Supabase client factories (browser, server, middleware)
public/                Static assets
supabase/
  migrations/          SQL migrations (schema, RLS policies)
types/                 Shared TypeScript types (hand-written, mirrors
                       the migrations — see Database schema below)
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for how these layers fit
together, module-by-module conventions, and boundaries future changes
must not break.

## Database schema

Defined across five migrations in `supabase/migrations/`:
`20260909075059_create_profiles_and_customers.sql`,
`20260910165452_create_projects.sql`,
`20260911000458_create_revenue_and_costs.sql`,
`20260917083615_create_estimated_revenue_and_costs.sql`, and
`20260918012926_add_accepted_at_to_projects.sql`.

- **profiles** — one row per authenticated user, keyed by the same UUID
  as `auth.users.id`. A `handle_new_user` trigger inserts this row
  automatically on signup, so there's no client-side insert path.
- **customers** — belongs to one profile via `user_id` (profiles 1 →
  many customers).
- **projects** — belongs to one profile and one customer (customers 1 →
  many projects). `customer_id` is `ON DELETE RESTRICT`, so a customer
  with projects can't be deleted until they are. `status` defaults to
  `'Active'` and `accepted_at` is a nullable timestamp (see
  [Project lifecycle](#project-lifecycle) — neither is a DB-level
  enum/check, both are app-validated only, by deliberate consistency
  with `customers.status`).
- **revenues** / **costs** / **estimated_revenues** / **estimated_costs**
  — each belongs to one profile and one project (projects 1 → many of
  each). `project_id` is also `ON DELETE RESTRICT` for the same reason
  as `customer_id` above. Amounts are `numeric(12,2)` with a DB-level
  `check (amount > 0)`, never floating point. Estimated tables are
  kept structurally separate from the actual tables (not a shared
  table with an `is_estimate` flag), so no query for actuals can ever
  accidentally include an estimate.

Row Level Security is enabled on all seven tables. Every policy checks
`auth.uid()` against the row's owner (`user_id`, or `id` for profiles);
`projects`/`revenues`/`costs`/`estimated_revenues`/`estimated_costs`
additionally require, at the RLS layer, that the referenced
customer/project belongs to the same user:

| Table              | select   | insert                            | update                            | delete   |
|--------------------|----------|------------------------------------|------------------------------------|----------|
| profiles           | own row  | — (trigger only)                   | own row                            | —        |
| customers          | own rows | own rows                           | own rows                           | own rows |
| projects           | own rows | own rows + customer must be own    | own rows + customer must be own    | own rows |
| revenues           | own rows | own rows + project must be own     | own rows + project must be own     | own rows |
| costs              | own rows | own rows + project must be own     | own rows + project must be own     | own rows |
| estimated_revenues | own rows | own rows + project must be own     | own rows + project must be own     | own rows |
| estimated_costs    | own rows | own rows + project must be own     | own rows + project must be own     | own rows |

To apply the migrations to a Supabase project: `npx supabase db push`
(or run the SQL files directly in the Supabase SQL editor).

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

Auth (`lib/auth/actions.ts`), and CRUD for customers, projects, revenue,
costs, estimated revenue, and estimated costs (`lib/customers/`,
`lib/projects/`, `lib/revenue/`, `lib/costs/`, `lib/estimated-revenue/`,
`lib/estimated-costs/`), are all implemented as server actions that call
`createClient()` from `lib/supabase/server.ts` and re-check
`auth.getUser()` themselves — every query is scoped to the signed-in
user's id (and, for projects/revenue/costs, to the parent
customer/project's owner too), with Row Level Security as the final
backstop.

## Authentication

Signup, login, logout, and password recovery are implemented
end-to-end (`lib/auth/actions.ts`, `app/login/`, `app/signup/`,
`app/forgot-password/`, `app/reset-password/`,
`app/auth/callback/route.ts`). Supabase (GoTrue) error strings are
mapped to plain user-facing copy in `lib/auth/errors.ts` rather than
shown directly.

**Password recovery**: the login page links to a "forgot password"
flow — request a reset email, open the link, set a new password. In
Supabase, add the app's exact URL and `/auth/callback` path to
**Authentication → URL Configuration → Redirect URLs**. Set
`NEXT_PUBLIC_SITE_URL` in production to the canonical site origin (for
example, `https://your-app.vercel.app`). The email redirect uses
`/auth/callback?next=/reset-password`; the callback route only ever
accepts that one fixed `next` value (never an arbitrary redirect
target from the query string).

`middleware.ts` protects every `/dashboard/*` route (redirects signed-out
users to `/login`); each protected page also re-checks `auth.getUser()`
itself, since middleware responses can be cached.

## Project lifecycle

A project's `status` is one of `Active` (default on create), `Completed`,
or `Archived` (`lib/projects/constants.ts`). Two dedicated, guarded
actions exist in `lib/projects/actions.ts`:

- **Complete** (`completeProject`) — only succeeds if the project's
  current status is exactly `Active`.
- **Accept** (`acceptProject`) — sets `accepted_at` (a separate,
  one-way timestamp, unrelated to `status`); this represents the user
  reviewing and accepting the project's profitability check, not a
  workflow stage.

There is no dedicated "Archive" action — `Archived` is only reachable
through the generic Edit Project form's status dropdown, which (unlike
`completeProject`) does not validate what transition is being made:
any status can be changed to any other status from that form. Revenue,
Costs, Estimated Revenue, and Estimated Costs are **not** locked when a
project is Completed or Archived — they remain fully editable through
the same forms used for an Active project. The "Projected Final
Profit" figure on the project detail page is only rendered while
`status === "Active"` (it disappears, rather than freezing, once the
project leaves that state). These are documented behaviors of the
current code, not proposals — see `ARCHITECTURE.md` before changing
any of them.

## Navigation

As of Mini-Sprint 34, `app/dashboard/layout.tsx` wraps every
`/dashboard/**` page with a persistent nav bar
(`components/DashboardNav.tsx`, three links: Dashboard, Projects,
Customers) — this is the only shared layout/nav in the app;
`app/layout.tsx` itself is still just the root HTML shell/fonts. Each
page additionally still owns its own local "back" link for immediate
context. The established convention for those: creating or editing
Revenue, Costs, Estimated Revenue, or Estimated Costs always returns to
that project's detail page (`/dashboard/projects/[id]`); as of
Mini-Sprint 32, editing the project itself follows the same
convention (previously it returned to the Projects list). The project
detail page and the Projects list both link to Edit Project.

## What's intentionally not here yet

Invoices, payments, and reports are **not** implemented. The dashboard
shows simple all-time running totals, not date-range or per-period
metrics.
