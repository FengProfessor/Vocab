-- Migration: 20260927_cross_classroom_due_words_and_tz.sql
-- Description: Cross-classroom vocabulary review support, timezone normalization to now(), and translation filtering (failed, Analyzing, ⏳) across get_due_words_list, get_word_summary, and push_actual_due_counts.

-- ============================================================================
-- 1. get_due_words_list
-- Returns due vocabulary words for review.
-- Supports cross-classroom querying when p_classroom_id IS NULL by checking all
-- classrooms the user owns or is enrolled in.
-- Includes classroom_id in return table for multi-classroom session tracking.
-- Evaluates s.next_review_date <= now() and excludes translation artifacts (failed, Analyzing, ⏳).
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_due_words_list(uuid, uuid, integer);
DROP FUNCTION IF EXISTS public.get_due_words_list(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_due_words_list(uuid);

CREATE OR REPLACE FUNCTION public.get_due_words_list(
  p_user_id uuid,
  p_classroom_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  word text,
  translation text,
  ipa text,
  pos text,
  example text,
  example_vi text,
  synonyms text[],
  antonyms text[],
  image_url text,
  review_count integer,
  classroom_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  WITH user_classes AS (
    SELECT c.id FROM public.classrooms c WHERE c.teacher_id = p_user_id
    UNION
    SELECT e.classroom_id AS id FROM public.enrollments e WHERE e.student_id = p_user_id
  )
  SELECT
    w.id,
    w.word,
    w.translation,
    w.ipa,
    w.pos,
    w.example,
    w.example_vi,
    w.synonyms,
    w.antonyms,
    w.image_url,
    s.review_count,
    w.classroom_id
  FROM public.srs_progress s
  JOIN public.words w ON w.id = s.word_id
  WHERE s.user_id = p_user_id
    AND w.classroom_id IN (SELECT id FROM user_classes)
    AND (p_classroom_id IS NULL OR w.classroom_id = p_classroom_id)
    AND s.review_count > 0
    AND s.next_review_date <= now()
    AND w.translation IS NOT NULL
    AND trim(w.translation) <> ''
    AND w.translation NOT ILIKE '%failed%'
    AND w.translation NOT ILIKE '%Analyzing%'
    AND w.translation NOT LIKE '%⏳%'
    AND (coalesce(auth.role(), '') = 'service_role' OR auth.uid() = p_user_id)
  ORDER BY s.next_review_date ASC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 0), 100);
$$;

REVOKE ALL ON FUNCTION public.get_due_words_list(uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_due_words_list(uuid, uuid, integer) TO service_role, authenticated;

-- ============================================================================
-- 2. get_word_summary
-- Aggregates vocabulary stats for a user.
-- When p_classroom_id IS NULL, aggregates across all user owned and enrolled classrooms.
-- Replaces (now() AT TIME ZONE 'UTC') with now() for uniform timestamptz evaluation.
-- Excludes translation artifacts (failed, Analyzing, ⏳) from review_due and srs_due.
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_word_summary(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_word_summary(uuid);

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
BEGIN
  -- Authenticated user verification: only service_role or the user themselves
  IF coalesce(auth.role(), '') <> 'service_role'
     AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Forbidden' USING errcode = '42501';
  END IF;

  RETURN QUERY
  WITH user_classes AS (
    SELECT c.id FROM public.classrooms c WHERE c.teacher_id = p_user_id
    UNION
    SELECT e.classroom_id AS id FROM public.enrollments e WHERE e.student_id = p_user_id
  )
  SELECT
    count(w.id)::bigint AS total,
    count(sp.word_id) FILTER (WHERE sp.review_count > 0)::bigint AS learned,
    count(sp.word_id) FILTER (
      WHERE sp.review_count > 0
        AND sp.next_review_date <= now()
        AND w.translation IS NOT NULL
        AND trim(w.translation) <> ''
        AND w.translation NOT ILIKE '%failed%'
        AND w.translation NOT ILIKE '%Analyzing%'
        AND w.translation NOT LIKE '%⏳%'
    )::bigint AS review_due,
    count(sp.word_id) FILTER (
      WHERE sp.next_review_date <= now()
        AND w.translation IS NOT NULL
        AND trim(w.translation) <> ''
        AND w.translation NOT ILIKE '%failed%'
        AND w.translation NOT ILIKE '%Analyzing%'
        AND w.translation NOT LIKE '%⏳%'
    )::bigint AS srs_due,
    count(sp.word_id)::bigint AS with_srs,
    GREATEST(0, count(w.id) - count(sp.word_id) FILTER (WHERE sp.review_count > 0))::bigint AS new_count,
    count(sp.word_id) FILTER (
      WHERE sp.review_count > 0
        AND sp.next_review_date <= now()
        AND w.translation IS NOT NULL
        AND trim(w.translation) <> ''
        AND w.translation NOT ILIKE '%failed%'
        AND w.translation NOT ILIKE '%Analyzing%'
        AND w.translation NOT LIKE '%⏳%'
    )::bigint AS review_due_count,
    (
      count(sp.word_id) FILTER (
        WHERE sp.next_review_date <= now()
          AND w.translation IS NOT NULL
          AND trim(w.translation) <> ''
          AND w.translation NOT ILIKE '%failed%'
          AND w.translation NOT ILIKE '%Analyzing%'
          AND w.translation NOT LIKE '%⏳%'
      )
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
  WHERE w.classroom_id IN (SELECT id FROM user_classes)
    AND (p_classroom_id IS NULL OR w.classroom_id = p_classroom_id);
END;
$$;

REVOKE ALL ON FUNCTION public.get_word_summary(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_word_summary(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_word_summary(uuid, uuid) TO authenticated;

-- ============================================================================
-- 3. push_actual_due_counts
-- Counts words actually due for review for an array of users.
-- Scopes words to active classrooms (owned or enrolled).
-- Excludes translation artifacts (failed, Analyzing, ⏳) to ensure push notification
-- counts match get_due_words_list and get_word_summary exactly.
-- ============================================================================

DROP FUNCTION IF EXISTS public.push_actual_due_counts(uuid[], timestamptz);
DROP FUNCTION IF EXISTS public.push_actual_due_counts(uuid[]);

CREATE OR REPLACE FUNCTION public.push_actual_due_counts(
  p_user_ids uuid[],
  p_now timestamptz DEFAULT now()
)
RETURNS TABLE(user_id uuid, due_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  WITH candidates AS (
    SELECT DISTINCT unnest(p_user_ids) AS user_id
  ),
  user_classes AS (
    SELECT c.teacher_id AS user_id, c.id AS cid
    FROM public.classrooms c
    JOIN candidates cand ON cand.user_id = c.teacher_id
    UNION
    SELECT e.student_id AS user_id, e.classroom_id AS cid
    FROM public.enrollments e
    JOIN candidates cand ON cand.user_id = e.student_id
  ),
  actual_due AS (
    SELECT
      sp.user_id,
      COUNT(DISTINCT sp.word_id)::bigint AS due_count
    FROM public.srs_progress sp
    JOIN candidates c ON c.user_id = sp.user_id
    JOIN public.words w ON w.id = sp.word_id
    JOIN user_classes uc ON uc.user_id = sp.user_id AND uc.cid = w.classroom_id
    WHERE sp.review_count > 0
      AND sp.next_review_date <= p_now
      AND w.translation IS NOT NULL
      AND trim(w.translation) <> ''
      AND w.translation NOT ILIKE '%failed%'
      AND w.translation NOT ILIKE '%Analyzing%'
      AND w.translation NOT LIKE '%⏳%'
    GROUP BY sp.user_id
  )
  SELECT
    c.user_id,
    COALESCE(d.due_count, 0)::bigint AS due_count
  FROM candidates c
  LEFT JOIN actual_due d ON d.user_id = c.user_id;
$$;

REVOKE ALL ON FUNCTION public.push_actual_due_counts(uuid[], timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.push_actual_due_counts(uuid[], timestamptz) TO service_role;

-- ============================================================================
-- 4. Planner statistics and index optimization
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_srs_progress_due_covering
  ON public.srs_progress (user_id, next_review_date ASC)
  INCLUDE (word_id, review_count)
  WHERE review_count > 0;

ANALYZE public.words;
ANALYZE public.srs_progress;
ANALYZE public.classrooms;
ANALYZE public.enrollments;
