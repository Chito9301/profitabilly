# Architecture

This document describes the actual, current architecture of
Profitabilly — for a human developer or an AI coding agent picking up
this codebase. It reflects what the code does today, not a target
design. See `README.md` first for stack, setup, and a feature-level
status list; this file goes one layer deeper: how things fit together,
and what must not be broken when extending them.

## Layers

Every feature (Customers, Projects, Revenue, Costs, Estimated Revenue,
Estimated Costs) follows the same three-layer shape:

1. **Client Components** — forms (`"use client"`), using React's
   `useActionState` to call a Server Action and show its returned
   `{ error }`/`{ message }` state. Shared primitives live in
   `components/` (`Button`, `TextField`, `SelectField`,
   `TextareaField`).
2. **Server Actions** — `"use server"` functions in `lib/<feature>/actions.ts`.
   Every action independently re-checks `supabase.auth.getUser()` —
   never trusts that the page that rendered the form already checked
   auth, because a Server Action is callable directly, on its own, as
   a public endpoint.
3. **Supabase (Postgres + RLS)** — `lib/supabase/{client,server,middleware}.ts`
   are the *only* three client factories; there is no fourth. Every
   table has Row Level Security enabled, and every RLS policy mirrors
   an ownership check already done in the Server Action layer. This is
   deliberate belt-and-suspenders, not redundancy to clean up: the
   in-app check exists to produce a clear error message; RLS exists so
   the same rule holds even if a query is ever issued a different way.
   **When adding a table or column, both layers must be updated
   together** — adding an app-level check without the matching RLS
   policy (or vice versa) breaks this invariant silently.

## Module map

| Feature            | Actions                              | Constants                     | Forms / pages                                                |
|---------------------|---------------------------------------|--------------------------------|----------------------------------------------------------------|
| Customers           | `lib/customers/actions.ts`            | `lib/customers/constants.ts` (`STATUSES`) | `app/dashboard/customers/**` |
| Projects            | `lib/projects/actions.ts`             | `lib/projects/constants.ts` (`STATUSES`)  | `app/dashboard/projects/**` (list, new, `[id]`, `[id]/edit`) |
| Revenue             | `lib/revenue/actions.ts`              | —                              | `app/dashboard/projects/[id]/revenue/**` |
| Costs               | `lib/costs/actions.ts`                | `lib/costs/constants.ts` (`CATEGORIES`) | `app/dashboard/projects/[id]/costs/**` |
| Estimated Revenue   | `lib/estimated-revenue/actions.ts`    | —                              | `app/dashboard/projects/[id]/estimated-revenue/**` |
| Estimated Costs     | `lib/estimated-costs/actions.ts`      | reuses `lib/costs/constants.ts` | `app/dashboard/projects/[id]/estimated-costs/**` |
| Auth                | `lib/auth/actions.ts`                 | `lib/auth/constants.ts` (`BUSINESS_TYPES`, `CURRENCIES`) | `app/login/`, `app/signup/`, `app/forgot-password/`, `app/reset-password/`, `app/auth/callback/` |

Estimated Costs deliberately reuses `costs`' category list rather than
defining its own — there is one cost taxonomy, not two.

## Finance / calculations

`lib/finance/money.ts` holds all shared money math:

- Amounts are stored and passed around as **strings** end-to-end
  (Postgres `numeric(12,2)` comes back from PostgREST as a string).
  They are converted to integer cents (`toCents`/`sumCents`) only to
  sum and compare, and formatted back with `formatCents` — never
  accumulated as parsed floats, to avoid floating-point rounding error.
- `calculateMarginPercent` returns `null` (not `0`/`Infinity`/`NaN`)
  when revenue is `0`; `formatMarginPercent` renders that as `"N/A"`.
- `profitToneClass` is presentation-only color mapping (green/red/
  neutral); it never affects the numeric value.

**Actual vs. Estimated vs. derived figures**: Revenue, Costs, Estimated
Revenue, and Estimated Costs are the only figures stored as rows.
Profit, Margin, Estimated Profit/Margin, Estimated vs Actual, Cost
Variance, and Projected Final Profit are **all computed inline in
`app/dashboard/projects/[id]/page.tsx`** at render time from those
rows — there is no separate `lib/` module for them. A future refactor
that extracts them into `lib/finance/` would be reasonable, but as of
this writing that logic lives in the page component; look there first,
not in `lib/finance/`, when tracing how a specific number on that page
is derived.

`lib/finance/validation.ts` is shared by Revenue, Costs, Estimated
Revenue, and Estimated Costs:

- `validateAmount` — must match `/^-?\d+(\.\d{1,2})?$/` and be `> 0`.
  The same `amount > 0` rule is **also** a DB-level `CHECK` constraint
  on all four tables (revenues, costs, estimated_revenues,
  estimated_costs) — this is intentionally enforced twice; do not
  remove either half on the assumption the other already covers it.
- `validateDescription`, `validateDate` — required non-blank / basic
  shape checks; deep calendar validity (e.g. Feb 30) is left to
  Postgres.
- `projectBelongsToUser` — the app-level half of the RLS ownership
  check described in Layers above.

Cost/Estimated Cost `category` is validated against
`lib/costs/constants.ts`'s `CATEGORIES` in the Server Action, but is a
plain `text` column with **no DB-level enum/check** — same deliberate
choice as `projects.status`/`customers.status` (see Project lifecycle
below), kept consistent across all three rather than introducing a
stricter pattern for just one column.

## Project lifecycle

See `README.md`'s [Project lifecycle](./README.md#project-lifecycle)
section for the current behavior (statuses, `completeProject`'s guard,
the absence of a dedicated Archive action, and that Revenue/Costs/
Estimated data is not locked by project status). That section is
written to be read by whoever is about to change any of this — read it
before touching `lib/projects/actions.ts`, `ProjectForm.tsx`, or the
conditional rendering in `app/dashboard/projects/[id]/page.tsx`.

## Navigation

No shared header, nav bar, or layout-level navigation exists —
`app/layout.tsx` only sets up fonts and metadata. Each page renders its
own back-link. The one real convention in place: a create/edit form for
anything that belongs to a project (Revenue, Costs, Estimated Revenue,
Estimated Costs, and — as of Mini-Sprint 32 — the project itself) both
links back to, and redirects on success to, that project's detail page
(`/dashboard/projects/[id]`). Follow this convention for any new nested
entity rather than introducing a new pattern.

## Development conventions

- **Path alias**: `@/*` maps to the repo root (`tsconfig.json`) — use
  `@/lib/...`, `@/components/...`, never relative `../../..` chains.
- **Design tokens**: colors are named for their role, not their hue
  (`ink`, `paper`, `rule`, `profit`, `signal`, `muted` in
  `tailwind.config.ts`) — a small, deliberately limited palette ("kept
  intentionally small — extend as real screens are built").
- **Ownership scoping on mutations**: every `update`/`delete` on a
  row scoped to a project (Revenue, Costs, Estimated Revenue,
  Estimated Costs) filters by `id` **and** `user_id` **and**
  `project_id` — not just `id` + `user_id`. This stops a request from
  supplying a valid row id from Project A together with a different
  Project B's id and still matching. Keep this three-way scoping when
  adding any new project-nested table.
- **`.select("id").single()` after insert/update/delete**: used
  throughout to distinguish "matched and changed exactly one row" from
  "matched zero rows" (wrong id, wrong project, or another user's row —
  RLS already hides which). Without it, a zero-row write reports no
  `error` and looks like success. Keep this pattern for any new
  mutation.
- **No DB enum for status/category fields** — see Finance/calculations
  and Project lifecycle above. This is a documented, deliberate,
  project-wide choice, not an oversight in one table.

## Known environment limitations

- The app requires a real Supabase project; there is no local/offline
  mock backend. Copy `.env.local.example` to `.env.local` and fill in
  `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` before
  `npm run dev` will do anything useful.
- No automated test suite exists yet (no `*.test.*`/`*.spec.*` files,
  no test runner in `package.json`). `npm run typecheck` and
  `npm run lint` are the only static checks currently configured.
- Any behavior that depends on Row Level Security or Supabase Auth
  (session cookies, `auth.uid()`, the `handle_new_user` trigger) can
  only be verified against a real Supabase project — static reading of
  the migrations and server actions can confirm the *policies exist
  and match the app-level checks*, but not that they behave correctly
  at runtime.
- `types/supabase.ts` is **hand-written**, not generated — it must be
  kept in sync with `supabase/migrations/` manually until the Supabase
  CLI is available to run
  `npx supabase gen types typescript --project-id <project-id> > types/supabase.ts`
  (see the comment at the top of that file).
