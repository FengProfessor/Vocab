-- Migration: Tối ưu hiệu năng truy vấn cho LingoPro Self-Hosted CSDL
-- Đánh các chỉ mục kép (Composite Indexes) giúp tăng tốc độ truy vấn SRS, bài tập ngữ pháp và danh sách từ vựng.

-- 1. Index cho truy vấn từ ôn tập SRS theo user và ngày đến hạn
CREATE INDEX IF NOT EXISTS idx_srs_user_next_review 
  ON public.srs_progress(user_id, next_review_date);

-- 2. Index cho truy vấn lịch sử làm bài tập ngữ pháp
CREATE INDEX IF NOT EXISTS idx_grammar_results_user_exercise 
  ON public.grammar_results(user_id, exercise_id);

-- 3. Index cho truy vấn danh sách từ vựng trong lớp học
CREATE INDEX IF NOT EXISTS idx_words_classroom 
  ON public.words(classroom_id);

-- 4. Index cho từ điển toàn cầu theo từ
CREATE INDEX IF NOT EXISTS idx_global_dictionary_word 
  ON public.global_dictionary(word);
