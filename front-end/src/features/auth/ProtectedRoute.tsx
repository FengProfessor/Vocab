import React, { useEffect } from 'react';
import { Card, Spin, Typography } from 'antd';
import { Outlet, useLocation } from 'react-router-dom';
import { ServerAuthLinks } from '@/lib/auth/ServerAuthLinks';
import { useAuthStore } from '@/stores/useAuthStore';

/**
 * Server-first authentication route guard.
 * Verifies the active session with the .NET 10 backend (GET /api/v1/auth/profile or OAuth token exchange).
 * If unauthenticated, exits the React SPA and redirects back to the server login page (/auth/login).
 */
export const ProtectedRoute: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, isCheckingSession, hasVerifiedServer, verifyServerSession } = useAuthStore();

  useEffect(() => {
    void verifyServerSession();
  }, [verifyServerSession]);

  useEffect(() => {
    if (hasVerifiedServer && !isCheckingSession && !isAuthenticated) {
      const normalizedPath =
        !location.pathname || location.pathname === '/' ? '/app' : location.pathname;
      const returnUrl = `${normalizedPath}${location.search}`;
      window.location.replace(ServerAuthLinks.loginUrl(returnUrl));
    }
  }, [hasVerifiedServer, isCheckingSession, isAuthenticated, location.pathname, location.search]);

  if (!isAuthenticated && (!hasVerifiedServer || isCheckingSession)) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          padding: 24,
        }}
      >
        <Card style={{ maxWidth: 420, width: '100%', textAlign: 'center', borderRadius: 16 }}>
          <Spin size="large" />
          <Typography.Title level={5} style={{ marginTop: 16, marginBottom: 4 }}>
            Đang xác thực phiên đăng nhập với Server (.NET 10)...
          </Typography.Title>
          <Typography.Text type="secondary">
            Kiểm tra phiên đăng nhập (HttpOnly cookie) & đồng bộ hồ sơ học tập từ máy chủ
          </Typography.Text>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <Outlet />;
};
