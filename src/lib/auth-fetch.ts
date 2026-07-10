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
    token = session?.access_token ?? null;
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers });
}
