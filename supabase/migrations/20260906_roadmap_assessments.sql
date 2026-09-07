-- Migration: 20260906_roadmap_assessments.sql
-- Lưu trữ lịch sử đánh giá đa tầng (Mini-quiz, Checkpoint, Level Exit Exam)
-- cùng báo cáo chẩn đoán (Diagnostic Report) cho Lộ trình học (Learning Roadmap).

create table if not exists public.user_roadmap_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  track text not null default 'cefr' check (track in ('cefr', 'thpt')),
  tier text not null check (tier in ('mini_quiz', 'checkpoint', 'exit_exam')),
  target_id text not null,
  score integer not null check (score >= 0 and score <= 100),
  passed boolean not null default false,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Index phục vụ tra cứu lịch sử làm bài gần nhất theo user và node/chặng/cấp
create index if not exists idx_user_roadmap_assessments_lookup
  on public.user_roadmap_assessments (user_id, target_id, created_at desc);

-- Index phục vụ thống kê theo track và tier đánh giá
create index if not exists idx_user_roadmap_assessments_user_tier
  on public.user_roadmap_assessments (user_id, track, tier);

-- Row Level Security (RLS)
alter table public.user_roadmap_assessments enable row level security;

create policy "user_roadmap_assessments_select_own"
  on public.user_roadmap_assessments
  for select
  using (auth.uid() = user_id);

create policy "user_roadmap_assessments_insert_own"
  on public.user_roadmap_assessments
  for insert
  with check (auth.uid() = user_id);
