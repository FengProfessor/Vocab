export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ_DATA: FaqItem[] = [
  {
    q: 'Thuật toán FSRS v5 hoạt động như thế nào và tại sao lại nhớ lâu hơn Anki SM-2?',
    a: 'FSRS (Free Spaced Repetition Scheduler v5) là mô hình học máy toán học hiện đại nhất hiện nay mô phỏng quá trình ghi nhớ và quên lãng của não bộ dựa trên 3 thông số: Độ khó (Difficulty), Độ ổn định (Stability) và Khả năng nhớ lại (Retrievability). Khác với Anki SM-2 vốn được sáng chế từ năm 1987 với các khoảng giãn cách cố định máy móc, FSRS tự động hiệu chỉnh từng giây phút để đưa ra thời điểm ôn tập lý tưởng nhất — giúp bạn tiết kiệm 40% số lượt ôn mà vẫn duy trì tỷ lệ nhớ trên 90%.',
  },
  {
    q: 'Tôi có thể dùng LingoPro trên điện thoại (iPhone / Android) được không?',
    a: 'Hoàn toàn được. LingoPro hỗ trợ đồng bộ thời gian thực đa nền tảng. Bạn có thể mở trực tiếp trên trình duyệt Safari/Chrome hoặc cài đặt ứng dụng PWA / Capacitor lên màn hình chính. Mọi tiến trình ôn tập từ vựng giữa laptop và điện thoại đều được đồng bộ ngay lập tức qua máy chủ đám mây.',
  },
  {
    q: 'Tôi có cần nhập thẻ tín dụng quốc tế (Visa/Mastercard) để bắt đầu học không?',
    a: 'Không. Gói Starter Free hoàn toàn miễn phí 0đ và không yêu cầu bất kỳ thông tin thẻ ngân hàng nào. Khi nâng cấp lên gói VIP Pro, bạn có thể thanh toán nội địa qua quét mã VietQR tự động (SePay) chỉ trong 30 giây mà không cần thẻ tín dụng.',
  },
  {
    q: 'Bộ đề thi TOEIC ETS 2026 trên LingoPro có gì khác so với tài liệu trên mạng?',
    a: 'Đội ngũ Khảo thí LingoPro đã số hóa định lượng 2.000 câu hỏi từ 20 bộ đề chuẩn ETS mới nhất (2024 & 2026), phân loại rõ 15 bẫy sát thủ phòng thi (bẫy being ở Part 1 tỷ lệ sai 100%, câu hỏi đuôi tăng +200%, trả lời vòng vo đùn đẩy ở Part 2, và kỹ thuật đổi chữ paraphrase 3 tầng ở Part 7). Bạn được luyện tập với audio 4 chất giọng và giải thích chi tiết từng câu.',
  },
  {
    q: 'Chính sách bảo hành hoàn tiền 100% trong 14 ngày áp dụng ra sao?',
    a: 'Chúng tôi cam kết chất lượng tuyệt đối. Nếu trong vòng 14 ngày kể từ khi nâng cấp gói Pro, bạn cảm thấy phương pháp FSRS không giúp bạn nhớ từ vựng hiệu quả hơn, bạn chỉ cần liên hệ qua Zalo/Telegram hỗ trợ — LingoPro sẽ hoàn lại 100% số tiền bạn đã thanh toán trong vòng 24 giờ làm việc.',
  },
];
