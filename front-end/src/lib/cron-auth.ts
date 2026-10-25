import { timingSafeEqual } from 'crypto';

const BEARER_HEADER = /^Bearer ([^\s]+)$/;

/**
 * Validate the cron bearer header against the server-side CRON_SECRET.
 * The expected secret is passed by server code only; this helper has no fallback.
 */
export function isCronAuthorizationValid(
  authHeader: string | null,
  expectedSecret: string | undefined,
): boolean {
  if (!expectedSecret || !authHeader) return false;

  const match = BEARER_HEADER.exec(authHeader);
  if (!match) return false;

  const expected = Buffer.from(expectedSecret, 'utf8');
  const provided = Buffer.from(match[1], 'utf8');
  if (expected.length !== provided.length) {
    timingSafeEqual(expected, expected);
    return false;
  }

  return timingSafeEqual(expected, provided);
}
