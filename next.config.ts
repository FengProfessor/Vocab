import type { NextConfig } from "next";
import path from "path";

/** Cố định root = thư mục web-app (tránh Turbopack nhảy lên D:\Vibe khi có nhiều lockfile) */
const configDir = path.resolve(process.cwd());

// CSP: giữ 'unsafe-inline' (Next.js/React inline style+script) và 'unsafe-eval'
// (Next dev dùng eval cho HMR) — tradeoff chấp nhận được, chưa dùng nonce.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://us-assets.i.posthog.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://fcm.googleapis.com https://fcmregistrations.googleapis.com https://firebaseinstallations.googleapis.com https://www.googleapis.com https://dict.minhqnd.com https://api.dictionaryapi.dev https://us.i.posthog.com https://us-assets.i.posthog.com",
  // Audio phát âm giọng thật: Free Dictionary (Wikimedia), Google gstatic, Youdao fallback
  "media-src 'self' https://api.dictionaryapi.dev https://ssl.gstatic.com https://dict.youdao.com",
  "worker-src 'self'",
  // 'self' = cho phép LingoTown nhúng app trong iframe (cùng origin)
  "frame-ancestors 'self'",
  "frame-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
].join('; ');

const nextConfig: NextConfig = {
  // Docker/Hetzner: image gọn, chỉ copy .next/standalone + static
  output: 'standalone',
  // Tránh Turbopack nhầm root lên D:\Vibe (nhiều lockfile) → API 404
  turbopack: {
    root: configDir,
  },
  // Tree-shake icon/chart/date barrels → giảm JS initial
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'date-fns',
      '@supabase/supabase-js',
    ],
  },
  images: {
    // SECURITY: KHÔNG dùng hostname:'**' — biến /_next/image thành open proxy + SSRF/transcode
    // abuse không auth (bỏ qua mọi hardening của /api/image-proxy). App KHÔNG dùng next/image
    // (mọi ảnh qua <img src={resolveImageSrc()}> → direct CDN hoặc /api/image-proxy same-origin),
    // nên allowlist này chỉ là defense-in-depth; mirror DIRECT_IMAGE_HOST_SUFFIXES trong media-url.ts.
    remotePatterns: [
      'supabase.co', 'supabase.in', 'pixabay.com', 'pexels.com', 'unsplash.com',
      'cloudinary.com', 'imgur.com', 'googleusercontent.com', 'ggpht.com', 'gstatic.com',
      'wikimedia.org', 'wikipedia.org', 'cdn.jsdelivr.net', 'cloudfront.net', 'r2.dev',
      'amazonaws.com', 'google.com', 'ytimg.com', 'twimg.com', 'fbcdn.net', 'pinimg.com',
      'staticflickr.com', 'pollinations.ai',
    ].flatMap((h) => [
      { protocol: 'https' as const, hostname: h },
      { protocol: 'https' as const, hostname: `**.${h}` },
    ]),
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 ngày
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  compress: true,
  poweredByHeader: false, // security: ẩn header X-Powered-By
  // 301 redirect: gộp /landing về trang chủ (tránh trùng nội dung, dồn SEO về /)
  async redirects() {
    return [
      { source: '/landing', destination: '/', permanent: true },
    ];
  },
  async headers() {
    // SW cần importScripts từ gstatic — CSP global worker-src 'self' sẽ chặn FCM.
    const fcmSwCsp =
      "default-src 'none'; script-src 'self' https://www.gstatic.com; connect-src 'self' https://*.googleapis.com https://fcm.googleapis.com https://fcmregistrations.googleapis.com https://firebaseinstallations.googleapis.com";
    const fcmSwHeaders = [
      { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
      { key: 'Service-Worker-Allowed', value: '/' },
      { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
      { key: 'Content-Security-Policy', value: fcmSwCsp },
    ];
    // Static immutable assets — browser + CDN giữ lâu
    const immutableYear = 'public, max-age=31536000, immutable';
    const longCache = 'public, max-age=604800, stale-while-revalidate=86400';
    return [
      { source: '/firebase-messaging-sw', headers: fcmSwHeaders },
      { source: '/firebase-messaging-sw.js', headers: fcmSwHeaders },
      {
        source: '/icons/:path*',
        headers: [{ key: 'Cache-Control', value: immutableYear }],
      },
      {
        source: '/:path*.(webp|png|jpg|jpeg|gif|svg|ico|woff2|woff)',
        headers: [{ key: 'Cache-Control', value: immutableYear }],
      },
      {
        // Video demo lớn — cache 7 ngày, không immutable (có thể thay file cùng tên)
        source: '/:path*.mp4',
        headers: [{ key: 'Cache-Control', value: longCache }],
      },
      {
        // Loại SW FCM khỏi CSP global (worker-src 'self' chặn importScripts gstatic)
        source: '/((?!firebase-messaging-sw).*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // SAMEORIGIN: hub iframe được; chặn site ngoài nhúng
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ];
  },
};

export default nextConfig;
