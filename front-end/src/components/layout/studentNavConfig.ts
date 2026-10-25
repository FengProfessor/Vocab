/**
 * Canonical Student Navigation Configuration ported from /src/lib/student-nav.ts.
 * Supports both original /src paths (/journey, /review, /library, etc.) and /app/* paths.
 */

export interface StudentNavItem {
  href: string;
  label: string;
  icon: string;
  matchPrefixes: string[];
  badge?: number;
}

export interface StudentNavSection {
  title: string;
  items: StudentNavItem[];
}

export const STUDENT_SIDEBAR_SECTIONS: StudentNavSection[] = [
  {
    title: 'Học & Lộ trình',
    items: [
      {
        href: '/journey',
        label: 'Lộ trình của tôi',
        icon: '🗺️',
        matchPrefixes: ['/journey', '/app/journey', '/student', '/app/dashboard'],
      },
      {
        href: '/review',
        label: 'Ôn tập hôm nay',
        icon: '🔄',
        matchPrefixes: ['/review', '/app/study'],
      },
    ],
  },
  {
    title: 'Luyện tập & Khảo thí',
    items: [
      {
        href: '/practice',
        label: 'Luyện tập tổng hợp',
        icon: '🏋️',
        matchPrefixes: [
          '/practice',
          '/app/practice',
          '/flashcard',
          '/quiz',
          '/writing',
          '/grammar',
          '/app/grammar',
          '/student/speaking',
          '/app/speaking',
        ],
      },
      {
        href: '/toeic',
        label: 'Thi thử TOEIC',
        icon: '🎯',
        matchPrefixes: ['/toeic', '/app/exam'],
      },
      {
        href: '/vstep',
        label: 'Thi thử VSTEP',
        icon: '🎓',
        matchPrefixes: ['/vstep'],
      },
      {
        href: '/challenge',
        label: 'Thử thách',
        icon: '🔥',
        matchPrefixes: ['/challenge', '/app/challenges'],
      },
    ],
  },
  {
    title: 'Kho & Tra cứu',
    items: [
      {
        href: '/dictionary',
        label: 'Từ điển Anh-Việt',
        icon: '📖',
        matchPrefixes: ['/dictionary', '/app/dictionary'],
      },
      {
        href: '/library',
        label: 'Kho từ của tôi',
        icon: '📦',
        matchPrefixes: ['/library', '/import', '/app/deck'],
      },
    ],
  },
];

export interface MobileTabItem {
  href: string;
  label: string;
  icon: string;
  isCenterCta?: boolean;
  matchPrefixes: string[];
}

export const MOBILE_BOTTOM_TABS: MobileTabItem[] = [
  {
    href: '/student',
    label: 'Home',
    icon: '🏠',
    matchPrefixes: ['/student', '/app/dashboard'],
  },
  {
    href: '/library',
    label: 'Kho',
    icon: '📦',
    matchPrefixes: ['/library', '/import', '/app/deck'],
  },
  {
    href: '/journey',
    label: 'Lộ trình',
    icon: '🗺️',
    isCenterCta: true,
    matchPrefixes: ['/journey', '/app/journey', '/review', '/app/study'],
  },
  {
    href: '/dictionary',
    label: 'Tra từ',
    icon: '🔍',
    matchPrefixes: ['/dictionary', '/app/dictionary'],
  },
  {
    href: '/student/profile',
    label: 'Profile',
    icon: '👤',
    matchPrefixes: ['/student/profile', '/app/profile', '/student/leaderboard', '/app/leaderboard'],
  },
];

export function isNavItemActive(pathname: string, matchPrefixes: string[]): boolean {
  return matchPrefixes.some((prefix) => {
    if (prefix === '/student') {
      return pathname === '/student' || pathname === '/app/dashboard';
    }
    return pathname === prefix || pathname.startsWith(prefix + '/');
  });
}

export interface RouteHeaderMeta {
  title: string;
  subtitle?: string;
}

export function getRouteHeaderMeta(pathname: string, userName?: string): RouteHeaderMeta {
  const display = userName || 'Học viên';
  if (pathname === '/student' || pathname === '/app/dashboard') {
    return {
      title: `Xin chào, ${display} 👋`,
      subtitle: 'Hôm nay bạn muốn chinh phục mục tiêu nào?',
    };
  }
  if (pathname.startsWith('/journey') || pathname.startsWith('/app/journey')) {
    return {
      title: 'Lộ trình học tập cá nhân hóa',
      subtitle: 'Theo dõi tiến độ từng chặng và hoàn thành nhiệm vụ hàng ngày',
    };
  }
  if (pathname.startsWith('/review') || pathname.startsWith('/app/study')) {
    return {
      title: 'Ôn tập FSRS hôm nay',
      subtitle: 'Thuật toán lặp lại ngắt quãng tối ưu trí nhớ dài hạn',
    };
  }
  if (
    pathname.startsWith('/practice') ||
    pathname.startsWith('/app/practice') ||
    pathname.startsWith('/flashcard') ||
    pathname.startsWith('/quiz') ||
    pathname.startsWith('/writing')
  ) {
    return {
      title: 'Luyện tập tổng hợp',
      subtitle: 'Flashcard, Trắc nghiệm, Điền từ, Chính tả và Viết câu AI',
    };
  }
  if (pathname.startsWith('/grammar') || pathname.startsWith('/app/grammar')) {
    return {
      title: 'Ngữ pháp tiếng Anh ứng dụng',
      subtitle: 'Lý thuyết cô đọng kèm bài tập thực hành phân tầng',
    };
  }
  if (pathname.startsWith('/student/speaking') || pathname.startsWith('/app/speaking')) {
    return {
      title: 'Phòng luyện phát âm & giao tiếp AI',
      subtitle: 'Chấm điểm phát âm chuẩn IPA và phản xạ hội thoại thời gian thực',
    };
  }
  if (pathname.startsWith('/toeic') || pathname.startsWith('/vstep') || pathname.startsWith('/app/exam')) {
    return {
      title: pathname.startsWith('/vstep') ? 'Phòng thi thử VSTEP chuẩn B1-C1' : 'Phòng thi thử TOEIC & VSTEP',
      subtitle: 'Mô phỏng áp lực phòng thi thật và phân tích điểm yếu tự động',
    };
  }
  if (pathname.startsWith('/challenge') || pathname.startsWith('/app/challenges')) {
    return {
      title: 'Thử thách & Đấu trường từ vựng',
      subtitle: 'Bứt phá giới hạn bản thân và nhận huy hiệu danh giá',
    };
  }
  if (pathname.startsWith('/dictionary') || pathname.startsWith('/app/dictionary')) {
    return {
      title: 'Từ điển Anh - Việt thông minh',
      subtitle: 'Tra cứu IPA, nghĩa ngữ cảnh, Collocations và lưu 1-chạm vào kho FSRS',
    };
  }
  if (pathname.startsWith('/library') || pathname.startsWith('/import') || pathname.startsWith('/app/deck')) {
    return {
      title: 'Kho từ vựng của tôi',
      subtitle: 'Quản lý bộ từ cá nhân, nhập hàng loạt và theo dõi trạng thái ghi nhớ',
    };
  }
  if (pathname.startsWith('/group') || pathname.startsWith('/app/classrooms')) {
    return {
      title: 'Lớp học & Nhóm học tập',
      subtitle: 'Nhận bài tập từ giáo viên và thi đua cùng bạn bè',
    };
  }
  if (pathname.startsWith('/upgrade') || pathname.startsWith('/app/billing')) {
    return {
      title: 'Nâng cấp tài khoản LingoPro',
      subtitle: 'Mở khóa không giới hạn kho từ vựng FSRS và trợ lý AI toàn diện',
    };
  }
  if (pathname.startsWith('/student/leaderboard') || pathname.startsWith('/app/leaderboard')) {
    return {
      title: 'Bảng xếp hạng học viên',
      subtitle: 'Vinh danh những chiến binh chăm chỉ nhất tuần và tháng',
    };
  }
  if (pathname.startsWith('/student/profile') || pathname.startsWith('/app/profile')) {
    return {
      title: 'Hồ sơ & Thống kê học tập',
      subtitle: 'Theo dõi biểu đồ tiến bộ, chuỗi ngày học và thiết lập mục tiêu',
    };
  }
  if (pathname.startsWith('/app/notifications')) {
    return {
      title: 'Thông báo của bạn',
      subtitle: 'Cập nhật lịch ôn tập, bài tập mới từ giáo viên và sự kiện',
    };
  }
  return {
    title: 'LingoPro Workspace',
    subtitle: 'Hệ thống học từ vựng thông minh FSRS',
  };
}
