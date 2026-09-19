-- Mini-Sprint 19: profit planning foundation.
--
-- Scope: estimated_revenues and estimated_costs only. These are kept
-- as separate tables from revenues/costs (not a shared table with an
-- is_estimate flag) so no query for actual totals can ever accidentally
-- include an estimate, or vice versa — see the Sprint 18 audit. No
-- estimated-vs-actual comparison or "profitability check" logic is
-- built here.

-- ---------------------------------------------------------------------
-- estimated_revenues
-- Same shape and RLS pattern as revenues (Sprint 8), minus "date": an
-- estimate isn't a dated transaction, so created_at is sufficient.
-- ---------------------------------------------------------------------
create table public.estimated_revenues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  -- Same reasoning as revenues.project_id: a project's estimates have
  -- no meaning without the project, but silently destroying them on
  -- project delete is still a real data-loss risk. "restrict" makes
  -- that delete fail loudly instead, same as revenues/costs.
  project_id uuid not null references public.projects (id) on delete restrict,
  description text not null check (btrim(description) <> ''),
  amount numeric(12, 2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

create index estimated_revenues_user_id_idx on public.estimated_revenues (user_id);
create index estimated_revenues_project_id_idx on public.estimated_revenues (project_id);

alter table public.estimated_revenues enable row level security;

create policy "Users can view own estimated revenues"
  on public.estimated_revenues for select
  using (auth.uid() = user_id);

-- insert/update also require project_id to point at a project this
-- same user owns — same reasoning as revenues/costs in Sprint 8.
create policy "Users can insert own estimated revenues"
  on public.estimated_revenues for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create policy "Users can update own estimated revenues"
  on public.estimated_revenues for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create policy "Users can delete own estimated revenues"
  on public.estimated_revenues for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- estimated_costs
-- Same shape as estimated_revenues, plus category. category reuses the
-- same taxonomy as costs.category (lib/costs/constants.ts) — no new
-- category list is introduced, and (matching costs.category) it is
-- left as plain app-validated text rather than a DB-level enum/check,
-- for the same consistency reasons documented on costs.category.
-- ---------------------------------------------------------------------
create table public.estimated_costs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete restrict,
  description text not null check (btrim(description) <> ''),
  amount numeric(12, 2) not null check (amount > 0),
  category text not null,
  created_at timestamptz not null default now()
);

create index estimated_costs_user_id_idx on public.estimated_costs (user_id);
create index estimated_costs_project_id_idx on public.estimated_costs (project_id);

alter table public.estimated_costs enable row level security;

create policy "Users can view own estimated costs"
  on public.estimated_costs for select
  using (auth.uid() = user_id);

create policy "Users can insert own estimated costs"
  on public.estimated_costs for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create policy "Users can update own estimated costs"
  on public.estimated_costs for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create policy "Users can delete own estimated costs"
  on public.estimated_costs for delete
  using (auth.uid() = user_id);
