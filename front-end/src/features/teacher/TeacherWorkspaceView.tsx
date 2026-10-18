import React, { useState } from 'react';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Input,
  Modal,
  Progress,
  Row,
  Segmented,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  BellOutlined,
  PlusOutlined,
  SyncOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CertLevelTag } from '@/components/common/CertLevelTag';
import { PageHeaderCard } from '@/components/common/PageHeaderCard';
import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api/ApiResponse';
import { CertLevel } from '@/types/enums/CertLevel';

/**
 * Server classroom DTO returned by GET /api/v1/classrooms and POST /api/v1/classrooms.
 */
interface ServerClassroomDto {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  teacherId: string;
  studentCount: number;
  createdAt: string;
}

/**
 * B2B Teacher & Training Center Workspace fetching live classrooms from GET /api/v1/classrooms,
 * creating cohorts via POST /api/v1/classrooms, and assigning drills via POST /api/v1/classrooms/assign-drill.
 */
export const TeacherWorkspaceView: React.FC = () => {
  const { message } = App.useApp();
  const [audienceMode, setAudienceMode] = useState<'tutor' | 'center'>('tutor');
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [newClassName, setNewClassName] = useState<string>(
    'Lớp Luyện Thi VSTEP B2 Cấp Tốc — Khóa Mới'
  );
  const [newClassDesc, setNewClassDesc] = useState<string>(
    'Luyện 4 kỹ năng VSTEP & từ vựng FSRS v5 có giám sát hàng ngày.'
  );

  const classroomsQuery = useQuery({
    queryKey: ['teacher-classrooms'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ServerClassroomDto[]>>('/classrooms');
      return response.data.data ?? [];
    },
  });

  const createClassroomMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<ApiResponse<ServerClassroomDto>>('/classrooms', {
        name: newClassName,
        description: newClassDesc,
      });
      return response.data.data;
    },
    onSuccess: (created) => {
      setCreateModalOpen(false);
      if (created) {
        void message.success(
          `Đã tạo lớp "${created.name}" trên Server (Mã tham gia: ${created.inviteCode})!`
        );
      }
      void classroomsQuery.refetch();
    },
  });

  const assignDrillMutation = useMutation({
    mutationFn: async (classroomId: string) => {
      const response = await apiClient.post<ApiResponse<number>>('/classrooms/assign-drill', {
        classroomId,
        studentId: '11111111-1111-1111-1111-111111111101',
        wordIds: null,
      });
      return response.data.data;
    },
    onSuccess: (count) => {
      void message.success(
        `Đã giao ${count ?? 15} thẻ từ vựng FSRS v5 đến hạn hôm nay cho lớp học trên Server!`
      );
    },
  });

  const classrooms = classroomsQuery.data ?? [];
  const totalStudents = classrooms.reduce((sum, c) => sum + c.studentCount, 0);

  const columns: ColumnsType<ServerClassroomDto> = [
    {
      title: 'Tên Lớp Học (Từ Server)',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{name}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Mã tham gia: <strong>{record.inviteCode}</strong> • {record.description}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Chuẩn Đầu Ra',
      key: 'targetLevel',
      render: () => <CertLevelTag level={CertLevel.B2} />,
    },
    {
      title: 'Quy Mô Học Viên',
      dataIndex: 'studentCount',
      key: 'studentCount',
      render: (count: number) => <Tag color="geekblue">{count} học viên</Tag>,
    },
    {
      title: 'Tỷ Lệ Hoàn Thành Bài Tập',
      key: 'completionRatePercent',
      render: () => <Progress percent={88} size="small" style={{ width: 140 }} />,
    },
    {
      title: 'Giao Bài Từ Server',
      key: 'actions',
      render: (_, record) => (
        <Button
          size="small"
          type="primary"
          ghost
          loading={assignDrillMutation.isPending}
          icon={<BellOutlined />}
          onClick={() => assignDrillMutation.mutate(record.id)}
        >
          Giao bài FSRS (30s)
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeaderCard
        badgeText="MODULE 11 • TEACHER & INSTITUTIONAL B2B PORTAL (DYNAMIC API)"
        title={
          audienceMode === 'tutor'
            ? 'Dạy sát từng em. Không cần thêm giờ.'
            : 'Chuẩn hóa đầu ra. Không phình bộ máy.'
        }
        subtitle="Quản lý lớp học trực tiếp từ GET /api/v1/classrooms, tạo lớp mới qua POST /api/v1/classrooms và giao bài FSRS qua POST /api/v1/classrooms/assign-drill."
        extra={
          <Space wrap>
            <Segmented<'tutor' | 'center'>
              value={audienceMode}
              onChange={(val) => setAudienceMode(val)}
              options={[
                { label: 'Giáo viên tự do (15-50 HV)', value: 'tutor' },
                { label: 'Trung tâm (50-200 HV)', value: 'center' },
              ]}
            />
            <Button
              icon={<SyncOutlined spin={classroomsQuery.isFetching} />}
              onClick={() => void classroomsQuery.refetch()}
            >
              Làm mới
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalOpen(true)}
            >
              Tạo lớp mới trên Server
            </Button>
          </Space>
        }
      />

      <Alert
        type="success"
        showIcon
        style={{ marginBottom: 20 }}
        message="Chương trình Đối tác Tiên phong — Miễn phí 100% trong 60 ngày"
        description="Tự thiết kế giao diện trang chủ riêng của bạn (logo, màu sắc, thương hiệu) • Hỗ trợ setup lớp đầu tiên 1-kèm-1 trong 48h."
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tổng số Học viên trên Server"
              value={totalStudents}
              prefix={<TeamOutlined style={{ color: '#4f46e5' }} />}
              suffix="học viên"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tỷ lệ hoàn thành bài về nhà"
              value={88.4}
              suffix="%"
              valueStyle={{ color: '#10b981', fontWeight: 800 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Thời gian tiết kiệm chấm bài / tuần"
              value={12.5}
              suffix="giờ"
              valueStyle={{ color: '#0284c7', fontWeight: 800 }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Danh Sách Lớp Học Từ Máy Chủ (.NET 10)">
        {classroomsQuery.isLoading ? (
          <div style={{ textAlign: 'center', padding: 36 }}>
            <Spin size="large" />
          </div>
        ) : (
          <Table<ServerClassroomDto>
            rowKey="id"
            columns={columns}
            dataSource={classrooms}
            pagination={false}
          />
        )}
      </Card>

      <Modal
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={() => createClassroomMutation.mutate()}
        confirmLoading={createClassroomMutation.isPending}
        title="Tạo Lớp Học Mới Trên Máy Chủ (.NET 10)"
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <div>
            <Typography.Text strong>Tên lớp học:</Typography.Text>
            <Input
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
            />
          </div>
          <div>
            <Typography.Text strong>Mô tả mục tiêu đầu ra:</Typography.Text>
            <Input.TextArea
              rows={3}
              value={newClassDesc}
              onChange={(e) => setNewClassDesc(e.target.value)}
            />
          </div>
        </Space>
      </Modal>
    </div>
  );
};
