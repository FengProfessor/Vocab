import type { NextConfig } from "next";

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
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
