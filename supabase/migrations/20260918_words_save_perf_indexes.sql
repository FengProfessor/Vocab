-- Migration: Tối ưu hiệu năng lưu từ và tính quota cho học sinh
-- Index tăng tốc truy vấn đếm từ cá nhân (added_by) theo chu kỳ thời gian (created_at)

CREATE INDEX IF NOT EXISTS idx_words_added_by_created 
  ON public.words(added_by, created_at);

CREATE INDEX IF NOT EXISTS idx_srs_user_word 
  ON public.srs_progress(user_id, word_id);

-- Index tăng tốc kiểm tra trùng lặp khi lưu từ (classroom_id + lower(word))
CREATE INDEX IF NOT EXISTS idx_words_classroom_word_lower
  ON public.words(classroom_id, lower(word));

-- Index tăng tốc truy vấn thẻ đến hạn ôn FSRS (user_id + next_review_date)
CREATE INDEX IF NOT EXISTS idx_srs_user_next_review
  ON public.srs_progress(user_id, next_review_date);

