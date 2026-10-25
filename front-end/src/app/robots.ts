import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/student', '/teacher', '/auth'],
    },
    host: 'https://lingopro.online',
    sitemap: 'https://lingopro.online/sitemap.xml',
  };
}
