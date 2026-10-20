import type { MenuProps } from 'antd';
import {
  ApartmentOutlined,
  AudioOutlined,
  BookOutlined,
  CompassOutlined,
  CrownOutlined,
  CustomerServiceOutlined,
  DashboardOutlined,
  FileProtectOutlined,
  FireOutlined,
  FontColorsOutlined,
  ReadOutlined,
  RobotOutlined,
  TeamOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { UserRole } from '@/types/enums/UserRole';

/**
 * Computes role-specific sidebar navigation items based on authenticated user RBAC permissions.
 * Prevents unauthorized or irrelevant routes from appearing in students' or teachers' menus.
 */
export const getSidebarMenuItems = (role?: UserRole): MenuProps['items'] => {
  const isTeacher = role === UserRole.Teacher || role === UserRole.Admin;
  const isAdmin = role === UserRole.Admin;

  const items: MenuProps['items'] = [];

  // Admin exclusive module placed on top for quick management access
  if (isAdmin) {
    items.push({
      key: '/admin',
      icon: <DashboardOutlined />,
      label: 'Quản trị Hệ thống',
    });
    items.push({
      type: 'divider',
    });
  }

  // Teacher workspace module
  if (isTeacher) {
    items.push({
      key: '/teacher',
      icon: <TeamOutlined />,
      label: 'Cổng Giáo viên (B2B)',
    });
    items.push({
      type: 'divider',
    });
  }

  // Core learning modules available for Students, Teachers, and Admins
  items.push(
    {
      key: '/app',
      icon: <CompassOutlined />,
      label: 'Lộ trình Adaptive',
    },
    {
      key: '/app/vocab',
      icon: <BookOutlined />,
      label: 'Từ vựng FSRS v5',
    },
    {
      key: '/app/grammar',
      icon: <FontColorsOutlined />,
      label: 'Ngữ pháp 4 Bước',
    },
    {
      key: '/app/reading',
      icon: <ReadOutlined />,
      label: 'Đọc hiểu Song ngữ',
    },
    {
      key: '/app/dictionary',
      icon: <ApartmentOutlined />,
      label: 'Từ điển Học thuật',
    },
    {
      key: '/app/toeic',
      icon: <CustomerServiceOutlined />,
      label: 'Luyện thi TOEIC 990',
    },
    {
      key: '/app/vstep',
      icon: <FileProtectOutlined />,
      label: 'Phòng thi VSTEP 4 Kỹ năng',
    },
    {
      key: '/app/ai-coach',
      icon: <RobotOutlined />,
      label: 'Trợ lý AI Socratic',
    },
    {
      key: '/app/speaking-foundation',
      icon: <AudioOutlined />,
      label: 'Phát âm & Nền tảng Nói',
    },
    {
      key: '/app/challenges',
      icon: <FireOutlined />,
      label: 'Thử thách Cam kết',
    },
    {
      key: '/app/social',
      icon: <TrophyOutlined />,
      label: 'Nhóm học & Xếp hạng',
    },
    {
      key: '/app/billing',
      icon: <CrownOutlined />,
      label: 'Gói Pro & Thanh toán',
    }
  );

  return items;
};
