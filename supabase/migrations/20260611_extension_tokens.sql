-- Extension tokens: long-lived opaque tokens for Chrome Extension auth.
-- Vá lỗi: extension trước đây dùng Supabase access_token (hết hạn ~1h)
-- → SAVE_WORD 401 sau 1 giờ, học sinh phải copy token lại liên tục.
-- Token dạng `lpext_<random>`, chỉ lưu SHA-256 hash. 1 token/user — regenerate = thu hồi token cũ.

create table if not exists public.extension_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

-- 1 token active per user (upsert onConflict: user_id)
create unique index if not exists extension_tokens_user_id_key
  on public.extension_tokens(user_id);

-- Service-role only: bật RLS, KHÔNG tạo policy → anon/authenticated không đọc được hash
alter table public.extension_tokens enable row level security;
