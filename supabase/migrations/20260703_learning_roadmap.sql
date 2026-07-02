-- Learning Roadmap (lộ trình 5 cấp A0→B2)
-- user_roadmap: 1 hàng/user — cấp hiện tại + kết quả placement.
-- user_roadmap_steps: tiến độ từng step (step_id ổn định từ artifact roadmap-v1.json).

create table if not exists public.user_roadmap (
  user_id uuid primary key references auth.users(id) on delete cascade,
  roadmap_version text not null default 'roadmap-v1',
  level_id text not null check (level_id in ('A0', 'A1', 'A2', 'B1', 'B2')),
  current_unit_id text,
  placement jsonb,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roadmap_steps (
  user_id uuid not null references auth.users(id) on delete cascade,
  step_id text not null,
  status text not null default 'completed' check (status in ('in_progress', 'completed')),
  score integer,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, step_id)
);

create index if not exists idx_user_roadmap_steps_user on public.user_roadmap_steps (user_id);

alter table public.user_roadmap enable row level security;
alter table public.user_roadmap_steps enable row level security;

-- Owner-only đọc; ghi qua service role trong API routes (bypass RLS).
drop policy if exists "user_roadmap_select_own" on public.user_roadmap;
create policy "user_roadmap_select_own" on public.user_roadmap
  for select using (auth.uid() = user_id);

drop policy if exists "user_roadmap_steps_select_own" on public.user_roadmap_steps;
create policy "user_roadmap_steps_select_own" on public.user_roadmap_steps
  for select using (auth.uid() = user_id);
