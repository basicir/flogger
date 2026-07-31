-- ═══════════════════════════════════════════════════════
-- Flogger — Supabase Database Migration
-- Run this in the Supabase SQL editor
-- ═══════════════════════════════════════════════════════

-- ── profiles ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  email                text,
  display_name         text,
  flightlogger_api_key text,
  created_at           timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ── pinned_students ───────────────────────────────────────────────────────
create table if not exists public.pinned_students (
  id                    uuid primary key default gen_random_uuid(),
  instructor_id         uuid not null references public.profiles(id) on delete cascade,
  callsign              text not null,
  display_name          text not null default '',
  flightlogger_user_id  text,
  pinned_at             timestamptz default now(),
  unique (instructor_id, callsign)
);

-- RLS
alter table public.pinned_students enable row level security;

create policy "Instructors can read own pinned students"
  on public.pinned_students for select
  using (auth.uid() = instructor_id);

create policy "Instructors can insert own pinned students"
  on public.pinned_students for insert
  with check (auth.uid() = instructor_id);

create policy "Instructors can delete own pinned students"
  on public.pinned_students for delete
  using (auth.uid() = instructor_id);

create policy "Instructors can update own pinned students"
  on public.pinned_students for update
  using (auth.uid() = instructor_id);

-- ── Auto-create profile on signup ─────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
