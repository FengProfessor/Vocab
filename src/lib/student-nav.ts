import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Compass,
  RotateCcw,
  BookA,
  Headphones,
  BookOpen,
  Languages,
  Zap,
  Award,
  Search,
  Library,
  FileUp,
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
        {
          href: '/practice/vocab-station',
          label: '100 Động từ cốt lõi',
          icon: Zap,
          match: (pathname) =>
            pathname.startsWith('/practice/vocab-station') ||
            pathname.startsWith('/practice/verb-drill'),
          onboardingId: 'practice-vocab-station',
        },
      ],
    },
    {
      id: 'exam',
      title: 'Khảo thí',
      items: [
        {
          href: '/toeic',
          label: 'Thi thử TOEIC chuẩn ETS',
          icon: Award,
          match: (pathname) => pathname.startsWith('/toeic'),
          onboardingId: 'toeic',
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
