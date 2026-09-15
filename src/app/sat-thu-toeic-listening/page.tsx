import type { Metadata } from 'next';
import LeadMagnetClient from '@/components/lead-magnet/LeadMagnetClient';

export const metadata: Metadata = {
  title: 'Bách Khoa Thực Chiến: Sát Thủ Bài Nghe TOEIC ETS 2024 & ETS 2026 | LingoPro',
  description:
    'Giải mã định lượng 2,000 câu hỏi từ 20 bộ đề thi chuẩn ETS 2024 & ETS 2026 mới nhất. Tải ngay Ebook độc quyền, làm bài test chẩn đoán phản xạ thính giác 15 chiều và bứt phá 450+ điểm Listening.',
};

export default function DirectSatThuToeicPage() {
  return <LeadMagnetClient />;
}
