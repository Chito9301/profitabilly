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

As of Mini-Sprint 34, `app/dashboard/layout.tsx` wraps every route
under `/dashboard/**` with a persistent nav bar
(`components/DashboardNav.tsx`; Dashboard/Projects/Customers,
highlights the active section via `usePathname()`) — this is the only
shared layout/nav in the app; `app/layout.tsx` only sets up fonts and
metadata. Each page additionally still renders its own local back-link.
The one convention in place for those: a create/edit form for anything
that belongs to a project (Revenue, Costs, Estimated Revenue,
Estimated Costs, and — as of Mini-Sprint 32 — the project itself) both
links back to, and redirects on success to, that project's detail page
(`/dashboard/projects/[id]`). Follow this convention for any new nested
entity rather than introducing a new pattern.

## Design system

Approved direction (Mini-Sprint 36): clean, minimal, professional,
numbers-first, contractor-oriented, responsive. No gradients, glass, 3D,
heavy shadows or decorative illustration. Plain Tailwind utilities — no
CSS methodology, no UI library. Token **names** are role-based and
stable, so a page that says `text-ink` or `border-rule` follows any
future palette change without being edited.

### Colors (`tailwind.config.ts`)

| Token | Hex | Use |
|---|---|---|
| `ink` | `#0F172A` | primary navy: text, primary button, focus ring |
| `ink-hover` | `#1E293B` | primary button hover |
| `ink-soft` | `#334155` | strong secondary text (inactive nav) |
| `paper` | `#F8FAFC` | page background |
| `surface` | `#FFFFFF` | inputs, nav bar, (future) cards |
| `rule` | `#E2E8F0` | subtle dividers and card borders |
| `rule-strong` | `#8390A5` | form-control / secondary-button boundary (~3.2:1) |
| `muted` | `#64748B` | secondary text (4.6:1 on `paper`; not for tinted fills) |
| `profit` | `#16A34A` | positive: fills, tints, borders |
| `profit-strong` | `#15803D` | positive **as text** (~5:1) |
| `profit-bright` | `#10B981` | approved emerald accent — reserved, unused so far |
| `danger` | `#DC2626` | negative values, errors, destructive actions |
| `warning` | `#D97706` | attention: fills/borders/icons (not yet used) |
| `warning-strong` | `#B45309` | warning as readable text |

Rules that come from contrast, not taste:
- The approved green `#16A34A` is only ~3.3:1 as text on white, so
  **green text uses `profit-strong`**; `profit` is for tints/borders
  (e.g. `bg-profit/10`). Same for warning (`#D97706` ≈ 3.2:1).
- Tinted backgrounds reuse the opacity modifier on the same token
  (`bg-profit/10`, `bg-ink/10`); don't add "soft" colors.
- Color is never the only signal: negative numbers carry a "-" sign,
  status badges carry their label and differ in shape, the active nav
  item has an underline bar and `aria-current`.
- The old gold `signal` accent no longer exists.
- `tailwind.config.ts` `content` now includes `./lib/**` because
  `lib/finance/money.ts` returns class names; before, those classes were
  only generated by accident when the same string appeared elsewhere.

### Typography

Inter via `next/font/google` (part of Next.js, no dependency). It
replaced Space Grotesk because the approved direction prefers Inter and
it is known to ship tabular figures (`tnum`). `body` sets `tabular-nums`,
so money columns line up everywhere. Scale (Tailwind classes):

| Role | Class | Size |
|---|---|---|
| Page heading | `text-page` *(new token)* | 28/32, tight tracking |
| Section / card heading | `text-lg font-medium` | 18 |
| Body | `text-sm` | 14 |
| Secondary metadata | `text-xs text-muted` | 12 |
| Financial value | `font-medium` + `profitToneClass(...)` | — |

`text-page` is applied on the **Dashboard only** (Mini-Sprint 37); the
other pages still use `text-2xl` (form pages, lists) and `text-4xl` (home). That inconsistency is deliberately left for each screen's own
redesign sprint.

### Spacing, shape, elevation

Rhythm is 4/8/16/24 px = Tailwind `1`/`2`/`4`/`6` (Tailwind defaults,
no custom scale). Page padding `px-6 py-12`; `max-w-md` for one-entity
forms, `max-w-4xl` for lists/detail. Buttons and inputs `rounded-lg`;
cards/surfaces are the `Card` component (`rounded-xl`, `p-4`); shadow at
most `shadow-sm`. Inline cards on the other pages still use `rounded-md`
— they change when their screen is redesigned.

### Responsive / touch

Controls are `min-h-12` (48px) on mobile and `sm:min-h-10` (40px) from
the `sm` breakpoint. Inputs use `text-base` on mobile (iOS Safari zooms
the page on focus below 16px) and `sm:text-sm` above.

### Components

- **`Button`** — variants `primary` (navy), `secondary` (outlined),
  `destructive` (filled red). `href` renders a styled `Link`. API is
  backward compatible (`primary` remains the default).
- **`TextField` / `SelectField` / `TextareaField`** — same markup and
  props as before. Their styling comes from **`components/fieldStyles.ts`**
  (`FIELD_LABEL_STYLES`, `FIELD_CONTROL_STYLES`), which `ProjectForm`'s
  hand-written customer `<select>` also imports; that select used to be a
  fourth copy of the string. Error state: set `aria-invalid` on a control
  and it gets the red border/ring — no new prop.
- **`StatusBadge`** — Active = green tint, Completed = navy tint,
  anything else (Archived) = outlined gray. Status logic untouched.
- **`DashboardNav`** — white bar, underline-bar active state,
  `aria-label="Main"`, `aria-current="page"`. Routes/structure unchanged.
- **`Card`** *(new in Mini-Sprint 37, `components/Card.tsx`)* — presentation
  only: `rounded-xl border border-rule bg-surface p-4` on a plain `<div>`;
  `className` is appended for layout only (there is no class-merging
  library, so don't use it to override padding/border). Used so far by
  the Dashboard only; Project Details should adopt it in its own sprint.
  The Dashboard's `Kpi` label/value helper is deliberately a local
  function in `app/dashboard/page.tsx`, not a component — promote it
  when Project Details needs the same pattern.
- **Delete buttons** — the six `Delete*Button.tsx` files are still
  hand-rolled small red text links; the new `destructive` variant is not
  used by them (adopting it would change how they look — a screen-level
  decision).

## Development conventions

- **Path alias**: `@/*` maps to the repo root (`tsconfig.json`) — use
  `@/lib/...`, `@/components/...`, never relative `../../..` chains.
- **Design tokens**: colors are named for their role, not their hue
  (`ink`, `paper`, `surface`, `rule`, `muted`, `profit`, `danger`,
  `warning` in `tailwind.config.ts`) — see Design system above; don't
  use raw Tailwind palette colors (`red-700`, `green-600`…).
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
