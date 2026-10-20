import React from 'react';
import { Card, Col, Row, Skeleton, Statistic, theme } from 'antd';
import {
  BankOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { AdminCrmDashboardSummaryDto } from '@/types/admin/AdminCrmDashboardSummaryDto';

interface AdminKpiMetricsProps {
  /** Aggregated CRM dashboard data. */
  crm: AdminCrmDashboardSummaryDto;
  /** Number of synced business enums between backend and frontend. */
  syncedEnumCount: number;
  /** Whether metrics are currently loading or refetching from the API. */
  isLoading?: boolean;
}

/**
 * Top KPI metric tiles displaying user count, revenue, synced business enums, and pilot lead volume.
 * Supports professional Skeleton reload states.
 */
export const AdminKpiMetrics: React.FC<AdminKpiMetricsProps> = ({
  crm,
  syncedEnumCount,
  isLoading = false,
}) => {
  const { token } = theme.useToken();

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} lg={6}>
        <Card
          style={{
            background: token.colorBgContainer,
            borderColor: token.colorBorderSecondary,
          }}
        >
          {isLoading ? (
            <Skeleton active paragraph={{ rows: 1 }} />
          ) : (
            <Statistic
              title="Tổng Học viên Toàn sàn"
              value={crm.totalUsers}
              prefix={<TeamOutlined style={{ color: token.colorPrimary }} />}
              suffix={`(${crm.activePremiumUsers} Pro)`}
              valueStyle={{ color: token.colorPrimary, fontWeight: 800 }}
            />
          )}
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card
          style={{
            background: token.colorBgContainer,
            borderColor: token.colorBorderSecondary,
          }}
        >
          {isLoading ? (
            <Skeleton active paragraph={{ rows: 1 }} />
          ) : (
            <Statistic
              title="Doanh thu Đã thanh toán"
              value={crm.totalPaidRevenueVnd.toLocaleString('vi-VN')}
              prefix={<DollarOutlined style={{ color: token.colorSuccess }} />}
              suffix="₫"
              valueStyle={{ color: token.colorSuccess, fontWeight: 800 }}
            />
          )}
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card
          style={{
            background: token.colorBgContainer,
            borderColor: token.colorBorderSecondary,
          }}
        >
          {isLoading ? (
            <Skeleton active paragraph={{ rows: 1 }} />
          ) : (
            <Statistic
              title="Business Enums Đồng bộ (/be ↔ /fe)"
              value={syncedEnumCount}
              prefix={<CheckCircleOutlined style={{ color: token.colorInfo }} />}
              suffix="Enums (100%)"
              valueStyle={{ color: token.colorInfo, fontWeight: 800 }}
            />
          )}
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card
          style={{
            background: token.colorBgContainer,
            borderColor: token.colorBorderSecondary,
          }}
        >
          {isLoading ? (
            <Skeleton active paragraph={{ rows: 1 }} />
          ) : (
            <Statistic
              title="Đơn đăng ký Pilot (/for-teacher)"
              value={crm.totalPilotLeads}
              prefix={<BankOutlined style={{ color: token.colorWarning }} />}
              suffix="đối tác"
              valueStyle={{ color: token.colorWarning, fontWeight: 800 }}
            />
          )}
        </Card>
      </Col>
    </Row>
  );
};
