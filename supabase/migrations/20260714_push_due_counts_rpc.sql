-- RPC bulk-count từ đến hạn cho cron push-due / email-due.
-- Thay N+1 (mỗi user vài query enrollment/words/srs) bằng 1 query cho CẢ danh sách user.
-- Logic khớp route: dueCount = (từ đang học đến hạn) + (từ mới trong lớp chưa có srs record).

CREATE OR REPLACE FUNCTION public.push_due_counts(
  p_user_ids uuid[],
  p_now timestamptz
)
RETURNS TABLE(user_id uuid, due_count bigint)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH cand AS (
    SELECT DISTINCT unnest(p_user_ids) AS uid
  ),
  -- Lớp của mỗi user: student qua enrollments, teacher qua classrooms.teacher_id
  user_classrooms AS (
    SELECT e.student_id AS uid, e.classroom_id
    FROM enrollments e
    JOIN cand ON cand.uid = e.student_id
    UNION
    SELECT c.teacher_id AS uid, c.id AS classroom_id
    FROM classrooms c
    JOIN cand ON cand.uid = c.teacher_id
  ),
  -- (1) Từ đang học đến hạn (bao cả từ cá nhân tự học lẫn từ lớp đã bắt đầu)
  started_due AS (
    SELECT sp.user_id AS uid, COUNT(*) AS n
    FROM srs_progress sp
    JOIN cand ON cand.uid = sp.user_id
    WHERE sp.next_review_date <= p_now
    GROUP BY sp.user_id
  ),
  -- (2) Từ mới được giao trong lớp, CHƯA có srs record của user đó
  new_in_class AS (
    SELECT uc.uid, COUNT(*) AS n
    FROM user_classrooms uc
    JOIN words w ON w.classroom_id = uc.classroom_id
    WHERE NOT EXISTS (
      SELECT 1 FROM srs_progress sp2
      WHERE sp2.user_id = uc.uid AND sp2.word_id = w.id
    )
    GROUP BY uc.uid
  )
  SELECT cand.uid AS user_id,
         COALESCE(sd.n, 0) + COALESCE(nc.n, 0) AS due_count
  FROM cand
  LEFT JOIN started_due sd ON sd.uid = cand.uid
  LEFT JOIN new_in_class nc ON nc.uid = cand.uid;
$$;

-- Chỉ cron (service role) gọi; cấp execute để PostgREST expose RPC.
GRANT EXECUTE ON FUNCTION public.push_due_counts(uuid[], timestamptz) TO service_role;
