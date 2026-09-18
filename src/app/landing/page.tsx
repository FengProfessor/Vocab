import type { Metadata } from 'next';
import { ReferoLandingMaster } from '@/components/landing/refero/ReferoLandingMaster';
import { FAQ_DATA } from '@/components/landing/refero/faq-data';

export const metadata: Metadata = {
  title: 'LingoPro — Nền Tảng Học Tiếng Anh FSRS v5 & Gemini AI | Khảo Thí ETS 2026',
  description:
    'Làm chủ 9.000+ từ vựng cốt lõi theo thuật toán lặp lại ngắt quãng FSRS v5 hiện đại nhất. Phân tích sắc thái chuyên sâu với Gemini AI và giải mã 20 bộ đề khảo thí TOEIC ETS 2026. Học 8 phút mỗi ngày, nhớ lâu gấp 4 lần.',
  keywords: [
    'học tiếng Anh',
    'FSRS v5',
    'spaced repetition',
    'luyện thi TOEIC',
    'ETS 2026',
    'từ vựng tiếng Anh',
    'phương pháp ghi nhớ ngắt quãng',
    'Anki thay thế',
    'Gemini AI tiếng Anh',
    'LingoPro',
  ],
  alternates: {
    canonical: 'https://lingopro.online/landing',
  },
  openGraph: {
    title: 'LingoPro — Học Tiếng Anh Theo Khoa Học FSRS v5 & Gemini AI',
    description:
      'Đánh bại đường quên Ebbinghaus với FSRS v5. Tặng ngay gói quà 0đ: Ebook Sát Thủ TOEIC 2026, 150 collocation bẫy thi và 7 ngày VIP Pro.',
    url: 'https://lingopro.online/landing',
    siteName: 'LingoPro EdTech Platform',
    images: [
      {
        url: 'https://lingopro.online/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'LingoPro Refero Style Landing Page',
      },
    ],
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LingoPro — Học Tiếng Anh FSRS v5 & Gemini AI Khảo Thí 2026',
    description:
      'Nhớ từ vựng vĩnh viễn với thuật toán FSRS v5. Trải nghiệm ngay 0đ trên máy tính và điện thoại!',
    images: ['https://lingopro.online/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function LandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        '@id': 'https://lingopro.online/landing#software',
        name: 'LingoPro EdTech Platform',
        operatingSystem: 'Web, iOS, Android, macOS, Windows',
        applicationCategory: 'EducationalApplication',
        description:
          'Nền tảng EdTech học từ vựng và ngữ pháp tiếng Anh thông minh với thuật toán FSRS v5 và Google Gemini AI.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'VND',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          ratingCount: '18500',
          bestRating: '5',
          worstRating: '1',
        },
      },
      {
        '@type': 'EducationalOrganization',
        '@id': 'https://lingopro.online#organization',
        name: 'LingoPro EdTech',
        url: 'https://lingopro.online',
        logo: 'https://lingopro.online/icons/icon-512.webp',
        sameAs: ['https://facebook.com/lingopro.online'],
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://lingopro.online/landing#faq',
        mainEntity: FAQ_DATA.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.a,
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ReferoLandingMaster />
    </>
  );
}
