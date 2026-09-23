-- Tiến độ A0/A1 lưu theo tài khoản và chặng; bài học vẫn chạy khi ngoại tuyến.
create table if not exists public.grammar_micro_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  stage text not null check (stage in ('a0', 'a1')),
  completed_steps integer[] not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (user_id, stage),
  constraint grammar_micro_steps_valid check (
    completed_steps <@ array[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
      12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]
  )
);

alter table public.grammar_micro_progress enable row level security;

drop policy if exists "Users read own grammar foundation progress" on public.grammar_micro_progress;
create policy "Users read own grammar foundation progress"
  on public.grammar_micro_progress for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own grammar foundation progress" on public.grammar_micro_progress;
create policy "Users insert own grammar foundation progress"
  on public.grammar_micro_progress for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own grammar foundation progress" on public.grammar_micro_progress;
create policy "Users update own grammar foundation progress"
  on public.grammar_micro_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
