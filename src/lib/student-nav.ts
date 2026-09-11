export type StudentNavItem = {
  href: string;
  label: string;
  emoji: string;
  color: string;
  tile: string;
  /** true = ẩn khỏi mobile drawer (vì trùng bottom 5-tab nav) */
  footerDup?: boolean;
  /** hiện khi học sinh đã tham gia lớp */
  requiresClass?: boolean;
  match: (pathname: string) => boolean;
  onboardingId?: string;
};

export function buildStudentNavItems(_opts?: {
  classroomId?: string | null;
  hasClass?: boolean;
}): StudentNavItem[] {
  const items: StudentNavItem[] = [
    {
      href: '/student',
      label: 'Dashboard',
      emoji: '🏠',
      color: '#4f46e5',
      tile: '#eef0ff',
      match: (pathname) => pathname === '/student',
      footerDup: true,
    },
    {
      href: '/journey',
      label: 'Lộ trình',
      emoji: '🗺️',
      color: '#059669',
      tile: '#dcfce7',
      match: (pathname) => pathname.startsWith('/journey'),
      footerDup: true,
      onboardingId: 'journey',
    },
    {
      href: '/review',
      label: 'Ôn tập',
      emoji: '📚',
      color: '#6366f1',
      tile: '#eef0ff',
      match: (pathname) =>
        pathname.startsWith('/review') ||
        pathname.startsWith('/flashcard') ||
        pathname.startsWith('/writing') ||
        pathname.startsWith('/quiz'),
      footerDup: true,
      onboardingId: 'nav-review',
    },
    {
      href: '/practice',
      label: 'Sử dụng từ',
      emoji: '✍️',
      color: '#7c3aed',
      tile: '#f3e8ff',
      match: (pathname) => pathname.startsWith('/practice'),
      onboardingId: 'practice-use-words',
    },
    {
      href: '/grammar/learn',
      label: 'Ngữ pháp',
      emoji: '🎓',
      color: '#8b5cf6',
      tile: '#f1ecff',
      match: (pathname) => pathname.startsWith('/grammar'),
      onboardingId: 'grammar',
    },
    {
      href: '/library',
      label: 'Thư viện từ vựng',
      emoji: '📦',
      color: '#10b981',
      tile: '#e1f7ee',
      match: (pathname) => pathname.startsWith('/library'),
      footerDup: true,
      onboardingId: 'library',
    },
    {
      href: '/dictionary',
      label: 'Tra từ điển',
      emoji: '🔍',
      color: '#06b6d4',
      tile: '#defafd',
      match: (pathname) => pathname.startsWith('/dictionary'),
      footerDup: true,
      onboardingId: 'dictionary',
    },
    {
      href: '/import',
      label: 'Nhập danh sách riêng',
      emoji: '➕',
      color: '#64748b',
      tile: '#eef1f5',
      match: (pathname) => pathname.startsWith('/import'),
      onboardingId: 'import',
    },
  ];

  return items;
}
