-- Mini-Sprint 2: profiles + customers foundation, with per-user data
-- isolation enforced by Row Level Security.
--
-- Scope: profiles and customers only. No projects, revenue, costs,
-- payments, or reporting tables are created here.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- profiles
-- One row per auth user. id is the same UUID as auth.users.id (not a
-- separate generated key) so profiles.id can be used directly as the
-- foreign key target for every other user-owned table.
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  business_name text,
  business_type text,
  currency text not null default 'USD',
  country text,
  timezone text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users may only see and edit their own profile row. There is no insert
-- or delete policy: rows are created by the handle_new_user trigger
-- below and deleted automatically via the auth.users cascade, so end
-- users never need direct insert/delete access.
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------
-- profiles provisioning
-- Auto-create a profile row whenever a new auth user signs up, so the
-- app never has to (and never needs an insert policy for users to do
-- it themselves). security definer lets this bypass RLS to insert.
-- ---------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- customers
-- Belongs to exactly one profile (profiles 1 -> many customers).
-- ---------------------------------------------------------------------
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  company text,
  email text,
  phone text,
  address text,
  notes text,
  status text not null default 'Active',
  created_at timestamptz not null default now()
);

-- RLS filters every query by user_id, so this index keeps those lookups
-- (and the FK's cascade delete) fast as the table grows.
create index customers_user_id_idx on public.customers (user_id);

alter table public.customers enable row level security;

create policy "Users can view own customers"
  on public.customers for select
  using (auth.uid() = user_id);

create policy "Users can insert own customers"
  on public.customers for insert
  with check (auth.uid() = user_id);

create policy "Users can update own customers"
  on public.customers for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own customers"
  on public.customers for delete
  using (auth.uid() = user_id);
