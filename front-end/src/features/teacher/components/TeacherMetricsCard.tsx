import React from 'react';
import { Card, Col, Row, Skeleton, Statistic } from '@/components/ui/Primitives';
import { BookOutlined, TeamOutlined } from '@/components/ui/Icons';
import styles from '@/features/teacher/components/TeacherMetricsCard.module.css';
import { TeacherMetricsCardProps } from '@/features/teacher/types/TeacherMetricsCardProps';

/**
 * Summary tiles for the teacher workspace: managed classrooms and enrolled students (real API values).
 */
export const TeacherMetricsCard: React.FC<TeacherMetricsCardProps> = ({
  totalClassrooms,
  totalStudents,
  isLoading = false,
}) => {
  return (
    <Row gutter={[16, 16]} className={styles.metrics}>
      <Col xs={24} sm={12}>
        <Card className={styles.card}>
          {isLoading ? (
            <Skeleton active paragraph={{ rows: 1 }} />
          ) : (
            <Statistic
              title="Lớp học đang quản lý"
              value={totalClassrooms}
              prefix={<BookOutlined />}
              suffix="lớp"
            />
          )}
        </Card>
      </Col>
      <Col xs={24} sm={12}>
        <Card className={styles.card}>
          {isLoading ? (
            <Skeleton active paragraph={{ rows: 1 }} />
          ) : (
            <Statistic
              title="Học viên trực thuộc"
              value={totalStudents}
              prefix={<TeamOutlined />}
              suffix="học viên"
            />
          )}
        </Card>
      </Col>
    </Row>
  );
};
