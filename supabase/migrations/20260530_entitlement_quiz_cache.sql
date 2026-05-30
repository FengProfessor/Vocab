-- Mục đích: nền tảng monetization + tối ưu chi phí AI.
-- 1. Entitlement: gắn gói (plan) cho mỗi user để gate tính năng theo tầng giá.
-- 2. Quiz cache: tái dùng câu hỏi AI đã sinh theo từng lesson → giảm ~80% gọi Gemini.
-- 3. AI daily usage: đếm lượt AI/ngày để áp quota cho gói Free (foundation, bật khi cần).

-- =============================================
-- 1. ENTITLEMENT — gói của user
-- =============================================
alter table public.profiles
  add column if not exists plan text default 'free'
    check (plan in ('free', 'pro', 'premium'));

-- null = không hết hạn (free vĩnh viễn hoặc lifetime). Có giá trị = mốc hạ cấp về free.
alter table public.profiles
  add column if not exists plan_expires_at timestamptz;

create index if not exists idx_profiles_plan_expires
  on public.profiles(plan_expires_at)
  where plan_expires_at is not null;

-- =============================================
-- 2. GRAMMAR QUIZ CACHE — tái dùng câu hỏi AI theo lesson
-- =============================================
create table if not exists public.grammar_quiz_cache (
  lesson_id uuid primary key references public.grammar_lessons(id) on delete cascade,
  questions jsonb not null,       -- mảng QuizQuestion đã validate
  model text,                     -- model đã dùng (vd 'gemini-2.0-flash') để invalidate khi đổi model
  created_at timestamptz default now()
);

alter table public.grammar_quiz_cache enable row level security;
-- Chỉ service role ghi/đọc (route dùng createServiceClient bypass RLS). Không cấp policy cho client.

-- =============================================
-- 3. AI DAILY USAGE — đếm lượt AI/ngày/user (quota gói Free)
-- =============================================
create table if not exists public.ai_daily_usage (
  user_id uuid references public.profiles(id) on delete cascade not null,
  usage_date date not null default current_date,
  count int not null default 0,
  primary key (user_id, usage_date)
);

alter table public.ai_daily_usage enable row level security;
create policy "Users view own ai usage" on public.ai_daily_usage
  for select using (auth.uid() = user_id);

-- RPC tăng counter atomic, trả về count mới. Dùng service role gọi từ API route.
create or replace function public.increment_ai_usage(p_user_id uuid)
returns int
language plpgsql
security definer
as $$
declare
  new_count int;
begin
  insert into public.ai_daily_usage (user_id, usage_date, count)
  values (p_user_id, current_date, 1)
  on conflict (user_id, usage_date)
  do update set count = public.ai_daily_usage.count + 1
  returning count into new_count;
  return new_count;
end;
$$;
