import React, { useState } from 'react';
import { Alert, App, Button, Card, Skeleton, Space } from 'antd';
import { FormOutlined, ReloadOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeaderCard } from '@/components/common/PageHeaderCard';
import { RoadmapMetricsOverview } from '@/features/roadmap/components/RoadmapMetricsOverview';
import { RoadmapPlacementModal } from '@/features/roadmap/components/RoadmapPlacementModal';
import { RoadmapStepCard } from '@/features/roadmap/components/RoadmapStepCard';
import { RoadmapTrackSelector } from '@/features/roadmap/components/RoadmapTrackSelector';
import { StudentMasteryRadar } from '@/features/roadmap/components/StudentMasteryRadar';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/useAuthStore';
import { ApiResponse } from '@/types/api/ApiResponse';
import { RoadmapLevelId } from '@/types/enums/RoadmapLevelId';
import { RoadmapStepStatus } from '@/types/enums/RoadmapStepStatus';
import { RoadmapTrackType } from '@/types/enums/RoadmapTrackType';
import { RoadmapStepMetadataDto } from '@/types/roadmap/RoadmapStepMetadataDto';

interface ServerRoadmapStepDto {
  stepId: string;
  status: RoadmapStepStatus | string;
  score: number | null;
  completedAt: string | null;
}

interface ServerRoadmapProgressDto {
  track: RoadmapTrackType | string;
  enrolled: boolean;
  needsPlacement: boolean;
  levelId: RoadmapLevelId | string | null;
  currentUnitId: string | null;
  completedSteps: ServerRoadmapStepDto[];
}

interface CompleteStepResultDto {
  stepId: string;
  status: RoadmapStepStatus | string;
  xpAwarded: number;
}

// TODO: [Backend API Required] GET /api/v1/roadmap/catalog?track={track}&level={level} - Provide a master
// curriculum catalog endpoint in .NET 10 WebApi returning all station nodes defined in EF Core.
const CURRICULUM_STATION_BLUEPRINTS: Array<{
  id: string;
  title: string;
  description: string;
  actionRoute: string;
  estimatedMinutes: number;
  xpReward: number;
}> = [
  {
    id: 'step-01-vocab-fsrs',
    title: 'Khởi động Từ vựng FSRS v5 Hàng ngày',
    description: 'Củng cố 20 thẻ từ vựng học thuật theo thuật toán giãn cách thời gian.',
    actionRoute: '/app/vocab',
    estimatedMinutes: 8,
    xpReward: 20,
  },
  {
    id: 'step-02-grammar-core',
    title: 'Ngữ pháp 4 Bước: Câu phức & Liên từ Chỉ nguyên nhân',
    description: 'Nắm vững cấu trúc mệnh đề trạng ngữ chỉ nguyên nhân trong các bài viết học thuật.',
    actionRoute: '/app/grammar',
    estimatedMinutes: 12,
    xpReward: 25,
  },
  {
    id: 'step-03-bilingual-reading',
    title: 'Đọc hiểu Song ngữ: Xu hướng Trí tuệ Nhân tạo',
    description: 'Phân tích văn bản học thuật kết hợp tra cứu cụm từ trực tiếp tại chỗ.',
    actionRoute: '/app/reading',
    estimatedMinutes: 15,
    xpReward: 30,
  },
  {
    id: 'step-04-toeic-listening',
    title: 'Luyện Nghe Chép Chính Tả TOEIC Part 2 & 3',
    description: 'Rèn luyện phản xạ nghe hội thoại thực tế và điền từ khuyết thiếu theo thời gian thực.',
    actionRoute: '/app/toeic',
    estimatedMinutes: 14,
    xpReward: 35,
  },
  {
    id: 'step-05-vstep-writing-check',
    title: 'Phòng thi Mô phỏng VSTEP: Bài luận Task 2',
    description: 'Thực hành viết bài luận ngắn và nhận đánh giá từ AI Socratic.',
    actionRoute: '/app/vstep',
    estimatedMinutes: 25,
    xpReward: 50,
  },
];

/**
 * Adaptive Roadmap and Student Learning Dashboard view.
 * Connects directly to GET /api/v1/roadmap?track={track} and POST /api/v1/roadmap/steps/complete.
 * Employs responsive Skeleton reload placeholders for high perceived performance.
 */
export const RoadmapDashboard: React.FC = () => {
  const { message } = App.useApp();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [activeTrack, setActiveTrack] = useState<RoadmapTrackType>(RoadmapTrackType.Vstep);
  const [placementModalOpen, setPlacementModalOpen] = useState<boolean>(false);

  const roadmapQuery = useQuery({
    queryKey: ['roadmap', activeTrack],
    queryFn: async () => {
      try {
        const response = await apiClient.get<ApiResponse<ServerRoadmapProgressDto>>(
          `/roadmap?track=${activeTrack}`
        );
        return response.data.data;
      } catch {
        return null;
      }
    },
  });

  const completeStepMutation = useMutation({
    mutationFn: async (stepId: string) => {
      const response = await apiClient.post<ApiResponse<CompleteStepResultDto>>(
        '/roadmap/steps/complete',
        {
          track: activeTrack,
          stepId,
        }
      );
      return response.data.data;
    },
    onSuccess: (data) => {
      void message.success(
        `Đã hoàn thành chặng học! (+${data?.xpAwarded ?? 25} XP)`
      );
      void queryClient.invalidateQueries({ queryKey: ['roadmap', activeTrack] });
    },
  });

  const completedMap = new Set(
    (roadmapQuery.data?.completedSteps ?? []).map((s) => s.stepId)
  );

  const stepList: RoadmapStepMetadataDto[] = CURRICULUM_STATION_BLUEPRINTS.map((step, index) => {
    const isCompleted = completedMap.has(step.id);
    const isPreviousCompleted =
      index === 0 || completedMap.has(CURRICULUM_STATION_BLUEPRINTS[index - 1].id);
    let status = RoadmapStepStatus.Locked;
    if (isCompleted) {
      status = RoadmapStepStatus.Completed;
    } else if (isPreviousCompleted) {
      status = RoadmapStepStatus.InProgress;
    }

    return {
      stepId: step.id,
      title: step.title,
      description: step.description,
      actionRoute: step.actionRoute,
      estimatedMinutes: step.estimatedMinutes,
      xpReward: step.xpReward,
      status,
    };
  });

  const completedCount = stepList.filter((s) => s.status === RoadmapStepStatus.Completed).length;
  const completionPercent = Math.round((completedCount / stepList.length) * 100);
  const needsPlacement = roadmapQuery.data?.needsPlacement ?? false;

  return (
    <div>
      <PageHeaderCard
        badgeText="MODULE 02 • ADAPTIVE ROADMAP & MASTERY ENGINE"
        title="Lộ trình Học tập Thích ứng Cá nhân hóa"
        subtitle="Hệ thống điều phối các chặng học dựa trên chẩn đoán năng lực và mục tiêu chứng chỉ thực tế."
        extra={
          <Button
            icon={<ReloadOutlined spin={roadmapQuery.isFetching} />}
            loading={roadmapQuery.isFetching}
            onClick={() => void roadmapQuery.refetch()}
          >
            Làm mới lộ trình
          </Button>
        }
      />

      <RoadmapTrackSelector
        activeTrack={activeTrack}
        onChangeTrack={(track) => setActiveTrack(track)}
      />

      {needsPlacement && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 20 }}
          message="Bạn chưa thực hiện bài đánh giá phân loại đầu vào cho lộ trình này"
          description="Hãy thực hiện bài khảo sát hoặc chọn trình độ xuất phát để hệ thống tối ưu hóa các chặng học phù hợp."
          action={
            <Button
              type="primary"
              size="small"
              icon={<FormOutlined />}
              onClick={() => setPlacementModalOpen(true)}
            >
              Làm bài đánh giá ngay
            </Button>
          }
        />
      )}

      <RoadmapMetricsOverview
        levelId={roadmapQuery.data?.levelId ?? user?.targetCertLevel ?? RoadmapLevelId.B1}
        track={activeTrack}
        completionPercent={completionPercent}
        completedCount={completedCount}
        totalCount={stepList.length}
        streakDays={user?.streakDays ?? 14}
        totalXp={user?.totalXp ?? 4850}
        isLoading={roadmapQuery.isLoading}
        onOpenPlacementModal={() => setPlacementModalOpen(true)}
      />

      <StudentMasteryRadar />

      <Card
        title={
          <Space>
            <span>Các chặng học trong Lộ trình hôm nay ({stepList.length} chặng)</span>
          </Space>
        }
      >
        {roadmapQuery.isLoading ? (
          <div style={{ padding: '16px 0' }}>
            <Skeleton active paragraph={{ rows: 3 }} />
            <Skeleton active paragraph={{ rows: 3 }} style={{ marginTop: 24 }} />
          </div>
        ) : (
          stepList.map((step, index) => (
            <RoadmapStepCard
              key={step.stepId}
              stepNumber={index + 1}
              step={step}
              isCompleting={completeStepMutation.isPending}
              onCompleteStep={(id) => completeStepMutation.mutate(id)}
            />
          ))
        )}
      </Card>

      <RoadmapPlacementModal
        open={placementModalOpen}
        track={activeTrack}
        onClose={() => setPlacementModalOpen(false)}
      />
    </div>
  );
};
