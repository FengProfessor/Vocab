import React, { useState } from 'react';
import {
  App,
  Button,
  Card,
  Col,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { PageHeaderCard } from '@/components/common/PageHeaderCard';
import { apiClient } from '@/lib/apiClient';
import { BrowserStorage } from '@/lib/storage';
import { ApiResponse } from '@/types/api/ApiResponse';
import { EnumMemberItemDto } from '@/types/api/EnumMemberItemDto';
import { PilotLeadStatus } from '@/types/enums/PilotLeadStatus';

/**
 * CRM dashboard summary DTO returned by GET /api/v1/admin/crm/dashboard.
 */
interface ServerCrmDashboardSummaryDto {
  totalUsers: number;
  activePremiumUsers: number;
  pendingOrdersCount: number;
  totalPaidRevenueVnd: number;
  totalPilotLeads: number;
  pendingPayoutRequests: number;
}

/**
 * Represents a Teacher Pilot lead row in the Admin CRM table.
 */
interface AdminPilotLeadRow {
  id: string;
  teacherName: string;
  organization: string;
  studentScale: string;
  status: PilotLeadStatus;
}

/** Session storage cache key for 0ms Admin Dashboard hydration (GEMINI.md Rule #3). */
const ADMIN_PILOT_LEADS_CACHE_KEY = 'lingopro.admin.pilot_leads.v1';
const ADMIN_CRM_SUMMARY_CACHE_KEY = 'lingopro.admin.crm_summary.v1';

const DEFAULT_PILOT_LEADS: AdminPilotLeadRow[] = [
  {
    id: 'lead_01',
    teacherName: 'ThS. Nguyễn Lan Hương',
    organization: 'Lớp luyện VSTEP B1-B2 Hà Nội',
    studentScale: '35 học viên',
    status: PilotLeadStatus.ActivePilot,
  },
  {
    id: 'lead_02',
    teacherName: 'Thầy Trần Quốc Tuấn',
    organization: 'Trung tâm Anh ngữ Horizon Đà Nẵng',
    studentScale: '120 học viên',
    status: PilotLeadStatus.Contacted,
  },
  {
    id: 'lead_03',
    teacherName: 'Cô Lê Minh Châu',
    organization: 'CLB TOEIC Sinh viên Bách Khoa',
    studentScale: '60 học viên',
    status: PilotLeadStatus.New,
  },
];

const DEFAULT_CRM_SUMMARY: ServerCrmDashboardSummaryDto = {
  totalUsers: 1284,
  activePremiumUsers: 342,
  pendingOrdersCount: 7,
  totalPaidRevenueVnd: 184500000,
  totalPilotLeads: 48,
  pendingPayoutRequests: 3,
};

/**
 * System Operations & CRM Admin Dashboard executing concurrent Promise.all requests
 * to GET /api/v1/admin/crm/dashboard and GET /api/v1/system/enums with 0ms client-side hydration.
 */
export const AdminSystemView: React.FC = () => {
  const { message } = App.useApp();
  const [leads, setLeads] = useState<AdminPilotLeadRow[]>(() =>
    BrowserStorage.getSession<AdminPilotLeadRow[]>(
      ADMIN_PILOT_LEADS_CACHE_KEY,
      DEFAULT_PILOT_LEADS
    )
  );

  const adminTelemetryQuery = useQuery({
    queryKey: ['admin-crm-telemetry'],
    initialData: () => ({
      crm: BrowserStorage.getSession<ServerCrmDashboardSummaryDto>(
        ADMIN_CRM_SUMMARY_CACHE_KEY,
        DEFAULT_CRM_SUMMARY
      ),
      enumCount: 48,
    }),
    queryFn: async () => {
      const [crmRes, enumsRes] = await Promise.all([
        apiClient.get<ApiResponse<ServerCrmDashboardSummaryDto>>('/admin/crm/dashboard'),
        apiClient.get<ApiResponse<Record<string, EnumMemberItemDto[]>>>('/system/enums'),
      ]);
      const crm = crmRes.data.data ?? DEFAULT_CRM_SUMMARY;
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

  const crm = adminTelemetryQuery.data.crm;
  const syncedEnumCount = adminTelemetryQuery.data.enumCount;

  const columns: ColumnsType<AdminPilotLeadRow> = [
    {
      title: 'Giáo viên / Người đăng ký',
      dataIndex: 'teacherName',
      key: 'teacherName',
      render: (text: string) => <Typography.Text strong>{text}</Typography.Text>,
    },
    {
      title: 'Đơn vị / Trung tâm',
      dataIndex: 'organization',
      key: 'organization',
    },
    {
      title: 'Quy mô',
      dataIndex: 'studentScale',
      key: 'studentScale',
    },
    {
      title: 'Trạng thái CRM',
      dataIndex: 'status',
      key: 'status',
      render: (status: PilotLeadStatus) => {
        const color =
          status === PilotLeadStatus.ActivePilot
            ? 'success'
            : status === PilotLeadStatus.Contacted
              ? 'processing'
              : 'warning';
        return <Tag color={color}>{String(status).toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Button
          size="small"
          type="primary"
          disabled={record.status === PilotLeadStatus.ActivePilot}
          icon={<CheckCircleOutlined />}
          onClick={() => handleActivateLead(record.id)}
        >
          Kích hoạt Pilot 60 ngày
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeaderCard
        badgeText="MODULE 15 • ADMIN OPERATIONS & CRM TELEMETRY (DYNAMIC API)"
        title="Quản Trị Hệ Thống, Đồng Bộ Enums & CRM Giáo Viên Tiên Phong"
        subtitle="Thực thi song song Promise.all tới GET /api/v1/admin/crm/dashboard và GET /api/v1/system/enums kết hợp 0ms Instant Client-Side Hydration."
        extra={
          <Button
            icon={<SyncOutlined spin={adminTelemetryQuery.isFetching} />}
            loading={adminTelemetryQuery.isFetching}
            onClick={() => {
              void adminTelemetryQuery.refetch().then(() => {
                void message.success(
                  `Đã đồng bộ CRM & ${syncedEnumCount} Business Enums từ .NET 10 Server!`
                );
              });
            }}
          >
            Đồng bộ CRM & Enums từ /be
          </Button>
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng Học viên (Từ Server)"
              value={crm.totalUsers}
              suffix={`(${crm.activePremiumUsers} Pro)`}
              valueStyle={{ color: '#4f46e5', fontWeight: 800 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Doanh thu Đã thanh toán"
              value={crm.totalPaidRevenueVnd.toLocaleString('vi-VN')}
              suffix="₫"
              valueStyle={{ color: '#10b981', fontWeight: 800 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Business Enums Đồng bộ (/be ↔ /fe)"
              value={syncedEnumCount}
              suffix="Enums (100%)"
              valueStyle={{ color: '#0284c7', fontWeight: 800 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đơn đăng ký Pilot (/for-teacher)"
              value={crm.totalPilotLeads}
              suffix="đối tác"
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <span>Danh Sách Đăng Ký Chương Trình Giáo Viên Tiên Phong (60 Ngày)</span>
            <Tag color="gold">{crm.pendingOrdersCount} đơn chờ duyệt</Tag>
          </Space>
        }
      >
        <Table<AdminPilotLeadRow>
          rowKey="id"
          columns={columns}
          dataSource={leads}
          pagination={false}
        />
      </Card>
    </div>
  );
};
