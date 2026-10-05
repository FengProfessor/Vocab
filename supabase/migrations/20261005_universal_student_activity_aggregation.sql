-- =============================================================================
-- Migration: 20261005_universal_student_activity_aggregation.sql
-- Description: Universal Student Activity Aggregation across all 9 learning modules:
--   1. SRS Flashcard Reviews (public.srs_progress)
--   2. Quizzes (public.quiz_results)
--   3. Saved Words (public.words via added_by or classroom __personal__)
--   4. Grammar Curriculum & Micro-steps (public.grammar_progress & public.grammar_micro_progress)
--   5. Daily Reading Completions (public.daily_reading_completions)
--   6. TOEIC Practice Question Bank (public.user_toeic_question_history)
--   7. Learning Roadmap & Mock Assessments (public.user_roadmap_assessments)
--   8. Thematic Vocab Packs (public.user_vocab_packs)
--   9. Gamification Streaks & Active Dates (public.user_gamification)
-- =============================================================================

-- =============================================================================
-- SECTION 0: Prerequisite Learning Module Tables (Idempotent Creation)
-- =============================================================================

-- 1. TOEIC Practice Question History
CREATE TABLE IF NOT EXISTS public.user_toeic_question_history (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  part integer NOT NULL CHECK (part BETWEEN 1 AND 7),
  last_answered_at timestamptz NOT NULL DEFAULT now(),
  is_correct boolean NOT NULL,
  attempt_count integer NOT NULL DEFAULT 1 CHECK (attempt_count >= 1),
  selected_option text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_toeic_question_history_pkey PRIMARY KEY (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_user_toeic_question_history_user_part
  ON public.user_toeic_question_history (user_id, part);

CREATE INDEX IF NOT EXISTS idx_user_toeic_question_history_user_part_correct
  ON public.user_toeic_question_history (user_id, part, is_correct);

ALTER TABLE public.user_toeic_question_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_toeic_question_history_select_own ON public.user_toeic_question_history;
CREATE POLICY user_toeic_question_history_select_own
  ON public.user_toeic_question_history FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_toeic_question_history_insert_own ON public.user_toeic_question_history;
CREATE POLICY user_toeic_question_history_insert_own
  ON public.user_toeic_question_history FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_toeic_question_history_update_own ON public.user_toeic_question_history;
CREATE POLICY user_toeic_question_history_update_own
  ON public.user_toeic_question_history FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_toeic_question_history_delete_own ON public.user_toeic_question_history;
CREATE POLICY user_toeic_question_history_delete_own
  ON public.user_toeic_question_history FOR DELETE USING (auth.uid() = user_id);

-- 2. Learning Roadmap & Mock Assessments
CREATE TABLE IF NOT EXISTS public.user_roadmap_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track text NOT NULL DEFAULT 'cefr' CHECK (track IN ('cefr', 'thpt')),
  tier text NOT NULL CHECK (tier IN ('mini_quiz', 'checkpoint', 'exit_exam')),
  target_id text NOT NULL,
  score integer NOT NULL CHECK (score >= 0 AND score <= 100),
  passed boolean NOT NULL DEFAULT false,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_roadmap_assessments_lookup
  ON public.user_roadmap_assessments (user_id, target_id, created_at DESC);

ALTER TABLE public.user_roadmap_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_roadmap_assessments_select_own" ON public.user_roadmap_assessments;
CREATE POLICY "user_roadmap_assessments_select_own"
  ON public.user_roadmap_assessments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_roadmap_assessments_insert_own" ON public.user_roadmap_assessments;
CREATE POLICY "user_roadmap_assessments_insert_own"
  ON public.user_roadmap_assessments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Grammar Micro-progress
CREATE TABLE IF NOT EXISTS public.grammar_micro_progress (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stage text NOT NULL CHECK (stage IN ('a0', 'a1')),
  completed_steps integer[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, stage)
);

ALTER TABLE public.grammar_micro_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own grammar foundation progress" ON public.grammar_micro_progress;
CREATE POLICY "Users read own grammar foundation progress"
  ON public.grammar_micro_progress FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own grammar foundation progress" ON public.grammar_micro_progress;
CREATE POLICY "Users insert own grammar foundation progress"
  ON public.grammar_micro_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own grammar foundation progress" ON public.grammar_micro_progress;
CREATE POLICY "Users update own grammar foundation progress"
  ON public.grammar_micro_progress FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Vocab Packs Progress
CREATE TABLE IF NOT EXISTS public.user_vocab_packs (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pack_id text NOT NULL,
  catalog_version text NOT NULL DEFAULT 'v1',
  topic_id text NOT NULL DEFAULT '',
  topic_title text NOT NULL DEFAULT '',
  pack_index integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'not_started',
  word_count integer NOT NULL DEFAULT 0,
  reviewed_count integer NOT NULL DEFAULT 0,
  started_at timestamptz,
  last_studied_at timestamptz,
  completed_at timestamptz,
  CONSTRAINT user_vocab_packs_pkey PRIMARY KEY (user_id, pack_id)
);

ALTER TABLE public.user_vocab_packs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own vocab pack progress" ON public.user_vocab_packs;
CREATE POLICY "Users read own vocab pack progress"
  ON public.user_vocab_packs FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own vocab pack progress" ON public.user_vocab_packs;
CREATE POLICY "Users insert own vocab pack progress"
  ON public.user_vocab_packs FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own vocab pack progress" ON public.user_vocab_packs;
CREATE POLICY "Users update own vocab pack progress"
  ON public.user_vocab_packs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. User Gamification
CREATE TABLE IF NOT EXISTS public.user_gamification (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_xp int NOT NULL DEFAULT 0,
  current_streak int NOT NULL DEFAULT 0,
  longest_streak int NOT NULL DEFAULT 0,
  last_active_date date,
  daily_goal int NOT NULL DEFAULT 30,
  today_xp int NOT NULL DEFAULT 0,
  today_date date
);

ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own gamification" ON public.user_gamification;
CREATE POLICY "Users manage own gamification"
  ON public.user_gamification FOR ALL USING (auth.uid() = user_id);


-- =============================================================================
-- SECTION 1: Performance Composite Indexes on Timestamp Columns
-- =============================================================================

-- 1. Grammar Master FSRS: Lookup student latest grammar review
CREATE INDEX IF NOT EXISTS idx_grammar_progress_user_reviewed
  ON public.grammar_progress (user_id, last_reviewed_at DESC);

-- 2. Daily Reading Completions: Lookup student latest reading completion
CREATE INDEX IF NOT EXISTS idx_daily_reading_user_completed
  ON public.daily_reading_completions (user_id, completed_at DESC);

-- 3. TOEIC Question History: Lookup student latest answered question
CREATE INDEX IF NOT EXISTS idx_toeic_history_user_answered
  ON public.user_toeic_question_history (user_id, last_answered_at DESC);

-- 4. Roadmap & Mock Assessments: Lookup student latest assessment creation
CREATE INDEX IF NOT EXISTS idx_roadmap_assessments_user_created
  ON public.user_roadmap_assessments (user_id, created_at DESC);

-- 5. Vocab Packs Progress: Lookup student latest studied pack
CREATE INDEX IF NOT EXISTS idx_vocab_packs_user_studied
  ON public.user_vocab_packs (user_id, last_studied_at DESC);


-- =============================================================================
-- SECTION 2: Upgraded get_crm_customer_stats RPC
-- =============================================================================
-- Note: In PostgreSQL, changing the return columns of RETURNS TABLE requires
-- dropping the existing function first to avoid "cannot change return type" error.

DROP FUNCTION IF EXISTS public.get_crm_customer_stats(timestamptz);
DROP FUNCTION IF EXISTS public.get_crm_customer_stats();

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
  last_quiz_at timestamptz,
  grammar_count bigint,
  last_grammar_at timestamptz,
  reading_count bigint,
  last_reading_at timestamptz,
  toeic_count bigint,
  toeic_correct_count bigint,
  last_toeic_at timestamptz,
  assessment_count bigint,
  last_assessment_at timestamptz,
  vocab_pack_count bigint,
  last_vocab_pack_at timestamptz,
  current_streak integer,
  last_streak_at timestamptz,
  true_last_active timestamptz,
  true_last_active_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  WITH
  -- 1. Words đã lưu: Hợp nhất cả words.added_by và words trong classroom '__personal__'
  words_stats AS (
    SELECT
      COALESCE(w.added_by, c.teacher_id) AS uid,
      count(w.id)::bigint AS word_count,
      max(w.created_at) AS last_word_at
    FROM public.words w
    LEFT JOIN public.classrooms c ON c.id = w.classroom_id AND c.name = '__personal__'
    WHERE w.added_by IS NOT NULL OR c.teacher_id IS NOT NULL
    GROUP BY COALESCE(w.added_by, c.teacher_id)
  ),
  -- 2. SRS Vocabulary Progress
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
  -- 3. Quizzes đã làm
  quiz_stats AS (
    SELECT
      qr.user_id AS uid,
      count(*)::bigint AS quiz_count,
      max(qr.completed_at) AS last_quiz_at
    FROM public.quiz_results qr
    GROUP BY qr.user_id
  ),
  -- 4. Grammar Progress (Master FSRS + Micro-grammar)
  grammar_stats AS (
    SELECT
      g.uid,
      count(*)::bigint AS grammar_count,
      max(g.last_at) AS last_grammar_at
    FROM (
      SELECT gp.user_id AS uid, gp.last_reviewed_at AS last_at
      FROM public.grammar_progress gp
      WHERE gp.last_reviewed_at IS NOT NULL
      UNION ALL
      SELECT gmp.user_id AS uid, gmp.updated_at AS last_at
      FROM public.grammar_micro_progress gmp
      WHERE gmp.updated_at IS NOT NULL
    ) g
    GROUP BY g.uid
  ),
  -- 5. Daily Reading Completions
  reading_stats AS (
    SELECT
      drc.user_id AS uid,
      count(*)::bigint AS reading_count,
      max(drc.completed_at) AS last_reading_at
    FROM public.daily_reading_completions drc
    WHERE drc.completed_at IS NOT NULL
    GROUP BY drc.user_id
  ),
  -- 6. TOEIC Practice Questions
  toeic_stats AS (
    SELECT
      utqh.user_id AS uid,
      count(*)::bigint AS toeic_count,
      count(*) FILTER (WHERE utqh.is_correct)::bigint AS toeic_correct_count,
      max(utqh.last_answered_at) AS last_toeic_at
    FROM public.user_toeic_question_history utqh
    GROUP BY utqh.user_id
  ),
  -- 7. Roadmap & Mock Test Assessments
  assessment_stats AS (
    SELECT
      ura.user_id AS uid,
      count(*)::bigint AS assessment_count,
      max(ura.created_at) AS last_assessment_at
    FROM public.user_roadmap_assessments ura
    GROUP BY ura.user_id
  ),
  -- 8. Vocab Packs Progress
  vocab_pack_stats AS (
    SELECT
      uvp.user_id AS uid,
      count(*)::bigint AS vocab_pack_count,
      max(uvp.last_studied_at) AS last_vocab_pack_at
    FROM public.user_vocab_packs uvp
    WHERE uvp.last_studied_at IS NOT NULL
    GROUP BY uvp.user_id
  ),
  -- 9. Gamification Streaks & Active Date
  gamification_stats AS (
    SELECT
      ug.user_id AS uid,
      ug.current_streak,
      (ug.last_active_date::timestamp AT TIME ZONE 'UTC') AS last_streak_at
    FROM public.user_gamification ug
    WHERE ug.last_active_date IS NOT NULL
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
    qs.last_quiz_at,
    COALESCE(gs.grammar_count, 0)::bigint AS grammar_count,
    gs.last_grammar_at,
    COALESCE(rs.reading_count, 0)::bigint AS reading_count,
    rs.last_reading_at,
    COALESCE(ts.toeic_count, 0)::bigint AS toeic_count,
    COALESCE(ts.toeic_correct_count, 0)::bigint AS toeic_correct_count,
    ts.last_toeic_at,
    COALESCE(ast.assessment_count, 0)::bigint AS assessment_count,
    ast.last_assessment_at,
    COALESCE(vps.vocab_pack_count, 0)::bigint AS vocab_pack_count,
    vps.last_vocab_pack_at,
    COALESCE(gms.current_streak, 0)::integer AS current_streak,
    gms.last_streak_at,
    GREATEST(
      pw.last_word_at,
      ss.last_reviewed_at,
      qs.last_quiz_at,
      gs.last_grammar_at,
      rs.last_reading_at,
      ts.last_toeic_at,
      ast.last_assessment_at,
      vps.last_vocab_pack_at,
      gms.last_streak_at
    ) AS true_last_active,
    GREATEST(
      pw.last_word_at,
      ss.last_reviewed_at,
      qs.last_quiz_at,
      gs.last_grammar_at,
      rs.last_reading_at,
      ts.last_toeic_at,
      ast.last_assessment_at,
      vps.last_vocab_pack_at,
      gms.last_streak_at
    ) AS true_last_active_at
  FROM public.profiles p
  LEFT JOIN words_stats pw ON pw.uid = p.id
  LEFT JOIN srs_stats ss ON ss.uid = p.id
  LEFT JOIN quiz_stats qs ON qs.uid = p.id
  LEFT JOIN grammar_stats gs ON gs.uid = p.id
  LEFT JOIN reading_stats rs ON rs.uid = p.id
  LEFT JOIN toeic_stats ts ON ts.uid = p.id
  LEFT JOIN assessment_stats ast ON ast.uid = p.id
  LEFT JOIN vocab_pack_stats vps ON vps.uid = p.id
  LEFT JOIN gamification_stats gms ON gms.uid = p.id;
$$;

REVOKE ALL ON FUNCTION public.get_crm_customer_stats(timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_crm_customer_stats(timestamptz) TO service_role;


-- =============================================================================
-- SECTION 3: Helper RPC get_students_activity_summary
-- =============================================================================
-- Batch activity summary for classroom students across all 9 activity sources.

DROP FUNCTION IF EXISTS public.get_students_activity_summary(uuid[]);

CREATE OR REPLACE FUNCTION public.get_students_activity_summary(
  p_student_ids uuid[]
)
RETURNS TABLE (
  student_id uuid,
  true_last_active timestamptz,
  true_last_active_at timestamptz,
  last_srs_at timestamptz,
  last_quiz_at timestamptz,
  last_word_at timestamptz,
  last_grammar_at timestamptz,
  last_reading_at timestamptz,
  last_toeic_at timestamptz,
  last_assessment_at timestamptz,
  last_vocab_pack_at timestamptz,
  last_streak_at timestamptz,
  last_streak_date text,
  word_count bigint,
  total_activities_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  WITH
  students AS (
    SELECT DISTINCT unnest(COALESCE(p_student_ids, ARRAY[]::uuid[])) AS uid
  ),
  srs_act AS (
    SELECT
      sp.user_id AS uid,
      count(*)::bigint AS act_count,
      max(sp.last_reviewed_at) AS last_at
    FROM public.srs_progress sp
    WHERE sp.user_id = ANY(p_student_ids) AND sp.last_reviewed_at IS NOT NULL
    GROUP BY sp.user_id
  ),
  quiz_act AS (
    SELECT
      qr.user_id AS uid,
      count(*)::bigint AS act_count,
      max(qr.completed_at) AS last_at
    FROM public.quiz_results qr
    WHERE qr.user_id = ANY(p_student_ids) AND qr.completed_at IS NOT NULL
    GROUP BY qr.user_id
  ),
  word_act AS (
    SELECT
      COALESCE(w.added_by, c.teacher_id) AS uid,
      count(w.id)::bigint AS act_count,
      max(w.created_at) AS last_at
    FROM public.words w
    LEFT JOIN public.classrooms c ON c.id = w.classroom_id AND c.name = '__personal__'
    WHERE (w.added_by = ANY(p_student_ids) OR (c.teacher_id = ANY(p_student_ids) AND c.name = '__personal__'))
    GROUP BY COALESCE(w.added_by, c.teacher_id)
  ),
  grammar_act AS (
    SELECT
      g.uid,
      count(*)::bigint AS act_count,
      max(g.last_at) AS last_at
    FROM (
      SELECT gp.user_id AS uid, gp.last_reviewed_at AS last_at
      FROM public.grammar_progress gp
      WHERE gp.user_id = ANY(p_student_ids) AND gp.last_reviewed_at IS NOT NULL
      UNION ALL
      SELECT gmp.user_id AS uid, gmp.updated_at AS last_at
      FROM public.grammar_micro_progress gmp
      WHERE gmp.user_id = ANY(p_student_ids) AND gmp.updated_at IS NOT NULL
    ) g
    GROUP BY g.uid
  ),
  reading_act AS (
    SELECT
      drc.user_id AS uid,
      count(*)::bigint AS act_count,
      max(drc.completed_at) AS last_at
    FROM public.daily_reading_completions drc
    WHERE drc.user_id = ANY(p_student_ids) AND drc.completed_at IS NOT NULL
    GROUP BY drc.user_id
  ),
  toeic_act AS (
    SELECT
      utqh.user_id AS uid,
      count(*)::bigint AS act_count,
      max(utqh.last_answered_at) AS last_at
    FROM public.user_toeic_question_history utqh
    WHERE utqh.user_id = ANY(p_student_ids)
    GROUP BY utqh.user_id
  ),
  assessment_act AS (
    SELECT
      ura.user_id AS uid,
      count(*)::bigint AS act_count,
      max(ura.created_at) AS last_at
    FROM public.user_roadmap_assessments ura
    WHERE ura.user_id = ANY(p_student_ids)
    GROUP BY ura.user_id
  ),
  vocab_pack_act AS (
    SELECT
      uvp.user_id AS uid,
      count(*)::bigint AS act_count,
      max(uvp.last_studied_at) AS last_at
    FROM public.user_vocab_packs uvp
    WHERE uvp.user_id = ANY(p_student_ids) AND uvp.last_studied_at IS NOT NULL
    GROUP BY uvp.user_id
  ),
  streak_act AS (
    SELECT
      ug.user_id AS uid,
      ug.last_active_date::text AS last_streak_date,
      (ug.last_active_date::timestamp AT TIME ZONE 'UTC') AS last_at
    FROM public.user_gamification ug
    WHERE ug.user_id = ANY(p_student_ids) AND ug.last_active_date IS NOT NULL
  )
  SELECT
    s.uid AS student_id,
    GREATEST(
      srs.last_at,
      q.last_at,
      w.last_at,
      g.last_at,
      r.last_at,
      t.last_at,
      a.last_at,
      vp.last_at,
      st.last_at
    ) AS true_last_active,
    GREATEST(
      srs.last_at,
      q.last_at,
      w.last_at,
      g.last_at,
      r.last_at,
      t.last_at,
      a.last_at,
      vp.last_at,
      st.last_at
    ) AS true_last_active_at,
    srs.last_at AS last_srs_at,
    q.last_at AS last_quiz_at,
    w.last_at AS last_word_at,
    g.last_at AS last_grammar_at,
    r.last_at AS last_reading_at,
    t.last_at AS last_toeic_at,
    a.last_at AS last_assessment_at,
    vp.last_at AS last_vocab_pack_at,
    st.last_at AS last_streak_at,
    st.last_streak_date,
    COALESCE(w.act_count, 0)::bigint AS word_count,
    (
      COALESCE(srs.act_count, 0) +
      COALESCE(q.act_count, 0) +
      COALESCE(w.act_count, 0) +
      COALESCE(g.act_count, 0) +
      COALESCE(r.act_count, 0) +
      COALESCE(t.act_count, 0) +
      COALESCE(a.act_count, 0) +
      COALESCE(vp.act_count, 0)
    )::bigint AS total_activities_count
  FROM students s
  LEFT JOIN srs_act srs ON srs.uid = s.uid
  LEFT JOIN quiz_act q ON q.uid = s.uid
  LEFT JOIN word_act w ON w.uid = s.uid
  LEFT JOIN grammar_act g ON g.uid = s.uid
  LEFT JOIN reading_act r ON r.uid = s.uid
  LEFT JOIN toeic_act t ON t.uid = s.uid
  LEFT JOIN assessment_act a ON a.uid = s.uid
  LEFT JOIN vocab_pack_act vp ON vp.uid = s.uid
  LEFT JOIN streak_act st ON st.uid = s.uid;
$$;

REVOKE ALL ON FUNCTION public.get_students_activity_summary(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_students_activity_summary(uuid[]) TO authenticated, service_role;
