-- Migration: Reading Library Articles & Progress
-- CEFR Level A1-C2, 15 themes according to src/lib/pack-themes.ts
-- High performance indexes & RLS policies compliant with GEMINI.md

create table if not exists public.reading_articles (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  title text not null,
  cefr_level text not null check (cefr_level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  theme_id text not null,
  passage text not null,
  passage_plain text not null,
  word_count int not null default 0,
  estimated_read_minutes int not null default 1,
  translation text,
  summary text,
  cloze jsonb not null default '{}'::jsonb,
  questions jsonb not null default '[]'::jsonb,
  vocabulary_highlights jsonb not null default '[]'::jsonb,
  audio_url text,
  podcast_meta jsonb default '{}'::jsonb,
  mindmap_data jsonb default '{}'::jsonb,
  source_type text not null default 'custom' check (source_type in ('vstep', 'toeic', 'voa', 'race', 'openstax', 'custom')),
  source_id text,
  source_metadata jsonb default '{}'::jsonb,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  difficulty_score float default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.reading_articles is
  'Library of reading articles spanning CEFR A1-C2 across 15 curated themes with cloze, questions, audio, and mindmaps.';

-- Optimized Indexes according to GEMINI.md
create index if not exists reading_articles_level_theme_status_idx
  on public.reading_articles (cefr_level, theme_id, status);

create index if not exists reading_articles_theme_status_idx
  on public.reading_articles (theme_id, status);

create index if not exists reading_articles_source_idx
  on public.reading_articles (source_type, source_id);

create index if not exists reading_articles_created_idx
  on public.reading_articles (created_at desc);

create index if not exists reading_articles_slug_idx
  on public.reading_articles (slug);

-- Enable RLS
alter table public.reading_articles enable row level security;

-- Reading Articles Policies
drop policy if exists "Public read published reading articles" on public.reading_articles;
create policy "Public read published reading articles"
  on public.reading_articles for select
  using (status = 'published');

drop policy if exists "Service role full access on reading_articles" on public.reading_articles;
create policy "Service role full access on reading_articles"
  on public.reading_articles for all
  using (
    auth.role() = 'service_role'
    or (auth.jwt() ->> 'role') = 'service_role'
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- User Reading Library Progress
create table if not exists public.user_reading_library_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  article_id uuid references public.reading_articles(id) on delete cascade not null,
  status text default 'in_progress' check (status in ('in_progress', 'completed', 'bookmarked')),
  is_bookmarked boolean default false,
  read_count int default 0,
  last_read_at timestamptz default now(),
  reading_time_seconds int default 0,
  mcq_score int default 0,
  mcq_total int default 0,
  cloze_score int default 0,
  cloze_total int default 0,
  user_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, article_id)
);

comment on table public.user_reading_library_progress is
  'User reading library progress, bookmarks, and quiz scores.';

create index if not exists user_reading_progress_user_idx
  on public.user_reading_library_progress (user_id, last_read_at desc);

create index if not exists user_reading_progress_bookmarked_idx
  on public.user_reading_library_progress (user_id, is_bookmarked)
  where is_bookmarked = true;

create index if not exists user_reading_progress_article_idx
  on public.user_reading_library_progress (article_id);

alter table public.user_reading_library_progress enable row level security;

drop policy if exists "Users manage own reading library progress" on public.user_reading_library_progress;
create policy "Users manage own reading library progress"
  on public.user_reading_library_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Service role manage user reading progress" on public.user_reading_library_progress;
create policy "Service role manage user reading progress"
  on public.user_reading_library_progress for all
  using (
    auth.role() = 'service_role'
    or (auth.jwt() ->> 'role') = 'service_role'
  );
