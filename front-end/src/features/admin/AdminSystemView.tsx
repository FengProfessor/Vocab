import React from 'react';
import { Alert, App, Button } from '@/components/ui/Primitives';
import { SyncOutlined } from '@/components/ui/Icons';
import { PageHeaderCard } from '@/components/common/PageHeaderCard';
import { AdminKpiMetrics } from '@/features/admin/components/AdminKpiMetrics';
import { AdminPilotLeadsTable } from '@/features/admin/components/AdminPilotLeadsTable';
import { useAdminTelemetry } from '@/hooks/admin/useAdminTelemetry';

/**
 * Admin CRM dashboard: counters from GET /admin/crm/dashboard and enum groups from GET /system/enums
 * (loaded concurrently), hydrated instantly from session storage.
 */
export const AdminSystemView: React.FC = () => {
  const { message } = App.useApp();
  const telemetryQuery = useAdminTelemetry();

  const handleRefresh = (): void => {
    void telemetryQuery.refetch().then((result) => {
      if (result.data) {
        void message.success('Đã đồng bộ số liệu CRM từ máy chủ.');
      }
    });
  };

  return (
    <div>
      <PageHeaderCard
        badgeText="MODULE 15 • ADMIN OPERATIONS & CRM"
        title="Quản Trị Hệ Thống & CRM Giáo Viên Tiên Phong"
        subtitle="Số liệu vận hành được tải song song từ máy chủ và làm mới nền."
        extra={
          <Button
            icon={<SyncOutlined spin={telemetryQuery.isFetching} />}
            loading={telemetryQuery.isFetching}
            onClick={handleRefresh}
          >
            Đồng bộ CRM
          </Button>
        }
      />

      {telemetryQuery.isError && (
        <Alert
          className="lp-mb-20"
          type="error"
          showIcon
          message="Không tải được số liệu CRM"
          description="Kiểm tra quyền Admin hoặc kết nối tới máy chủ rồi thử đồng bộ lại."
        />
      )}

      <AdminKpiMetrics telemetry={telemetryQuery.data} isLoading={telemetryQuery.isLoading} />

      <AdminPilotLeadsTable
        leads={[]}
        pendingCount={telemetryQuery.data?.crm.pendingOrdersCount ?? 0}
        isLoading={telemetryQuery.isLoading}
      />
    </div>
  );
};
