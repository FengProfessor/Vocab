-- Tách hàng đợi ôn khỏi từ mới và ghi một lượt FSRS theo CAS/idempotency.
ALTER TABLE public.srs_progress
  ALTER COLUMN next_review_date TYPE timestamptz USING next_review_date::timestamptz;

CREATE TABLE IF NOT EXISTS public.srs_review_events (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_id uuid NOT NULL,
  word_id uuid NOT NULL REFERENCES public.words(id) ON DELETE CASCADE,
  quality integer NOT NULL CHECK (quality IN (0, 3, 4, 5)),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, review_id)
);
ALTER TABLE public.srs_review_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.srs_review_events FROM PUBLIC, anon, authenticated;

DROP FUNCTION IF EXISTS public.get_due_words_list(uuid, uuid, integer);
CREATE FUNCTION public.get_due_words_list(p_user_id uuid, p_classroom_id uuid DEFAULT NULL, p_limit integer DEFAULT 50)
RETURNS TABLE (id uuid, word text, translation text, ipa text, pos text, example text,
  example_vi text, synonyms text[], antonyms text[], image_url text, review_count integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
  SELECT w.id, w.word, w.translation, w.ipa, w.pos, w.example, w.example_vi,
         w.synonyms, w.antonyms, w.image_url, s.review_count
  FROM public.words w
  JOIN public.srs_progress s ON s.word_id = w.id AND s.user_id = p_user_id
  WHERE w.classroom_id = COALESCE(p_classroom_id,
    (SELECT c.id FROM public.classrooms c WHERE c.teacher_id = p_user_id AND c.name = '__personal__' LIMIT 1))
    AND s.review_count > 0 AND s.next_review_date <= now()
    AND w.translation IS NOT NULL AND w.translation NOT ILIKE '%failed%' AND w.translation NOT ILIKE '%Analyzing%'
    AND (coalesce(auth.role(), '') = 'service_role' OR auth.uid() = p_user_id)
  ORDER BY s.next_review_date ASC
  LIMIT LEAST(GREATEST(p_limit, 0), 100);
$$;
REVOKE ALL ON FUNCTION public.get_due_words_list(uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_due_words_list(uuid, uuid, integer) TO service_role, authenticated;

CREATE OR REPLACE FUNCTION public.apply_srs_review(
  p_user_id uuid, p_word_id uuid, p_review_id uuid, p_quality integer,
  p_expected_last_reviewed_at timestamptz, p_stability double precision,
  p_difficulty double precision, p_interval_days integer, p_review_count integer,
  p_state integer, p_lapses integer, p_learning_steps integer,
  p_next_review_date timestamptz, p_last_reviewed_at timestamptz)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE v_changed integer := 0;
BEGIN
  IF p_quality NOT IN (0, 3, 4, 5) THEN RAISE EXCEPTION 'Invalid quality'; END IF;
  IF EXISTS (SELECT 1 FROM public.srs_review_events WHERE user_id = p_user_id AND review_id = p_review_id) THEN
    RETURN 'duplicate';
  END IF;
  IF p_expected_last_reviewed_at IS NULL THEN
    INSERT INTO public.srs_progress (user_id, word_id, stability, difficulty, interval_days,
      review_count, state, lapses, learning_steps, next_review_date, last_reviewed_at, algorithm_version)
    VALUES (p_user_id, p_word_id, p_stability, p_difficulty, p_interval_days,
      p_review_count, p_state, p_lapses, p_learning_steps, p_next_review_date, p_last_reviewed_at, 'ts-fsrs')
    ON CONFLICT (user_id, word_id) DO NOTHING;
    GET DIAGNOSTICS v_changed = ROW_COUNT;
  ELSE
    UPDATE public.srs_progress SET stability=p_stability, difficulty=p_difficulty,
      interval_days=p_interval_days, review_count=p_review_count, state=p_state,
      lapses=p_lapses, learning_steps=p_learning_steps, next_review_date=p_next_review_date,
      last_reviewed_at=p_last_reviewed_at, algorithm_version='ts-fsrs'
    WHERE user_id=p_user_id AND word_id=p_word_id
      AND last_reviewed_at IS NOT DISTINCT FROM p_expected_last_reviewed_at;
    GET DIAGNOSTICS v_changed = ROW_COUNT;
  END IF;
  IF v_changed = 0 THEN RETURN 'conflict'; END IF;
  INSERT INTO public.srs_review_events(user_id, review_id, word_id, quality)
  VALUES (p_user_id, p_review_id, p_word_id, p_quality);
  RETURN 'applied';
EXCEPTION WHEN unique_violation THEN RETURN 'duplicate';
END;
$$;
REVOKE ALL ON FUNCTION public.apply_srs_review(uuid,uuid,uuid,integer,timestamptz,double precision,double precision,integer,integer,integer,integer,integer,timestamptz,timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_srs_review(uuid,uuid,uuid,integer,timestamptz,double precision,double precision,integer,integer,integer,integer,integer,timestamptz,timestamptz) TO service_role;
