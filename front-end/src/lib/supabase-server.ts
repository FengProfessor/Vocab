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
