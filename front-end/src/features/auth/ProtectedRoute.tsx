import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FullScreenStatus } from '@/components/common/FullScreenStatus';
import { useAuthStore } from '@/stores/useAuthStore';

/**
 * Server-first authentication route guard.
 * Verifies the active session with the .NET 10 backend (GET /api/v1/auth/profile or OAuth token exchange).
 * If unauthenticated, redirects to the SPA login page (/auth/login) with a safe return URL.
 */
export const ProtectedRoute: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, isCheckingSession, hasVerifiedServer, verifyServerSession } = useAuthStore();

  const navigate = useNavigate();

  useEffect(() => {
    void verifyServerSession();
  }, [verifyServerSession]);

  useEffect(() => {
    if (hasVerifiedServer && !isCheckingSession && !isAuthenticated) {
      const normalizedPath =
        !location.pathname || location.pathname === '/' ? '/app' : location.pathname;
      const returnUrl = `${normalizedPath}${location.search}`;
      navigate(`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`, { replace: true });
    }
  }, [hasVerifiedServer, isCheckingSession, isAuthenticated, location.pathname, location.search, navigate]);

  if (!isAuthenticated && (!hasVerifiedServer || isCheckingSession)) {
    return (
      <FullScreenStatus
        message="Đang xác thực phiên đăng nhập..."
        hint="Kiểm tra phiên đăng nhập và đồng bộ hồ sơ học tập từ máy chủ."
      />
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <Outlet />;
};
