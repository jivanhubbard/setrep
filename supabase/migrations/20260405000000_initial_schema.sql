-- Setrep initial schema: profiles, templates, exercises, workouts, RLS

-- Extensions
create extension if not exists "pgcrypto";

-- Enums
create type public.goal_type as enum (
  'bulk',
  'cut',
  'recomp',
  'maintain',
  'performance'
);

create type public.weight_unit_type as enum ('lb', 'kg');

create type public.experience_level_type as enum (
  'beginner',
  'intermediate',
  'advanced'
);

-- Profiles (1:1 with auth.users)
create table public.profiles (
  user_id uuid primary key references auth.users on delete cascade,
  display_name text,
  goal public.goal_type,
  experience_level public.experience_level_type,
  days_per_week int check (days_per_week >= 1 and days_per_week <= 7),
  equipment text default 'gym',
  injuries_notes text,
  program_template_id uuid,
  weight_unit public.weight_unit_type not null default 'lb',
  timezone text default 'UTC',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Program templates (global)
create table public.program_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  days_per_week int not null check (days_per_week >= 1 and days_per_week <= 7),
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Day slot within a template: 0 = Monday .. 6 = Sunday
create table public.template_days (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.program_templates (id) on delete cascade,
  day_index int not null check (day_index >= 0 and day_index <= 6),
  focus_label text not null,
  muscle_groups text[] not null default '{}',
  unique (template_id, day_index)
);

alter table public.profiles
  add constraint profiles_program_template_id_fkey
  foreign key (program_template_id) references public.program_templates (id) on delete set null;

-- Exercises: global (user_id is null) or user-owned custom
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  name text not null,
  muscle_group text not null,
  created_at timestamptz not null default now(),
  constraint exercises_user_name unique (user_id, name)
);

create index exercises_muscle_group_idx on public.exercises (muscle_group);
create index exercises_user_id_idx on public.exercises (user_id);

-- Workout sessions
create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  performed_at timestamptz not null,
  title text not null default 'Workout',
  notes text,
  duration_minutes int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workout_sessions_user_performed_idx on public.workout_sessions (user_id, performed_at desc);

-- Line items per session
create table public.workout_entries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  exercise_id uuid references public.exercises (id) on delete set null,
  sort_order int not null default 0,
  custom_exercise_name text,
  constraint workout_entries_exercise_or_custom check (
    exercise_id is not null or (custom_exercise_name is not null and length(trim(custom_exercise_name)) > 0)
  )
);

create index workout_entries_session_id_idx on public.workout_entries (session_id);

-- Sets
create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.workout_entries (id) on delete cascade,
  set_index int not null,
  reps int not null check (reps >= 0),
  weight numeric not null check (weight >= 0),
  unique (entry_id, set_index)
);

create index workout_sets_entry_id_idx on public.workout_sets (entry_id);

-- Updated_at helper
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger workout_sessions_updated_at
  before update on public.workout_sessions
  for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.program_templates enable row level security;
alter table public.template_days enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_entries enable row level security;
alter table public.workout_sets enable row level security;

-- Profiles: own row only
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = user_id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = user_id);

-- Program templates: readable by authenticated users
create policy "program_templates_select_authenticated" on public.program_templates
  for select to authenticated using (true);

create policy "template_days_select_authenticated" on public.template_days
  for select to authenticated using (true);

-- Exercises: global or own
create policy "exercises_select" on public.exercises
  for select to authenticated using (user_id is null or user_id = auth.uid());

create policy "exercises_insert_own" on public.exercises
  for insert to authenticated with check (user_id = auth.uid());

create policy "exercises_update_own" on public.exercises
  for update to authenticated using (user_id = auth.uid());

create policy "exercises_delete_own" on public.exercises
  for delete to authenticated using (user_id = auth.uid());

-- Workout sessions
create policy "workout_sessions_all_own" on public.workout_sessions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Entries: via session ownership
create policy "workout_entries_all" on public.workout_entries
  for all to authenticated using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = workout_entries.session_id and s.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.workout_sessions s
      where s.id = workout_entries.session_id and s.user_id = auth.uid()
    )
  );

-- Sets: via entry -> session
create policy "workout_sets_all" on public.workout_sets
  for all to authenticated using (
    exists (
      select 1 from public.workout_entries e
      join public.workout_sessions s on s.id = e.session_id
      where e.id = workout_sets.entry_id and s.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.workout_entries e
      join public.workout_sessions s on s.id = e.session_id
      where e.id = workout_sets.entry_id and s.user_id = auth.uid()
    )
  );

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Grants: Supabase defaults often cover authenticated; explicit for clarity
grant usage on schema public to anon, authenticated, service_role;
grant select on public.program_templates, public.template_days to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.exercises to authenticated;
grant select, insert, update, delete on public.workout_sessions to authenticated;
grant select, insert, update, delete on public.workout_entries to authenticated;
grant select, insert, update, delete on public.workout_sets to authenticated;
