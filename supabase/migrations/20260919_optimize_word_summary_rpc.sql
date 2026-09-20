-- Migration: 20260919_optimize_word_summary_rpc.sql
-- Description: Single-pass get_word_summary RPC with FILTER clauses, personal classroom auto-resolution, and level counts.

-- 1. Covering index for zero-heap Index-Only Scans
CREATE INDEX IF NOT EXISTS idx_srs_user_word_summary_perf
  ON public.srs_progress (user_id, word_id)
  INCLUDE (review_count, next_review_date, stability);

-- 2. Drop existing function signatures to allow new return table contract
DROP FUNCTION IF EXISTS public.get_word_summary(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_word_summary(uuid);

-- 3. Optimized single-pass RPC
CREATE OR REPLACE FUNCTION public.get_word_summary(
  p_user_id uuid,
  p_classroom_id uuid DEFAULT NULL
)
RETURNS TABLE (
  total bigint,
  learned bigint,
  review_due bigint,
  srs_due bigint,
  with_srs bigint,
  new_count bigint,
  review_due_count bigint,
  due_count bigint,
  level_counts jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_target_class_id uuid := p_classroom_id;
BEGIN
  -- Authenticated user verification: only service_role or the user themselves
  IF coalesce(auth.role(), '') <> 'service_role'
     AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Forbidden' USING errcode = '42501';
  END IF;

  -- Auto-resolve personal classroom when omitted/NULL
  IF v_target_class_id IS NULL THEN
    SELECT id INTO v_target_class_id
    FROM public.classrooms
    WHERE teacher_id = p_user_id
      AND name = '__personal__'
    LIMIT 1;
  END IF;

  -- If user has no personal classroom yet, return zeroes immediately (<0.1ms)
  IF v_target_class_id IS NULL THEN
    RETURN QUERY SELECT
      0::bigint AS total,
      0::bigint AS learned,
      0::bigint AS review_due,
      0::bigint AS srs_due,
      0::bigint AS with_srs,
      0::bigint AS new_count,
      0::bigint AS review_due_count,
      0::bigint AS due_count,
      jsonb_build_array(0, 0, 0, 0, 0, 0) AS level_counts;
    RETURN;
  END IF;

  -- Single-pass aggregation using index join and FILTER clauses
  RETURN QUERY
  SELECT
    count(w.id)::bigint AS total,
    count(sp.word_id) FILTER (WHERE sp.review_count > 0)::bigint AS learned,
    count(sp.word_id) FILTER (
      WHERE sp.review_count > 0 AND sp.next_review_date <= (now() AT TIME ZONE 'UTC')
    )::bigint AS review_due,
    count(sp.word_id) FILTER (
      WHERE sp.next_review_date <= (now() AT TIME ZONE 'UTC')
    )::bigint AS srs_due,
    count(sp.word_id)::bigint AS with_srs,
    GREATEST(0, count(w.id) - count(sp.word_id) FILTER (WHERE sp.review_count > 0))::bigint AS new_count,
    count(sp.word_id) FILTER (
      WHERE sp.review_count > 0 AND sp.next_review_date <= (now() AT TIME ZONE 'UTC')
    )::bigint AS review_due_count,
    (
      count(sp.word_id) FILTER (WHERE sp.next_review_date <= (now() AT TIME ZONE 'UTC'))
      + GREATEST(0, count(w.id) - count(sp.word_id))
    )::bigint AS due_count,
    jsonb_build_array(
      count(w.id) FILTER (WHERE sp.word_id IS NULL OR COALESCE(sp.stability, 0) < 2),
      count(w.id) FILTER (WHERE sp.word_id IS NOT NULL AND sp.stability >= 2 AND sp.stability < 5),
      count(w.id) FILTER (WHERE sp.word_id IS NOT NULL AND sp.stability >= 5 AND sp.stability < 10),
      count(w.id) FILTER (WHERE sp.word_id IS NOT NULL AND sp.stability >= 10 AND sp.stability < 30),
      count(w.id) FILTER (WHERE sp.word_id IS NOT NULL AND sp.stability >= 30 AND sp.stability < 90),
      count(w.id) FILTER (WHERE sp.word_id IS NOT NULL AND sp.stability >= 90)
    ) AS level_counts
  FROM public.words w
  LEFT JOIN public.srs_progress sp
    ON sp.word_id = w.id
   AND sp.user_id = p_user_id
  WHERE w.classroom_id = v_target_class_id;
END;
$$;

-- 4. Permissions configuration
REVOKE ALL ON FUNCTION public.get_word_summary(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_word_summary(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_word_summary(uuid, uuid) TO authenticated;

-- 5. Refresh query planner statistics
ANALYZE public.words;
ANALYZE public.srs_progress;
ANALYZE public.classrooms;
