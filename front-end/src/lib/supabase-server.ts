import { supabase } from '@/lib/supabase';

/**
 * Browser-safe fallback for any shared utility referencing `@/lib/supabase-server`.
 * All requests go through the BFF API `/api/auth/data/*` via `@/lib/supabase`.
 */
export function createServiceClient() {
  return supabase;
}

export async function createServerSupabaseClient() {
  return supabase;
}
