-- Đa track lộ trình: 'cefr' (A0-B2 hiện có) + 'thpt' (lớp 10/11/12 luyện thi).
-- user_roadmap thêm cột track; hàng cũ mặc định 'cefr'.
-- step_id trong user_roadmap_steps đã prefix theo artifact (sv-/sg-/sr-...) nên không xung đột giữa track.

alter table public.user_roadmap
  add column if not exists track text not null default 'cefr'
  check (track in ('cefr', 'thpt'));

-- level_id giờ chấp nhận cả mã lớp THPT — nới constraint cũ.
alter table public.user_roadmap drop constraint if exists user_roadmap_level_id_check;
alter table public.user_roadmap
  add constraint user_roadmap_level_id_check
  check (level_id in ('A0','A1','A2','B1','B2','lop-10','lop-11','lop-12'));
