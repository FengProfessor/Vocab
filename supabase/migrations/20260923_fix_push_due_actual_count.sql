-- Thông báo chỉ hiển thị số từ đã học và thực sự đến hạn ôn.
-- Trước đây RPC cộng cả từ mới chưa có SRS, khiến số thông báo tăng theo kho từ.

CREATE OR REPLACE FUNCTION public.push_actual_due_counts(
  p_user_ids uuid[],
  p_now timestamptz
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
  actual_due AS (
    SELECT
      sp.user_id,
      COUNT(DISTINCT sp.word_id)::bigint AS due_count
    FROM public.srs_progress sp
    JOIN candidates c ON c.user_id = sp.user_id
    WHERE sp.review_count > 0
      AND sp.next_review_date <= p_now
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
