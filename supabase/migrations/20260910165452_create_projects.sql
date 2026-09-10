-- Mini-Sprint 7: projects/jobs foundation.
--
-- Scope: projects only. No revenue, costs, profit, invoices, or payments
-- tables are created here — those come later, once this relationship
-- (Customer 1 -> many Projects) is in place.

-- ---------------------------------------------------------------------
-- projects
-- Belongs to exactly one profile (owner) and exactly one customer.
-- ---------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  -- Deliberately NOT "on delete cascade": deleting a customer must not
  -- silently wipe out their project/job history. "restrict" makes that
  -- delete fail loudly instead (Postgres's default FK behavior would do
  -- the same thing, but this spells out the decision rather than
  -- leaving it implicit). The customers.deleteCustomer action doesn't
  -- special-case this failure yet — a customer with existing projects
  -- will surface today's generic "could not delete" message, which is
  -- accurate but not specific; refining that message is a follow-up,
  -- not part of this migration.
  customer_id uuid not null references public.customers (id) on delete restrict,
  name text not null,
  status text not null default 'Active',
  created_at timestamptz not null default now()
);

-- RLS filters every query by user_id, same reasoning as customers_user_id_idx.
create index projects_user_id_idx on public.projects (user_id);
-- Supports the FK's restrict-check and the customer-ownership lookups
-- used when listing a customer's projects or validating customer_id.
create index projects_customer_id_idx on public.projects (customer_id);

alter table public.projects enable row level security;

create policy "Users can view own projects"
  on public.projects for select
  using (auth.uid() = user_id);

-- insert/update also require customer_id to point at a customer this
-- same user owns — otherwise a user could create a project "for
-- themselves" (user_id = auth.uid(), passing the basic check) that
-- points at someone else's customer. The server action checks this too
-- (for a clear error message), but per the brief this must not depend
-- on the frontend/action alone — RLS enforces it independently here.
create policy "Users can insert own projects"
  on public.projects for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.customers c
      where c.id = customer_id and c.user_id = auth.uid()
    )
  );

create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.customers c
      where c.id = customer_id and c.user_id = auth.uid()
    )
  );

create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);
