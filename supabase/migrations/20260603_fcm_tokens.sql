-- Multi-device FCM: 1 user có thể có nhiều token (iPhone, máy tính, Android…)
-- Thay cho việc lưu 1 token duy nhất ở profiles.fcm_token (bị ghi đè khi đổi thiết bị).

create table if not exists public.fcm_tokens (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete cascade not null,
  token        text not null,
  device_label text,
  created_at   timestamptz default now(),
  last_used_at timestamptz default now(),
  unique (user_id, token)
);

create index if not exists idx_fcm_tokens_user on public.fcm_tokens(user_id);

alter table public.fcm_tokens enable row level security;

-- Idempotent: drop trước khi tạo để chạy lại không lỗi
drop policy if exists "Users manage own fcm tokens" on public.fcm_tokens;
create policy "Users manage own fcm tokens"
  on public.fcm_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Backfill token cũ từ profiles.fcm_token (giữ liền mạch khi chuyển)
insert into public.fcm_tokens (user_id, token)
select id, fcm_token from public.profiles
where fcm_token is not null
on conflict (user_id, token) do nothing;
