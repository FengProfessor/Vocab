-- Migration: 20260919_optimize_session_queries.sql
-- Description: Fast Session Start & Due Queue Priority Optimization (Milestone M2)
-- 1. get_due_words_list: Strictly prioritizes scheduled reviews ahead of unstudied words
-- 2. get_new_words_list: Fast indexed LEFT JOIN query for new words, replacing in-memory scans

-- 1. Drop existing function signatures to allow clean recreation
DROP FUNCTION IF EXISTS public.get_due_words_list(uuid, uuid, integer);
DROP FUNCTION IF EXISTS public.get_new_words_list(uuid, uuid, integer);

-- 2. Re-create get_due_words_list with strict priority ordering
CREATE OR REPLACE FUNCTION public.get_due_words_list(
  p_user_id UUID,
  p_classroom_id UUID DEFAULT NULL,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  word TEXT,
  translation TEXT,
  ipa TEXT,
  pos TEXT,
  example TEXT,
  example_vi TEXT,
  synonyms TEXT[],
  antonyms TEXT[],
  image_url TEXT,
  review_count integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_target_class_id uuid := p_classroom_id;
BEGIN
  -- Security check: service_role or matching user
  IF coalesce(auth.role(), '') <> 'service_role'
     AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Forbidden' USING errcode = '42501';
  END IF;

  -- Auto-resolve personal classroom when omitted/NULL
  IF v_target_class_id IS NULL THEN
    SELECT c.id INTO v_target_class_id
    FROM public.classrooms c
    WHERE c.teacher_id = p_user_id
      AND c.name = '__personal__'
    LIMIT 1;
  END IF;

  IF v_target_class_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH due_words AS (
    -- Priority 1: Due reviews (review_count > 0 AND next_review_date <= now)
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
      s.next_review_date,
      1 AS priority
    FROM public.words w
    JOIN public.srs_progress s
      ON s.word_id = w.id AND s.user_id = p_user_id
    WHERE w.classroom_id = v_target_class_id
      AND s.review_count > 0
      AND s.next_review_date <= (now() AT TIME ZONE 'UTC')
      AND (w.translation IS NOT NULL AND w.translation NOT LIKE '%failed%' AND w.translation NOT LIKE '%Analyzing%')
    ORDER BY s.next_review_date ASC
    LIMIT p_limit
  ),
  new_words AS (
    -- Priority 2: Unstudied words (s.id IS NULL OR s.review_count = 0)
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
      0 AS review_count,
      w.created_at AS next_review_date,
      2 AS priority
    FROM public.words w
    LEFT JOIN public.srs_progress s
      ON s.word_id = w.id AND s.user_id = p_user_id
    WHERE w.classroom_id = v_target_class_id
      AND (s.id IS NULL OR s.review_count = 0)
      AND (w.translation IS NOT NULL AND w.translation NOT LIKE '%failed%' AND w.translation NOT LIKE '%Analyzing%')
    ORDER BY w.created_at DESC
    LIMIT GREATEST(0, p_limit - (SELECT count(*)::int FROM due_words))
  )
  SELECT
    c.id,
    c.word,
    c.translation,
    c.ipa,
    c.pos,
    c.example,
    c.example_vi,
    c.synonyms,
    c.antonyms,
    c.image_url,
    c.review_count
  FROM (
    SELECT * FROM due_words
    UNION ALL
    SELECT * FROM new_words
  ) c
  ORDER BY c.priority ASC, c.next_review_date ASC
  LIMIT p_limit;
END;
$$;

-- 3. Create get_new_words_list RPC (Direct Indexed Query for New Words)
CREATE OR REPLACE FUNCTION public.get_new_words_list(
  p_user_id UUID,
  p_classroom_id UUID DEFAULT NULL,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  word TEXT,
  translation TEXT,
  ipa TEXT,
  pos TEXT,
  example TEXT,
  example_vi TEXT,
  synonyms TEXT[],
  antonyms TEXT[],
  image_url TEXT,
  review_count integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_target_class_id uuid := p_classroom_id;
BEGIN
  -- Security check: service_role or matching user
  IF coalesce(auth.role(), '') <> 'service_role'
     AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Forbidden' USING errcode = '42501';
  END IF;

  -- Auto-resolve personal classroom when omitted/NULL
  IF v_target_class_id IS NULL THEN
    SELECT c.id INTO v_target_class_id
    FROM public.classrooms c
    WHERE c.teacher_id = p_user_id
      AND c.name = '__personal__'
    LIMIT 1;
  END IF;

  IF v_target_class_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
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
    0 AS review_count
  FROM public.words w
  LEFT JOIN public.srs_progress s
    ON s.word_id = w.id AND s.user_id = p_user_id
  WHERE w.classroom_id = v_target_class_id
    AND (s.id IS NULL OR s.review_count = 0)
    AND (w.translation IS NOT NULL AND w.translation NOT LIKE '%failed%' AND w.translation NOT LIKE '%Analyzing%')
  ORDER BY w.created_at DESC
  LIMIT p_limit;
END;
$$;

-- 4. Permissions configuration
REVOKE ALL ON FUNCTION public.get_due_words_list(uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_due_words_list(uuid, uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_due_words_list(uuid, uuid, integer) TO authenticated;

REVOKE ALL ON FUNCTION public.get_new_words_list(uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_new_words_list(uuid, uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_new_words_list(uuid, uuid, integer) TO authenticated;

-- 5. Refresh query planner statistics
ANALYZE public.words;
ANALYZE public.srs_progress;
ANALYZE public.classrooms;
