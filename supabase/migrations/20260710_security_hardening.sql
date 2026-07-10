-- Security hardening: dictionary writes, profile entitlements, SECURITY DEFINER RPCs.
-- Migration intentionally keeps public dictionary reads and safe self-profile edits.

-- -----------------------------------------------------------------------------
-- 1. global_dictionary: public read-only, writes only through service_role.
-- -----------------------------------------------------------------------------
ALTER TABLE public.global_dictionary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon insert for dictionary builder"
  ON public.global_dictionary;

REVOKE INSERT, UPDATE, DELETE ON TABLE public.global_dictionary FROM anon, authenticated;
GRANT SELECT ON TABLE public.global_dictionary TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2. profiles: remove directory-wide reads and protect entitlement/identity data.
-- RLS still limits safe column updates to the caller's own row.
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Own row only (SELECT already had "Users can view own profile" in base schema).
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- Teachers need student display names in classroom UIs (not full directory).
DROP POLICY IF EXISTS "Teachers can view enrolled student profiles" ON public.profiles;
CREATE POLICY "Teachers can view enrolled student profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.enrollments AS e
      JOIN public.classrooms AS c ON c.id = e.classroom_id
      WHERE e.student_id = profiles.id
        AND c.teacher_id = (SELECT auth.uid())
    )
  );

-- Group owners/members can see co-member display names.
DROP POLICY IF EXISTS "Group members can view co-member profiles" ON public.profiles;
CREATE POLICY "Group members can view co-member profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.group_members AS me
      JOIN public.group_members AS peer ON peer.group_id = me.group_id
      WHERE me.user_id = (SELECT auth.uid())
        AND peer.user_id = profiles.id
    )
  );

-- Remove any table-wide/column-level update capability before granting the
-- small set of mutable profile preferences used by browser call sites.
-- NEVER grant: role, plan, plan_expires_at, email, gemini_api_key, fcm_token.
REVOKE UPDATE ON TABLE public.profiles FROM anon, authenticated;
REVOKE UPDATE (email, role, plan, plan_expires_at)
  ON TABLE public.profiles FROM anon, authenticated;

DO $migration$
DECLARE
  v_safe_columns text;
BEGIN
  SELECT string_agg(quote_ident(c.column_name), ', ' ORDER BY c.ordinal_position)
    INTO v_safe_columns
  FROM information_schema.columns AS c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'profiles'
    AND c.column_name IN (
      'full_name',
      'avatar_url',
      'daily_goal',
      'notification_hour',
      'telegram_id'
    );

  IF v_safe_columns IS NOT NULL THEN
    EXECUTE format(
      'GRANT UPDATE (%s) ON TABLE public.profiles TO authenticated',
      v_safe_columns
    );
  END IF;
END
$migration$;

-- Teacher self-claim (signup/OAuth only elevates student → teacher; never admin).
CREATE OR REPLACE FUNCTION public.claim_teacher_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_role text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING errcode = '42501';
  END IF;

  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found' USING errcode = 'P0002';
  END IF;

  IF v_role = 'teacher' THEN
    RETURN 'teacher';
  END IF;

  IF v_role IS DISTINCT FROM 'student' THEN
    RAISE EXCEPTION 'Cannot claim teacher role from role %', v_role
      USING errcode = '42501';
  END IF;

  UPDATE public.profiles
  SET role = 'teacher'
  WHERE id = v_user_id;

  RETURN 'teacher';
END;
$$;

REVOKE ALL ON FUNCTION public.claim_teacher_role()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_teacher_role() TO authenticated;

-- -----------------------------------------------------------------------------
-- 3. SECURITY DEFINER RPCs: fixed search_path and least-privilege EXECUTE.
-- -----------------------------------------------------------------------------
ALTER FUNCTION public.get_due_word_count(uuid, uuid)
  SET search_path = pg_catalog, public;
REVOKE ALL ON FUNCTION public.get_due_word_count(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_due_word_count(uuid, uuid) TO service_role;

ALTER FUNCTION public.get_due_words_list(uuid, uuid, integer)
  SET search_path = pg_catalog, public;
REVOKE ALL ON FUNCTION public.get_due_words_list(uuid, uuid, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_due_words_list(uuid, uuid, integer) TO service_role;

-- award_xp is an internal primitive. Browser clients must use purpose-built,
-- idempotent claim RPCs instead of choosing their own user and XP amount.
CREATE OR REPLACE FUNCTION public.award_xp(p_user_id uuid, p_xp int)
RETURNS public.user_gamification
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_row public.user_gamification;
BEGIN
  IF p_user_id IS NULL OR p_xp IS NULL OR p_xp <= 0 THEN
    RAISE EXCEPTION 'Invalid XP award';
  END IF;

  IF p_xp > 10000 THEN
    RAISE EXCEPTION 'XP award exceeds limit';
  END IF;

  INSERT INTO public.user_gamification (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT *
    INTO v_row
  FROM public.user_gamification
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_row.today_date IS DISTINCT FROM current_date THEN
    v_row.today_xp := 0;
    v_row.today_date := current_date;
  END IF;

  IF v_row.last_active_date = current_date THEN
    NULL;
  ELSIF v_row.last_active_date = current_date - 1 THEN
    v_row.current_streak := v_row.current_streak + 1;
    v_row.last_active_date := current_date;
  ELSE
    v_row.current_streak := 1;
    v_row.last_active_date := current_date;
  END IF;

  IF v_row.current_streak > v_row.longest_streak THEN
    v_row.longest_streak := v_row.current_streak;
  END IF;

  v_row.total_xp := v_row.total_xp + p_xp;
  v_row.today_xp := v_row.today_xp + p_xp;

  UPDATE public.user_gamification
  SET total_xp = v_row.total_xp,
      current_streak = v_row.current_streak,
      longest_streak = v_row.longest_streak,
      last_active_date = v_row.last_active_date,
      today_xp = v_row.today_xp,
      today_date = v_row.today_date
  WHERE user_id = p_user_id;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.award_xp(uuid, int)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_xp(uuid, int)
  TO service_role;

DROP POLICY IF EXISTS "Users manage own gamification"
  ON public.user_gamification;
DROP POLICY IF EXISTS "Users view own gamification"
  ON public.user_gamification;
CREATE POLICY "Users view own gamification"
  ON public.user_gamification
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);
REVOKE INSERT, UPDATE, DELETE ON TABLE public.user_gamification
  FROM anon, authenticated;
GRANT SELECT ON TABLE public.user_gamification TO authenticated;

-- One immutable ledger row per user/event makes browser-facing XP claims
-- replay-safe. RLS is enabled without client policies by design.
CREATE TABLE IF NOT EXISTS public.xp_award_events (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_key text NOT NULL,
  xp_awarded integer NOT NULL CHECK (xp_awarded > 0),
  claimed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_key)
);

ALTER TABLE public.xp_award_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.xp_award_events FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.claim_onboarding_xp()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_claimed boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.xp_award_events (user_id, event_key, xp_awarded)
  VALUES (v_user_id, 'onboarding_completed', 50)
  ON CONFLICT (user_id, event_key) DO NOTHING
  RETURNING true INTO v_claimed;

  IF COALESCE(v_claimed, false) THEN
    PERFORM public.award_xp(v_user_id, 50);
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_onboarding_xp()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_onboarding_xp() TO authenticated;

ALTER FUNCTION public.increment_ai_usage(uuid)
  SET search_path = pg_catalog, public;
REVOKE ALL ON FUNCTION public.increment_ai_usage(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_ai_usage(uuid) TO service_role;

ALTER FUNCTION public.increment_coupon_usage(text)
  SET search_path = pg_catalog, public;
REVOKE ALL ON FUNCTION public.increment_coupon_usage(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_coupon_usage(text) TO service_role;
