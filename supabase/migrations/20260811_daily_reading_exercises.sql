-- Nightly NLM-generated reading exercises from daily vocabulary.
-- Per-classroom: all students in a classroom share the same exercise.
-- Script runs at 2AM, inserts exercise_date = tomorrow.

create table if not exists public.daily_reading_exercises (
  id uuid default gen_random_uuid() primary key,
  -- null = bài cá nhân không gắn với lớp; set classroom_id nếu theo lớp
  classroom_id uuid references public.classrooms(id) on delete cascade,
  -- null = bài chung cả lớp; set user_id nếu per-user mode
  target_user_id uuid references public.profiles(id) on delete cascade,

  -- Dates
  exercise_date date not null,              -- ngày bài dành cho (hôm sau)
  source_date date not null,                -- ngày từ được thêm/ôn

  -- Content (from NLM JSON)
  title text not null,
  passage text not null,                    -- EN passage, **target** words bolded
  passage_plain text not null,              -- plain text (no markdown)
  level text default 'A2',

  -- Questions + Cloze (JSONB)
  questions jsonb not null default '[]',    -- [{q, options, answer, explain}]
  cloze jsonb not null default '{}',        -- {text, blanks: [{id, answer, options}]}

  -- Source words used
  source_words jsonb not null default '[]', -- [{word, translation, pos}]
  used_words text[] default '{}',
  coverage float default 0,

  -- Bonus vocab (từ mới NLM thêm thắt)
  bonus_words jsonb default '[]',           -- [{word, translation, pos, definition_en}]

  -- Status
  status text default 'ready' check (status in ('generating', 'ready', 'failed', 'archived')),
  error_message text,
  generated_at timestamptz default now(),
  generation_meta jsonb default '{}',       -- {nlm_profile, notebook_id, duration_ms, attempts}

  -- Prevent duplicate per classroom per day (target_user_id null = classroom-wide)
  unique nulls not distinct (classroom_id, exercise_date, target_user_id)
);

-- Ensure classroom_id is nullable if table was previously created with NOT NULL constraint
do $$
begin
  alter table public.daily_reading_exercises alter column classroom_id drop not null;
exception
  when others then null;
end $$;

comment on table public.daily_reading_exercises is
  'Nightly NLM-generated reading exercises from daily vocabulary. One per classroom per day.';

-- Fast lookups & Strict uniqueness
create index if not exists daily_reading_exercises_classroom_date_idx
  on public.daily_reading_exercises(classroom_id, exercise_date desc);
create unique index if not exists daily_reading_exercises_user_date_uidx
  on public.daily_reading_exercises(target_user_id, exercise_date)
  where target_user_id is not null;
create unique index if not exists daily_reading_exercises_class_date_uidx
  on public.daily_reading_exercises(classroom_id, exercise_date)
  where target_user_id is null;
create index if not exists daily_reading_exercises_date_status_idx
  on public.daily_reading_exercises(exercise_date, status);

alter table public.daily_reading_exercises enable row level security;

-- Students can read exercises for classrooms they are enrolled in
create policy "Students view classroom daily exercises"
  on public.daily_reading_exercises for select using (
    exists (
      select 1 from public.enrollments e
      where e.classroom_id = daily_reading_exercises.classroom_id
        and e.student_id = auth.uid()
    )
    or target_user_id = auth.uid()
  );

-- Teachers can manage exercises for their classrooms
create policy "Teachers manage classroom daily exercises"
  on public.daily_reading_exercises for all using (
    exists (
      select 1 from public.classrooms c
      where c.id = daily_reading_exercises.classroom_id
        and c.teacher_id = auth.uid()
    )
  );

-- ── Student exercise completion tracking ──
create table if not exists public.daily_reading_completions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  exercise_id uuid references public.daily_reading_exercises(id) on delete cascade not null,
  -- Scores
  mcq_score int default 0,
  mcq_total int default 0,
  cloze_score int default 0,
  cloze_total int default 0,
  -- Timestamps
  started_at timestamptz default now(),
  completed_at timestamptz,
  unique(user_id, exercise_id)
);

alter table public.daily_reading_completions enable row level security;

create policy "Users manage own daily reading completions"
  on public.daily_reading_completions for all using (auth.uid() = user_id);

create policy "Teachers view student completions"
  on public.daily_reading_completions for select using (
    exists (
      select 1 from public.daily_reading_exercises dre
      join public.classrooms c on c.id = dre.classroom_id
      where dre.id = daily_reading_completions.exercise_id
        and c.teacher_id = auth.uid()
    )
  );
