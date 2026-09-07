import type { Metadata } from 'next';
import React from 'react';

const BASE_URL = 'https://lingopro.online';
const PAGE_URL = `${BASE_URL}/ipa`;

export const metadata: Metadata = {
  title: 'Bảng Phiên Âm IPA Chuẩn Quốc Tế (44 Âm) | Học Phát Âm Tiếng Anh Mỹ - LingoPro',
  description:
    "Lộ trình làm chủ 44 âm phiên âm IPA tiếng Anh chuẩn quốc tế cho người Việt. Video thị phạm khẩu hình môi-răng-lưỡi từ Rachel's English, 4 chặng sư phạm trọng tâm sửa âm tử huyệt, bài tập 5 bước chuẩn khoa học.",
  keywords: [
    'bảng phiên âm ipa',
    '44 âm ipa tiếng anh',
    'bảng ipa tiếng anh',
    'học phát âm ipa',
    'phát âm tiếng anh chuẩn mỹ',
    'nguyên âm phụ âm tiếng anh',
    'rachel english ipa',
    'phát âm tiếng anh cho người việt',
    'cách đọc bảng ipa',
    'tử huyệt phát âm tiếng anh',
    'luyện phát âm ipa online',
    'ipa soundboard',
  ],
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    title: 'Bảng Phiên Âm IPA Chuẩn Quốc Tế (44 Âm) — LingoPro',
    description:
      "Lộ trình 4 chặng làm chủ 44 âm IPA tiếng Anh với video khẩu hình chuẩn Rachel's English. Miễn phí thực hành phản xạ cho người Việt.",
    type: 'website',
    locale: 'vi_VN',
    siteName: 'LingoPro',
    url: PAGE_URL,
    images: [
      {
        url: `${BASE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'Bảng Phiên Âm IPA Quốc Tế 44 Âm LingoPro',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bảng Phiên Âm IPA Chuẩn Quốc Tế (44 Âm) — LingoPro',
    description:
      "Làm chủ 44 âm IPA tiếng Anh với video khẩu hình chuẩn Rachel's English theo lộ trình 4 chặng sư phạm.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Course',
      name: 'Luyện Phát Âm Tiếng Anh Chuẩn 44 Âm Phiên Âm IPA Quốc Tế',
      description:
        "Khóa học và bảng âm tương tác 44 âm IPA chuẩn Anh - Mỹ với video thị phạm khẩu hình từ Rachel's English, phân chia 4 chặng sư phạm chuyên sâu cho người Việt.",
      provider: {
        '@type': 'Organization',
        name: 'LingoPro',
        url: BASE_URL,
      },
      educationalLevel: 'Beginner to Advanced',
      inLanguage: 'vi',
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: 'online',
        courseWorkload: 'PT15M',
      },
    },
    {
      '@type': 'LearningResource',
      name: 'Bảng Tương Tác Phiên Âm IPA 44 Âm Quốc Tế',
      description:
        'Hệ thống soundboard luyện nghe, xem video khẩu hình phân đoạn và luyện phân biệt cặp âm tối thiểu (minimal pairs).',
      url: PAGE_URL,
      learningResourceType: 'Interactive Resource',
      educationalUse: 'Pronunciation practice',
      inLanguage: 'vi',
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Trang chủ',
          item: BASE_URL,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Lộ trình',
          item: `${BASE_URL}/journey`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Phiên Âm IPA',
          item: PAGE_URL,
        },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Bảng phiên âm IPA tiếng Anh có bao nhiêu âm và gồm những nhóm nào?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Bảng phiên âm IPA tiếng Anh quốc tế gồm đúng 44 âm, chia thành: 12 nguyên âm đơn (Monophthongs), 8 nguyên âm đôi (Diphthongs) và 24 phụ âm (Consonants).',
          },
        },
        {
          '@type': 'Question',
          name: 'Người Việt hay phát âm sai những âm nào nhất trong tiếng Anh?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Người Việt hay gặp khó khăn nhất ở 14 âm: ngọng hai âm th (/θ/ và /ð/), nuốt âm gió và âm đuôi (/s/, /z/, /t/, /k/), âm chu môi (/ʃ/, /ʒ/, /tʃ/, /dʒ/), cắn môi dưới (/v/), và nhầm lẫn giữa nguyên âm dài và ngắn (/iː/ vs /ɪ/).',
          },
        },
        {
          '@type': 'Question',
          name: 'Tại sao LingoPro lại chia lộ trình thành 4 chặng học?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Để tránh quá tải nhận thức khi nhìn vào 44 âm cùng lúc. Chặng 1 sửa 14 âm tử huyệt người Việt hay sai; Chặng 2 luyện các cặp nguyên âm đối lập dài/ngắn; Chặng 3 học 8 cặp phụ âm đối xứng cùng khẩu hình (học 1 được 2); Chặng 4 hoàn thiện âm đôi và âm lướt để nói trôi chảy.",
          },
        },
        {
          '@type': 'Question',
          name: 'Học phát âm IPA trên LingoPro có mất phí không?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Bảng phiên âm IPA và toàn bộ bài tập luyện khẩu hình, nghe mẫu và video Rachel's English trên LingoPro là hoàn toàn miễn phí trên nền tảng web.",
          },
        },
      ],
    },
  ],
};

export default function IpaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
