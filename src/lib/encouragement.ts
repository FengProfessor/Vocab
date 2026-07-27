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
  | 'level_complete'     // hoàn thành cả cấp
  | 'streak_milestone'   // mốc streak 3/7/14/30…
  | 'level_up'           // lên Lingo Level
  | 'badge_unlock'       // mở badge
  | 'pro_trial_claimed'; // nhận Pro trial mốc học

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
  streak_milestone: [
    'Ngày liên tiếp, không phải ngày rải rác — não nhớ nhờ nhịp đều, không nhờ học dồn.',
    'Giữ lửa từng ngày nhỏ. Chuỗi này là bằng chứng bạn đang xây thói quen thật.',
    'Mỗi ngày quay lại là một lần bạn chọn phiên bản siêng năng hơn của mình.',
  ],
  level_up: [
    'XP tích từng buổi — level mới không đến từ may mắn, mà từ số lần bạn bấm ôn.',
    'Lên level rồi! Nhìn thanh XP dài ra theo đúng số buổi bạn đã chịu ngồi học.',
    'Cấp mới mở. Giữ nhịp hiện tại — đó mới là thứ giữ level không “rớt” theo nghĩa tinh thần.',
  ],
  badge_unlock: [
    'Thành tích mới! Badge không tự rơi — bạn đã chạm đúng mốc nỗ lực.',
    'Mở khóa rồi. Ghim khoảnh khắc này: bạn vừa chứng minh mình đi được xa hơn hôm qua.',
    'Một huy hiệu nữa trên tường nỗ lực. Cứ thế, từng mốc một.',
  ],
  pro_trial_claimed: [
    'Quà Pro mở bằng học thật — không phải bấm nút cho có. Bạn xứng đáng dùng trọn tuần này.',
    'Mốc streak + từ đã đạt. Hãy tận dụng Pro để học sâu hơn, không chỉ “thử cho biết”.',
    'Trial Pro đã bật. Coi đây là boost — nhịp học đều mới giữ được thành quả sau 7 ngày.',
  ],
};

/** Lấy 1 câu động viên theo ngữ cảnh (random trong pool). */
export function encouragement(context: EncouragementContext): string {
  const pool = MESSAGES[context];
  return pool[Math.floor(Math.random() * pool.length)] ?? '';
}

/** Mốc streak được popup chúc mừng (ngày liên tiếp). */
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100] as const;

export type MilestoneKind = 'streak' | 'level' | 'badge' | 'pro' | 'unit' | 'roadmap_level';

export interface MilestoneCopy {
  kind: MilestoneKind;
  emoji: string;
  title: string;
  subtitle: string;
  message: string;
  cta: string;
}

function pick(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)] ?? pool[0] ?? '';
}

/** Copy popup chúc mừng theo mốc (title + lời động viên). */
export function milestoneCopy(input: {
  kind: MilestoneKind;
  /** streak days / Lingo level number */
  value?: number;
  badgeLabel?: string;
  unitTitle?: string;
  levelId?: string;
}): MilestoneCopy {
  const { kind, value, badgeLabel, unitTitle, levelId } = input;

  if (kind === 'streak') {
    const days = value ?? 0;
    const subtitle =
      days >= 100
        ? 'Huyền thoại streak'
        : days >= 30
          ? 'Một tháng lửa'
          : days >= 14
            ? 'Hai tuần kiên trì'
            : days >= 7
              ? 'Một tuần liên tiếp'
              : days >= 3
                ? 'Bắt đầu thói quen'
                : 'Chuỗi ngày học';
    return {
      kind,
      emoji: '🔥',
      title: `Streak ${days} ngày!`,
      subtitle,
      message: pick([
        ...MESSAGES.streak_milestone,
        days >= 7
          ? `${days} ngày liên tiếp — não đang “nhớ” lịch học của bạn. Đừng để gãy ở ngày ${days + 1}.`
          : `${days} ngày liên tiếp rồi. Chỉ cần quay lại mai là chuỗi dài thêm một nấc.`,
      ]),
      cta: 'Tiếp tục giữ lửa',
    };
  }

  if (kind === 'level') {
    const lv = value ?? 1;
    return {
      kind,
      emoji: '⭐',
      title: `Lên Level ${lv}!`,
      subtitle: 'XP tích từng buổi học',
      message: encouragement('level_up'),
      cta: 'Tuyệt, tiếp tục học',
    };
  }

  if (kind === 'badge') {
    return {
      kind,
      emoji: '🏆',
      title: 'Mở khóa thành tích!',
      subtitle: badgeLabel ? `Badge: ${badgeLabel}` : 'Huy hiệu mới',
      message: encouragement('badge_unlock'),
      cta: 'Xem tiếp',
    };
  }

  if (kind === 'pro') {
    return {
      kind,
      emoji: '👑',
      title: 'Pro trial đã mở!',
      subtitle: 'Quà mốc học tân binh',
      message: encouragement('pro_trial_claimed'),
      cta: 'Khám phá Pro',
    };
  }

  if (kind === 'roadmap_level') {
    return {
      kind,
      emoji: '🏔️',
      title: levelId ? `Xong cấp ${levelId}!` : 'Hoàn thành cả cấp!',
      subtitle: 'Lộ trình dài thêm một tầng',
      message: encouragement('level_complete'),
      cta: 'Xem lộ trình',
    };
  }

  // unit
  return {
    kind: 'unit',
    emoji: '🚩',
    title: 'Vượt chặng!',
    subtitle: unitTitle || 'Một chặng nữa đã xong',
    message: encouragement('unit_complete'),
    cta: 'Chặng tiếp theo',
  };
}
