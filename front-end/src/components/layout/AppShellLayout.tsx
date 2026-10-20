import React, { useState, useMemo } from 'react';
import { Layout, Menu, Typography, theme } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getSidebarMenuItems } from '@/components/layout/getSidebarMenuItems';
import { TopHeaderBar } from '@/components/layout/TopHeaderBar';
import { useAuthStore } from '@/stores/useAuthStore';

/**
 * Primary application shell layout with collapsible sidebar navigation dynamically
 * filtered by the user's RBAC role (Student, Teacher, Admin).
 */
export const AppShellLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const { user } = useAuthStore();

  const menuItems = useMemo(() => {
    return getSidebarMenuItems(user?.role);
  }, [user?.role]);

  return (
    <Layout style={{ minHeight: '100vh', background: token.colorBgLayout }}>
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

      <Layout style={{ background: token.colorBgLayout }}>
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
