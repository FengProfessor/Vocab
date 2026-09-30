-- Narrow server-only boolean check; no Auth rows exposed to browser/anon/user roles.
CREATE OR REPLACE FUNCTION public.is_app_auth_session_active(p_session_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.sessions AS s
    JOIN auth.users AS u ON u.id = s.user_id
    WHERE s.id = p_session_id AND s.user_id = p_user_id
      AND (s.not_after IS NULL OR s.not_after > CURRENT_TIMESTAMP)
      AND u.email_confirmed_at IS NOT NULL
      AND (u.banned_until IS NULL OR u.banned_until <= CURRENT_TIMESTAMP)
  );
$$;
ALTER FUNCTION public.is_app_auth_session_active(uuid, uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.is_app_auth_session_active(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_app_auth_session_active(uuid, uuid) TO service_role;
