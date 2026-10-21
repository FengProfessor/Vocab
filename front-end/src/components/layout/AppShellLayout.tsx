import React, { useMemo, useState } from 'react';
import { Layout, Menu, Typography } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import styles from '@/components/layout/AppShellLayout.module.css';
import { getSidebarMenuItems } from '@/components/layout/getSidebarMenuItems';
import { TopHeaderBar } from '@/components/layout/TopHeaderBar';
import { useAuthStore } from '@/stores/useAuthStore';

/**
 * Application shell: collapsible sidebar whose entries depend on the server-assigned role,
 * the top bar and the routed content area.
 */
export const AppShellLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();
  const role = useAuthStore((state) => state.user?.role);

  const menuItems = useMemo(() => getSidebarMenuItems(role), [role]);

  return (
    <Layout className={styles.shell}>
      <Layout.Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={255}
        className={styles.sider}
      >
        <div
          className={`${styles.brand} ${collapsed ? styles.brandCollapsed : ''}`}
          onClick={() => navigate('/app')}
        >
          <div className={styles.logo}>L</div>
          {!collapsed && (
            <div className={styles.brandText}>
              <Typography.Text strong className={styles.brandName}>
                LingoPro
              </Typography.Text>
              <Typography.Text className={styles.brandTagline}>VSTEP & TOEIC Mastery</Typography.Text>
            </div>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          className={styles.menu}
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Layout.Sider>

      <Layout>
        <TopHeaderBar />
        <Layout.Content className={styles.content}>
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  );
};
