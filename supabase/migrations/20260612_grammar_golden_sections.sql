-- Golden Lesson: lưu nội dung CÓ CẤU TRÚC để UI render section-cards + quiz interactive
-- (thay vì markdown blob). Giữ theory_vi cũ làm fallback.
alter table public.grammar_lessons add column if not exists sections jsonb;
alter table public.grammar_lessons add column if not exists exercises jsonb;
