-- Seed program templates and global exercises (runs as migration owner)

insert into public.program_templates (id, name, slug, days_per_week, description, sort_order) values
  ('a0000001-0000-4000-8000-000000000001', 'Push / Pull / Legs (6x)', 'ppl-6', 6, 'Classic PPL twice per week rotation.', 1),
  ('a0000001-0000-4000-8000-000000000002', 'Upper / Lower (4x)', 'ul-4', 4, 'Four sessions: upper, lower, upper, lower.', 2),
  ('a0000001-0000-4000-8000-000000000003', 'Full Body (3x)', 'fb-3', 3, 'Three full-body days.', 3),
  ('a0000001-0000-4000-8000-000000000004', 'Bro Split (5x)', 'bro-5', 5, 'One muscle group per day.', 4);

-- PPL 6: Mon Push, Tue Pull, Wed Legs, Thu Push, Fri Pull, Sat Legs (example rotation)
insert into public.template_days (template_id, day_index, focus_label, muscle_groups) values
  ('a0000001-0000-4000-8000-000000000001', 0, 'Push', array['chest', 'shoulders', 'triceps']),
  ('a0000001-0000-4000-8000-000000000001', 1, 'Pull', array['back', 'biceps', 'rear_delts']),
  ('a0000001-0000-4000-8000-000000000001', 2, 'Legs', array['quads', 'hamstrings', 'glutes', 'calves']),
  ('a0000001-0000-4000-8000-000000000001', 3, 'Push', array['chest', 'shoulders', 'triceps']),
  ('a0000001-0000-4000-8000-000000000001', 4, 'Pull', array['back', 'biceps', 'rear_delts']),
  ('a0000001-0000-4000-8000-000000000001', 5, 'Legs', array['quads', 'hamstrings', 'glutes', 'calves']),
  ('a0000001-0000-4000-8000-000000000001', 6, 'Rest / Cardio', array[]::text[]);

-- UL 4: Mon Upper, Tue Lower, Thu Upper, Fri Lower
insert into public.template_days (template_id, day_index, focus_label, muscle_groups) values
  ('a0000001-0000-4000-8000-000000000002', 0, 'Upper', array['chest', 'back', 'shoulders', 'arms']),
  ('a0000001-0000-4000-8000-000000000002', 1, 'Lower', array['quads', 'hamstrings', 'glutes', 'calves']),
  ('a0000001-0000-4000-8000-000000000002', 2, 'Active recovery', array[]::text[]),
  ('a0000001-0000-4000-8000-000000000002', 3, 'Upper', array['chest', 'back', 'shoulders', 'arms']),
  ('a0000001-0000-4000-8000-000000000002', 4, 'Lower', array['quads', 'hamstrings', 'glutes', 'calves']),
  ('a0000001-0000-4000-8000-000000000002', 5, 'Rest', array[]::text[]),
  ('a0000001-0000-4000-8000-000000000002', 6, 'Rest', array[]::text[]);

-- Full body 3: M/W/F
insert into public.template_days (template_id, day_index, focus_label, muscle_groups) values
  ('a0000001-0000-4000-8000-000000000003', 0, 'Full body A', array['chest', 'back', 'legs', 'shoulders']),
  ('a0000001-0000-4000-8000-000000000003', 1, 'Rest', array[]::text[]),
  ('a0000001-0000-4000-8000-000000000003', 2, 'Full body B', array['chest', 'back', 'legs', 'arms']),
  ('a0000001-0000-4000-8000-000000000003', 3, 'Rest', array[]::text[]),
  ('a0000001-0000-4000-8000-000000000003', 4, 'Full body C', array['legs', 'back', 'shoulders', 'core']),
  ('a0000001-0000-4000-8000-000000000003', 5, 'Rest', array[]::text[]),
  ('a0000001-0000-4000-8000-000000000003', 6, 'Rest', array[]::text[]);

-- Bro 5: chest, back, legs, shoulders, arms
insert into public.template_days (template_id, day_index, focus_label, muscle_groups) values
  ('a0000001-0000-4000-8000-000000000004', 0, 'Chest', array['chest']),
  ('a0000001-0000-4000-8000-000000000004', 1, 'Back', array['back', 'rear_delts']),
  ('a0000001-0000-4000-8000-000000000004', 2, 'Legs', array['quads', 'hamstrings', 'glutes', 'calves']),
  ('a0000001-0000-4000-8000-000000000004', 3, 'Shoulders', array['shoulders']),
  ('a0000001-0000-4000-8000-000000000004', 4, 'Arms', array['biceps', 'triceps']),
  ('a0000001-0000-4000-8000-000000000004', 5, 'Rest', array[]::text[]),
  ('a0000001-0000-4000-8000-000000000004', 6, 'Rest', array[]::text[]);

-- Global exercises (user_id null)
insert into public.exercises (user_id, name, muscle_group) values
  (null, 'Barbell back squat', 'quads'),
  (null, 'Front squat', 'quads'),
  (null, 'Leg press', 'quads'),
  (null, 'Romanian deadlift', 'hamstrings'),
  (null, 'Leg curl', 'hamstrings'),
  (null, 'Leg extension', 'quads'),
  (null, 'Walking lunge', 'glutes'),
  (null, 'Hip thrust', 'glutes'),
  (null, 'Calf raise', 'calves'),
  (null, 'Barbell bench press', 'chest'),
  (null, 'Incline dumbbell press', 'chest'),
  (null, 'Cable fly', 'chest'),
  (null, 'Dips', 'chest'),
  (null, 'Pull-up', 'back'),
  (null, 'Lat pulldown', 'back'),
  (null, 'Barbell row', 'back'),
  (null, 'One-arm dumbbell row', 'back'),
  (null, 'Seated cable row', 'back'),
  (null, 'Face pull', 'rear_delts'),
  (null, 'Overhead press', 'shoulders'),
  (null, 'Dumbbell lateral raise', 'shoulders'),
  (null, 'Barbell curl', 'biceps'),
  (null, 'Hammer curl', 'biceps'),
  (null, 'Tricep pushdown', 'triceps'),
  (null, 'Skull crusher', 'triceps'),
  (null, 'Plank', 'core'),
  (null, 'Cable crunch', 'core'),
  (null, 'Deadlift', 'back'),
  (null, 'Sumo deadlift', 'glutes'),
  (null, 'Goblet squat', 'quads'),
  (null, 'Bulgarian split squat', 'quads'),
  (null, 'Pec deck', 'chest'),
  (null, 'Push-up', 'chest'),
  (null, 'T-bar row', 'back'),
  (null, 'Shrug', 'back'),
  (null, 'Arnold press', 'shoulders'),
  (null, 'Preacher curl', 'biceps'),
  (null, 'Overhead tricep extension', 'triceps'),
  (null, 'Hack squat', 'quads'),
  (null, 'Nordic curl', 'hamstrings');
