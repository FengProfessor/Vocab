/**
 * Browser-safe TOEIC media URL resolver.
 */
export const ALLOWED_UPSTREAM_DOMAINS: readonly string[] = [
  'odlnhfaygiotcyehuysw.supabase.co',
];

export function resolveProxyMediaUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl || '';
  return rawUrl.trim();
}
