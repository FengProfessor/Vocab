-- Sub VI cho câu ví dụ (học từ mới: hiện mặc định; ôn: nút Dịch)
-- Backfill: scripts/backfill-example-vi.ts (Gemini batch, không scrape)

ALTER TABLE public.words
  ADD COLUMN IF NOT EXISTS example_vi text;

COMMENT ON COLUMN public.words.example_vi IS
  'Bản dịch tiếng Việt tự nhiên của example (1 câu). Học mới: hiện sub; ôn: ẩn + nút Dịch.';

-- Không replace RPC ở đây. Production có thể đã nhận definition mới hơn với
-- default arguments, authorization guard, fixed search_path và query tối ưu.
-- CREATE OR REPLACE bằng definition cũ vừa không thể bỏ defaults, vừa làm lùi
-- các thuộc tính bảo mật/hiệu năng đó. Chỉ xác nhận contract mà migration cần.
DO $migration$
DECLARE
  v_function regprocedure := to_regprocedure(
    'public.get_due_words_list(uuid,uuid,integer)'
  );
  v_has_example_vi boolean;
BEGIN
  IF v_function IS NULL THEN
    RAISE EXCEPTION
      'Required function public.get_due_words_list(uuid,uuid,integer) is missing';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM pg_proc p
    CROSS JOIN LATERAL unnest(
      p.proallargtypes,
      p.proargmodes,
      p.proargnames
    ) AS argument(type_oid, argument_mode, argument_name)
    WHERE p.oid = v_function
      AND argument.argument_mode IN ('o', 't')
      AND argument.argument_name = 'example_vi'
      AND argument.type_oid = 'text'::regtype
  )
  INTO v_has_example_vi;

  IF NOT v_has_example_vi THEN
    RAISE EXCEPTION
      'public.get_due_words_list(uuid,uuid,integer) must return example_vi text';
  END IF;
END;
$migration$;
