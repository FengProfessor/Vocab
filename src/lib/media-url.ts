/**
 * Media URL helpers — cắt Function Invocations / Fluid CPU trên Vercel.
 *
 * Ảnh public CDN (Supabase Storage, Pixabay, …) load TRỰC TIẾP → 0 function.
 * Chỉ proxy host lạ / hotlink / CORS (rủi ro) qua /api/image-proxy.
 */

/** Host cho phép browser load thẳng (HTTPS public). */
const DIRECT_IMAGE_HOST_SUFFIXES = [
  'supabase.co',
  'supabase.in',
  'pixabay.com',
  'pexels.com',
  'images.pexels.com',
  'unsplash.com',
  'images.unsplash.com',
  'cloudinary.com',
  'imgur.com',
  'i.imgur.com',
  'googleusercontent.com',
  'ggpht.com',
  'gstatic.com',
  'wikimedia.org',
  'wikipedia.org',
  'upload.wikimedia.org',
  'cdn.jsdelivr.net',
  'cloudfront.net',
  'r2.dev',
  'amazonaws.com',
  'google.com',
  'ytimg.com',
  'twimg.com',
  'fbcdn.net',
  'pinimg.com',
  'staticflickr.com',
  'pollinations.ai',
  'image.pollinations.ai',
] as const;

function hostAllowedDirect(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return DIRECT_IMAGE_HOST_SUFFIXES.some(
    (s) => h === s || h.endsWith(`.${s}`),
  );
}

/**
 * Trả URL ảnh an toàn cho <img src>.
 * - URL rỗng → ''
 * - Public CDN → URL gốc (không tốn Vercel function)
 * - Còn lại → /api/image-proxy?url=...
 */
export function resolveImageSrc(url: string | null | undefined): string {
  const raw = (url || '').trim();
  if (!raw) return '';

  // Đã là proxy / path nội bộ
  if (raw.startsWith('/api/image-proxy')) return raw;
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw;
  if (raw.startsWith('data:') || raw.startsWith('blob:')) return raw;

  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') {
      return `/api/image-proxy?url=${encodeURIComponent(raw)}`;
    }
    // Chỉ direct HTTPS public; http → proxy (upgrade/safety)
    if (u.protocol === 'https:' && hostAllowedDirect(u.hostname)) {
      return raw;
    }
  } catch {
    // relative hoặc invalid
    if (!raw.includes('://')) return raw;
  }

  return `/api/image-proxy?url=${encodeURIComponent(raw)}`;
}
