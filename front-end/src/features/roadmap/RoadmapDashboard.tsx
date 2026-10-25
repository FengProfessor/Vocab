import React, { useMemo, useState } from 'react';
import { Alert, Button, Card, Skeleton } from '@/components/ui/Primitives';
import { FormOutlined, ReloadOutlined } from '@/components/ui/Icons';
import { PageHeaderCard } from '@/components/common/PageHeaderCard';
import { ROADMAP_DAILY_STATIONS } from '@/config/roadmapCurriculum';
import { RoadmapMetricsOverview } from '@/features/roadmap/components/RoadmapMetricsOverview';
import { RoadmapPlacementModal } from '@/features/roadmap/components/RoadmapPlacementModal';
import { RoadmapStepCard } from '@/features/roadmap/components/RoadmapStepCard';
import { RoadmapTrackSelector } from '@/features/roadmap/components/RoadmapTrackSelector';
import { StudentMasteryRadar } from '@/features/roadmap/components/StudentMasteryRadar';
import { useGamificationStats } from '@/hooks/useGamificationStats';
import { useCompleteRoadmapStep } from '@/hooks/roadmap/useCompleteRoadmapStep';
import { useRoadmapQuery } from '@/hooks/roadmap/useRoadmapQuery';
import { RoadmapProgressCalculator } from '@/lib/roadmapProgressCalculator';
import { RoadmapStepStatus } from '@/types/enums/RoadmapStepStatus';
import { RoadmapTrackType } from '@/types/enums/RoadmapTrackType';

/**
 * Adaptive roadmap and student dashboard: track switch, enrollment (placement), progress and station list.
 * Data comes from GET /api/v1/roadmap and POST /api/v1/roadmap/steps/complete.
 */
export const RoadmapDashboard: React.FC = () => {
  const { streakDays, totalXp } = useGamificationStats();
  const [activeTrack, setActiveTrack] = useState<RoadmapTrackType>(RoadmapTrackType.Vstep);
  const [placementOpen, setPlacementOpen] = useState<boolean>(false);

  const roadmapQuery = useRoadmapQuery(activeTrack);
  const completeStep = useCompleteRoadmapStep(activeTrack);

  const steps = useMemo(() => {
    const completed = new Set((roadmapQuery.data?.completedSteps ?? []).map((s) => s.stepId));
    return RoadmapProgressCalculator.buildSteps(ROADMAP_DAILY_STATIONS, completed);
  }, [roadmapQuery.data]);

  const completionPercent = RoadmapProgressCalculator.completionPercent(steps);
  const completedCount = steps.filter((s) => s.status === RoadmapStepStatus.Completed).length;
  const needsPlacement = roadmapQuery.data?.needsPlacement ?? false;

  return (
    <div>
      <PageHeaderCard
        badgeText="MODULE 02 • ADAPTIVE ROADMAP"
        title="Lộ trình Học tập Thích ứng Cá nhân hóa"
        subtitle="Các chặng học theo từng lộ trình mục tiêu, mở khóa tuần tự khi hoàn thành chặng trước."
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

      <RoadmapTrackSelector activeTrack={activeTrack} onChangeTrack={setActiveTrack} />

      {needsPlacement && (
        <Alert
          className="lp-mb-20"
          type="warning"
          showIcon
          message="Bạn chưa ghi danh vào lộ trình này"
          description="Chọn cấp độ xuất phát để hệ thống tạo lộ trình phù hợp."
          action={
            <Button type="primary" size="small" icon={<FormOutlined />} onClick={() => setPlacementOpen(true)}>
              Chọn cấp độ ngay
            </Button>
          }
        />
      )}

      <RoadmapMetricsOverview
        levelId={roadmapQuery.data?.levelId ?? null}
        track={activeTrack}
        completionPercent={completionPercent}
        completedCount={completedCount}
        totalCount={steps.length}
        streakDays={streakDays}
        totalXp={totalXp}
        isLoading={roadmapQuery.isLoading}
        onOpenPlacementModal={() => setPlacementOpen(true)}
      />

      <StudentMasteryRadar />

      <Card title={`Các chặng học trong lộ trình (${steps.length} chặng)`}>
        {roadmapQuery.isLoading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : (
          steps.map((step, index) => (
            <RoadmapStepCard
              key={step.stepId}
              stepNumber={index + 1}
              step={step}
              isCompleting={completeStep.isPending}
              onCompleteStep={(target) => completeStep.mutate(target)}
            />
          ))
        )}
      </Card>

      <RoadmapPlacementModal
        open={placementOpen}
        track={activeTrack}
        onClose={() => setPlacementOpen(false)}
      />
    </div>
  );
};
