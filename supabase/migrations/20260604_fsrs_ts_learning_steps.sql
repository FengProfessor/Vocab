-- =============================================
-- FSRS (ts-fsrs) upgrade — thêm learning/relearning steps
-- Bổ sung cột để lưu Card của ts-fsrs: lapses + learning_steps.
-- (Cột `state` đã có sẵn: srs_progress.state int — 20260411; grammar_progress.state text — 20260519)
-- Chạy TRƯỚC khi deploy code dùng lib/fsrs.ts. An toàn idempotent (IF NOT EXISTS).
-- =============================================

-- 1) Từ vựng
ALTER TABLE public.srs_progress
  ADD COLUMN IF NOT EXISTS lapses          int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS learning_steps  int DEFAULT 0;

COMMENT ON COLUMN public.srs_progress.lapses         IS 'FSRS: số lần quên (Again) trên thẻ';
COMMENT ON COLUMN public.srs_progress.learning_steps IS 'FSRS: chỉ số bước learning/relearning hiện tại';

-- 2) Ngữ pháp
ALTER TABLE public.grammar_progress
  ADD COLUMN IF NOT EXISTS lapses          int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS learning_steps  int DEFAULT 0;

COMMENT ON COLUMN public.grammar_progress.lapses         IS 'FSRS: số lần quên';
COMMENT ON COLUMN public.grammar_progress.learning_steps IS 'FSRS: chỉ số bước learning/relearning hiện tại';

-- Ghi chú: KHÔNG cần migrate dữ liệu cũ — lib/fsrs.ts tự suy luận state=Review cho
-- hàng legacy có stability/review_count > 0 (state=0) để không reset tiến độ.
