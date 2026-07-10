-- Extension tokens: multi-device, expires_at, revoke.
-- Trước: 1 token/user (upsert on user_id) → desktop + extension thu hồi lẫn nhau.

-- Bỏ unique 1 token/user
DROP INDEX IF EXISTS public.extension_tokens_user_id_key;

ALTER TABLE public.extension_tokens
  ADD COLUMN IF NOT EXISTS device_name text,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz;

-- Index tra cứu token active theo user
CREATE INDEX IF NOT EXISTS idx_extension_tokens_user_active
  ON public.extension_tokens (user_id, created_at DESC)
  WHERE revoked_at IS NULL;

-- Lookup hash vẫn unique (token_hash)
-- Default expiry cho token cũ: null = không hết hạn (giữ hành vi cũ cho đến khi mint lại)

COMMENT ON COLUMN public.extension_tokens.device_name IS
  'Tên thiết bị do client gửi (vd Chrome Extension, Desktop Windows)';
COMMENT ON COLUMN public.extension_tokens.expires_at IS
  'Null = không hết hạn; mint mới mặc định +1 năm';
COMMENT ON COLUMN public.extension_tokens.revoked_at IS
  'Null = còn hiệu lực; set khi user revoke hoặc mint thay thế tùy chọn';
