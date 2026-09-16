import { supabase } from '@/lib/supabase';

/**
 * fetch wrapper (client-side) tự đính kèm Supabase JWT vào header Authorization.
 * Dùng cho mọi API route yêu cầu auth.
 *
 * @param accessToken — optional: reuse token đã có (tránh N× getSession trong 1 loadData)
 */
export async function authFetch(
  input: string,
  init: RequestInit = {},
  accessToken?: string | null,
): Promise<Response> {
  const headers = new Headers(init.headers);
  let token = accessToken ?? null;
  if (!token) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      // If token expires in under 60s, refresh proactively
      const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
      if (expiresAt > 0 && expiresAt - Date.now() < 60_000) {
        try {
          const { data: refreshed } = await supabase.auth.refreshSession();
          token = refreshed.session?.access_token ?? session.access_token;
        } catch {
          token = session.access_token;
        }
      } else {
        token = session.access_token;
      }
    }
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  let res = await fetch(input, { ...init, headers });

  // If 401 Unauthorized occurs and no explicit token was passed, attempt single refresh & retry
  if (res.status === 401 && !accessToken) {
    try {
      const { data: refreshed } = await supabase.auth.refreshSession();
      if (refreshed.session?.access_token) {
        headers.set('Authorization', `Bearer ${refreshed.session.access_token}`);
        res = await fetch(input, { ...init, headers });
      }
    } catch {
      // Return original response if refresh failed
    }
  }

  return res;
}
