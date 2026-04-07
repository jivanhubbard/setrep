-- Per-user exercise lists for each weekday slot on a program template (global templates stay read-only)

create table public.user_template_day_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  program_template_id uuid not null references public.program_templates (id) on delete cascade,
  day_index int not null check (day_index >= 0 and day_index <= 6),
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, program_template_id, day_index, sort_order)
);

create index user_template_day_exercises_lookup_idx
  on public.user_template_day_exercises (user_id, program_template_id, day_index);

alter table public.user_template_day_exercises enable row level security;

create policy "user_template_day_exercises_own" on public.user_template_day_exercises
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on public.user_template_day_exercises to authenticated;
