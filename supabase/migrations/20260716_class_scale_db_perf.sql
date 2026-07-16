-- =============================================================================
-- Class scale DB perf (200 HS / peak) — 2026-07-16
-- Mục tiêu: giảm sequential scan + thay N+1 levelCounts bằng 1 RPC.
-- An toàn: IF NOT EXISTS / CREATE OR REPLACE. Chạy trên Supabase SQL Editor
-- hoặc: supabase db push
-- =============================================================================

-- ── 1. Indexes hot-path (login + /student + flashcard) ──────────────────────

-- Personal classroom lookup: teacher_id + name = '__personal__' (mỗi request /api/words)
CREATE INDEX IF NOT EXISTS idx_classrooms_teacher_name
  ON public.classrooms (teacher_id, name);

-- Join class / verify enrollment
CREATE INDEX IF NOT EXISTS idx_enrollments_student
  ON public.enrollments (student_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_classroom
  ON public.enrollments (classroom_id);

-- SRS join theo word (delete word, leaderboard, level map)
CREATE INDEX IF NOT EXISTS idx_srs_progress_word
  ON public.srs_progress (word_id);

-- Review queue: user + đã học + due + sort next_review
-- (bổ sung partial đã có idx_srs_progress_user_due — covering sort)
CREATE INDEX IF NOT EXISTS idx_srs_progress_user_review_due_sorted
  ON public.srs_progress (user_id, next_review_date ASC)
  WHERE review_count > 0;

-- last_reviewed_at heatmap (stats lite 30 ngày)
CREATE INDEX IF NOT EXISTS idx_srs_progress_user_last_reviewed
  ON public.srs_progress (user_id, last_reviewed_at DESC)
  WHERE last_reviewed_at IS NOT NULL;

-- Quiz history
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_completed
  ON public.quiz_results (user_id, completed_at DESC);

-- Peer enrich: tìm từ đã có nghĩa theo word (ilike exact thường = lower)
CREATE INDEX IF NOT EXISTS idx_words_word_lower
  ON public.words (lower(word));

-- Global dictionary lookup (đã có idx_global_dictionary_word — đảm bảo)
CREATE INDEX IF NOT EXISTS idx_global_dictionary_word_lower
  ON public.global_dictionary (lower(word));

-- ── 2. RPC: phân bố L1–L6 một query (thay fetchLevelCounts O(n) chunk) ─────
-- Khớp src/lib/srs.ts stabilityToLevel:
--   S<2→L1, S<5→L2, S<10→L3, S<30→L4, S<90→L5, else L6
-- Chưa có SRS = L1

CREATE OR REPLACE FUNCTION public.get_word_level_counts(
  p_user_id uuid,
  p_classroom_id uuid
)
RETURNS TABLE (
  l1 bigint,
  l2 bigint,
  l3 bigint,
  l4 bigint,
  l5 bigint,
  l6 bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  WITH levels AS (
    SELECT
      CASE
        WHEN sp.word_id IS NULL OR COALESCE(sp.stability, 0) < 2 THEN 1
        WHEN sp.stability < 5 THEN 2
        WHEN sp.stability < 10 THEN 3
        WHEN sp.stability < 30 THEN 4
        WHEN sp.stability < 90 THEN 5
        ELSE 6
      END AS lvl
    FROM public.words w
    LEFT JOIN public.srs_progress sp
      ON sp.word_id = w.id
     AND sp.user_id = p_user_id
    WHERE w.classroom_id = p_classroom_id
  )
  SELECT
    count(*) FILTER (WHERE lvl = 1)::bigint,
    count(*) FILTER (WHERE lvl = 2)::bigint,
    count(*) FILTER (WHERE lvl = 3)::bigint,
    count(*) FILTER (WHERE lvl = 4)::bigint,
    count(*) FILTER (WHERE lvl = 5)::bigint,
    count(*) FILTER (WHERE lvl = 6)::bigint
  FROM levels;
$$;

REVOKE ALL ON FUNCTION public.get_word_level_counts(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_word_level_counts(uuid, uuid) TO service_role;

-- ── 3. RPC: due review words (cap) — 1 round-trip cho flashcard ────────────
-- Trả id + fields nhẹ; API vẫn có thể dùng filter=review hiện tại.
-- Dùng khi muốn cắt join srs_progress(*) bloated.

CREATE OR REPLACE FUNCTION public.get_due_review_word_ids(
  p_user_id uuid,
  p_limit int DEFAULT 40
)
RETURNS TABLE (
  word_id uuid,
  next_review_date timestamptz,
  review_count int,
  stability double precision,
  difficulty double precision
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT
    sp.word_id,
    sp.next_review_date::timestamptz,
    sp.review_count,
    sp.stability,
    sp.difficulty
  FROM public.srs_progress sp
  WHERE sp.user_id = p_user_id
    AND sp.review_count > 0
    AND sp.next_review_date <= (now() AT TIME ZONE 'UTC')
  ORDER BY sp.next_review_date ASC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 40), 100));
$$;

REVOKE ALL ON FUNCTION public.get_due_review_word_ids(uuid, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_due_review_word_ids(uuid, int) TO service_role;

-- ── 4. Củng cố get_word_summary: chỉ đếm SRS gắn word trong classroom ───────
-- (tránh over-count khi user có SRS ở lớp khác)

CREATE OR REPLACE FUNCTION public.get_word_summary(
  p_user_id uuid,
  p_classroom_id uuid
)
RETURNS TABLE (
  total bigint,
  new_count bigint,
  review_due_count bigint,
  due_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role'
     AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Forbidden' USING errcode = '42501';
  END IF;

  RETURN QUERY
  WITH w AS (
    SELECT w.id
    FROM public.words w
    WHERE w.classroom_id = p_classroom_id
  ),
  s AS (
    SELECT
      sp.word_id,
      sp.review_count,
      sp.next_review_date
    FROM public.srs_progress sp
    INNER JOIN w ON w.id = sp.word_id
    WHERE sp.user_id = p_user_id
  ),
  agg AS (
    SELECT
      (SELECT count(*)::bigint FROM w) AS total,
      (SELECT count(*)::bigint FROM s WHERE review_count > 0) AS learned,
      (SELECT count(*)::bigint FROM s
        WHERE review_count > 0
          AND next_review_date <= (now() AT TIME ZONE 'UTC')) AS review_due,
      (SELECT count(*)::bigint FROM s
        WHERE next_review_date <= (now() AT TIME ZONE 'UTC')) AS srs_due,
      (SELECT count(*)::bigint FROM s) AS with_srs
  )
  SELECT
    agg.total,
    GREATEST(0, agg.total - agg.learned) AS new_count,
    agg.review_due AS review_due_count,
    (agg.srs_due + GREATEST(0, agg.total - agg.with_srs)) AS due_count
  FROM agg;
END;
$$;

REVOKE ALL ON FUNCTION public.get_word_summary(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_word_summary(uuid, uuid) TO service_role;

-- ── 5. Stats planner ───────────────────────────────────────────────────────
ANALYZE public.words;
ANALYZE public.srs_progress;
ANALYZE public.classrooms;
ANALYZE public.enrollments;
ANALYZE public.profiles;
ANALYZE public.quiz_results;
ANALYZE public.global_dictionary;
