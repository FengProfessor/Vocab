import type { Metadata } from 'next';
import LeadMagnetClient from '@/components/lead-magnet/LeadMagnetClient';

export const metadata: Metadata = {
  title: 'Bách Khoa Thực Chiến: Sát Thủ Bài Nghe TOEIC ETS 2024 & ETS 2026 | LingoPro',
  description:
    'Giải mã định lượng 2,000 câu hỏi từ 20 bộ đề thi chuẩn ETS 2024 & ETS 2026 mới nhất. Tải ngay Ebook độc quyền, làm bài test chẩn đoán phản xạ 15 bẫy nghe sát thủ và bứt phá 450+ điểm Listening.',
  keywords: [
    'TOEIC Listening',
    'Sát thủ TOEIC',
    'ETS 2024',
    'ETS 2026',
    'Bẫy nghe TOEIC',
    'LingoPro',
    'Luyện nghe FSRS',
    'Test chẩn đoán 15 bẫy nghe',
    'Từ điển TOEIC 150 từ',
  ],
  openGraph: {
    title: 'Bách Khoa Thực Chiến: Sát Thủ Bài Nghe TOEIC ETS 2024 & ETS 2026',
    description:
      'Đột phá phản xạ nghe, bẻ gãy 15 bẫy sát thủ phòng thi, chinh phục 450+ đến 495 điểm Listening tuyệt đối cùng LingoPro.',
    type: 'website',
    locale: 'vi_VN',
    url: 'https://lingopro.vn/lead-magnet/sat-thu-toeic-listening',
    siteName: 'LingoPro EdTech Platform',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sát Thủ Bài Nghe TOEIC ETS 2024 & ETS 2026 | LingoPro',
    description:
      'Giải mã 2,000 câu hỏi từ 20 bộ đề chuẩn ETS mới nhất. Nhận Ebook và làm test chẩn đoán 15 bẫy nghe miễn phí.',
  },
};

export default function SatThuToeicListeningPage() {
  return <LeadMagnetClient />;
}
