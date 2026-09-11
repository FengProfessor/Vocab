-- Migration: 20260911_toeic_question_history.sql
-- Description: Per-question attempt and history tracking for TOEIC practice & exams.
-- Supports smart question anti-duplication, spaced repetition mistake review, and cross-device sync.

create table if not exists public.user_toeic_question_history (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  part integer not null check (part between 1 and 7),
  last_answered_at timestamptz not null default now(),
  is_correct boolean not null,
  attempt_count integer not null default 1 check (attempt_count >= 1),
  selected_option text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Composite Primary Key: Exactly one record per question per user (O(1) upsert)
  constraint user_toeic_question_history_pkey primary key (user_id, question_id)
);

-- Index for querying all answered questions by a user in a specific TOEIC Part
create index if not exists idx_user_toeic_question_history_user_part
  on public.user_toeic_question_history (user_id, part);

-- Index for querying mistakes (is_correct = false) and progress stats by part
create index if not exists idx_user_toeic_question_history_user_part_correct
  on public.user_toeic_question_history (user_id, part, is_correct);

-- Enable Row Level Security (RLS)
alter table public.user_toeic_question_history enable row level security;

-- RLS Policies: Authenticated users have full CRUD on their own records

create policy user_toeic_question_history_select_own
  on public.user_toeic_question_history
  for select
  using (auth.uid() = user_id);

create policy user_toeic_question_history_insert_own
  on public.user_toeic_question_history
  for insert
  with check (auth.uid() = user_id);

create policy user_toeic_question_history_update_own
  on public.user_toeic_question_history
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy user_toeic_question_history_delete_own
  on public.user_toeic_question_history
  for delete
  using (auth.uid() = user_id);
