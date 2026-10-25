import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Compass,
  RotateCcw,
  BookA,
  Zap,
  Award,
  Library,
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
