/**
 * Cấu hình nội dung & metadata cho từng bước onboarding.
 * Dùng CSS selector `[data-onboarding="xxx"]` để nhắm target element trên sidebar.
 */

export interface OnboardingStep {
  id: string;
  type: 'modal' | 'spotlight';
  /** CSS selector cho element cần spotlight. Chỉ dùng khi type === 'spotlight'. */
  targetSelector?: string;
  /** Nếu target nằm trong mobile drawer, cần selector riêng. */
  mobileTargetSelector?: string;
  title: string;
  description: string;
  emoji: string;
  /** XP thưởng khi qua bước này. */
  xpReward: number;
  /** Vị trí tooltip so với target. */
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    type: 'modal',
    title: 'Chào mừng đến LingoPro!',
    description: 'Để mình hướng dẫn bạn khám phá LingoPro trong 60 giây nhé!',
    emoji: '🥳',
    xpReward: 0,
  },
  {
    id: 'library',
    type: 'spotlight',
    targetSelector: '[data-onboarding="library"]',
    title: 'Thư viện từ vựng',
    description: 'Bắt đầu từ đây! Chọn bộ từ vựng theo chủ đề bạn thích — từ Giao Tiếp Cơ Bản đến IELTS.',
    emoji: '📚',
    xpReward: 5,
    position: 'right',
  },
  {
    id: 'learn',
    type: 'spotlight',
    targetSelector: '[data-onboarding="learn"]',
    title: 'Học từ mới',
    description: 'Mỗi ngày học 10-20 từ mới. Xem từ, nghe phát âm, rồi tự điền lại!',
    emoji: '✨',
    xpReward: 5,
    position: 'right',
  },
  {
    id: 'review',
    type: 'spotlight',
    targetSelector: '[data-onboarding="review"]',
    title: 'Ôn tập (Flashcards)',
    description: 'Hệ thống FSRS tự tính lịch ôn cho bạn — quên thì ôn sớm, nhớ tốt thì giãn ra.',
    emoji: '📖',
    xpReward: 5,
    position: 'right',
  },
  {
    id: 'practice',
    type: 'spotlight',
    targetSelector: '[data-onboarding="quiz"]',
    title: 'Quiz & Writing',
    description: 'Kiểm tra kiến thức bằng Quiz nhanh và luyện viết câu để nhớ sâu hơn!',
    emoji: '⚡',
    xpReward: 5,
    position: 'right',
  },
  {
    id: 'advanced',
    type: 'spotlight',
    targetSelector: '[data-onboarding="grammar"]',
    title: 'Grammar & Speaking',
    description: 'Học ngữ pháp qua bài tập tương tác và luyện nói với gia sư AI!',
    emoji: '🎓',
    xpReward: 5,
    position: 'right',
  },
  {
    id: 'survey',
    type: 'modal',
    title: 'Khảo sát nhỏ 📊',
    description: 'Bạn biết đến LingoPro từ đâu thế?',
    emoji: '📊',
    xpReward: 0,
  },
  {
    id: 'setup',
    type: 'modal',
    title: 'Bật Thông Báo & Cài App 🚀',
    description: 'Thiết lập để nhận nhắc nhở học FSRS và cài đặt LingoPro lên màn hình chính điện thoại!',
    emoji: '📱',
    xpReward: 5,
  },
  {
    id: 'reward',
    type: 'modal',
    title: 'Tuyệt vời! 🎉',
    description: 'Bạn đã hoàn thành hướng dẫn và nhận thưởng!',
    emoji: '🎁',
    xpReward: 15, // tổng cộng = 6*5 + 15 = 45 + 15? Không, 30 + 20 = 50 XP (kể cả khảo sát / setup)
  },
];

/** localStorage key đánh dấu đã hoàn thành onboarding. */
export const ONBOARDING_STORAGE_KEY = 'lingopro_onboarding_completed';

/** Tổng XP thưởng cho toàn bộ onboarding. */
export const ONBOARDING_TOTAL_XP = ONBOARDING_STEPS.reduce((sum, s) => sum + s.xpReward, 0);

/** Số bước spotlight (không tính modal welcome + reward). */
export const ONBOARDING_SPOTLIGHT_COUNT = ONBOARDING_STEPS.filter(s => s.type === 'spotlight').length;
