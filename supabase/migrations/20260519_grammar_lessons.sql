-- Hệ thống bài giảng grammar đầy đủ lộ trình.
-- Bổ sung 3 bảng: grammar_topics (chủ đề/lộ trình), grammar_lessons (lý thuyết),
-- grammar_progress (SRS theo bài học). Gắn grammar_exercises vào lesson.

-- =============================================
-- 1. GRAMMAR TOPICS — chủ đề / lộ trình
-- =============================================
create table if not exists public.grammar_topics (
  id uuid default uuid_generate_v4() primary key,
  slug text unique not null,
  title text not null,
  title_vi text,
  level text default 'beginner' check (level in ('beginner', 'intermediate', 'advanced')),
  order_index int default 0,
  parent_id uuid references public.grammar_topics(id) on delete set null,
  created_at timestamptz default now()
);

-- =============================================
-- 2. GRAMMAR LESSONS — nội dung lý thuyết
-- =============================================
create table if not exists public.grammar_lessons (
  id uuid default uuid_generate_v4() primary key,
  topic_id uuid references public.grammar_topics(id) on delete cascade not null,
  title text not null,
  theory text,                    -- lý thuyết (markdown, tiếng Anh)
  theory_vi text,                 -- lý thuyết tiếng Việt
  examples jsonb default '[]',    -- mảng { en, vi, note }
  image_url text,
  image_source text,
  image_confidence smallint,
  source text,                    -- 'mai-lan-huong-pdf' | 'web-scrape' | 'ai'
  source_url text,
  order_index int default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create index if not exists idx_grammar_lessons_topic on public.grammar_lessons(topic_id);

-- =============================================
-- 3. GRAMMAR PROGRESS — SRS theo bài học (FSRS v5, song song srs_progress)
-- =============================================
create table if not exists public.grammar_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  lesson_id uuid references public.grammar_lessons(id) on delete cascade not null,
  stability float8 default 0,
  difficulty float8 default 0,
  interval_days int default 0,
  review_count int default 0,
  next_review_date timestamptz default now(),
  last_reviewed_at timestamptz,
  state text default 'new',
  mastery_score smallint default 0,
  unique(user_id, lesson_id)
);

create index if not exists idx_grammar_progress_user on public.grammar_progress(user_id);

-- =============================================
-- 4. Gắn grammar_exercises với lesson
-- =============================================
alter table public.grammar_exercises
  add column if not exists lesson_id uuid references public.grammar_lessons(id) on delete set null;

-- =============================================
-- 5. ROW LEVEL SECURITY
-- =============================================
alter table public.grammar_topics enable row level security;
alter table public.grammar_lessons enable row level security;
alter table public.grammar_progress enable row level security;

-- grammar_topics: ai cũng xem, chỉ teacher quản lý
create policy "Anyone can view grammar topics" on public.grammar_topics
  for select using (true);
create policy "Teachers manage grammar topics" on public.grammar_topics
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'));

-- grammar_lessons: ai cũng xem, chỉ teacher quản lý
create policy "Anyone can view grammar lessons" on public.grammar_lessons
  for select using (true);
create policy "Teachers manage grammar lessons" on public.grammar_lessons
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'));

-- grammar_progress: user quản lý của mình; teacher xem học sinh trong lớp
create policy "Users manage own grammar progress" on public.grammar_progress
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "Teachers view student grammar progress" on public.grammar_progress
  for select using (
    exists (
      select 1 from public.enrollments e
      join public.classrooms c on c.id = e.classroom_id
      where e.student_id = grammar_progress.user_id and c.teacher_id = auth.uid()
    )
  );
