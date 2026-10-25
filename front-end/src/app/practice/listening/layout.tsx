import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Luyện Nghe Tiếng Anh Qua Video Đời Sống (200+ Bài Học) | LingoPro',
  description:
    'Kho 200 video luyện nghe tiếng Anh YouTube bản ngữ có phụ đề song ngữ tương tác chính xác từng giây. Hỗ trợ lặp đoạn A-B, tra từ 1-chạm vào FSRS.',
  keywords: [
    'luyện nghe tiếng anh',
    'học tiếng anh qua video',
    'phụ đề song ngữ tiếng anh',
    'luyện nghe tiếng anh giao tiếp',
    'tiếng anh đời sống',
    'nghe chép chính tả',
    'dictation english',
    'luyện nghe a2 b1 b2',
    'english listening practice',
    'ted ed listening',
    'bbc learning english',
  ],
  alternates: {
    canonical: 'https://lingopro.online/practice/listening',
  },
  openGraph: {
    title: 'Luyện Nghe Tiếng Anh Qua Video Đời Sống — Phụ Đề Song Ngữ Tương Tác',
    description:
      'Kho 200 video bản ngữ chọn lọc qua 7 chuyên đề thực tế: phụ đề song ngữ từng giây, lặp câu A-B và tra từ tức thì.',
    url: 'https://lingopro.online/practice/listening',
    type: 'website',
    siteName: 'LingoPro',
    images: [
      {
        url: 'https://img.youtube.com/vi/LhytOhr5ZMA/maxresdefault.jpg',
        width: 1280,
        height: 720,
        alt: 'Luyện nghe tiếng Anh video đời sống LingoPro',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Luyện Nghe Tiếng Anh Qua Video Đời Sống | LingoPro',
    description:
      'Kho 200 video bản ngữ: phụ đề song ngữ, lặp câu A-B và tra từ 1-chạm.',
    images: ['https://img.youtube.com/vi/LhytOhr5ZMA/maxresdefault.jpg'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Luyện Nghe Video Tiếng Anh Đời Sống',
  description:
    'Kho 200 video tiếng Anh YouTube bản ngữ có phụ đề song ngữ tương tác, lặp câu A-B và tra cứu từ vựng.',
  url: 'https://lingopro.online/practice/listening',
  provider: {
    '@type': 'Organization',
    name: 'LingoPro',
    url: 'https://lingopro.online',
  },
  hasPart: [
    {
      '@type': 'Course',
      name: 'Luyện Nghe Tiếng Anh Giao Tiếp Đời Sống Thực Tế',
      description: '200 video luyện nghe phân cấp A2-B2 qua 7 chuyên đề thực tế.',
      provider: {
        '@type': 'Organization',
        name: 'LingoPro',
      },
    },
  ],
};

export default function ListeningLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://img.youtube.com" />
      <link rel="preconnect" href="https://www.youtube-nocookie.com" />
      <link rel="dns-prefetch" href="https://img.youtube.com" />
      <link rel="dns-prefetch" href="https://i.ytimg.com" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
