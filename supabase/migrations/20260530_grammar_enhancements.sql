-- Mục đích: nâng chất lượng bài tập grammar
-- 1. Phân biệt 3 dạng bài (multiple_choice / fill_blank / error_correction) để render UI khác nhau.
-- 2. Lưu độ khó để sort easy → hard trong drill, thay vì shuffle ngẫu nhiên.

alter table public.grammar_exercises
  add column if not exists type text default 'multiple_choice'
    check (type in ('multiple_choice', 'fill_blank', 'error_correction'));

alter table public.grammar_exercises
  add column if not exists difficulty smallint default 2
    check (difficulty between 1 and 3);

-- Index để truy vấn ordered drill nhanh hơn khi mảng exercises lớn.
create index if not exists idx_grammar_exercises_difficulty
  on public.grammar_exercises(classroom_id, difficulty);
