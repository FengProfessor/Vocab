/**
 * Default media secret fallback if process.env.TOEIC_SECURITY_SECRET is not configured.
 */
const DEFAULT_MEDIA_SECRET = 'lingopro-toeic-media-security-secret-2026';

/**
 * Whitelist of allowed upstream domains for SSRF protection.
 * Only upstream storage buckets in this list are allowed to be proxied.
 */
export const ALLOWED_UPSTREAM_DOMAINS: readonly string[] = [

];

function getNodeCrypto(): typeof import('crypto') | null {
  if (typeof window !== 'undefined' && typeof (process as any)?.versions?.node === 'undefined') return null;
  try {
    const req = eval('require');
    return req('crypto');
  } catch {
    return null;
  }
}

function getEncryptionKey(cryptoMod: typeof import('crypto')): Buffer {
  const secret = (typeof process !== 'undefined' && process.env?.TOEIC_SECURITY_SECRET) || DEFAULT_MEDIA_SECRET;
  return cryptoMod.createHash('sha256').update(secret).digest();
}

/**
 * Generates a deterministic AES-256-CBC encrypted token for a raw media URL.
 */
export function generateMediaProxyToken(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const cryptoMod = getNodeCrypto();
  if (cryptoMod && typeof Buffer !== 'undefined') {
    const key = getEncryptionKey(cryptoMod);
    const iv = cryptoMod.createHmac('sha256', key).update(rawUrl).digest().subarray(0, 16);
    const cipher = cryptoMod.createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([cipher.update(rawUrl, 'utf8'), cipher.final()]);
    return Buffer.concat([iv, encrypted]).toString('base64url');
  }
  return typeof btoa === 'function'
    ? btoa(encodeURIComponent(rawUrl)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    : rawUrl;
}

/**
 * Alias for generateMediaProxyToken.
 */
export const generateProxyMediaToken = generateMediaProxyToken;

/**
 * Decrypts a base64url token back to the original raw media URL.
 */
export function decryptMediaProxyToken(token: string): string | null {
  if (!token || typeof token !== 'string') return null;
  const cryptoMod = getNodeCrypto();
  if (cryptoMod && typeof Buffer !== 'undefined') {
    try {
      const buf = Buffer.from(token, 'base64url');
      if (buf.length < 32) return null;
      const iv = buf.subarray(0, 16);
      const ciphertext = buf.subarray(16);
      const key = getEncryptionKey(cryptoMod);
      const decipher = cryptoMod.createDecipheriv('aes-256-cbc', key, iv);
      const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');

      const expectedIv = cryptoMod.createHmac('sha256', key).update(decrypted).digest().subarray(0, 16);
      if (!cryptoMod.timingSafeEqual(iv, expectedIv)) {
        return null;
      }

      return decrypted;
    } catch {
      return null;
    }
  }
  try {
    const b64 = token.replace(/-/g, '+').replace(/_/g, '/');
    return decodeURIComponent(atob(b64));
  } catch {
    return null;
  }
}

/**
 * Checks if a given rawUrl is allowed for upstream proxy fetching.
 */
export function isAllowedUpstreamUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

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

    const customAllowed =
      typeof process !== 'undefined' && process.env?.TOEIC_MEDIA_ALLOWED_DOMAINS
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
 */
export function resolveProxyMediaUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl || '';

  const trimmed = rawUrl.trim();

  if (trimmed.startsWith('/api/toeic/media/proxy') || trimmed.includes('/api/toeic/media/proxy?t=')) {
    return trimmed;
  }

  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  if (isAllowedUpstreamUrl(trimmed)) {
    if (typeof window !== 'undefined' && typeof (process as any)?.versions?.node === 'undefined') {
      // In pure browser SPA without proxy server, allow direct public storage access or proxy route
      const token = generateMediaProxyToken(trimmed);
      return `/api/toeic/media/proxy?t=${token}`;
    }
    const token = generateMediaProxyToken(trimmed);
    return `/api/toeic/media/proxy?t=${token}`;
  }

  return trimmed;
}
