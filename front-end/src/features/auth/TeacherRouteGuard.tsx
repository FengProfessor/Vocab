import React from 'react';
import { Button, Card, Result, Space } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { UserRole } from '@/types/enums/UserRole';

/**
 * Role-based route guard enforcing UserRole.Teacher or UserRole.Admin access for B2B teacher portals.
 */
export const TeacherRouteGuard: React.FC = () => {
  const navigate = useNavigate();
  const { user, switchRole } = useAuthStore();

  const hasTeacherAccess = user?.role === UserRole.Teacher || user?.role === UserRole.Admin;

  if (!hasTeacherAccess) {
    return (
      <Card style={{ borderRadius: 16, marginTop: 24 }}>
        <Result
          status="403"
          title="Khu vực dành riêng cho Giáo viên & Quản trị viên"
          subTitle="Tài khoản hiện tại đang ở chế độ Học viên (Student). Bạn có thể chuyển nhanh sang vai trò Giáo viên trên thanh công cụ để kiểm thử B2B Portal."
          extra={
            <Space>
              <Button
                type="primary"
                onClick={() => {
                  switchRole(UserRole.Teacher);
                }}
              >
                Kích hoạt quyền Giáo viên (Teacher)
              </Button>
              <Button onClick={() => navigate('/app')}>Quay về Lộ trình Học viên</Button>
            </Space>
          }
        />
      </Card>
    );
  }

  return <Outlet />;
};
