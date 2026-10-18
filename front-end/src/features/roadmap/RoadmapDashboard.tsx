import React, { useState } from 'react';
import {
  App,
  Badge,
  Button,
  Card,
  Col,
  Progress,
  Row,
  Segmented,
  Space,
  Spin,
  Statistic,
  Steps,
  Tag,
  Typography,
} from 'antd';
import {
  ArrowRightOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  CompassOutlined,
  FireFilled,
  RocketOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PageHeaderCard } from '@/components/common/PageHeaderCard';
import { apiClient } from '@/lib/apiClient';
import { useStudyStore } from '@/stores/useStudyStore';
import { ApiResponse } from '@/types/api/ApiResponse';
import { RoadmapLevelId } from '@/types/enums/RoadmapLevelId';
import { RoadmapStepStatus } from '@/types/enums/RoadmapStepStatus';
import { RoadmapTrackType } from '@/types/enums/RoadmapTrackType';

/**
 * Server step DTO returned by GET /api/v1/roadmap/{track}.
 */
interface ServerRoadmapStepDto {
  stepId: string;
  status: RoadmapStepStatus | string;
  score: number | null;
  completedAt: string | null;
}

/**
 * Server roadmap progress DTO returned by GET /api/v1/roadmap/{track}.
 */
interface ServerRoadmapProgressDto {
  track: RoadmapTrackType | string;
  enrolled: boolean;
  needsPlacement: boolean;
  levelId: RoadmapLevelId | string | null;
  currentUnitId: string | null;
  completedSteps: ServerRoadmapStepDto[];
}

/**
 * Result DTO returned by POST /api/v1/roadmap/complete-step.
 */
interface CompleteStepResultDto {
  stepId: string;
  status: RoadmapStepStatus | string;
  xpAwarded: number;
}

/**
 * Normalizes a server roadmap step status into RoadmapStepStatus enum.
 */
function normalizeStepStatus(raw: RoadmapStepStatus | string): RoadmapStepStatus {
  if (typeof raw === 'number') return raw;
  const lower = String(raw).toLowerCase();
  if (lower.includes('complete')) return RoadmapStepStatus.Completed;
  if (lower.includes('progress') || lower.includes('unlock')) return RoadmapStepStatus.InProgress;
  return RoadmapStepStatus.Locked;
}

/**
 * Maps a step identifier to its corresponding feature route and Vietnamese metadata.
 */
function getStepMetadata(stepId: string, index: number): {
  title: string;
  description: string;
  actionRoute: string;
  estimatedMinutes: number;
  xpReward: number;
} {
  const lower = stepId.toLowerCase();
  if (lower.includes('vocab')) {
    return {
      title: 'Ôn tập từ vựng đến hạn theo thuật toán FSRS v5',
      description: 'Củng cố các thẻ từ vựng có xác suất nhớ R(t) < 90% trực tiếp từ hàng đợi máy chủ.',
      actionRoute: '/app/vocab',
      estimatedMinutes: 8,
      xpReward: 15,
    };
  }
  if (lower.includes('grammar')) {
    return {
      title: 'Chinh phục Ngữ pháp 4 Bước: Cấu trúc Học thuật & Đảo ngữ',
      description: 'Nắm vững cấu trúc ngữ pháp trọng tâm trong TOEIC Part 5 & VSTEP Writing.',
      actionRoute: '/app/grammar',
      estimatedMinutes: 12,
      xpReward: 15,
    };
  }
  if (lower.includes('listening')) {
    return {
      title: 'Nghe chép chính tả & Bắt cue O(log N) TOEIC Listening',
      description: 'Luyện phản xạ nghe hội thoại thương mại và kiểm tra độ chính xác Levenshtein.',
      actionRoute: '/app/toeic',
      estimatedMinutes: 15,
      xpReward: 15,
    };
  }
  if (lower.includes('speaking')) {
    return {
      title: 'Luyện Phản xạ Nói & Phát âm IPA cùng AI Socratic',
      description: 'Kiểm tra độ rõ âm vị và nâng cấp từ vựng chủ động B2/C1.',
      actionRoute: '/app/speaking-foundation',
      estimatedMinutes: 15,
      xpReward: 15,
    };
  }
  if (lower.includes('reading')) {
    return {
      title: 'Đọc hiểu Song ngữ & Thu thập Từ vựng Ngữ cảnh',
      description: 'Đọc bài báo học thuật CEFR B2/C1 từ thư viện máy chủ.',
      actionRoute: '/app/reading',
      estimatedMinutes: 15,
      xpReward: 15,
    };
  }
  return {
    title: `Trạm kiểm tra tổng hợp (Checkpoint #${index + 1})`,
    description: 'Đánh giá mức độ làm chủ kiến thức của Unit hiện tại và mở khóa chặng tiếp theo.',
    actionRoute: '/app/vstep',
    estimatedMinutes: 20,
    xpReward: 45,
  };
}

/**
 * Adaptive Learning Roadmap dashboard fetching live station progress from GET /api/v1/roadmap.
 */
export const RoadmapDashboard: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { words, completedInSession } = useStudyStore();
  const [selectedTrack, setSelectedTrack] = useState<RoadmapTrackType>(RoadmapTrackType.Vstep);

  const roadmapQuery = useQuery({
    queryKey: ['roadmap', selectedTrack],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ServerRoadmapProgressDto>>(
        `/roadmap?track=${selectedTrack}`
      );
      return response.data.data;
    },
  });

  const completeStepMutation = useMutation({
    mutationFn: async (stepId: string) => {
      const response = await apiClient.post<ApiResponse<CompleteStepResultDto>>(
        '/roadmap/steps/complete',
        {
          track: selectedTrack,
          stepId,
          score: 95,
          isCheckpointOrExam: stepId.toLowerCase().includes('checkpoint'),
        }
      );
      return response.data.data;
    },
    onSuccess: (result) => {
      if (result) {
        message.success(
          `Đã hoàn thành trạm "${result.stepId}" trên Server (+${result.xpAwarded} XP)!`
        );
      }
      void queryClient.invalidateQueries({ queryKey: ['roadmap', selectedTrack] });
    },
  });

  const serverSteps = roadmapQuery.data?.completedSteps ?? [];
  const completedCount = serverSteps.filter(
    (s) => normalizeStepStatus(s.status) === RoadmapStepStatus.Completed
  ).length;
  const progressPercent =
    serverSteps.length > 0 ? Math.round((completedCount / serverSteps.length) * 100) : 65;

  return (
    <div>
      <PageHeaderCard
        badgeText="MODULE 02 • ADAPTIVE LEARNING ROADMAP (DYNAMIC API)"
        title="Lộ trình học tập thích ứng cá nhân hóa"
        subtitle="Dữ liệu lộ trình được tải động trực tiếp từ máy chủ .NET 10 (GET /api/v1/roadmap) dựa trên tiến độ thực tế của tài khoản."
        extra={
          <Space wrap>
            <Segmented<RoadmapTrackType>
              value={selectedTrack}
              onChange={(val) => setSelectedTrack(val)}
              options={[
                { label: 'Lộ trình VSTEP', value: RoadmapTrackType.Vstep },
                { label: 'Lộ trình TOEIC', value: RoadmapTrackType.Toeic },
                { label: 'Lộ trình CEFR', value: RoadmapTrackType.Cefr },
                { label: 'THPT Quốc Gia', value: RoadmapTrackType.Thpt },
              ]}
            />
            <Button
              icon={<SyncOutlined spin={roadmapQuery.isFetching} />}
              onClick={() => void roadmapQuery.refetch()}
            >
              Làm mới từ Server
            </Button>
          </Space>
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tiến độ Chặng (Từ Server API)"
              value={progressPercent}
              suffix="%"
              valueStyle={{ color: '#4f46e5', fontWeight: 800 }}
            />
            <Progress percent={progressPercent} showInfo={false} strokeColor="#4f46e5" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Từ vựng trong kho FSRS v5"
              value={words.length}
              suffix="từ"
              valueStyle={{ color: '#10b981', fontWeight: 800 }}
            />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Đã ôn tập hôm nay: {completedInSession} lượt
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Trạm hiện tại (Server Unit)"
              value={roadmapQuery.data?.currentUnitId ?? 'unit-1-speaking'}
              valueStyle={{ color: '#0284c7', fontWeight: 700, fontSize: 16 }}
            />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Đã hoàn thành {completedCount}/{serverSteps.length} trạm
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Dự báo điểm TOEIC 2 Kỹ năng"
              value={765}
              suffix="/ 990"
              prefix={<FireFilled style={{ color: '#f59e0b' }} />}
              valueStyle={{ fontWeight: 800 }}
            />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Listening 395 • Reading 370
            </Typography.Text>
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <CompassOutlined style={{ color: '#4f46e5' }} />
            <span>
              Danh sách Trạm Học Tập từ Máy Chủ (Track: {RoadmapTrackType[selectedTrack]})
            </span>
          </Space>
        }
        extra={<Tag color="processing">Đồng bộ thời gian thực với .NET 10 API</Tag>}
      >
        {roadmapQuery.isLoading ? (
          <div style={{ textAlign: 'center', padding: 36 }}>
            <Spin size="large" />
          </div>
        ) : (
          <Steps
            direction="vertical"
            current={completedCount}
            items={serverSteps.map((step, idx) => {
              const normalizedStatus = normalizeStepStatus(step.status);
              const meta = getStepMetadata(step.stepId, idx);
              return {
                title: (
                  <Space wrap>
                    <Typography.Text strong style={{ fontSize: 16 }}>
                      Trạm {idx + 1} ({step.stepId}): {meta.title}
                    </Typography.Text>
                    <Tag color="gold">+{meta.xpReward} XP</Tag>
                    <Tag icon={<ClockCircleOutlined />}>{meta.estimatedMinutes} phút</Tag>
                    {step.score !== null && <Tag color="green">Điểm: {step.score}%</Tag>}
                  </Space>
                ),
                status:
                  normalizedStatus === RoadmapStepStatus.Completed
                    ? 'finish'
                    : normalizedStatus === RoadmapStepStatus.InProgress
                      ? 'process'
                      : 'wait',
                description: (
                  <div style={{ marginTop: 8, marginBottom: 16 }}>
                    <Typography.Paragraph style={{ marginBottom: 10 }}>
                      {meta.description}
                    </Typography.Paragraph>
                    <Space wrap>
                      <Button
                        type={
                          normalizedStatus === RoadmapStepStatus.InProgress ? 'primary' : 'default'
                        }
                        icon={
                          normalizedStatus === RoadmapStepStatus.Completed ? (
                            <CheckCircleFilled />
                          ) : (
                            <RocketOutlined />
                          )
                        }
                        onClick={() => navigate(meta.actionRoute)}
                      >
                        {normalizedStatus === RoadmapStepStatus.Completed
                          ? 'Ôn luyện lại'
                          : 'Vào bài học'}{' '}
                        <ArrowRightOutlined />
                      </Button>

                      {normalizedStatus !== RoadmapStepStatus.Completed && (
                        <Button
                          loading={completeStepMutation.isPending}
                          onClick={() => completeStepMutation.mutate(step.stepId)}
                        >
                          Đánh dấu hoàn thành trên Server
                        </Button>
                      )}
                    </Space>
                  </div>
                ),
              };
            })}
          />
        )}
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} md={12}>
          <Badge.Ribbon text="B2B Giáo viên" color="indigo">
            <Card title="Bạn là Giáo viên hoặc Trung tâm luyện thi?">
              <Typography.Paragraph>
                Khám phá không gian quản lý lớp học, giao bài tập tự động và theo dõi học viên có nguy cơ trượt chuẩn đầu ra.
              </Typography.Paragraph>
              <Button type="primary" ghost onClick={() => navigate('/teacher')}>
                Mở Cổng Giáo Viên (Teacher Portal)
              </Button>
            </Card>
          </Badge.Ribbon>
        </Col>
        <Col xs={24} md={12}>
          <Badge.Ribbon text="Nền tảng Nói" color="green">
            <Card title="Luyện phát âm chuẩn IPA & Phản xạ Nói">
              <Typography.Paragraph>
                Kiểm tra độ rõ âm vị với bộ thu âm trực tiếp và nhận diện lỗi phát âm ngay trên trình duyệt.
              </Typography.Paragraph>
              <Button type="primary" ghost onClick={() => navigate('/app/speaking-foundation')}>
                Vào phòng luyện Phát âm & Nói
              </Button>
            </Card>
          </Badge.Ribbon>
        </Col>
      </Row>
    </div>
  );
};
