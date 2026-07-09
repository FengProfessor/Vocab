-- 1 FCM token = 1 thiết bị. Không cho cùng token gắn nhiều user
-- (đổi tài khoản trên 1 máy → broadcast/cron bắn 2 TB xuống 1 phone).

-- Giữ bản ghi mới nhất theo last_used_at cho mỗi token trùng
with ranked as (
  select id,
         row_number() over (
           partition by token
           order by last_used_at desc nulls last, created_at desc nulls last
         ) as rn
  from public.fcm_tokens
)
delete from public.fcm_tokens
where id in (select id from ranked where rn > 1);

-- Unique toàn cục trên token
create unique index if not exists fcm_tokens_token_unique
  on public.fcm_tokens (token);
