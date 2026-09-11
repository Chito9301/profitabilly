-- Mini-Sprint 8: revenue and costs foundation.
--
-- Scope: revenues and costs only. No invoices, payments, budgets, or
-- accounting tables are created here.

-- ---------------------------------------------------------------------
-- revenues
-- Belongs to exactly one project and one owning profile. user_id is
-- stored directly (not derived via a join through projects) so RLS on
-- this table can stay a simple auth.uid() = user_id check, matching
-- the pattern already used for customers and projects.
-- ---------------------------------------------------------------------
create table public.revenues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  -- Deliberately NOT "on delete cascade": unlike a customer (who
  -- outlives any one project), a project's financial history has no
  -- meaning without the project, but silently destroying it when a
  -- project is deleted is still a real data-loss risk the user may not
  -- expect. "restrict" makes that delete fail loudly instead, the same
  -- defensive choice made for customers -> projects in Sprint 7.
  -- deleteProject (lib/projects/actions.ts) isn't touched by this
  -- migration, so a project with revenue/cost rows will surface
  -- today's generic "could not delete" message rather than a message
  -- specific to this case — same known follow-up noted for customers.
  project_id uuid not null references public.projects (id) on delete restrict,
  -- btrim check: FormData can't submit a value that's only whitespace
  -- past the app's own trim+required check, but this keeps the
  -- invariant true regardless of what inserts the row.
  description text not null check (btrim(description) <> ''),
  -- numeric(12,2), not float/double/real: an exact decimal type is
  -- required for money so amounts and sums never carry floating-point
  -- rounding error. The check enforces "greater than zero" at the
  -- database layer too, not just in the server action.
  amount numeric(12, 2) not null check (amount > 0),
  date date not null,
  created_at timestamptz not null default now()
);

create index revenues_user_id_idx on public.revenues (user_id);
create index revenues_project_id_idx on public.revenues (project_id);

alter table public.revenues enable row level security;

create policy "Users can view own revenues"
  on public.revenues for select
  using (auth.uid() = user_id);

-- insert/update also require project_id to point at a project this
-- same user owns — same reasoning as the projects/customer_id check in
-- Sprint 7: without this, a user could create a revenue row "for
-- themselves" (user_id = auth.uid()) that points at someone else's
-- project. The server action checks this too (for a clear error
-- message), but RLS enforces it independently here as well.
create policy "Users can insert own revenues"
  on public.revenues for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create policy "Users can update own revenues"
  on public.revenues for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create policy "Users can delete own revenues"
  on public.revenues for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- costs
-- Same shape and reasoning as revenues, plus a required category.
-- ---------------------------------------------------------------------
create table public.costs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete restrict,
  description text not null check (btrim(description) <> ''),
  amount numeric(12, 2) not null check (amount > 0),
  -- Not constrained to a fixed list at the database layer: the app
  -- validates against the single source of truth in
  -- lib/costs/constants.ts, the same choice already made for
  -- customers.status and projects.status (plain text, app-validated,
  -- no DB enum/check) — kept consistent rather than introducing a
  -- stricter pattern for this one column.
  category text not null,
  date date not null,
  created_at timestamptz not null default now()
);

create index costs_user_id_idx on public.costs (user_id);
create index costs_project_id_idx on public.costs (project_id);

alter table public.costs enable row level security;

create policy "Users can view own costs"
  on public.costs for select
  using (auth.uid() = user_id);

create policy "Users can insert own costs"
  on public.costs for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create policy "Users can update own costs"
  on public.costs for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create policy "Users can delete own costs"
  on public.costs for delete
  using (auth.uid() = user_id);
