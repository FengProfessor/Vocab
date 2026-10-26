import { createClient } from '@supabase/supabase-js';

/** Service-role client chỉ dùng trong server code và luôn fail closed khi thiếu cấu hình. */
export function createServiceClient() {
  if (typeof window !== 'undefined') {
    throw new Error('Service-role Supabase client is server-only');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing required server-side Supabase configuration');
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Helper to fetch all rows beyond Supabase's default 1000-row limit.
 * Pass a callback that builds the query with a `.range(from, to)`.
 */
export async function fetchAllRows<T = Record<string, unknown>>(
  buildQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
  const step = 1000;
  while (true) {
    const { data, error } = await buildQuery(from, from + step - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < step) break;
    from += step;
  }
  return all;
}
