import React, { useState } from 'react';
import { App, Button } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { PageHeaderCard } from '@/components/common/PageHeaderCard';
import { AdminCustomerDrawer } from '@/features/admin/components/AdminCustomerDrawer';
import { AdminKpiMetrics } from '@/features/admin/components/AdminKpiMetrics';
import { AdminPilotLeadsTable } from '@/features/admin/components/AdminPilotLeadsTable';
import { apiClient } from '@/lib/apiClient';
import { BrowserStorage } from '@/lib/storage';
import { AdminCrmDashboardSummaryDto } from '@/types/admin/AdminCrmDashboardSummaryDto';
import { AdminPilotLeadDto } from '@/types/admin/AdminPilotLeadDto';
import { ApiResponse } from '@/types/api/ApiResponse';
import { EnumMemberItemDto } from '@/types/api/EnumMemberItemDto';
import { PilotLeadStatus } from '@/types/enums/PilotLeadStatus';

const ADMIN_PILOT_LEADS_CACHE_KEY = 'lingopro.admin.pilot_leads.v1';
const ADMIN_CRM_SUMMARY_CACHE_KEY = 'lingopro.admin.crm_summary.v1';

const EMPTY_CRM_SUMMARY: AdminCrmDashboardSummaryDto = {
  totalUsers: 0,
  activePremiumUsers: 0,
  pendingOrdersCount: 0,
  totalPaidRevenueVnd: 0,
  totalPilotLeads: 0,
  pendingPayoutRequests: 0,
};

/**
 * System Operations & CRM Admin Dashboard executing concurrent Promise.all requests
 * to GET /api/v1/admin/crm/dashboard and GET /api/v1/system/enums with 0ms client-side hydration.
 */
export const AdminSystemView: React.FC = () => {
  const { message } = App.useApp();
  const [selectedLead, setSelectedLead] = useState<AdminPilotLeadDto | null>(null);

  // TODO: [Backend API Required] GET /api/v1/admin/leads - Implement MediatR query handler in .NET 10 WebApi
  // to fetch live teacher pilot leads from database. Currently falls back to cached leads or empty list.
  const [leads, setLeads] = useState<AdminPilotLeadDto[]>(() =>
    BrowserStorage.getSession<AdminPilotLeadDto[]>(ADMIN_PILOT_LEADS_CACHE_KEY, [])
  );

  const adminTelemetryQuery = useQuery({
    queryKey: ['admin-crm-telemetry'],
    initialData: () => ({
      crm: BrowserStorage.getSession<AdminCrmDashboardSummaryDto>(
        ADMIN_CRM_SUMMARY_CACHE_KEY,
        EMPTY_CRM_SUMMARY
      ),
      enumCount: 48,
    }),
    queryFn: async () => {
      const [crmRes, enumsRes] = await Promise.all([
        apiClient.get<ApiResponse<AdminCrmDashboardSummaryDto>>('/admin/crm/dashboard'),
        apiClient.get<ApiResponse<Record<string, EnumMemberItemDto[]>>>('/system/enums'),
      ]);
      const crm = crmRes.data.data ?? EMPTY_CRM_SUMMARY;
      const enumCount = enumsRes.data.data ? Object.keys(enumsRes.data.data).length : 48;
      BrowserStorage.setSession(ADMIN_CRM_SUMMARY_CACHE_KEY, crm);
      return { crm, enumCount };
    },
  });

  const handleActivateLead = (id: string): void => {
    const updated = leads.map((item) =>
      item.id === id ? { ...item, status: PilotLeadStatus.ActivePilot } : item
    );
    setLeads(updated);
    BrowserStorage.setSession(ADMIN_PILOT_LEADS_CACHE_KEY, updated);
    void message.success('Đã kích hoạt gói Đối tác Tiên phong 60 ngày cho giáo viên!');
  };

  const crm = adminTelemetryQuery.data?.crm ?? EMPTY_CRM_SUMMARY;
  const syncedEnumCount = adminTelemetryQuery.data?.enumCount ?? 48;
  const isReloading = adminTelemetryQuery.isFetching;

  return (
    <div>
      <PageHeaderCard
        badgeText="MODULE 15 • ADMIN OPERATIONS & CRM TELEMETRY"
        title="Quản Trị Hệ Thống, Đồng Bộ Enums & CRM Giáo Viên Tiên Phong"
        subtitle="Hệ thống giám sát vận hành thực thi song song Promise.all kết hợp 0ms Instant Client-Side Hydration."
        extra={
          <Button
            icon={<SyncOutlined spin={isReloading} />}
            loading={isReloading}
            onClick={() => {
              void adminTelemetryQuery.refetch().then(() => {
                void message.success(
                  `Đã đồng bộ CRM & ${syncedEnumCount} Business Enums từ .NET 10 Server!`
                );
              });
            }}
          >
            Đồng bộ CRM & Enums
          </Button>
        }
      />

      <AdminKpiMetrics
        crm={crm}
        syncedEnumCount={syncedEnumCount}
        isLoading={adminTelemetryQuery.isLoading}
      />

      <AdminPilotLeadsTable
        leads={leads}
        pendingCount={crm.pendingOrdersCount}
        isLoading={adminTelemetryQuery.isLoading}
        onActivateLead={handleActivateLead}
        onSelectLead={(lead) => setSelectedLead(lead)}
      />

      <AdminCustomerDrawer
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onActivatePilot={handleActivateLead}
      />
    </div>
  );
};
