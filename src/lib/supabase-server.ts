import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedServiceClient: SupabaseClient<any, 'public', any> | null = null;
let cachedConfigKey = '';

/**
 * Server-only Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * Reuses a singleton instance per configuration to avoid allocating hundreds
 * of client objects during concurrent request bursts.
 */
export function createServiceClient() {
  if (typeof window !== 'undefined') {
    throw new Error('createServiceClient is server-only and cannot run in the browser.');
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing required server-side Supabase configuration.');
  }
  const configKey = `${supabaseUrl}::${serviceRoleKey}`;
  if (cachedServiceClient && cachedConfigKey === configKey) {
    return cachedServiceClient;
  }
  cachedServiceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  cachedConfigKey = configKey;
  return cachedServiceClient;
}
