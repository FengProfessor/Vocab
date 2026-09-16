import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hệ Thống Khảo Thí & Luyện Thi TOEIC — LingoPro',
  description:
    'Phòng thi trực tuyến mô phỏng chuẩn định dạng TOEIC: 200 câu hỏi chia 2 cột, bảng điều hướng 4 trạng thái, gắn cờ Flag, bảng barem 990 và giải thích chi tiết.',
  alternates: { canonical: '/toeic' },
  openGraph: {
    title: 'Khảo Thí & Luyện Thi TOEIC — LingoPro',
    description:
      'Luyện thi TOEIC đa chế độ: Thi thử 120 phút chuẩn phòng thi máy tính hoặc luyện linh hoạt Part 1–7 với thuật toán chống trùng lặp câu hỏi thông minh.',
    url: 'https://lingopro.online/toeic',
    siteName: 'LingoPro',
    locale: 'vi_VN',
    type: 'website',
  },
};

export default function ToeicLayout({ children }: { children: React.ReactNode }) {
  return children;
}
