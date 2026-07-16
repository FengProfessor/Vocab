-- Multi-track enrollment: 1 user ghi danh CẢ CEFR lẫn THPT (song song).
-- Trước: PK = user_id → chọn track = ghi đè. Sau: PK = (user_id, track).
-- step_id không trùng giữa 2 artifact → user_roadmap_steps giữ nguyên.

alter table public.user_roadmap drop constraint if exists user_roadmap_pkey;

-- track đã not null + check từ 20260704; đảm bảo lại nếu môi trường thiếu migration cũ
alter table public.user_roadmap
  alter column track set default 'cefr';

alter table public.user_roadmap
  add constraint user_roadmap_pkey primary key (user_id, track);

create index if not exists idx_user_roadmap_user on public.user_roadmap (user_id);
