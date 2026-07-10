-- Perf: indexes cho count summary (cần ôn / cần học) + optional RPC 1-shot

-- SRS: đếm due (user + next_review_date, chỉ đã học)
CREATE INDEX IF NOT EXISTS idx_srs_progress_user_due
  ON public.srs_progress (user_id, next_review_date)
  WHERE review_count > 0;

-- SRS: đếm đã học theo user
CREATE INDEX IF NOT EXISTS idx_srs_progress_user_learned
  ON public.srs_progress (user_id)
  WHERE review_count > 0;

-- SRS: filter due mọi review_count (dueCount gộp)
CREATE INDEX IF NOT EXISTS idx_srs_progress_user_next_review
  ON public.srs_progress (user_id, next_review_date);

-- Words list theo classroom + created_at DESC
CREATE INDEX IF NOT EXISTS idx_words_classroom_created
  ON public.words (classroom_id, created_at DESC);

-- RPC một query: total / new / review_due / due (service_role hoặc authenticated user = p_user_id)
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
  -- Authenticated: chỉ đọc summary của chính mình. service_role bỏ qua.
  IF coalesce(auth.role(), '') <> 'service_role'
     AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Forbidden' USING errcode = '42501';
  END IF;

  RETURN QUERY
  WITH w AS (
    SELECT count(*)::bigint AS total
    FROM public.words
    WHERE classroom_id = p_classroom_id
  ),
  s AS (
    SELECT
      count(*) FILTER (WHERE review_count > 0)::bigint AS learned,
      count(*) FILTER (
        WHERE review_count > 0 AND next_review_date <= (now() AT TIME ZONE 'UTC')
      )::bigint AS review_due,
      count(*) FILTER (
        WHERE next_review_date <= (now() AT TIME ZONE 'UTC')
      )::bigint AS srs_due,
      count(*)::bigint AS with_srs
    FROM public.srs_progress
    WHERE user_id = p_user_id
  )
  SELECT
    w.total,
    GREATEST(0, w.total - s.learned) AS new_count,
    s.review_due AS review_due_count,
    (s.srs_due + GREATEST(0, w.total - s.with_srs)) AS due_count
  FROM w, s;
END;
$$;

REVOKE ALL ON FUNCTION public.get_word_summary(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_word_summary(uuid, uuid) TO service_role;
-- Không grant authenticated: API dùng service_role sau khi check auth.uid()
