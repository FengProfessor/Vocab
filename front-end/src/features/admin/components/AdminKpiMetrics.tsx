import React from 'react';
import { Card, Col, Row, Skeleton, Statistic } from '@/components/ui/Primitives';
import { ApiOutlined, BankOutlined, DollarOutlined, TeamOutlined } from '@/components/ui/Icons';
import styles from '@/features/admin/components/AdminKpiMetrics.module.css';
import { AdminKpiMetricsProps } from '@/features/admin/types/AdminKpiMetricsProps';

/**
 * Admin KPI tiles (users, paid revenue, API enum groups, pilot leads) with skeletons on first load.
 */
export const AdminKpiMetrics: React.FC<AdminKpiMetricsProps> = ({ telemetry, isLoading = false }) => {
  const crm = telemetry?.crm;
  const showSkeleton = isLoading || !crm;

  const tile = (content: React.ReactNode, key: string): React.ReactNode => (
    <Col xs={24} sm={12} lg={6} key={key}>
      <Card className={styles.card}>
        {showSkeleton ? <Skeleton active paragraph={{ rows: 1 }} /> : content}
      </Card>
    </Col>
  );

  return (
    <Row gutter={[16, 16]} className={styles.metrics}>
      {tile(
        <Statistic
          title="Tổng học viên"
          value={crm?.totalUsers}
          prefix={<TeamOutlined />}
          suffix={`(${crm?.activePremiumUsers ?? 0} Pro)`}
        />,
        'users'
      )}
      {tile(
        <Statistic
          title="Doanh thu đã thanh toán"
          value={crm?.totalPaidRevenueVnd.toLocaleString('vi-VN')}
          prefix={<DollarOutlined />}
          suffix="₫"
        />,
        'revenue'
      )}
      {tile(
        <Statistic
          title="Nhóm Enum từ máy chủ"
          value={telemetry?.enumGroupCount}
          prefix={<ApiOutlined />}
          suffix="nhóm"
        />,
        'enums'
      )}
      {tile(
        <Statistic
          title="Đơn đăng ký Pilot"
          value={crm?.totalPilotLeads}
          prefix={<BankOutlined />}
          suffix="đối tác"
        />,
        'leads'
      )}
    </Row>
  );
};
