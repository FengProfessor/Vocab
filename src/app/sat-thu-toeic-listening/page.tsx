import type { Metadata } from 'next';
import LeadMagnetClient from '@/components/lead-magnet/LeadMagnetClient';

export const metadata: Metadata = {
  title: 'Bách Khoa Thực Chiến: Sát Thủ Bài Nghe TOEIC ETS 2024 & ETS 2026 | LingoPro',
  description:
    'Giải mã định lượng 2,000 câu hỏi từ 20 bộ đề thi chuẩn ETS 2024 & ETS 2026 mới nhất. Tải ngay Ebook 15 trang độc quyền, làm bài test chẩn đoán phản xạ 15 bẫy nghe sát thủ và bứt phá 450+ điểm Listening.',
  keywords: [
    'TOEIC Listening',
    'ETS 2024',
    'ETS 2026',
    'sát thủ bài nghe TOEIC',
    'bẫy nghe TOEIC',
    'giải đề ETS 2026',
    'từ vựng TOEIC Part 1 2 3 4',
    'kinh nghiệm luyện thi TOEIC',
    'tài liệu TOEIC miễn phí',
    'FSRS LingoPro',
    'bẫy being part 1',
    'đối thoại 3 người part 3',
  ],
  alternates: {
    canonical: '/sat-thu-toeic-listening',
  },
  openGraph: {
    title: 'Bách Khoa Thực Chiến: Sát Thủ Bài Nghe TOEIC ETS 2024 & ETS 2026',
    description:
      'Tải miễn phí trọn bộ Ebook 15 trang tinh gọn giải mã 2,000 câu hỏi khảo thí ETS 2024-2026, kho 150 cụm collocation bẫy thi và bài test chẩn đoán phản xạ 15 bẫy sát thủ.',
    url: 'https://lingopro.vn/sat-thu-toeic-listening',
    siteName: 'LingoPro EdTech Platform',
    images: [
      {
        url: '/images/og-sat-thu-toeic.jpg',
        width: 1200,
        height: 630,
        alt: 'Bách Khoa Thực Chiến Sát Thủ Bài Nghe TOEIC ETS 2024 & ETS 2026 - LingoPro',
      },
    ],
    locale: 'vi_VN',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bách Khoa Thực Chiến: Sát Thủ Bài Nghe TOEIC ETS 2024 & ETS 2026',
    description:
      'Giải mã 2,000 câu hỏi nghe thực tế từ 20 đề chuẩn ETS 2024 & 2026. Tải Ebook 15 trang miễn phí ngay!',
    images: ['/images/og-sat-thu-toeic.jpg'],
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

export default function DirectSatThuToeicPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Book',
        '@id': 'https://lingopro.vn/sat-thu-toeic-listening#ebook',
        name: 'Bách Khoa Thực Chiến: Sát Thủ Bài Nghe TOEIC ETS 2024 & ETS 2026',
        description:
          'Ấn phẩm khảo thí giải mã định lượng 2,000 câu hỏi từ 20 bộ đề chuẩn ETS 2024 & ETS 2026, 15 bẫy sát thủ phòng thi và từ điển 150 cụm từ tần suất cao nhất.',
        inLanguage: 'vi',
        numberOfPages: 15,
        bookFormat: 'https://schema.org/EBook',
        author: {
          '@type': 'Organization',
          name: 'Hội đồng Khảo thí LingoPro',
          url: 'https://lingopro.vn',
        },
        publisher: {
          '@type': 'Organization',
          name: 'LingoPro EdTech Platform',
          url: 'https://lingopro.vn',
          logo: {
            '@type': 'ImageObject',
            url: 'https://lingopro.vn/icons/icon-512.png',
          },
        },
        image: 'https://lingopro.vn/images/sat-thu-toeic-3d-book.jpg',
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://lingopro.vn/sat-thu-toeic-listening#faq',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Bách khoa Sát Thủ Bài Nghe TOEIC ETS 2024 & 2026 có gì khác biệt so với các tài liệu mẹo vặt thông thường?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Khác với các tài liệu mẹo vặt máy móc thời kỳ cũ (ETS 2019-2022) vốn đã bị Viện Khảo Thí ETS vô hiệu hóa, tài liệu này được đúc kết từ dữ liệu khảo thí định lượng của 20 bộ đề chuẩn ETS 2024 và 2026 (2,000 câu hỏi). Toàn bộ 15 bẫy sát thủ, bẫy being (100% sai), bẫy câu hỏi đuôi (+200%), đối thoại 3 người (+150%) và quy luật đổi chữ paraphrase 3 tầng đều có dẫn chứng số câu, số đề thực tế và công thức phản xạ 3 giây chuẩn xác.',
            },
          },
          {
            '@type': 'Question',
            name: 'Tại sao trong đề thi ETS 2026, các phương án chứa từ "being" ở Part 1 lại có tỷ lệ sai 100%?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Theo thống kê thực nghiệm trên 10 đề ETS 2026, 11/11 phương án xuất hiện cấu trúc is/are being + V-ed trong tranh tĩnh không có người thao tác đều là bẫy mồi nhử. ETS cố tình gài để loại các thí sinh học vẹt công thức mà không quan sát hành động thực tế của con người trong tranh.',
            },
          },
          {
            '@type': 'Question',
            name: 'Part 2 đề thi mới 2024–2026 có xu hướng ra đề như thế nào?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Part 2 hiện nay đã cắt giảm triệt để các câu trả lời trực tiếp (Yes/No, thời gian cụ thể). Thay vào đó, hơn 40% câu hỏi sử dụng phản xạ trả lời vòng vo, thoái thác hoặc bẻ lái câu hỏi (như đùn đẩy trách nhiệm: "Clara is already organizing one"). Ngoài ra, số lượng câu hỏi đuôi tăng vọt từ 6 lên 18 câu (+200%) nhằm gài bẫy thói quen dịch nghĩa của người Việt.',
            },
          },
          {
            '@type': 'Question',
            name: 'Làm thế nào để nhận trọn bộ Ebook, File Audio và Mã VIP Pro 7 ngày?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Bạn chỉ cần nhập địa chỉ Email vào biểu mẫu trên trang web. Hệ thống máy chủ tự động của LingoPro sẽ gửi ngay link tải trọn gói gồm: Ebook chuẩn PDF 15 trang, File tài liệu Markdown, bộ từ điển 150 cụm từ và mã kích hoạt 7 ngày trải nghiệm luyện nghe FSRS trên nền tảng.',
            },
          },
          {
            '@type': 'Question',
            name: 'Lộ trình 30 ngày trong Ebook có phù hợp với người mất gốc tiếng Anh không?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Hoàn toàn phù hợp. Lộ trình được thiết kế theo 4 chặng từ cơ bản đến nâng cao: Tuần 1 giải mã Part 1 & Part 2, Tuần 2 bẻ khóa bẫy vòng vo, Tuần 3 làm chủ Paraphrase 3 tầng và Tuần 4 thi thử áp lực 45 phút. Kèm theo đó là công nghệ FSRS của LingoPro giúp tự động ngắt quãng ôn tập thính giác phù hợp với từng bạn.',
            },
          },
        ],
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://lingopro.vn/sat-thu-toeic-listening#breadcrumb',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Trang Chủ',
            item: 'https://lingopro.vn',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Thư Viện Khảo Thí TOEIC',
            item: 'https://lingopro.vn/toeic',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Sát Thủ Bài Nghe TOEIC ETS 2024 & 2026',
            item: 'https://lingopro.vn/sat-thu-toeic-listening',
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LeadMagnetClient />
    </>
  );
}

