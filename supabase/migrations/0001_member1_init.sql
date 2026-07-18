-- ===========================================================================
-- Member 1 — User, Company & Vehicle System
-- Schema, RLS policies, triggers and RPCs for the Carpooling Platform.
--
-- Run this in the Supabase SQL Editor (or `supabase db push`).
-- Idempotent-ish: safe to re-run in development.
-- ===========================================================================

-- Needed for gen_random_uuid()
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.company_role as enum ('OWNER', 'ADMIN', 'MEMBER');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.vehicle_status as enum ('ACTIVE', 'INACTIVE');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Application profile, 1:1 with auth.users. Authentication itself is fully
-- owned by Supabase Auth (auth.users) — never store passwords here.
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  phone       text,
  avatar_url  text,
  -- Platform-level role. 'user' by default; 'admin' reserved for staff.
  -- Protected: users cannot change this themselves (see trigger below).
  role        text not null default 'user',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  code        text not null unique,          -- shareable join code
  email       text,
  phone       text,
  address     text,
  description text,
  created_by  uuid not null references auth.users (id) on delete restrict,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.company_members (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        public.company_role not null default 'MEMBER',
  joined_at   timestamptz not null default now(),
  unique (company_id, user_id)              -- no duplicate memberships
);

create table if not exists public.vehicles (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid not null references auth.users (id) on delete cascade,
  company_id          uuid references public.companies (id) on delete set null,
  name                text,
  type                text,
  brand               text,
  model               text,
  registration_number text not null,
  seating_capacity    int  not null check (seating_capacity between 1 and 100),
  color               text,
  status              public.vehicle_status not null default 'ACTIVE',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- A registration number is globally unique (case-insensitive).
create unique index if not exists vehicles_registration_number_key
  on public.vehicles (upper(registration_number));

create table if not exists public.saved_places (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  label       text not null,
  address     text,
  latitude    double precision,
  longitude   double precision,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.user_settings (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null unique references auth.users (id) on delete cascade,
  notification_preferences jsonb not null default '{}'::jsonb,
  privacy_preferences      jsonb not null default '{}'::jsonb,
  appearance_preferences   jsonb not null default '{}'::jsonb,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- Secondary FKs to public.profiles (in addition to the auth.users FKs) so that
-- PostgREST / Supabase can embed member & owner profiles directly, e.g.
-- company_members -> profiles, vehicles -> profiles. profiles.id == auth.users.id
-- so these are always consistent.
do $$ begin
  alter table public.company_members
    add constraint company_members_user_id_profiles_fkey
    foreign key (user_id) references public.profiles (id) on delete cascade;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.vehicles
    add constraint vehicles_owner_id_profiles_fkey
    foreign key (owner_id) references public.profiles (id) on delete cascade;
exception when duplicate_object then null; end $$;

-- Helpful indexes for the common foreign-key lookups.
create index if not exists company_members_user_id_idx on public.company_members (user_id);
create index if not exists company_members_company_id_idx on public.company_members (company_id);
create index if not exists vehicles_owner_id_idx on public.vehicles (owner_id);
create index if not exists vehicles_company_id_idx on public.vehicles (company_id);
create index if not exists saved_places_user_id_idx on public.saved_places (user_id);

-- ---------------------------------------------------------------------------
-- Utility functions
-- ---------------------------------------------------------------------------

-- Keep updated_at fresh on every UPDATE.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['profiles','companies','company_members','vehicles','saved_places','user_settings']
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- Provision a profile + settings row automatically when an auth user is created.
-- SECURITY DEFINER so it can write to public tables from the auth schema.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Prevent users from changing their own protected role. The service_role
-- (server-side admin client) may still update it.
create or replace function public.protect_profile_columns()
returns trigger language plpgsql as $$
begin
  if auth.role() is distinct from 'service_role' then
    new.role := old.role;   -- role is immutable from the client
    new.id   := old.id;
  end if;
  return new;
end $$;

drop trigger if exists protect_profile_columns on public.profiles;
create trigger protect_profile_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- Membership / role helpers. SECURITY DEFINER so RLS policies can call them
-- WITHOUT recursively evaluating company_members' own policies.
create or replace function public.is_company_member(cid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.company_members
    where company_id = cid and user_id = auth.uid()
  );
$$;

create or replace function public.is_company_manager(cid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.company_members
    where company_id = cid and user_id = auth.uid()
      and role in ('OWNER', 'ADMIN')
  );
$$;

-- Generate a short, unique, human-friendly company join code.
create or replace function public.generate_company_code()
returns text language plpgsql as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
  i int;
begin
  loop
    candidate := '';
    for i in 1..6 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.companies where code = candidate);
  end loop;
  return candidate;
end $$;

-- ---------------------------------------------------------------------------
-- RPCs (SECURITY DEFINER) — atomic company create & join
-- ---------------------------------------------------------------------------

-- Creates a company and makes the caller its OWNER, atomically.
create or replace function public.create_company(
  p_name text,
  p_email text default null,
  p_phone text default null,
  p_address text default null,
  p_description text default null
)
returns public.companies
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_company public.companies;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'Company name is required' using errcode = '22000';
  end if;

  insert into public.companies (name, code, email, phone, address, description, created_by)
  values (trim(p_name), public.generate_company_code(),
          nullif(trim(p_email), ''), nullif(trim(p_phone), ''),
          nullif(trim(p_address), ''), nullif(trim(p_description), ''), v_uid)
  returning * into v_company;

  insert into public.company_members (company_id, user_id, role)
  values (v_company.id, v_uid, 'OWNER');

  return v_company;
end $$;

-- Joins the caller to a company by its code as a MEMBER. Prevents duplicates
-- and never lets the caller pick an elevated role.
create or replace function public.join_company_by_code(p_code text)
returns public.companies
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_company public.companies;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select * into v_company from public.companies
  where code = upper(trim(p_code));

  if not found then
    raise exception 'Invalid company code' using errcode = 'P0002';
  end if;

  if exists (
    select 1 from public.company_members
    where company_id = v_company.id and user_id = v_uid
  ) then
    raise exception 'You are already a member of this company' using errcode = '23505';
  end if;

  insert into public.company_members (company_id, user_id, role)
  values (v_company.id, v_uid, 'MEMBER');

  return v_company;
end $$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.companies        enable row level security;
alter table public.company_members  enable row level security;
alter table public.vehicles         enable row level security;
alter table public.saved_places     enable row level security;
alter table public.user_settings    enable row level security;

-- ---- profiles -------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using (true);  -- names/avatars are shared app-wide

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ---- companies ------------------------------------------------------------
drop policy if exists companies_select on public.companies;
create policy companies_select on public.companies
  for select to authenticated
  using (created_by = auth.uid() or public.is_company_member(id));

drop policy if exists companies_insert on public.companies;
create policy companies_insert on public.companies
  for insert to authenticated with check (created_by = auth.uid());

drop policy if exists companies_update_manager on public.companies;
create policy companies_update_manager on public.companies
  for update to authenticated
  using (public.is_company_manager(id)) with check (public.is_company_manager(id));

drop policy if exists companies_delete_owner on public.companies;
create policy companies_delete_owner on public.companies
  for delete to authenticated
  using (exists (
    select 1 from public.company_members
    where company_id = id and user_id = auth.uid() and role = 'OWNER'
  ));

-- ---- company_members ------------------------------------------------------
drop policy if exists company_members_select on public.company_members;
create policy company_members_select on public.company_members
  for select to authenticated
  using (user_id = auth.uid() or public.is_company_member(company_id));

-- Managers may add members directly; normal self-join goes through the RPC.
drop policy if exists company_members_insert_manager on public.company_members;
create policy company_members_insert_manager on public.company_members
  for insert to authenticated with check (public.is_company_manager(company_id));

drop policy if exists company_members_update_manager on public.company_members;
create policy company_members_update_manager on public.company_members
  for update to authenticated
  using (public.is_company_manager(company_id)) with check (public.is_company_manager(company_id));

-- Managers can remove members; anyone can remove (leave) their own membership.
drop policy if exists company_members_delete on public.company_members;
create policy company_members_delete on public.company_members
  for delete to authenticated
  using (user_id = auth.uid() or public.is_company_manager(company_id));

-- ---- vehicles -------------------------------------------------------------
drop policy if exists vehicles_select on public.vehicles;
create policy vehicles_select on public.vehicles
  for select to authenticated
  using (owner_id = auth.uid()
         or (company_id is not null and public.is_company_member(company_id)));

drop policy if exists vehicles_insert_owner on public.vehicles;
create policy vehicles_insert_owner on public.vehicles
  for insert to authenticated
  with check (owner_id = auth.uid()
              and (company_id is null or public.is_company_member(company_id)));

drop policy if exists vehicles_update on public.vehicles;
create policy vehicles_update on public.vehicles
  for update to authenticated
  using (owner_id = auth.uid()
         or (company_id is not null and public.is_company_manager(company_id)))
  with check (owner_id = auth.uid()
              or (company_id is not null and public.is_company_manager(company_id)));

drop policy if exists vehicles_delete on public.vehicles;
create policy vehicles_delete on public.vehicles
  for delete to authenticated
  using (owner_id = auth.uid()
         or (company_id is not null and public.is_company_manager(company_id)));

-- ---- saved_places ---------------------------------------------------------
drop policy if exists saved_places_all on public.saved_places;
create policy saved_places_all on public.saved_places
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- user_settings --------------------------------------------------------
drop policy if exists user_settings_all on public.user_settings;
create policy user_settings_all on public.user_settings
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage — avatars bucket (public read, users write only their own folder)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists avatars_read on storage.objects;
create policy avatars_read on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists avatars_insert_own on storage.objects;
create policy avatars_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
