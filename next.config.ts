import type { NextConfig } from "next";

// CSP: giữ 'unsafe-inline' (Next.js/React inline style+script) và 'unsafe-eval'
// (Next dev dùng eval cho HMR) — tradeoff chấp nhận được, chưa dùng nonce.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://fcm.googleapis.com https://fcmregistrations.googleapis.com https://firebaseinstallations.googleapis.com https://www.googleapis.com https://dict.minhqnd.com https://api.dictionaryapi.dev",
  // Audio phát âm giọng thật: Free Dictionary (Wikimedia), Google gstatic, Youdao fallback
  "media-src 'self' https://api.dictionaryapi.dev https://ssl.gstatic.com https://dict.youdao.com",
  "worker-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
].join('; ');

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Cho phép mọi host https (ảnh đi qua image-proxy / nguồn ngoài động)
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
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
    return [
      { source: '/firebase-messaging-sw', headers: fcmSwHeaders },
      { source: '/firebase-messaging-sw.js', headers: fcmSwHeaders },
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
        ],
      },
    ];
  },
};

export default nextConfig;
