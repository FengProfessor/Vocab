import React from 'react';
import { Button, Card, Result } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';
import styles from '@/features/auth/components/RoleRouteGuard.module.css';
import { RoleRouteGuardProps } from '@/features/auth/types/RoleRouteGuardProps';
import { useAuthStore } from '@/stores/useAuthStore';

/**
 * Role-based route guard (RBAC). The role comes only from the server profile and can never be switched in the UI;
 * unauthorized users see a 403 page. The API enforces the same policies (RequireTeacher / RequireAdmin).
 */
export const RoleRouteGuard: React.FC<RoleRouteGuardProps> = ({ allowedRoles }) => {
  const navigate = useNavigate();
  const role = useAuthStore((state) => state.user?.role);

  if (!role || !allowedRoles.includes(role)) {
    return (
      <Card className={styles.card}>
        <Result
          status="403"
          title="Bạn không có quyền truy cập khu vực này"
          subTitle="Tài khoản hiện tại không đủ quyền. Vui lòng liên hệ quản trị viên nếu bạn cần truy cập."
          extra={
            <Button type="primary" onClick={() => navigate('/app')}>
              Quay về Lộ trình học
            </Button>
          }
        />
      </Card>
    );
  }

  return <Outlet />;
};
