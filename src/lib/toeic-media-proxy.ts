import crypto from 'crypto';

/**
 * Default media secret fallback if process.env.TOEIC_SECURITY_SECRET is not configured.
 */
const DEFAULT_MEDIA_SECRET = 'lingopro-toeic-media-security-secret-2026';

/**
 * Whitelist of allowed upstream domains for SSRF protection.
 * Only upstream storage buckets in this list are allowed to be proxied.
 */
export const ALLOWED_UPSTREAM_DOMAINS: readonly string[] = [
  'odlnhfaygiotcyehuysw.supabase.co',
];

/**
 * Derives a 32-byte AES-256 key from the configured secret.
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.TOEIC_SECURITY_SECRET || DEFAULT_MEDIA_SECRET;
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Generates a deterministic AES-256-CBC encrypted token for a raw media URL.
 * Same rawUrl will always produce the exact same token to maximize CDN/Browser caching.
 *
 * @param rawUrl Upstream media URL (e.g., https://odlnhfaygiotcyehuysw.supabase.co/...)
 * @returns base64url encoded token containing 16-byte IV + ciphertext
 */
export function generateMediaProxyToken(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const key = getEncryptionKey();
  const iv = crypto.createHmac('sha256', key).update(rawUrl).digest().subarray(0, 16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(rawUrl, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, encrypted]).toString('base64url');
}

/**
 * Alias for generateMediaProxyToken.
 */
export const generateProxyMediaToken = generateMediaProxyToken;

/**
 * Decrypts a base64url token back to the original raw media URL.
 * Performs HMAC integrity verification on the IV.
 *
 * @param token base64url encoded token
 * @returns decrypted URL or null if invalid/tampered
 */
export function decryptMediaProxyToken(token: string): string | null {
  if (!token || typeof token !== 'string') return null;
  try {
    const buf = Buffer.from(token, 'base64url');
    if (buf.length < 32) return null; // 16 bytes IV + at least 16 bytes ciphertext
    const iv = buf.subarray(0, 16);
    const ciphertext = buf.subarray(16);
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');

    // Verify HMAC integrity of IV against decrypted URL to prevent bit-flipping
    const expectedIv = crypto.createHmac('sha256', key).update(decrypted).digest().subarray(0, 16);
    if (!crypto.timingSafeEqual(iv, expectedIv)) {
      return null;
    }

    return decrypted;
  } catch {
    return null;
  }
}

/**
 * Checks if a given rawUrl is allowed for upstream proxy fetching.
 * Enforces strict HTTPS/HTTP protocol and hostname whitelist.
 * Blocks private IP addresses, loopback, and local network ranges.
 */
export function isAllowedUpstreamUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Disallow loopback, localhost, and private IP patterns (SSRF protection)
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('169.254.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
    ) {
      return false;
    }

    const customAllowed = process.env.TOEIC_MEDIA_ALLOWED_DOMAINS
      ? process.env.TOEIC_MEDIA_ALLOWED_DOMAINS.split(',').map((d) => d.trim().toLowerCase())
      : [];

    const allowedSet = new Set<string>([
      ...ALLOWED_UPSTREAM_DOMAINS,
      ...customAllowed,
    ]);

    return allowedSet.has(hostname);
  } catch {
    return false;
  }
}

/**
 * Transforms an upstream media URL to the internal proxy endpoint.
 * Leaves already-proxied, local, relative, data/blob URLs, or non-whitelisted URLs untouched.
 *
 * Example:
 * 'https://odlnhfaygiotcyehuysw.supabase.co/storage/v1/object/public/...'
 * -> '/api/toeic/media/proxy?t=<token>'
 */
export function resolveProxyMediaUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl || '';

  const trimmed = rawUrl.trim();

  // Already proxied
  if (trimmed.startsWith('/api/toeic/media/proxy') || trimmed.includes('/api/toeic/media/proxy?t=')) {
    return trimmed;
  }

  // Local / static paths or data / blob URIs
  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Only proxy URLs from allowed upstream domains
  if (isAllowedUpstreamUrl(trimmed)) {
    const token = generateMediaProxyToken(trimmed);
    return `/api/toeic/media/proxy?t=${token}`;
  }

  return trimmed;
}
