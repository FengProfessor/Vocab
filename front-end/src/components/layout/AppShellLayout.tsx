import React, { useState } from 'react';
import { Layout, Menu, Typography } from 'antd';
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
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { TopHeaderBar } from '@/components/layout/TopHeaderBar';

/**
 * Primary application shell layout with collapsible sidebar navigation covering all LingoPro modules.
 */
export const AppShellLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems: MenuProps['items'] = [
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
    },
    {
      type: 'divider',
    },
    {
      key: '/teacher',
      icon: <TeamOutlined />,
      label: 'Cổng Giáo viên (B2B)',
    },
    {
      key: '/admin',
      icon: <DashboardOutlined />,
      label: 'Quản trị Hệ thống',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        width={255}
        style={{
          background: '#0f172a',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 20px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/app')}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #4f46e5 0%, #10b981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            L
          </div>
          {!collapsed && (
            <div style={{ marginLeft: 12 }}>
              <Typography.Text strong style={{ color: '#fff', fontSize: 16, display: 'block' }}>
                LingoPro
              </Typography.Text>
              <Typography.Text style={{ color: '#94a3b8', fontSize: 11 }}>
                VSTEP & TOEIC Mastery
              </Typography.Text>
            </div>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ background: '#0f172a', borderRight: 0, padding: '8px' }}
        />
      </Layout.Sider>

      <Layout>
        <TopHeaderBar />
        <Layout.Content
          style={{
            padding: '24px',
            maxWidth: 1360,
            width: '100%',
            margin: '0 auto',
          }}
        >
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  );
};
