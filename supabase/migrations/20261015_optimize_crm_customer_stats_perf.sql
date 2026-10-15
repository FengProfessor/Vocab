-- =============================================================================
-- Migration: 20261015_optimize_crm_customer_stats_perf.sql
-- Description: Tối ưu hoá triệt để hiệu năng RPC get_crm_customer_stats
-- Loại bỏ full-table scan và OR-join trên 33,000 từ của bảng words,
-- tách UNION ALL để tận dụng index idx_words_added_by_created.
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
  -- 1. Words đã lưu: Tách UNION ALL thay vì OR/COALESCE để PostgreSQL dùng index scan idx_words_added_by_created
  words_stats AS (
    SELECT
      u.uid,
      count(*)::bigint AS word_count,
      max(u.created_at) AS last_word_at
    FROM (
      -- 1a. Từ do user trực tiếp thêm (hơn 99.9% từ của user, dùng index scan idx_words_added_by_created)
      SELECT w.added_by AS uid, w.created_at
      FROM public.words w
      WHERE w.added_by IS NOT NULL
      UNION ALL
      -- 1b. Dự phòng: Từ trong lớp personal mà added_by là NULL
      SELECT c.teacher_id AS uid, w.created_at
      FROM public.words w
      JOIN public.classrooms c ON c.id = w.classroom_id AND c.name = '__personal__'
      WHERE w.added_by IS NULL AND c.teacher_id IS NOT NULL
    ) u
    GROUP BY u.uid
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
