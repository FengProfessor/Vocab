/**
 * Foundation Curriculum Context & Dependency Resolver
 *
 * Encapsulates authentication and client resolution locally for the Foundation Curriculum.
 * This guarantees that global security helpers (src/lib/api-security.ts, src/lib/supabase-server.ts)
 * remain untouched and maintain 100% identical global semantics across the repository.
 */

import { getAuthUser as defaultGetAuthUser, type AuthResult } from '@/lib/api-security';
import { createServiceClient as defaultCreateServiceClient } from '@/lib/supabase-server';
import type { SupabaseClient } from '@supabase/supabase-js';

export { unauthorized, forbidden } from '@/lib/api-security';
export type { AuthResult };

let testAuthHook: ((req: Request) => Promise<AuthResult | null> | AuthResult | null) | null = null;
let testServiceClientHook: (() => SupabaseClient) | null = null;

/** Test-only: allows foundation test suites to simulate authenticated sessions in non-production. */
export function setFoundationTestAuthHook(hook: typeof testAuthHook) {
  if (process.env.NODE_ENV !== 'production') {
    testAuthHook = hook;
  }
}

/** Test-only: allows foundation test suites to provide an isolated mock DB in non-production. */
export function setFoundationTestServiceClientHook(hook: typeof testServiceClientHook) {
  if (process.env.NODE_ENV !== 'production') {
    testServiceClientHook = hook;
  }
}

/** Resolves the authenticated user for foundation API routes. */
export async function getFoundationAuthUser(req: Request): Promise<AuthResult | null> {
  if (process.env.NODE_ENV !== 'production' && testAuthHook) {
    return testAuthHook(req);
  }
  return defaultGetAuthUser(req);
}

/** Resolves the Supabase service client for foundation operations. */
export function getFoundationServiceClient(): SupabaseClient {
  if (process.env.NODE_ENV !== 'production' && testServiceClientHook) {
    return testServiceClientHook();
  }
  return defaultCreateServiceClient();
}
