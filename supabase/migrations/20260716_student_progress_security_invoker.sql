-- =============================================================================
-- Fix Supabase Advisor: Security Definer View public.student_progress
--
-- Vấn đề: VIEW với SECURITY DEFINER (mặc định owner = postgres/service)
--   → query chạy RLS/quyền của OWNER, không của user đang gọi.
--   → authenticated có thể đọc rộng hơn policy bảng gốc (profiles email, v.v.)
--
-- Fix: security_invoker = true (PG15+) — RLS áp dụng theo user query.
-- API teacher vẫn dùng service_role (bypass RLS) + check teacher_id trong code.
-- =============================================================================

DROP VIEW IF EXISTS public.student_progress;

CREATE VIEW public.student_progress
WITH (security_invoker = true)
AS
WITH stats AS (
  SELECT
    p.id AS student_id,
    p.full_name AS student_name,
    p.email,
    e.classroom_id,
    count(DISTINCT sp.word_id) AS total_words,
    -- VMS: stability > 15 ngày
    count(DISTINCT CASE WHEN sp.stability > 15 THEN sp.word_id END) AS mastered_words,
    -- LCS: số ngày active 14 ngày
    count(DISTINCT date(sp.last_reviewed_at))
      FILTER (WHERE sp.last_reviewed_at > (now() - interval '14 days')) AS active_days_14,
    avg(qr.accuracy) AS avg_quiz_accuracy,
    count(DISTINCT qr.id) AS quizzes_taken,
    max(sp.last_reviewed_at) AS last_active,
    -- Alias tương thích schema cũ (teacher stats dùng words_reviewed)
    count(DISTINCT sp.word_id) AS words_reviewed
  FROM public.profiles p
  JOIN public.enrollments e ON e.student_id = p.id
  LEFT JOIN public.words w ON w.classroom_id = e.classroom_id
  LEFT JOIN public.srs_progress sp ON sp.word_id = w.id AND sp.user_id = p.id
  LEFT JOIN public.quiz_results qr ON qr.user_id = p.id AND qr.classroom_id = e.classroom_id
  GROUP BY p.id, p.full_name, p.email, e.classroom_id
)
SELECT
  student_id,
  student_name,
  email,
  classroom_id,
  total_words,
  mastered_words,
  active_days_14,
  avg_quiz_accuracy,
  quizzes_taken,
  last_active,
  words_reviewed,
  CASE
    WHEN total_words > 0 THEN round((mastered_words::float / total_words::float) * 100)
    ELSE 0
  END AS vms,
  round((active_days_14::float / 14.0) * 100) AS lcs
FROM stats;

COMMENT ON VIEW public.student_progress IS
  'Teacher analytics aggregate. security_invoker=true — RLS of caller, not owner.';

-- Không grant rộng cho anon. authenticated chỉ thấy qua RLS bảng gốc.
-- service_role (API) vẫn full access.
GRANT SELECT ON public.student_progress TO authenticated, service_role;
REVOKE ALL ON public.student_progress FROM anon;
