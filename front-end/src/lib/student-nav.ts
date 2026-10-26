import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Compass,
  RotateCcw,
  BookA,
  Zap,
  Award,
  Library,
  Mic,
  Gamepad2,
  Layers,
  Target,
  PenTool,
  BookOpen,
  Headphones,
  FileText,
} from 'lucide-react';

export type StudentNavSubItem = {
  href: string;
  label: string;
  shortLabel: string;
  desc: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
};

export type StudentNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  emoji?: string;
  color?: string;
  tile?: string;
  /** true = ẩn khỏi mobile drawer (vì trùng bottom 5-tab nav) */
  footerDup?: boolean;
  /** hiện khi học sinh đã tham gia lớp */
  requiresClass?: boolean;
  match: (pathname: string) => boolean;
  onboardingId?: string;
  badge?: string | number;
  /** Danh sách mục con hiển thị trong sidebar con (ví dụ: Trung tâm Luyện tập) */
  children?: readonly StudentNavSubItem[];
};

export const PRACTICE_HUB_SUB_ITEMS: readonly StudentNavSubItem[] = [
  {
    href: '/student/speaking/foundation',
    label: 'Luyện nói phản xạ · A0–C1',
    shortLabel: 'Luyện nói A0–C1',
    desc: 'Luyện cơ miệng, phản xạ câu tự nhiên, sửa phát âm chuẩn xác cùng AI',
    icon: Mic,
    match: (pathname) => pathname.startsWith('/student/speaking'),
  },
  {
    href: '/practice/games',
    label: 'Sân chơi tiếng Anh · 6 mini game',
    shortLabel: '6 Mini Game',
    desc: 'Lật cặp · đua từ · giải mã chữ · xếp câu · cầu ngữ pháp · thám tử săn lỗi',
    icon: Gamepad2,
    match: (pathname) => pathname.startsWith('/practice/games'),
  },
  {
    href: '/practice/vocab-station',
    label: '100 Động từ Cốt lõi & Luyện ngữ cảnh',
    shortLabel: '100 Động từ Cốt lõi',
    desc: 'Lộ trình bài bản mất gốc A0-A1 · Đọc đoạn văn · Đục lỗ · Bố cục S-V-O · Flashcard 2.0',
    icon: Layers,
    match: (pathname) => pathname.startsWith('/practice/vocab-station'),
  },
  {
    href: '/toeic',
    label: 'Thi thử TOEIC chuẩn ETS',
    shortLabel: 'Thi thử TOEIC',
    desc: '200 câu thi thật 120p · Split-Pane · luyện Part 1-7 · Barem 990',
    icon: Target,
    match: (pathname) => pathname.startsWith('/toeic'),
  },
  {
    href: '/practice/verb-drill',
    label: 'Quiz nhớ nhanh',
    shortLabel: 'Quiz nhớ nhanh',
    desc: 'MCQ mix nghĩa + cloze · đúng thì lên bậc',
    icon: Zap,
    match: (pathname) => pathname.startsWith('/practice/verb-drill'),
  },
  {
    href: '/practice/codemix',
    label: 'Đặt câu',
    shortLabel: 'Đặt câu',
    desc: 'Chọn vài từ → viết câu → xem bản tiếng Anh',
    icon: PenTool,
    match: (pathname) => pathname.startsWith('/practice/codemix'),
  },
  {
    href: '/practice/reading-library',
    label: 'Thư viện bài đọc · A1–C2',
    shortLabel: 'Thư viện bài đọc',
    desc: 'Kho 619 bài đọc đa dạng chủ đề A1-C2, VSTEP, TOEIC, VOA · Đọc hiểu, đục lỗ, trắc nghiệm song song',
    icon: BookOpen,
    match: (pathname) => pathname.startsWith('/practice/reading-library'),
  },
  {
    href: '/practice/listening',
    label: 'Luyện nghe Video',
    shortLabel: 'Luyện nghe Video',
    desc: 'YouTube đời sống · phụ đề song ngữ đồng bộ theo video · lướt xem theo chủ đề',
    icon: Headphones,
    match: (pathname) => pathname.startsWith('/practice/listening'),
  },
  {
    href: '/practice/pack-reading',
    label: 'Luyện đọc',
    shortLabel: 'Luyện đọc gói từ',
    desc: 'Từ đã học · Yếu/Đang nhớ/Vững · đọc đoạn + quiz',
    icon: Compass,
    match: (pathname) => pathname.startsWith('/practice/pack-reading'),
  },
  {
    href: '/practice/daily-reading',
    label: 'Bài đọc hàng ngày',
    shortLabel: 'Bài đọc hàng ngày',
    desc: 'Tự động tạo đêm qua · đọc + quiz + điền từ + từ mới',
    icon: FileText,
    match: (pathname) => pathname.startsWith('/practice/daily-reading'),
  },
];

export type StudentNavSection = {
  id: string;
  title: string;
  items: StudentNavItem[];
};

export function buildStudentNavSections(opts?: {
  classroomId?: string | null;
  hasClass?: boolean;
  reviewDueCount?: number;
  grammarDueCount?: number;
}): StudentNavSection[] {
  const safeClassId = opts?.classroomId?.trim();
  const reviewHref = safeClassId ? `/review?class=${encodeURIComponent(safeClassId)}` : '/review';
  const reviewBadge =
    opts?.reviewDueCount && opts.reviewDueCount > 0
      ? opts.reviewDueCount > 99
        ? '99+'
        : opts.reviewDueCount
      : undefined;
  const grammarBadge =
    opts?.grammarDueCount && opts.grammarDueCount > 0
      ? opts.grammarDueCount > 99
        ? '99+'
        : opts.grammarDueCount
      : undefined;

  return [
    {
      id: 'learn',
      title: 'Học & Lộ trình',
      items: [
        {
          href: '/student',
          label: 'Dashboard',
          icon: LayoutDashboard,
          footerDup: true,
          match: (pathname) => pathname === '/student',
          onboardingId: 'nav-dashboard',
        },
        {
          href: '/journey',
          label: 'Lộ trình học',
          icon: Compass,
          footerDup: true,
          match: (pathname) => pathname.startsWith('/journey'),
          onboardingId: 'journey',
        },
        {
          href: reviewHref,
          label: 'Ôn tập ngắt quãng',
          icon: RotateCcw,
          footerDup: true,
          badge: reviewBadge,
          match: (pathname) =>
            pathname.startsWith('/review') ||
            pathname.startsWith('/flashcard') ||
            pathname.startsWith('/writing') ||
            pathname.startsWith('/quiz'),
          onboardingId: 'nav-review',
        },
        {
          href: '/grammar',
          label: 'Ngữ pháp ứng dụng',
          icon: BookA,
          badge: grammarBadge,
          match: (pathname) => pathname.startsWith('/grammar'),
          onboardingId: 'grammar',
        },
      ],
    },
    {
      id: 'practice',
      title: 'Luyện tập & Khảo thí',
      items: [
        {
          href: '/practice',
          label: 'Trung tâm Luyện tập',
          icon: Zap,
          match: (pathname) =>
            pathname === '/practice' ||
            pathname.startsWith('/practice') ||
            pathname.startsWith('/student/speaking'),
          onboardingId: 'practice-hub',
          children: PRACTICE_HUB_SUB_ITEMS,
        },
        {
          href: '/toeic',
          label: 'Thi thử & Khảo thí',
          icon: Award,
          match: (pathname) =>
            pathname.startsWith('/toeic') ||
            pathname.startsWith('/vstep') ||
            pathname.startsWith('/vnu-bac-3') ||
            pathname.startsWith('/thpt') ||
            pathname.startsWith('/sat-thu-toeic'),
          onboardingId: 'toeic',
        },
      ],
    },
    {
      id: 'vault',
      title: 'Kho & Tra cứu',
      items: [
        {
          href: '/library',
          label: 'Kho từ vựng & Tra cứu',
          icon: Library,
          footerDup: true,
          match: (pathname) =>
            pathname.startsWith('/library') ||
            pathname.startsWith('/dictionary') ||
            pathname.startsWith('/import'),
          onboardingId: 'library',
        },
      ],
    },
  ];
}

export function buildStudentNavItems(opts?: {
  classroomId?: string | null;
  hasClass?: boolean;
  reviewDueCount?: number;
  grammarDueCount?: number;
}): StudentNavItem[] {
  return buildStudentNavSections(opts).flatMap((section) => section.items);
}
