import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Compass,
  RotateCcw,
  BookA,
  Headphones,
  BookOpen,
  Languages,
  Award,
  ShieldCheck,
  Search,
  Library,
  FileUp,
  Mic,
  Sparkles,
  Gift,
} from 'lucide-react';

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
};

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
          href: '/grammar/learn',
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
      title: 'Kỹ năng thực hành',
      items: [
        {
          href: '/student/speaking/foundation',
          label: 'Luyện nói Nền tảng',
          icon: Sparkles,
          badge: 'A0–A1',
          match: (pathname) => pathname.startsWith('/student/speaking/foundation'),
          onboardingId: 'speaking-foundation',
        },
        {
          href: '/student/speaking',
          label: 'Luyện nói AI (MVA)',
          icon: Mic,
          badge: '24+ Chủ đề',
          match: (pathname) =>
            pathname === '/student/speaking' ||
            (pathname.startsWith('/student/speaking') &&
              !pathname.startsWith('/student/speaking/foundation')),
          onboardingId: 'speaking-ai',
        },
        {
          href: '/practice/listening',
          label: 'Luyện nghe Video',
          icon: Headphones,
          match: (pathname) => pathname.startsWith('/practice/listening'),
          onboardingId: 'practice-listening',
        },
        {
          href: '/practice/pack-reading',
          label: 'Luyện đọc hiểu',
          icon: BookOpen,
          match: (pathname) =>
            pathname.startsWith('/practice/pack-reading') ||
            pathname.startsWith('/practice/daily-reading'),
          onboardingId: 'practice-reading',
        },
        {
          href: '/practice/codemix',
          label: 'Đặt câu song ngữ',
          icon: Languages,
          match: (pathname) => pathname.startsWith('/practice/codemix'),
          onboardingId: 'practice-codemix',
        },
      ],
    },
    {
      id: 'exam',
      title: 'Khảo thí',
      items: [
        {
          href: '/toeic',
          label: 'Thi thử TOEIC',
          icon: Award,
          badge: 'ETS 990',
          match: (pathname) => pathname.startsWith('/toeic'),
          onboardingId: 'toeic',
        },
        {
          href: '/vstep',
          label: 'Thi thử VSTEP',
          icon: ShieldCheck,
          badge: 'B1–C1',
          match: (pathname) => pathname.startsWith('/vstep'),
          onboardingId: 'vstep',
        },
      ],
    },
    {
      id: 'vault',
      title: 'Tra cứu & Kho',
      items: [
        {
          href: '/dictionary',
          label: 'Tra từ điển',
          icon: Search,
          footerDup: true,
          match: (pathname) => pathname.startsWith('/dictionary'),
          onboardingId: 'dictionary',
        },
        {
          href: '/library',
          label: 'Thư viện từ vựng',
          icon: Library,
          footerDup: true,
          match: (pathname) => pathname.startsWith('/library'),
          onboardingId: 'library',
        },
        {
          href: '/import',
          label: 'Nhập danh sách riêng',
          icon: FileUp,
          match: (pathname) => pathname.startsWith('/import'),
          onboardingId: 'import',
        },
      ],
    },
    {
      id: 'referral',
      title: 'Cộng đồng & Quà tặng',
      items: [
        {
          href: '/student/referral',
          label: 'Mời bạn học nhận VIP',
          icon: Gift,
          badge: '+7 ngày VIP',
          match: (pathname) => pathname.startsWith('/student/referral') || pathname === '/referral',
          onboardingId: 'referral-hub',
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
