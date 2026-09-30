-- =============================================================================
-- CRM Performance Optimization RPC — 2026-10-01
-- Replaces fetching 60k+ raw rows (words, srs_progress, quiz_results) over HTTP
-- with a single aggregate SQL function executed inside Postgres engine in ~20ms.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_crm_customer_stats(
  p_now timestamptz DEFAULT now()
)
RETURNS TABLE (
  user_id uuid,
  word_count bigint,
  last_word_at timestamptz,
  learned_count bigint,
  review_total bigint,
  lapses_total bigint,
  last_reviewed_at timestamptz,
  due_count bigint,
  quiz_count bigint,
  last_quiz_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  WITH
  -- 1. Personal vocabulary words per user (classroom name = '__personal__')
  personal_words AS (
    SELECT
      c.teacher_id AS uid,
      count(w.id)::bigint AS word_count,
      max(w.created_at) AS last_word_at
    FROM public.classrooms c
    JOIN public.words w ON w.classroom_id = c.id
    WHERE c.name = '__personal__'
    GROUP BY c.teacher_id
  ),
  -- 2. SRS stats per user (learned words, total reviews, lapses, last review, due)
  srs_stats AS (
    SELECT
      sp.user_id AS uid,
      count(*) FILTER (WHERE sp.review_count >= 1)::bigint AS learned_count,
      COALESCE(sum(sp.review_count) FILTER (WHERE sp.review_count > 0), 0)::bigint AS review_total,
      COALESCE(sum(sp.lapses) FILTER (WHERE sp.lapses > 0), 0)::bigint AS lapses_total,
      max(sp.last_reviewed_at) AS last_reviewed_at,
      count(*) FILTER (
        WHERE sp.next_review_date IS NOT NULL 
          AND sp.next_review_date <= (p_now AT TIME ZONE 'UTC')::date
      )::bigint AS due_count
    FROM public.srs_progress sp
    GROUP BY sp.user_id
  ),
  -- 3. Quiz stats per user (total quizzes completed, last quiz timestamp)
  quiz_stats AS (
    SELECT
      qr.user_id AS uid,
      count(*)::bigint AS quiz_count,
      max(qr.completed_at) AS last_quiz_at
    FROM public.quiz_results qr
    GROUP BY qr.user_id
  )
  SELECT
    p.id AS user_id,
    COALESCE(pw.word_count, 0)::bigint AS word_count,
    pw.last_word_at,
    COALESCE(ss.learned_count, 0)::bigint AS learned_count,
    COALESCE(ss.review_total, 0)::bigint AS review_total,
    COALESCE(ss.lapses_total, 0)::bigint AS lapses_total,
    ss.last_reviewed_at,
    COALESCE(ss.due_count, 0)::bigint AS due_count,
    COALESCE(qs.quiz_count, 0)::bigint AS quiz_count,
    qs.last_quiz_at
  FROM public.profiles p
  LEFT JOIN personal_words pw ON pw.uid = p.id
  LEFT JOIN srs_stats ss ON ss.uid = p.id
  LEFT JOIN quiz_stats qs ON qs.uid = p.id;
$$;

REVOKE ALL ON FUNCTION public.get_crm_customer_stats(timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_crm_customer_stats(timestamptz) TO service_role;
