/**
 * Lời động viên theo ngữ cảnh — dựa nghiên cứu engagement (docs/roadmap-research/04-engagement.md):
 * - Khen NỖ LỰC cụ thể, không khen phẩm chất ("bạn giỏi quá" gây lo âu hiệu suất).
 * - Sai → an ủi kiểu mistake-safe, không phán xét.
 * - Không lạm phát khen (celebration chỉ ở milestone thật).
 */

export type EncouragementContext =
  | 'session_start'      // mở phiên học
  | 'streak_answer'      // đúng liên tiếp 5 câu trong phiên
  | 'retry_success'      // làm lại sau khi rớt và pass
  | 'hard_word_done'     // trả lời đúng từ/câu từng sai
  | 'wrong_answer'       // vừa sai 1 câu
  | 'many_wrong'         // sai nhiều trong phiên (an ủi)
  | 'comeback'           // quay lại sau nhiều ngày nghỉ
  | 'unit_complete'      // vượt chặng
  | 'level_complete';    // hoàn thành cả cấp

const MESSAGES: Record<EncouragementContext, string[]> = {
  session_start: [
    'Vào việc thôi — 5 phút hôm nay đáng giá hơn 1 giờ tuần sau.',
    'Bạn đã mở app — bước khó nhất xong rồi đó.',
    'Từng chặng nhỏ thôi. Đi đều quan trọng hơn đi nhanh.',
  ],
  streak_answer: [
    'Chuỗi 5 câu đúng — nhịp làm bài của bạn đang rất ổn định.',
    'Bạn đang tập trung tốt, thấy rõ qua từng câu trả lời.',
  ],
  retry_success: [
    'Làm lại và vượt qua — kiên trì kiểu này mới là thứ tạo khác biệt.',
    'Lần trước chưa được, lần này được. Đó chính xác là cách não học.',
  ],
  hard_word_done: [
    'Câu này từng làm khó bạn — hôm nay bạn xử gọn. Nỗ lực ôn lại có kết quả rồi.',
    'Từ khó mà bạn vẫn nhớ — công ôn tập hôm trước không uổng.',
  ],
  wrong_answer: [
    'Không sao — sai ở đây rẻ hơn sai ngoài đời nhiều.',
    'Ghi nhận rồi. Câu này sẽ quay lại đúng lúc để bạn nhớ sâu hơn.',
  ],
  many_wrong: [
    'Hôm nay nhiều câu khó — nhưng bạn vẫn làm tới câu cuối, điều đó đáng kể hơn điểm số.',
    'Sai nhiều = não đang được thử thách đúng chỗ. Mai quay lại sẽ nhẹ hơn hẳn.',
  ],
  comeback: [
    'Bạn quay lại rồi — với việc học, quay lại luôn thắng bỏ cuộc.',
    'Nghỉ mấy ngày không xóa được nền cũ đâu. Ôn nhẹ vài phút là guồng lại ngay.',
  ],
  unit_complete: [
    'Vượt chặng! Bạn đã đi qua đủ từ vựng, ngữ pháp lẫn phát âm của chặng này.',
    'Một chặng nữa ở lại phía sau — lộ trình của bạn đang dài ra theo đúng nghĩa đen.',
  ],
  level_complete: [
    'Hoàn thành cả một CẤP — đây là thành quả của rất nhiều buổi học đều đặn. Trân trọng nó nhé!',
    'Lên cấp! Nhìn lại chỗ bạn bắt đầu mà xem — khoảng cách đó là do chính bạn đắp nên.',
  ],
};

/** Lấy 1 câu động viên theo ngữ cảnh (random trong pool). */
export function encouragement(context: EncouragementContext): string {
  const pool = MESSAGES[context];
  return pool[Math.floor(Math.random() * pool.length)];
}
