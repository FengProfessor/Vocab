-- Gamification: streak, XP, daily goal
-- Table: user_gamification (1 row per user)
CREATE TABLE IF NOT EXISTS public.user_gamification (
  user_id         uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_xp        int NOT NULL DEFAULT 0,
  current_streak  int NOT NULL DEFAULT 0,
  longest_streak  int NOT NULL DEFAULT 0,
  last_active_date date,
  daily_goal      int NOT NULL DEFAULT 30,
  today_xp        int NOT NULL DEFAULT 0,
  today_date      date
);

ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own gamification"
  ON public.user_gamification FOR ALL
  USING (auth.uid() = user_id);

-- RPC: award_xp — atomic streak + XP update
CREATE OR REPLACE FUNCTION public.award_xp(p_user_id uuid, p_xp int)
RETURNS public.user_gamification AS $$
DECLARE
  v_row public.user_gamification;
BEGIN
  -- Upsert row nếu chưa có
  INSERT INTO public.user_gamification (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_row FROM public.user_gamification WHERE user_id = p_user_id;

  -- Reset today_xp nếu ngày mới
  IF v_row.today_date IS DISTINCT FROM current_date THEN
    v_row.today_xp  := 0;
    v_row.today_date := current_date;
  END IF;

  -- Cập nhật streak
  IF v_row.last_active_date = current_date THEN
    -- Đã học hôm nay rồi, giữ streak
    NULL;
  ELSIF v_row.last_active_date = current_date - 1 THEN
    v_row.current_streak := v_row.current_streak + 1;
    v_row.last_active_date := current_date;
  ELSE
    -- Streak bị đứt hoặc lần đầu
    v_row.current_streak  := 1;
    v_row.last_active_date := current_date;
  END IF;

  -- Cập nhật longest streak
  IF v_row.current_streak > v_row.longest_streak THEN
    v_row.longest_streak := v_row.current_streak;
  END IF;

  -- Cộng XP
  v_row.total_xp := v_row.total_xp + p_xp;
  v_row.today_xp := v_row.today_xp + p_xp;

  UPDATE public.user_gamification SET
    total_xp        = v_row.total_xp,
    current_streak  = v_row.current_streak,
    longest_streak  = v_row.longest_streak,
    last_active_date = v_row.last_active_date,
    today_xp        = v_row.today_xp,
    today_date      = v_row.today_date
  WHERE user_id = p_user_id;

  RETURN v_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
