/**
 * Tour sau đăng nhập — desktop + điện thoại.
 * Mobile: footer Home · Ôn · Lộ trình · Kho · Tra từ · menu ☰ · PWA.
 */

export interface OnboardingStep {
  id: string;
  type: 'modal' | 'spotlight' | 'guide';
  targetSelector?: string;
  mobileTargetSelector?: string;
  openMobileMenu?: boolean;
  route?: string;
  title: string;
  description: string;
  /** How-to desktop / chung. */
  howTo?: string[];
  /** How-to ưu tiên khi viewport < 768 (điện thoại). */
  howToMobile?: string[];
  ctaLabel?: string;
  emoji: string;
  xpReward: number;
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Chỉ chạy spotlight trên mobile (bỏ qua desktop). */
  mobileOnly?: boolean;
  /** Chỉ desktop (bỏ qua mobile). */
  desktopOnly?: boolean;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    type: 'modal',
    title: 'Chào mừng đến LingoPro!',
    description: 'Tour chỉ đúng nút trên máy tính và điện thoại — khoảng 3–4 phút.',
    emoji: '🥳',
    xpReward: 0,
  },
  {
    id: 'method',
    type: 'modal',
    title: 'Cách học mỗi ngày',
    description: 'Lộ trình/Thư viện → Cần học → Cần ôn → Ngữ pháp / Tra từ.',
    emoji: '🧠',
    xpReward: 0,
  },

  // ── Mobile: bản đồ 5 tab footer ──
  {
    id: 'mobile-nav',
    type: 'spotlight',
    route: '/student',
    mobileOnly: true,
    targetSelector: '[data-onboarding="mobile-nav"]',
    mobileTargetSelector: '[data-onboarding="mobile-nav"]',
    title: 'Thanh điều hướng dưới máy',
    description: '5 tab luôn ở đáy màn hình — chạm để đi mọi chỗ chính.',
    howToMobile: [
      '🏠 Home = Dashboard (Cần học / Cần ôn / Kho)',
      '📚 Ôn = từ đến hạn FSRS (có badge số đỏ)',
      '🗺️ Lộ trình = nút tròn nổi giữa (học theo chặng)',
      '📦 Kho = Thư viện gói từ',
      '🔍 Tra từ = từ điển 1 chạm',
      '☰ góc trái header = menu thêm: Ngữ pháp, Nhập list, Lớp…',
    ],
    emoji: '📱',
    xpReward: 5,
    position: 'top',
  },

  // ── Dashboard ──
  {
    id: 'learn',
    type: 'spotlight',
    route: '/student',
    targetSelector: '[data-onboarding="learn"]',
    title: 'Cần học',
    description: 'Card từ mới. Xem + nghe → tự gõ nhớ lại (~8 từ/phiên).',
    howTo: [
      'Bấm card «Cần học» khi còn từ mới',
      'Bước 1: xem từ, nghe, ví dụ',
      'Bước 2: tự gõ lại từ',
      'Xong → từ vào lịch ôn FSRS',
    ],
    howToMobile: [
      'Ở Home: bấm card lớn «Cần học» (bên trái)',
      'Xem từ + loa phát âm → vuốt/bấm tiếp',
      'Gõ lại từ bằng bàn phím điện thoại',
      'Xong phiên quay Home — số Cần học giảm',
    ],
    emoji: '✨',
    xpReward: 5,
    position: 'bottom',
  },
  {
    id: 'review',
    type: 'spotlight',
    route: '/student',
    targetSelector: '[data-onboarding="review"]',
    mobileTargetSelector: '[data-onboarding="mobile-review"]',
    title: 'Cần ôn',
    description: 'Từ đến hạn nhớ. Chọn đúng: Quên / Khó / Nhớ / Dễ.',
    howTo: [
      'Bấm card «Cần ôn» hoặc menu Ôn tập',
      'Quên (kể cả nhớ sau khi xem đáp án) → Quên',
      'Chật vật nhưng đúng → Khó · bình thường → Nhớ · rất dễ → Dễ',
    ],
    howToMobile: [
      'Card «Cần ôn» trên Home HOẶC tab 📚 Ôn dưới đáy',
      'Badge đỏ trên tab Ôn = số từ due',
      'Ôn xong chạm đúng mức nhớ — đừng bấm Khó khi đã quên',
    ],
    emoji: '🔄',
    xpReward: 5,
    position: 'bottom',
  },
  {
    id: 'progress',
    type: 'spotlight',
    route: '/student',
    targetSelector: '[data-onboarding="progress"]',
    title: 'Streak & XP',
    description: '🔥 học đều · ⭐ XP. Kéo xuống: Kho từ (L1–L6, gói đang học).',
    howToMobile: [
      'Header: 🔥 streak · ⭐ XP (có thể ẩn bớt trên màn nhỏ)',
      'Vuốt xuống Home: heatmap + mục tiêu XP ngày',
      'Kho từ vựng: mức nhớ L1→L6, gói «Học tiếp»',
    ],
    emoji: '🏅',
    xpReward: 5,
    position: 'bottom',
  },

  // ── Sử dụng từ / Luyện tập ──
  {
    id: 'guide-practice',
    type: 'guide',
    route: '/practice',
    title: 'Sử dụng từ & Luyện tập',
    description: 'Luyện điền ô trống, sửa lỗi sai & ghép câu để phản xạ nhanh.',
    howTo: [
      'Sidebar: Sử dụng từ ✍️',
      'Luyện điền từ trực tiếp vào ô trống',
      'Tìm và sửa lỗi sai trong câu, chọn collocations chuẩn',
    ],
    howToMobile: [
      'Chạm ☰ góc trái header → chọn «Sử dụng từ»',
      'Luyện điền từ vào ô trống & sửa lỗi sai',
      'Luyện tập giúp bạn làm chủ ngữ cảnh và cách dùng từ',
    ],
    ctaLabel: 'Mở Luyện tập & thử',
    emoji: '✍️',
    xpReward: 5,
  },
  {
    id: 'practice-spot',
    type: 'spotlight',
    route: '/practice',
    targetSelector: '[data-onboarding="practice-use-words"]',
    title: 'Trang Luyện tập',
    description: 'Chọn các dạng bài tương tác để rèn luyện kỹ năng sử dụng từ.',
    emoji: '✍️',
    xpReward: 5,
    position: 'bottom',
  },

  // ── Thư viện ──
  {
    id: 'guide-library',
    type: 'guide',
    route: '/library',
    title: 'Thư viện — gói từ & PDF',
    description: 'Thêm pack vào kho + tải PDF ôn offline.',
    howTo: [
      'Vào Thư viện (sidebar 📦)',
      'Chọn bộ THPT / Luyện thi / Giao tiếp',
      'Unit → chặng (~8–12 từ) → preview → Thêm / Học',
      'PDF: «PDF chủ đề» / icon tải unit / «Tải PDF» trong unit',
      'Cửa sổ in → Lưu PDF · list riêng: «Nhập tay»',
    ],
    howToMobile: [
      'Tab 📦 Kho dưới đáy màn hình',
      'Chạm bộ (THPT / TOEIC / Giao tiếp) → popup unit',
      'Chạm unit → chạm chặng (pack) → Thêm vào kho / Học',
      'PDF: nút PDF chủ đề hoặc icon tải cạnh unit',
      'Mobile: app có thể tải HTML → mở file → Chia sẻ/In → Lưu PDF',
      'List riêng: «Nhập tay» góc phải header Thư viện',
    ],
    ctaLabel: 'Mở Thư viện & thử',
    emoji: '📦',
    xpReward: 5,
  },
  {
    id: 'lib-routes',
    type: 'spotlight',
    route: '/library',
    targetSelector: '[data-onboarding="lib-routes"]',
    title: 'Chọn bộ từ',
    description: 'Bấm một bộ để mở unit → chặng → thêm vào kho.',
    howToMobile: [
      'Chạm thẻ bộ (vd Lớp 10)',
      'Popup: chạm unit → chạm pack',
      'Preview → Thêm / Học ngay',
    ],
    emoji: '🎒',
    xpReward: 5,
    position: 'bottom',
  },
  {
    id: 'lib-import',
    type: 'spotlight',
    route: '/library',
    targetSelector: '[data-onboarding="lib-import"]',
    title: 'Nhập list riêng',
    description: 'Dán list / file từ của bạn qua «Nhập tay».',
    emoji: '➕',
    xpReward: 5,
    position: 'bottom',
  },

  // ── Lộ trình ──
  {
    id: 'guide-journey',
    type: 'guide',
    route: '/journey',
    title: 'Lộ trình theo chặng',
    description: 'CEFR hoặc THPT → placement → học từng chặng.',
    howTo: [
      'Menu Lộ trình (🗺️)',
      'Chọn CEFR A0–B2 hoặc THPT Lớp 10–12',
      'Test ~4 phút hoặc tự chọn cấp',
      'Mỗi chặng: từ vựng → ngữ pháp → checkpoint',
    ],
    howToMobile: [
      'Tab 🗺️ giữa footer (nút tròn nổi xanh)',
      'Chạm CEFR hoặc THPT',
      'Làm test hoặc tự chọn cấp',
      'Chạm chặng đang mở để học; chặng khóa = xong chặng trước',
      'Free A0–A1 · Pro A2+',
    ],
    ctaLabel: 'Mở Lộ trình & thử',
    emoji: '🗺️',
    xpReward: 5,
  },
  {
    id: 'journey-pick',
    type: 'spotlight',
    route: '/journey',
    targetSelector: '[data-onboarding="journey-main"]',
    mobileTargetSelector: '[data-onboarding="mobile-journey"]',
    title: 'Màn lộ trình',
    description: 'Chọn hướng / cấp, hoặc bấm chặng đang mở để học tiếp.',
    howToMobile: [
      'Nếu chưa ghi danh: chạm CEFR hoặc THPT trên màn hình',
      'Đã có path: vuốt danh sách chặng → chạm chặng mở',
      'Quay Home: tab 🏠 hoặc Back',
    ],
    emoji: '🧭',
    xpReward: 5,
    position: 'bottom',
  },

  // ── Tra từ ──
  {
    id: 'guide-dict',
    type: 'guide',
    route: '/dictionary',
    title: 'Tra từ điển',
    description: 'Gõ từ → nghĩa/IPA → lưu kho ôn sau.',
    howTo: [
      'Menu Tra từ điển',
      'Gõ từ → Enter → loa phát âm',
      'Lưu vào kho để ôn FSRS',
    ],
    howToMobile: [
      'Tab 🔍 Tra từ dưới đáy',
      'Gõ từ (bàn phím ĐT) → tìm',
      'Chạm loa nghe · chạm Lưu vào kho',
      'Lịch sử tra nằm dưới ô tìm',
    ],
    ctaLabel: 'Mở Tra từ & thử',
    emoji: '🔍',
    xpReward: 5,
  },
  {
    id: 'dict-search',
    type: 'spotlight',
    route: '/dictionary',
    targetSelector: '[data-onboarding="dict-search"]',
    mobileTargetSelector: '[data-onboarding="mobile-dictionary"]',
    title: 'Ô tra từ',
    description: 'Gõ từ → tìm. Có kết quả thì lưu vào kho nếu muốn ôn.',
    emoji: '🔍',
    xpReward: 5,
    position: 'bottom',
  },

  // ── Ngữ pháp ──
  {
    id: 'guide-grammar',
    type: 'guide',
    route: '/grammar/learn',
    title: 'Ngữ pháp & Lịch ôn FSRS',
    description: 'Bài học chuẩn GFM, công thức badge màu, bài tập điền từ & sửa lỗi sai.',
    howTo: [
      'Sidebar: Ngữ pháp 🎓',
      'Xem công thức cấu trúc màu sinh động',
      'Điền đáp án trực tiếp vào câu & click sửa từ sai',
      'Ôn tập định kỳ theo thuật toán FSRS',
    ],
    howToMobile: [
      'Chạm ☰ góc trái header (mọi trang app)',
      'Trong drawer: chạm «Ngữ pháp»',
      'Chọn bài đang mở hoặc đến hạn ôn',
      'Học công thức dạng badge & bài tập tương tác',
    ],
    ctaLabel: 'Mở Ngữ pháp',
    emoji: '🎓',
    xpReward: 5,
  },
  {
    id: 'grammar-menu',
    type: 'spotlight',
    route: '/student',
    mobileOnly: true,
    openMobileMenu: true,
    targetSelector: '[data-onboarding="grammar"]',
    title: 'Ngữ pháp trong menu ☰',
    description: 'Trên điện thoại: mở ☰ → chạm Ngữ pháp (không nằm ở footer).',
    howToMobile: [
      'Tour đang mở drawer giúp bạn',
      'Chạm dòng 🎓 Ngữ pháp',
      'Đóng menu: chạm ra ngoài hoặc X',
    ],
    emoji: '☰',
    xpReward: 5,
    position: 'right',
  },

  // ── App điện thoại + PC ──
  {
    id: 'guide-download',
    type: 'guide',
    route: '/download',
    title: 'Cài app ĐT & máy tính',
    description: 'PWA điện thoại + Desktop Windows tra từ mọi app.',
    howTo: [
      'Windows: /download → Setup.exe → token ở Hồ sơ',
      'Điện thoại: Safari/Chrome → Thêm vào MH chính',
    ],
    howToMobile: [
      'Bạn đang trên điện thoại — gắn web như app:',
      'iPhone (Safari): nút Chia sẻ → «Thêm vào MH chính»',
      'Android (Chrome): menu ⋮ → «Thêm vào MH chính» / «Cài ứng dụng»',
      'Mở icon LingoPro ngoài màn hình = full màn, gần app native',
      'Muốn tra từ trên Windows: mở /download trên máy tính, tải Setup.exe',
      'Bước Setup sau trong tour cũng có hướng dẫn PWA',
    ],
    ctaLabel: 'Xem trang Tải app',
    emoji: '📲',
    xpReward: 5,
  },
  {
    id: 'download-cta',
    type: 'spotlight',
    route: '/download',
    desktopOnly: true,
    targetSelector: '[data-onboarding="download-setup"]',
    title: 'Tải Setup Windows',
    description: 'Setup.exe → cài → dán token lpext_… từ Hồ sơ web.',
    emoji: '⬇️',
    xpReward: 5,
    position: 'bottom',
  },
  {
    id: 'pwa-phone',
    type: 'spotlight',
    route: '/student',
    mobileOnly: true,
    targetSelector: '[data-onboarding="mobile-nav"]',
    title: 'Gắn app lên màn hình ĐT',
    description: 'Không cần App Store. Safari/Chrome → Thêm vào MH chính.',
    howToMobile: [
      'iOS Safari: Chia sẻ (ô mũi tên) → Thêm vào MH chính → Thêm',
      'Android Chrome: ⋮ → Cài đặt ứng dụng / Thêm vào MH chính',
      'Sau đó mở từ icon ngoài home — học nhanh hơn tab trình duyệt',
      'Bật thông báo khi trình duyệt hỏi để FSRS nhắc ôn',
    ],
    emoji: '📲',
    xpReward: 5,
    position: 'top',
  },

  // ── Thông báo ──
  {
    id: 'guide-notify',
    type: 'guide',
    route: '/student',
    title: 'Bật thông báo nhắc ôn',
    description: 'Nhắc khi từ sắp quên — giữ streak.',
    howTo: [
      'Dashboard: banner Bật thông báo',
      'Cho phép khi trình duyệt hỏi',
      'Chuông header = due',
    ],
    howToMobile: [
      'Home: popup/sheet dưới «Bật nhắc ôn tập» (nếu hiện)',
      'Chạm «Bật ngay» → Cho phép thông báo',
      'iOS: cần thêm vào MH chính (PWA) mới nhận push ổn định hơn',
      'Chuông 🔔 góc phải header: xem due',
      'Đã chặn: Cài đặt Safari/Chrome → lingopro.online → Thông báo → Cho phép',
    ],
    ctaLabel: 'Về Home bật thông báo',
    emoji: '🔔',
    xpReward: 5,
  },
  {
    id: 'notify-spot',
    type: 'spotlight',
    route: '/student',
    targetSelector: '[data-onboarding="notify"]',
    title: 'Bật thông báo',
    description: 'Chạm Bật ngay → Cho phép. Chuông header báo số due.',
    howToMobile: [
      'Sheet dưới màn (mobile) hoặc banner (nếu rộng)',
      'Chạm Bật ngay',
      'Nếu không thấy sheet: đã bật rồi, hoặc vào bước Setup tiếp theo',
    ],
    emoji: '🔔',
    xpReward: 5,
    position: 'bottom',
  },

  {
    id: 'survey',
    type: 'modal',
    title: 'Khảo sát nhỏ',
    description: 'Bạn biết LingoPro từ đâu?',
    emoji: '📊',
    xpReward: 0,
  },
  {
    id: 'setup',
    type: 'modal',
    title: 'Thông báo & cài app ĐT',
    description: 'Bật FCM + gắn PWA lên màn hình điện thoại.',
    emoji: '📱',
    xpReward: 5,
  },
  {
    id: 'reward',
    type: 'modal',
    title: 'Xong tour!',
    description: 'Học streak 3 ngày + 50 từ → nhận Pro 1 tuần.',
    emoji: '🎁',
    xpReward: 15,
  },
];

export const ONBOARDING_VERSION = 'v6-20260805-mandatory';

export const ONBOARDING_STORAGE_KEY = `lingopro_onboarding_${ONBOARDING_VERSION}`;
export const ONBOARDING_STORAGE_KEY_LEGACY = 'lingopro_onboarding_completed';
export const ONBOARDING_STEP_SESSION_KEY = 'lingopro_onboarding_step_v6';

export const ONBOARDING_PRO_COUPON = 'NEWBIE1W';
export const ONBOARDING_PRO_DAYS = 7;
export const ONBOARDING_PRO_LABEL = '1 tuần';

export const ONBOARDING_TOTAL_XP = ONBOARDING_STEPS.reduce((sum, s) => sum + s.xpReward, 0);
export const ONBOARDING_SPOTLIGHT_COUNT = ONBOARDING_STEPS.filter((s) => s.type === 'spotlight').length;

export const ONBOARDING_OPEN_MENU_EVENT = 'lingopro-onboarding-open-menu';
export const ONBOARDING_CLOSE_MENU_EVENT = 'lingopro-onboarding-close-menu';

/** Viewport mobile tour (< md Tailwind). */
export function isTourMobile(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < 768;
}

/** Lọc bước theo thiết bị (mobileOnly / desktopOnly). */
export function getActiveOnboardingSteps(): OnboardingStep[] {
  const mobile = isTourMobile();
  return ONBOARDING_STEPS.filter((s) => {
    if (s.mobileOnly && !mobile) return false;
    if (s.desktopOnly && mobile) return false;
    return true;
  });
}

export function resolveHowTo(step: OnboardingStep): string[] {
  if (isTourMobile() && step.howToMobile?.length) return step.howToMobile;
  return step.howTo ?? [];
}

